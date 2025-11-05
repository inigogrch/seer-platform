"""
Heuristic-based ranking for search results.

Fast, interpretable ranking using:
1. Recency score (how recent is the content?)
2. Domain authority (how trustworthy is the source?)
3. Provider score (original relevance from search API)

Combined using a weighted formula optimized for news/research content.
"""

from typing import List
from datetime import datetime, timedelta
from models.schemas import Document, RankedDoc
from ranking.domain_authority import get_domain_authority
import math


def rank_by_heuristics(
    documents: List[Document],
    recency_weight: float = 0.4,
    authority_weight: float = 0.3,
    provider_weight: float = 0.3,
    recency_halflife_days: int = 7,
) -> List[RankedDoc]:
    """Rank documents using heuristic scoring.
    
    Scoring formula:
        final_score = (recency_weight * recency_score) +
                     (authority_weight * domain_authority) +
                     (provider_weight * provider_score)
    
    Where:
    - recency_score: Exponential decay based on age (1.0 for today, 0.5 after halflife)
    - domain_authority: Pre-configured score based on source domain (0.5-1.0)
    - provider_score: Original relevance score from search API (0.0-1.0)
    
    Args:
        documents: List of normalized Document objects
        recency_weight: Weight for recency in final score (default: 0.4)
        authority_weight: Weight for domain authority (default: 0.3)
        provider_weight: Weight for provider score (default: 0.3)
        recency_halflife_days: Days until recency score decays to 50% (default: 7)
        
    Returns:
        List of RankedDoc objects sorted by final_score (highest first)
        
    Example:
        >>> from models.schemas import Document, SearchProvider
        >>> from datetime import datetime
        >>> docs = [
        ...     Document(
        ...         id="1", title="News", url="https://techcrunch.com/article",
        ...         snippet="...", published_at=datetime.now(),
        ...         source_domain="techcrunch.com", provider=SearchProvider.EXA,
        ...         raw_score=0.9
        ...     )
        ... ]
        >>> ranked = rank_by_heuristics(docs)
        >>> ranked[0].rank
        1
    """
    if not documents:
        return []
    
    # Validate weights sum to ~1.0
    total_weight = recency_weight + authority_weight + provider_weight
    if not (0.99 <= total_weight <= 1.01):
        raise ValueError(
            f"Weights must sum to 1.0, got {total_weight:.3f}. "
            f"(recency={recency_weight}, authority={authority_weight}, provider={provider_weight})"
        )
    
    # Score all documents
    scored_docs = []
    now = datetime.now()
    
    for doc in documents:
        # Calculate individual scores
        recency_score = _calculate_recency_score(doc.published_at, now, recency_halflife_days)
        authority_score = get_domain_authority(doc.source_domain)
        provider_score = doc.raw_score
        
        # Calculate weighted final score (0-100 scale for readability)
        final_score = (
            recency_weight * recency_score +
            authority_weight * authority_score +
            provider_weight * provider_score
        ) * 100.0
        
        ranked_doc = RankedDoc(
            document=doc,
            final_score=final_score,
            rank=0,  # Will be set after sorting
            heuristic_score=final_score,
        )
        scored_docs.append(ranked_doc)
    
    # Sort by final_score (descending)
    scored_docs.sort(key=lambda x: x.final_score, reverse=True)
    
    # Assign ranks (1-based)
    for rank, doc in enumerate(scored_docs, start=1):
        doc.rank = rank
    
    return scored_docs


def _calculate_recency_score(
    published_at: datetime | None,
    now: datetime,
    halflife_days: int
) -> float:
    """Calculate recency score using exponential decay.
    
    Score decays exponentially with age:
    - Today: 1.0
    - After halflife_days: 0.5
    - After 2*halflife_days: 0.25
    - And so on...
    
    If published_at is None, returns a low default score (0.3).
    
    Args:
        published_at: Publication date (or None)
        now: Current datetime
        halflife_days: Days until score decays to 50%
        
    Returns:
        Recency score between 0.0 and 1.0
        
    Examples:
        >>> from datetime import datetime, timedelta
        >>> now = datetime.now()
        >>> # Today's content
        >>> _calculate_recency_score(now, now, 7)
        1.0
        >>> # 7 days old (halflife)
        >>> week_ago = now - timedelta(days=7)
        >>> abs(_calculate_recency_score(week_ago, now, 7) - 0.5) < 0.01
        True
        >>> # 14 days old (2*halflife)
        >>> two_weeks_ago = now - timedelta(days=14)
        >>> abs(_calculate_recency_score(two_weeks_ago, now, 7) - 0.25) < 0.01
        True
    """
    if published_at is None:
        # No date available - assign low score
        return 0.3
    
    # Handle timezone-naive vs timezone-aware datetimes
    if published_at.tzinfo is not None and now.tzinfo is None:
        now = now.replace(tzinfo=published_at.tzinfo)
    elif published_at.tzinfo is None and now.tzinfo is not None:
        published_at = published_at.replace(tzinfo=now.tzinfo)
    
    # Calculate age in days
    age_delta = now - published_at
    age_days = age_delta.total_seconds() / 86400.0  # seconds -> days
    
    # Handle edge cases
    if age_days < 0:
        # Future date (shouldn't happen due to clamping, but be safe)
        return 1.0
    
    if age_days == 0:
        # Published today
        return 1.0
    
    # Exponential decay formula: score = 0.5^(age_days / halflife_days)
    # Equivalent to: score = e^(-(ln(2) / halflife_days) * age_days)
    decay_rate = math.log(2) / halflife_days
    score = math.exp(-decay_rate * age_days)
    
    # Clamp to reasonable minimum (very old content still has some value)
    return max(score, 0.01)


def explain_score(ranked_doc: RankedDoc, recency_halflife_days: int = 7) -> str:
    """Generate human-readable explanation of a document's score.
    
    Useful for debugging and understanding ranking decisions.
    
    Args:
        ranked_doc: RankedDoc with scoring information
        recency_halflife_days: Halflife used for recency calculation
        
    Returns:
        Multi-line explanation string
        
    Example:
        >>> # (Assuming a RankedDoc object)
        >>> print(explain_score(ranked_doc))
        Rank #1 - Score: 87.5
        Title: "AI Breakthrough"
        Domain: techcrunch.com (Premium, authority=1.0)
        Recency: 2 days old (score=0.85)
        Provider: EXA (score=0.92)
    """
    doc = ranked_doc.document
    now = datetime.now()
    
    # Calculate component scores
    recency_score = _calculate_recency_score(doc.published_at, now, recency_halflife_days)
    authority_score = get_domain_authority(doc.source_domain)
    
    # Calculate age
    if doc.published_at:
        age_delta = now - doc.published_at
        age_days = int(age_delta.total_seconds() / 86400)
        age_str = f"{age_days} days old"
    else:
        age_str = "unknown age"
    
    # Get authority tier
    from ranking.domain_authority import get_authority_tier
    authority_tier = get_authority_tier(authority_score)
    
    explanation = f"""Rank #{ranked_doc.rank} - Score: {ranked_doc.final_score:.1f}
Title: "{doc.title[:60]}{'...' if len(doc.title) > 60 else ''}"
Domain: {doc.source_domain} ({authority_tier}, authority={authority_score:.2f})
Recency: {age_str} (score={recency_score:.2f})
Provider: {doc.provider.value.upper()} (score={doc.raw_score:.2f})
"""
    
    return explanation.strip()

