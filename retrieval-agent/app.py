"""
FastAPI server for the Seer retrieval agent.

Endpoints:
- POST /retrieve - Start a retrieval job
- GET /stream/{job_id} - SSE stream for job progress
- GET /health - Health check
"""

import asyncio
import uuid
from typing import Dict, List, Optional
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from tools.exa import ExaClient
from tools.perplexity import PerplexityClient
from tools.normalize import normalize_batch
from ranking.heuristics import rank_by_heuristics
from database.supabase_client import SupabaseClient
from models.schemas import Document, RankedDoc, SearchResult


# Request/Response Models
class RetrieveRequest(BaseModel):
    """Request to start a retrieval job."""
    user_id: str = Field(..., description="User ID for personalization")
    query: Optional[str] = Field(None, description="Custom search query (optional)")
    preferences: Dict = Field(default_factory=dict, description="User preferences from onboarding")
    num_results: int = Field(default=25, ge=5, le=50, description="Number of results to retrieve")


class JobResponse(BaseModel):
    """Response with job ID for tracking."""
    job_id: str
    status: str
    message: str


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: str
    version: str = "0.4.0"


# Job Management
jobs: Dict[str, Dict] = {}  # In-memory job store {job_id: {status, events, result}}


async def process_retrieval_job(job_id: str, request: RetrieveRequest):
    """Background task to process retrieval job with progress updates."""

    def add_event(event_type: str, data: Dict):
        """Add event to job's event stream."""
        jobs[job_id]["events"].append({
            "event": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        })

    try:
        jobs[job_id]["status"] = "running"
        add_event("started", {"message": "Retrieval job started"})

        # Step 1: Parallel search
        add_event("progress", {"step": "search", "message": "Searching Exa and Perplexity..."})
        exa_client = ExaClient()
        perplexity_client = PerplexityClient()

        search_query = request.query or f"Latest developments in {request.preferences.get('industry', 'AI')}"

        exa_task, perplexity_task = await asyncio.gather(
            exa_client.search(search_query, num_results=request.num_results // 2),
            perplexity_client.search(search_query, num_results=request.num_results // 2),
            return_exceptions=True
        )

        # Handle search errors and ensure we have lists
        exa_results: List[SearchResult] = []
        perplexity_results: List[SearchResult] = []

        if isinstance(exa_task, BaseException):
            add_event("warning", {"message": f"Exa search failed: {str(exa_task)}"})
        else:
            exa_results = exa_task  # Type narrowed to List[SearchResult]

        if isinstance(perplexity_task, BaseException):
            add_event("warning", {"message": f"Perplexity search failed: {str(perplexity_task)}"})
        else:
            perplexity_results = perplexity_task  # Type narrowed to List[SearchResult]

        total_results = len(exa_results) + len(perplexity_results)
        add_event("progress", {"step": "search", "message": f"Retrieved {total_results} results"})

        # Step 2: Normalize
        add_event("progress", {"step": "normalize", "message": "Normalizing results..."})
        all_results = exa_results + perplexity_results
        documents: List[Document] = normalize_batch(all_results)
        add_event("progress", {"step": "normalize", "message": f"Normalized to {len(documents)} documents"})

        # Step 3: Rank
        add_event("progress", {"step": "rank", "message": "Ranking documents..."})
        ranked_docs: List[RankedDoc] = rank_by_heuristics(documents)
        add_event("progress", {"step": "rank", "message": f"Ranked {len(ranked_docs)} documents"})

        # Step 4: Store in database
        add_event("progress", {"step": "store", "message": "Storing results..."})
        db_client = SupabaseClient()

        # Convert to Story objects and store
        from database.utils import ranked_doc_to_story
        stories = [ranked_doc_to_story(doc, request.user_id) for doc in ranked_docs[:request.num_results]]

        # Store stories
        story_ids = []
        for story in stories:
            try:
                story_id = await db_client.create_story(story)
                story_ids.append(story_id)
            except Exception as e:
                add_event("warning", {"message": f"Failed to store story: {str(e)}"})

        add_event("progress", {"step": "store", "message": f"Stored {len(story_ids)} stories"})

        # Complete
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["result"] = {
            "story_ids": story_ids,
            "total_results": len(stories),
            "user_id": request.user_id
        }
        add_event("completed", {
            "message": "Retrieval job completed successfully",
            "story_count": len(stories)
        })

    except Exception as e:
        jobs[job_id]["status"] = "failed"
        add_event("error", {"message": str(e)})


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    # Startup
    print("🚀 Seer Retrieval Agent starting...")
    yield
    # Shutdown
    print("👋 Seer Retrieval Agent shutting down...")


# FastAPI App
app = FastAPI(
    title="Seer Retrieval Agent",
    description="AI-powered news retrieval and personalization engine",
    version="0.4.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
        "https://*.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat()
    )


@app.post("/retrieve", response_model=JobResponse)
async def start_retrieval(
    request: RetrieveRequest,
    background_tasks: BackgroundTasks
):
    """
    Start a retrieval job.

    Returns a job_id that can be used to track progress via /stream/{job_id}
    """
    job_id = str(uuid.uuid4())

    # Initialize job
    jobs[job_id] = {
        "status": "pending",
        "events": [],
        "result": None,
        "created_at": datetime.utcnow().isoformat()
    }

    # Start background task
    background_tasks.add_task(process_retrieval_job, job_id, request)

    return JobResponse(
        job_id=job_id,
        status="pending",
        message=f"Retrieval job started. Use /stream/{job_id} to track progress."
    )


@app.get("/stream/{job_id}")
async def stream_job_progress(job_id: str):
    """
    SSE endpoint for streaming job progress.

    Events:
    - started: Job has started
    - progress: Progress update with step and message
    - warning: Non-fatal warning
    - completed: Job completed successfully
    - error: Job failed
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        """Generate SSE events for job progress."""
        sent_events = 0

        while True:
            job = jobs[job_id]
            events = job["events"]

            # Send new events
            while sent_events < len(events):
                event = events[sent_events]
                yield {
                    "event": event["event"],
                    "data": event["data"]
                }
                sent_events += 1

            # Check if job is complete
            if job["status"] in ["completed", "failed"]:
                # Send final result
                if job["status"] == "completed":
                    yield {
                        "event": "result",
                        "data": job["result"]
                    }
                break

            # Wait before checking for new events
            await asyncio.sleep(0.5)

    return EventSourceResponse(event_generator())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
