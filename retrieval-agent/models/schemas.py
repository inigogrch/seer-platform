"""
Core data models for the retrieval agent.
Following the architecture spec for SearchResult and Document schemas.

Data Flow:
  SearchResult (API) → Document (normalized) → RankedDoc (scored) 
  → Story (enriched) → BriefSection (organized) → DailyBrief (complete)
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from typing_extensions import TypedDict
from datetime import datetime, date
from enum import Enum


class SearchProvider(str, Enum):
    """Supported search providers."""
    EXA = "exa"
    PERPLEXITY = "perplexity"


class BriefStatus(str, Enum):
    """Status of a daily brief in its lifecycle."""
    DRAFT = "draft"
    GENERATED = "generated"
    VIEWED = "viewed"
    ARCHIVED = "archived"


class ContentType(str, Enum):
    """Content type classification for stories.
    
    Guidelines for distinguishing overlapping types:
    
    RESEARCH - Peer-reviewed papers, formal studies with methodology
        - Key indicators: arXiv, Nature, Science, ACL, NeurIPS papers
        - Has: Abstract, methodology, results, citations
        - Examples: "Novel approach to transformer architecture", "Empirical study of RAG systems"
        - NOT opinion pieces about research or educational explanations
    
    NEWS - Breaking announcements, product launches, company updates
        - Key indicators: "announces", "launches", "releases", press releases
        - Timely, event-driven, factual reporting
        - Examples: "Anthropic releases Claude 4.5", "OpenAI announces GPT-5"
        - Primary purpose: inform about current events
    
    OPINION - Analysis, commentary, predictions, hot takes
        - Key indicators: Author's perspective, "I think", "we believe", predictions
        - Examples: "Why Claude beats GPT-4", "The future of AI agents"
        - Distinguished from NEWS by subjective analysis vs objective reporting
    
    LEARNING - Tutorials, explainers, "how-to" guides, educational content
        - Key indicators: Step-by-step, teaching concepts, "introduction to"
        - Examples: "Understanding transformers", "Guide to RAG implementation"
        - Distinguished from RESEARCH by pedagogical focus vs novel findings
        - Distinguished from OPINION by teaching vs arguing a position
    
    CASE_STUDY - Real-world implementation stories, success/failure narratives
        - Key indicators: "How we", company names, specific implementations
        - Examples: "How Spotify uses embeddings", "Scaling RAG at Netflix"
        - Must describe specific real-world application
    
    EVENT_COVERAGE - Conference reports, workshop summaries, meetup recaps
        - Key indicators: Conference/event names, dates, keynotes, sessions
        - Examples: "NeurIPS 2025 highlights", "AI Summit keynote recap"
        - Distinguished from NEWS by covering event content vs announcing it
    
    REVIEW - Tool/model comparisons, benchmarks, product reviews
        - Key indicators: Comparisons, benchmark numbers, "vs", ratings
        - Examples: "GPT-4 vs Claude 3.5 benchmark", "Top 10 vector DBs"
        - Must compare multiple options or evaluate one thoroughly
    
    INTERVIEW - Q&A format, profile pieces, conversations with people
        - Key indicators: Question format, quotes, "interview with"
        - Examples: "Interview with Demis Hassabis", "A conversation with..."
        - Distinguished by format: direct quotes and Q&A structure
    
    DATASET - Data releases, new benchmarks, corpus announcements
        - Key indicators: Dataset names, download links, data specifications
        - Examples: "New multilingual dataset released", "MMLU benchmark v2"
        - Primary focus: the data itself, not analysis using it
    
    DISCUSSION - Forum threads, community debates, multi-party exchanges
        - Key indicators: Multiple viewpoints, forum/Reddit/HN discussions
        - Examples: "HackerNews discusses AI safety", "Twitter debate on AGI"
        - Distinguished by community conversation vs single-author opinion
    
    REGULATORY - Policy, regulations, legal, ethical frameworks, governance
        - Key indicators: Government, policy, regulations, compliance, ethics
        - Examples: "EU AI Act updates", "White House executive order"
        - Must focus on governance/policy vs technical implementation
    
    Overlap Resolution Priority:
    1. RESEARCH > LEARNING (if peer-reviewed with novel findings)
    2. NEWS > OPINION (if primarily factual announcement vs analysis)
    3. CASE_STUDY > LEARNING (if specific implementation vs general tutorial)
    4. INTERVIEW > OPINION (if Q&A format with quotes vs single viewpoint)
    5. REGULATORY > OPINION (if policy-focused vs general ethical discussion)
    """
    RESEARCH = "Research"
    OPINION = "Opinion"
    LEARNING = "Learning/Educational"
    NEWS = "News"
    CASE_STUDY = "Case Study"
    EVENT_COVERAGE = "Event Coverage"
    REVIEW = "Review/Benchmark"
    INTERVIEW = "Interview/Profile"
    DATASET = "Dataset/Resource"
    DISCUSSION = "Discussion"
    REGULATORY = "Regulatory/Policy"


class SearchResult(BaseModel):
    """Raw search result from provider (matches API output).
    
    This is the direct representation of what we get from the search API,
    before normalization and processing.
    """
    id: str
    title: str
    url: str
    text: str  # snippet or full content
    score: float
    published_date: Optional[str] = None  # Raw string from API
    author: Optional[str] = None
    provider: SearchProvider
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "https://techcrunch.com/2025/01/04/ai-news",
                "title": "AI Breakthrough: New Model Achieves 95% Accuracy",
                "url": "https://techcrunch.com/2025/01/04/ai-news",
                "text": "Researchers announced a breakthrough in AI reasoning...",
                "score": 0.92,
                "published_date": "2025-01-04",
                "author": "Jane Smith",
                "provider": "exa"
            }
        }
    }


class Document(BaseModel):
    """Normalized document after processing.
    
    This is our standardized internal representation with parsed dates,
    extracted domains, and optional embeddings for ranking.
    
    Date Handling:
    - published_online: When the article first appeared online (e.g., "Available online", "Early Access")
    - published_issue: Official publication/issue date (may be in future for journals)
    - published_at: The effective date used for ranking (online date preferred, clamped to prevent future dates)
    """
    id: str
    title: str
    url: str
    snippet: str  # Cleaned and truncated text
    published_at: Optional[datetime] = None  # Effective date for ranking (computed)
    published_online: Optional[datetime] = None  # When first available online
    published_issue: Optional[datetime] = None  # Official issue/print date
    source_domain: str  # Extracted from URL
    author: Optional[str] = None
    provider: SearchProvider
    raw_score: float  # Original score from provider
    embedding: Optional[List[float]] = None  # For MMR and novelty filtering (later)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "https://techcrunch.com/2025/01/04/ai-news",
                "title": "AI Breakthrough: New Model Achieves 95% Accuracy",
                "url": "https://techcrunch.com/2025/01/04/ai-news",
                "snippet": "Researchers announced a breakthrough in AI reasoning...",
                "published_at": "2025-01-04T10:00:00Z",
                "published_online": "2025-01-04T10:00:00Z",
                "published_issue": None,
                "source_domain": "techcrurch.com",
                "author": "Jane Smith",
                "provider": "exa",
                "raw_score": 0.92
            }
        }
    }


class RankedDoc(BaseModel):
    """Document after ranking pipeline with scoring metadata.
    
    This wraps a Document with all the ranking scores from various stages,
    allowing us to debug and explain why items are ranked in a certain order.
    """
    document: Document
    final_score: float  # Combined score from all ranking stages
    rank: int  # Final position in ranking (1-based)
    
    # Scoring breakdown (for debugging and explainability)
    heuristic_score: Optional[float] = None  # Score from heuristics (recency + domain)
    rrf_score: Optional[float] = None  # Reciprocal Rank Fusion score (future)
    rerank_score: Optional[float] = None  # LLM reranker score (future)
    rerank_reason: Optional[str] = None  # Explanation from LLM reranker (future)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "document": {
                    "id": "https://techcrunch.com/2025/01/04/ai-news",
                    "title": "AI Breakthrough: New Model Achieves 95% Accuracy",
                    "url": "https://techcrunch.com/2025/01/04/ai-news",
                    "snippet": "Researchers announced a breakthrough...",
                    "published_at": "2025-01-04T10:00:00Z",
                    "source_domain": "techcrunch.com",
                    "provider": "exa",
                    "raw_score": 0.92
                },
                "final_score": 88.5,
                "rank": 1,
                "heuristic_score": 88.5
            }
        }
    }


class Story(BaseModel):
    """Enriched story ready for UI display.
    
    This is the final form of content after:
    - API retrieval (SearchResult)
    - Normalization (Document)
    - Ranking (RankedDoc)
    - AI enrichment (content_type, ai_tags)
    
    Maps directly to dashboard story cards.
    """
    # Core identity (from Document)
    id: str
    title: str
    url: str
    summary: str  # 1-2 sentence summary (from snippet or AI-generated)
    
    # Source metadata
    source_domain: str  # e.g., "techcrunch.com"
    source_display_name: str  # e.g., "TechCrunch" (formatted for UI)
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    
    # AI enrichment (to be added by LLM agent)
    content_type: Optional[ContentType] = None  # e.g., "News", "Research"
    ai_tags: List[str] = []  # e.g., ["LLMs", "Claude", "Reasoning"]
    
    # Ranking metadata
    final_score: float  # From RankedDoc
    rank: int  # Position in ranking
    provider: SearchProvider
    raw_score: float  # Original API score
    
    # User interaction state
    user_id: str  # User who owns this story in their brief
    is_read: bool = False
    is_saved: bool = False
    user_rating: Optional[int] = Field(None, ge=1, le=5)  # 1-5 stars
    user_notes: Optional[str] = None
    
    # Timestamps
    retrieved_at: datetime  # When story was fetched from API
    added_to_brief_at: datetime  # When added to user's daily brief
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "https://techcrunch.com/2025/01/04/ai-news",
                "title": "Anthropic releases Claude 3.5 Sonnet with enhanced reasoning",
                "url": "https://techcrunch.com/2025/01/04/ai-news",
                "summary": "The latest model shows significant improvements in complex reasoning tasks and extended context...",
                "source_domain": "techcrunch.com",
                "source_display_name": "TechCrunch",
                "author": "Jane Smith",
                "published_at": "2025-01-04T10:00:00Z",
                "content_type": "News",
                "ai_tags": ["LLMs", "Claude", "Reasoning"],
                "final_score": 88.5,
                "rank": 1,
                "provider": "exa",
                "raw_score": 0.92,
                "user_id": "user_123",
                "is_read": False,
                "is_saved": False,
                "user_rating": None,
                "user_notes": None,
                "retrieved_at": "2025-01-04T08:00:00Z",
                "added_to_brief_at": "2025-01-04T09:00:00Z"
            }
        }
    }


class BriefSection(BaseModel):
    """Logical section within a daily brief with personalized grouping.
    
    REQUIRED SECTION TYPES:
    
    1. "featured" (ALWAYS PRESENT, order=1)
       - Top 7-10 highest-ranked stories regardless of topic
       - These are the most important/relevant stories of the day
       - Always shown first in the brief
       - title: "Featured Stories" or "Top Stories Today"
       - Populated from top-ranked stories after heuristic ranking
    
    2. Dynamic sections (3-4 sections, order=2+)
       - Created based on content quality and user preferences
       - Only created if there are enough high-quality stories for a topic
       - Examples:
         * "Latest in Large Language Models" (interest-based)
         * "AI Safety & Alignment News" (preference-based)
         * "Trending: Multimodal AI" (topic-based)
         * "Research Papers You'll Love" (recommended)
         * "News for Product Managers in Healthcare" (role/industry)
    
    Section Types:
    - "featured": Top stories (REQUIRED, always 7-10 stories)
    - "preference-based": Based on user's content interests and preferences
    - "topic-based": Clustered by topic/theme
    - "recommended": Based on user behavior patterns
    - "trending": Hot topics this week
    - "role-based": Based on user's role
    - "industry-based": Based on user's industry
    
    Story Count Guidelines:
    - Featured section: 7-10 stories (always)
    - Dynamic sections: 5-7 stories each (only if quality threshold met)
    - Total brief: ~25-35 stories across all sections
    """
    id: str  # UUID
    daily_brief_id: str  # Reference to parent DailyBrief
    
    # Section metadata
    title: str  # e.g., "Featured Stories", "Latest in Large Language Models"
    description: Optional[str] = None  # e.g., "Your top stories today", "Based on your interest in LLMs"
    section_type: str  # "featured", "interest-based", "preference-based", "topic-based", "recommended", "trending"
    
    # Content organization
    story_ids: List[str]  # References to Story IDs in this section
    order: int  # Display order within brief (1-based, featured=1)
    
    # Section insights
    topic_tags: List[str] = []  # Primary topics in this section
    estimated_read_time: Optional[int] = None  # Total minutes for section
    story_count: int  # Number of stories in section
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "section_uuid_123",
                "daily_brief_id": "brief_uuid_456",
                "title": "Latest in Large Language Models",
                "description": "Based on your interest in LLMs",
                "section_type": "interest-based",
                "story_ids": ["story_1", "story_2", "story_3"],
                "order": 1,
                "topic_tags": ["LLMs", "Claude", "GPT-4"],
                "estimated_read_time": 12,
                "story_count": 3,
                "created_at": "2025-01-04T09:00:00Z"
            }
        }
    }


class DailyBrief(BaseModel):
    """Complete daily brief for a user with all content and metadata.
    
    REQUIRED STRUCTURE:
    
    1. Summary (REQUIRED)
       - Paragraph or few sentences summarizing major changes for the user
       - Highlights most important developments from today's stories
       - Synthesized by AI to be personalized and relevant
       - Stored in `summary` field
       - Example: "Today's brief focuses on major LLM releases from Anthropic 
         and OpenAI, plus new research on AI safety frameworks. Key development: 
         Claude 3.5 Sonnet shows significant reasoning improvements."
    
    2. What's Next (REQUIRED)
       - Bulleted list of top action items user should be aware of
       - Synthesized by AI from the day's stories
       - Stored in `whats_next` JSONB field
       - Example action items:
         * "Review Claude 3.5 Sonnet's reasoning capabilities for your RAG pipeline"
         * "Consider implications of new AI safety frameworks for your project"
         * "Evaluate new benchmark results against your current model"
    
    3. Featured Stories Section (REQUIRED, section_type="featured", order=1)
       - Top 7-10 highest-ranked stories of the day
       - ALWAYS present regardless of topics
       - These are the most important stories based on ranking algorithm
       - First section in section_ids list
    
    4. Dynamic Sections (3-4 sections, CONDITIONAL, order=2+)
       - Only created if sufficient quality stories exist for a topic/theme
       - Each section: 3-6 stories on a specific topic
       - Examples: "Latest in LLMs", "AI Safety Updates", "Research Papers"
       - Created based on user preferences + content clustering
    
    VALIDATION:
    - Must have at least 1 section (featured)
    - Featured section must have 7-10 stories
    - Total stories typically 15-25 across all sections
    - summary must not be None/empty when status="generated"
    - whats_next must not be None when status="generated"
    """
    id: str  # UUID
    user_id: str  # Reference to auth.users
    date: date  # Brief date (e.g., 2025-11-05)
    
    # Brief metadata
    title: str  # e.g., "Your Daily AI Brief - November 5, 2025"
    summary: Optional[str] = Field(
        None,
        description="REQUIRED paragraph(s) summarizing major changes/developments for the user. "
                   "Should be 2-4 sentences highlighting key stories and themes. "
                   "Must be populated when status='generated'."
    )
    
    # Content organization (section IDs - stories are in sections)
    section_ids: List[str] = Field(
        default_factory=list,
        description="Ordered list of BriefSection IDs. First section (order=1) must be 'featured' type. "
                   "Followed by 3-4 dynamic sections based on content quality."
    )
    total_items: int = Field(
        default=0,
        description="Total number of stories across ALL sections. Typically 15-25 stories."
    )
    
    # Insights
    top_topics: List[str] = Field(
        default_factory=list,
        description="Most prominent topics across all stories (e.g., ['LLMs', 'AI Safety']). "
                   "Extracted from story ai_tags, typically 3-5 topics."
    )
    top_sources: List[str] = Field(
        default_factory=list,
        description="Most frequent source domains (e.g., ['TechCrunch', 'ArXiv']). "
                   "Top 3-5 sources by story count."
    )
    
    # What's Next (AI-generated action items)
    whats_next: Optional[Dict[str, Any]] = Field(
        None,
        description="REQUIRED AI-generated action items. Must contain 'action_items' list with "
                   "3-5 bullet points synthesized from stories. Format: "
                   "{'action_items': [...], 'rationale': '...', 'related_story_ids': [...]}"
    )
    
    # User preferences applied during generation
    query_preferences: Dict[str, Any] = Field(
        default_factory=dict,
        description="User preferences used during brief generation (interests, content types, etc.)"
    )
    
    # Status tracking
    status: BriefStatus = Field(
        default=BriefStatus.DRAFT,
        description="Brief lifecycle: 'draft' (generating) -> 'generated' (ready) -> "
                   "'viewed' (user opened) -> 'archived' (old)"
    )
    
    # Statistics
    read_count: int = Field(default=0, description="Number of stories marked as read")
    saved_count: int = Field(default=0, description="Number of stories marked as saved")
    engagement_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Calculated engagement metric (0.0-1.0) based on reads, saves, ratings"
    )
    
    # Timestamps
    generated_at: datetime = Field(default_factory=datetime.now)
    viewed_at: Optional[datetime] = None
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "brief_uuid_456",
                "user_id": "user_123",
                "date": "2025-11-05",
                "title": "Your Daily AI Brief - November 5, 2025",
                "summary": "Today's brief focuses on LLM advancements, AI safety developments, and new research in multimodal AI.",
                "section_ids": ["section_1", "section_2", "section_3"],
                "total_items": 15,
                "top_topics": ["LLMs", "AI Safety", "Multimodal AI"],
                "top_sources": ["TechCrunch", "ArXiv", "Anthropic Research"],
                "whats_next": {
                    "action_items": [
                        "Review Claude 3.5 Sonnet's reasoning capabilities for your RAG system",
                        "Consider implications of new AI safety frameworks"
                    ],
                    "rationale": "Based on your interests in LLMs and AI Safety"
                },
                "query_preferences": {"interests": ["LLMs", "AI Safety"], "content_types": ["News", "Research"]},
                "status": "generated",
                "read_count": 5,
                "saved_count": 3,
                "engagement_score": 0.85,
                "generated_at": "2025-11-05T06:00:00Z",
                "viewed_at": "2025-11-05T08:30:00Z"
            }
        }
    }


class WhatsNext(BaseModel):
    """AI-generated action items and priorities for the user.
    
    Used in the "What's Next" section on dashboard.
    Synthesizes the stories in the brief to suggest personalized, actionable priorities.
    
    REQUIREMENTS:
    - 3-5 action items (bullets)
    - Each item should be specific and actionable
    - Personalized based on user's role and interests
    - Synthesized from today's stories (not generic advice)
    
    Examples by role:
    - Data Engineer: "Review data schemas according to new framework discussed in Nature paper"
    - Product Manager: "Consider Claude 3.5's reasoning capabilities for Q3 roadmap planning"
    - Researcher: "Evaluate new MMLU benchmark results against your current model"
    - Software Engineer: "Explore the vector database comparison for your RAG implementation"
    - Founder: "Assess competitive implications of GPT-5 announcement for your product"
    
    Quality Guidelines:
    - ✅ GOOD: "Review Claude 3.5 Sonnet for your RAG pipeline upgrade"
    - ✅ GOOD: "Consider attending AI Safety Summit based on today's policy updates"
    - ❌ BAD: "Learn about AI" (too generic, not actionable)
    - ❌ BAD: "Read this article" (not synthesized, just pointing to story)
    """
    # Action items (3-5 bullets)
    action_items: List[str] = Field(
        ...,
        min_length=3,
        max_length=5,
        description="Prioritized list of specific, actionable items. Each should reference "
                   "concrete developments from today's stories."
    )
    
    # Context
    rationale: Optional[str] = Field(
        None,
        description="Why these actions matter to the user. References their role/interests."
    )
    related_story_ids: List[str] = Field(
        default_factory=list,
        description="Story IDs that informed these action items (for user to dive deeper)"
    )
    
    # Metadata
    generated_at: datetime = Field(default_factory=datetime.now)
    user_role: Optional[str] = Field(
        None,
        description="User's role for context (e.g., 'Data Engineer', 'Product Manager')"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "action_items": [
                    "Review data schemas according to new framework discussed in today's research",
                    "Evaluate Claude 3.5 Sonnet for your current RAG pipeline",
                    "Consider attending the upcoming AI safety workshop"
                ],
                "rationale": "Based on your interest in LLMs and data engineering",
                "related_story_ids": ["story_1", "story_2", "story_3"],
                "generated_at": "2025-11-05T09:00:00Z",
                "user_role": "Data Engineer"
            }
        }
    }


class RetrievalState(TypedDict, total=False):
    """State passed between agent nodes in LangGraph workflow.
    
    This is the working memory for the agent during daily brief generation.
    Follows LangGraph's state management pattern.
    """
    # Input context
    user_id: str
    date: date
    user_preferences: Dict[str, Any]  # Search topics, content types, etc.
    
    # Pipeline stages (populated progressively)
    raw_results: List[SearchResult]  # From search node
    documents: List[Document]  # From normalization node
    ranked_docs: List[RankedDoc]  # From ranking node
    stories: List[Story]  # From enrichment node
    sections: List[BriefSection]  # From organization node
    daily_brief: Optional[DailyBrief]  # Final output from composition node
    
    # Metadata
    retrieval_timestamp: datetime
    errors: List[str]  # Accumulated errors during pipeline
    
    # Agent decision tracking (for debugging)
    decisions: List[Dict[str, Any]]  # Log of agent decisions

