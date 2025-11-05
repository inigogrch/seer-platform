"""
Core data models for the retrieval agent.
Following the architecture spec for SearchResult and Document schemas.
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SearchProvider(str, Enum):
    """Supported search providers."""
    EXA = "exa"
    PERPLEXITY = "perplexity"


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

