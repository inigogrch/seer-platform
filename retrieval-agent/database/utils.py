"""
Database utility functions.

Helpers for data transformation and formatting.
"""

from typing import Optional
from datetime import datetime
from models.schemas import RankedDoc, Story


def format_source_display_name(domain: str) -> str:
    """Convert domain name to human-readable display name.
    
    Transforms technical domains into user-friendly names for UI display.
    
    Args:
        domain: Source domain (e.g., "techcrunch.com", "arxiv.org")
        
    Returns:
        Formatted display name (e.g., "TechCrunch", "ArXiv")
        
    Examples:
        >>> format_source_display_name("techcrunch.com")
        "TechCrunch"
        >>> format_source_display_name("arxiv.org")
        "ArXiv"
        >>> format_source_display_name("anthropic.com")
        "Anthropic"
    """
    if not domain or domain == "unknown":
        return "Unknown Source"
    
    # Custom mappings for well-known sources
    source_map = {
        "techcrunch.com": "TechCrunch",
        "theverge.com": "The Verge",
        "arxiv.org": "ArXiv",
        "anthropic.com": "Anthropic",
        "openai.com": "OpenAI",
        "deepmind.com": "DeepMind",
        "microsoft.com": "Microsoft",
        "google.com": "Google",
        "stanford.edu": "Stanford HAI",
        "mit.edu": "MIT",
        "nytimes.com": "The New York Times",
        "wsj.com": "The Wall Street Journal",
        "wired.com": "WIRED",
        "arstechnica.com": "Ars Technica",
        "venturebeat.com": "VentureBeat",
        "forbes.com": "Forbes",
        "bloomberg.com": "Bloomberg",
        "reuters.com": "Reuters",
        "bbc.com": "BBC",
        "cnn.com": "CNN",
        "nature.com": "Nature",
        "science.org": "Science",
        "ieee.org": "IEEE",
        "acm.org": "ACM",
        "github.com": "GitHub",
        "medium.com": "Medium",
        "substack.com": "Substack",
        "towardsai.com": "Towards AI",
        "huggingface.co": "Hugging Face",
        "ibm.com": "IBM",
        "meta.com": "Meta",
        "amazon.com": "Amazon",
        "nvidia.com": "NVIDIA",
    }
    
    # Check if we have a custom mapping
    if domain in source_map:
        return source_map[domain]
    
    # Generic formatting: remove TLD and capitalize
    # e.g., "example.com" → "Example"
    base_domain = domain.split('.')[0]
    
    # Handle special cases
    if base_domain.lower() in ['ai', 'ml', 'api', 'gpt', 'llm']:
        return base_domain.upper()
    
    # Title case for single words
    return base_domain.title()


def calculate_read_time(text_length: int) -> int:
    """Calculate estimated read time in minutes.
    
    Uses average reading speed of ~250 words per minute.
    
    Args:
        text_length: Length of text in characters
        
    Returns:
        Estimated read time in minutes (minimum 1)
        
    Examples:
        >>> calculate_read_time(1000)  # ~200 words
        1
        >>> calculate_read_time(5000)  # ~1000 words
        4
    """
    # Average word length ~ 5 characters
    estimated_words = text_length / 5
    
    # Average reading speed ~ 250 words per minute
    minutes = estimated_words / 250
    
    # Round up and ensure minimum of 1 minute
    return max(1, round(minutes))


def truncate_summary(text: str, max_length: int = 200) -> str:
    """Truncate text to create a concise summary.
    
    Tries to break at sentence boundaries for readability.
    
    Args:
        text: Full text to truncate
        max_length: Maximum character length (default: 200 for 1-2 sentences)
        
    Returns:
        Truncated summary with ellipsis if needed
        
    Examples:
        >>> truncate_summary("This is sentence one. This is sentence two. This is sentence three.")
        "This is sentence one. This is sentence two."
    """
    if len(text) <= max_length:
        return text
    
    # Try to find sentence boundary
    truncated = text[:max_length]
    
    # Look for period followed by space
    last_period = truncated.rfind('. ')
    
    if last_period > max_length * 0.6:  # Only if we don't lose too much
        return truncated[:last_period + 1]
    
    # Otherwise, break at last space
    last_space = truncated.rfind(' ')
    if last_space > 0:
        return truncated[:last_space] + "..."
    
    return truncated + "..."


def ranked_doc_to_story(ranked_doc: RankedDoc, user_id: str) -> Story:
    """Convert a RankedDoc to a Story for database storage.

    Args:
        ranked_doc: RankedDoc with ranking scores
        user_id: User ID who owns this story

    Returns:
        Story object ready for database insertion
    """
    doc = ranked_doc.document
    now = datetime.utcnow()

    return Story(
        # Core identity
        id=doc.id,
        title=doc.title,
        url=doc.url,
        summary=truncate_summary(doc.snippet, max_length=200),

        # Source metadata
        source_domain=doc.source_domain,
        source_display_name=format_source_display_name(doc.source_domain),
        author=doc.author,
        published_at=doc.published_at,

        # AI enrichment (placeholder - will be added by LLM agent later)
        content_type=None,
        ai_tags=[],

        # Ranking metadata
        final_score=ranked_doc.final_score,
        rank=ranked_doc.rank,
        provider=doc.provider,
        raw_score=doc.raw_score,

        # User interaction state
        user_id=user_id,
        is_read=False,
        is_saved=False,
        user_rating=None,
        user_notes=None,

        # Timestamps
        retrieved_at=now,
        added_to_brief_at=now
    )

