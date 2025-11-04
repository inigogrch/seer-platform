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
    """
    id: str
    title: str
    url: str
    snippet: str  # Cleaned and truncated text
    published_at: Optional[datetime] = None  # Parsed datetime
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
                "source_domain": "techcrurch.com",
                "author": "Jane Smith",
                "provider": "exa",
                "raw_score": 0.92
            }
        }
    }

