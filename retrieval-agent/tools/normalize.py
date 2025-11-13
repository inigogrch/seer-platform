"""
Result normalization utilities.

Converts raw SearchResult objects from APIs into standardized Document objects.
Handles date parsing, domain extraction, text truncation, and field mapping.

Date Handling Strategy:
- APIs may return unreliable/placeholder dates (e.g., far future dates)
- We reject dates more than 14 days in the future as unreliable
- published_at is None for documents with unreliable dates
"""

from typing import List, Optional
from datetime import datetime, timedelta
from urllib.parse import urlparse
import re
from models.schemas import SearchResult, Document


def normalize_search_result(result: SearchResult) -> Document:
    """Normalize a single SearchResult into a Document.
    
    Performs:
    - Date string parsing to datetime
    - Future date validation (rejects unreliable dates)
    - Domain extraction from URL
    - Text truncation to snippet length
    - Field mapping and validation
    
    Args:
        result: Raw SearchResult from API
        
    Returns:
        Normalized Document object
    """
    # Parse the date from the API
    raw_date = _parse_date(result.published_date)
    
    # Validate date and reject unreliable future dates
    # (some sources return placeholder dates months/years ahead)
    effective_date = _clamp_future_date(raw_date)
    
    return Document(
        id=result.id,
        title=result.title,
        url=result.url,
        snippet=_truncate_text(result.text),
        published_at=effective_date,  # Validated date for ranking (None if unreliable)
        published_online=effective_date,  # Same as published_at
        published_issue=raw_date if raw_date != effective_date else None,  # Original if rejected
        source_domain=extract_domain(result.url),
        author=result.author,
        provider=result.provider,
        raw_score=result.score,
        embedding=None  # Will be populated later by embedding service
    )


def normalize_batch(results: List[SearchResult]) -> List[Document]:
    """Normalize a batch of SearchResults.
    
    Args:
        results: List of SearchResult objects
        
    Returns:
        List of normalized Document objects
    """
    return [normalize_search_result(result) for result in results]


def extract_domain(url: str) -> str:
    """Extract the primary domain from a URL.
    
    Handles:
    - Standard URLs (https://example.com/path)
    - Subdomains (blog.example.com → example.com)
    - www prefix removal
    - Malformed URLs (returns "unknown")
    
    Args:
        url: Full URL string
        
    Returns:
        Primary domain (e.g., "techcrunch.com")
    """
    if not url:
        return "unknown"
    
    try:
        parsed = urlparse(url)
        hostname = parsed.netloc or parsed.path  # Handle URLs without protocol
        
        if not hostname:
            return "unknown"
        
        # Remove www. prefix
        hostname = hostname.replace("www.", "")
        
        # Extract primary domain (last two parts of domain)
        # e.g., blog.openai.com → openai.com
        parts = hostname.split(".")
        
        if len(parts) >= 2:
            # Get last two parts (domain + TLD)
            return ".".join(parts[-2:])
        elif len(parts) == 1:
            # Single part - check if it looks like a valid domain
            # If it has no dots and no protocol, it's likely invalid
            part = parts[0]
            if part == "localhost" or parsed.scheme:
                return part
            else:
                # Looks like invalid input (e.g., "not-a-url")
                return "unknown"
        else:
            return "unknown"
            
    except Exception:
        # Malformed URL
        return "unknown"


def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
    """Parse various date formats into datetime.
    
    Supports:
    - ISO 8601: 2025-01-04T10:30:00Z
    - Simple date: 2025-01-04
    - With milliseconds: 2025-01-04T10:30:00.123Z
    
    Args:
        date_str: Date string from API (can be None)
        
    Returns:
        Parsed datetime or None if parsing fails or input is None
    """
    if not date_str:
        return None
    
    # List of date formats to try
    formats = [
        "%Y-%m-%d",                      # 2025-01-04
        "%Y-%m-%dT%H:%M:%SZ",           # 2025-01-04T10:30:00Z
        "%Y-%m-%dT%H:%M:%S.%fZ",        # 2025-01-04T10:30:00.123Z
        "%Y-%m-%dT%H:%M:%S%z",          # 2025-01-04T10:30:00+00:00
        "%Y-%m-%dT%H:%M:%S.%f%z",       # 2025-01-04T10:30:00.123+00:00
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    # If all formats fail, try fromisoformat (handles most ISO variants)
    try:
        # Remove Z suffix if present (replace with +00:00 for fromisoformat)
        cleaned = date_str.replace("Z", "+00:00")
        return datetime.fromisoformat(cleaned)
    except Exception:
        # If everything fails, return None
        return None


def _truncate_text(text: str, max_length: int = 1000) -> str:
    """Truncate text to maximum length, adding ellipsis if needed.
    
    Tries to break at word boundaries for better readability.
    
    Args:
        text: Full text content
        max_length: Maximum length for snippet (default: 1000)
        
    Returns:
        Truncated text with ellipsis if needed (total length <= max_length)
    """
    if len(text) <= max_length:
        return text
    
    # Reserve 3 characters for "..."
    # Truncate to max_length - 3 to ensure final length is exactly max_length
    truncated = text[:max_length - 3]
    
    # Try to break at last word boundary
    last_space = truncated.rfind(" ")
    if last_space > (max_length - 3) * 0.8:  # Only if we don't lose too much
        truncated = truncated[:last_space]
    
    return truncated.rstrip() + "..."


def _clamp_future_date(date: Optional[datetime], max_future_days: int = 14) -> Optional[datetime]:
    """Validate dates and reject unreliable future dates.
    
    Some sources return invalid/placeholder dates months in the future.
    These unreliable dates should not be used for recency ranking.
    
    Strategy:
    - If date is None, return None
    - If date is more than max_future_days in the future, return None (unreliable)
    - Otherwise, return the original date
    
    Args:
        date: Parsed datetime (or None)
        max_future_days: Maximum acceptable days in the future (default: 14)
        
    Returns:
        Original datetime if valid, None if unreliable or missing
        
    Examples:
        >>> from datetime import datetime, timedelta
        >>> now = datetime.now()
        >>> # Date 1 month in future -> rejected as unreliable
        >>> future = now + timedelta(days=30)
        >>> _clamp_future_date(future) is None
        True
        >>> # Date 1 week in future -> kept as is
        >>> near_future = now + timedelta(days=7)
        >>> _clamp_future_date(near_future) == near_future
        True
    """
    if date is None:
        return None
    
    now = datetime.now()
    
    # If date has timezone info, make now timezone-aware too
    if date.tzinfo is not None:
        now = datetime.now(date.tzinfo)
    
    # Calculate the threshold
    max_future_threshold = now + timedelta(days=max_future_days)
    
    # If date is suspiciously far in the future, reject it as unreliable
    if date > max_future_threshold:
        return None
    
    # Otherwise, return the original date
    return date

