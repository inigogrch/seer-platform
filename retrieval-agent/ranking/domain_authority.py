"""
Domain authority scoring for search results.

Provides domain-based scoring to boost high-quality sources and penalize low-quality ones.
Scores are tiered to make configuration and debugging easier.

To upgrade---will add more domains, remove hardcoded scoring, and include personalizability based on user preferences. For example, if a user is interested in a specific industry, we can boost the scores for sources in that industry.
"""

from typing import Dict

# Domain authority tiers
# Scores range from 0.0 (lowest) to 1.0 (highest)
# These are multipliers applied to base scores

DOMAIN_AUTHORITY_SCORES: Dict[str, float] = {
    # Tier 1: Premium tech news and official sources (1.0)
    "techcrunch.com": 1.0,
    "theverge.com": 1.0,
    "arstechnica.com": 1.0,
    "wired.com": 1.0,
    "engadget.com": 1.0,
    "theinformation.com": 1.0,
    "stratechery.com": 1.0,
    
    # Official company blogs and announcements (1.0)
    "openai.com": 1.0,
    "anthropic.com": 1.0,
    "deepmind.com": 1.0,
    "google.com": 1.0,
    "microsoft.com": 1.0,
    "apple.com": 1.0,
    "meta.com": 1.0,
    "nvidia.com": 1.0,
    
    # Tier 2: Academic and research institutions (0.95)
    "arxiv.org": 0.95,
    "scholar.google.com": 0.95,
    "mit.edu": 0.95,
    "stanford.edu": 0.95,
    "berkeley.edu": 0.95,
    "caltech.edu": 0.95,
    "ox.ac.uk": 0.95,
    "cam.ac.uk": 0.95,
    
    # Academic publishers (0.9)
    "nature.com": 0.9,
    "science.org": 0.9,
    "sciencedirect.com": 0.9,
    "springer.com": 0.9,
    "ieee.org": 0.9,
    "acm.org": 0.9,
    "plos.org": 0.9,
    
    # Tier 3: Respected tech publications (0.85)
    "venturebeat.com": 0.85,
    "zdnet.com": 0.85,
    "cnet.com": 0.85,
    "technologyreview.com": 0.85,
    "theatlantic.com": 0.85,
    "newyorker.com": 0.85,
    
    # Tier 4: Developer/practitioner communities (0.8)
    "hackernews.com": 0.8,
    "ycombinator.com": 0.8,
    "github.com": 0.8,
    "stackoverflow.com": 0.8,
    "dev.to": 0.8,
    "medium.com": 0.75,  # Slightly lower due to variable quality
    
    # Tier 5: Aggregators and general news (0.7)
    "reuters.com": 0.7,
    "bloomberg.com": 0.7,
    "wsj.com": 0.7,
    "nytimes.com": 0.7,
    "washingtonpost.com": 0.7,
    "theguardian.com": 0.7,
    "bbc.co.uk": 0.7,
    "bbc.com": 0.7,
    
    # Tier 6: Reference and encyclopedic (0.65)
    "wikipedia.org": 0.65,  # Good for background but not for "news"
    
    # Default for unknown domains: 0.5 (neutral)
}

DEFAULT_DOMAIN_AUTHORITY = 0.5


def get_domain_authority(domain: str) -> float:
    """Get the authority score for a domain.
    
    Args:
        domain: Domain name (e.g., "techcrunch.com")
        
    Returns:
        Authority score between 0.0 and 1.0
        
    Examples:
        >>> get_domain_authority("openai.com")
        1.0
        >>> get_domain_authority("arxiv.org")
        0.95
        >>> get_domain_authority("unknown-blog.com")
        0.5
    """
    if not domain:
        return DEFAULT_DOMAIN_AUTHORITY
    
    # Normalize domain (lowercase, remove www prefix if present)
    normalized_domain = domain.lower().replace("www.", "")
    
    return DOMAIN_AUTHORITY_SCORES.get(normalized_domain, DEFAULT_DOMAIN_AUTHORITY)


def get_authority_tier(score: float) -> str:
    """Get a human-readable tier label for an authority score.
    
    Useful for debugging and explanations.
    
    Args:
        score: Authority score (0.0-1.0)
        
    Returns:
        Tier label string
        
    Examples:
        >>> get_authority_tier(1.0)
        'Premium'
        >>> get_authority_tier(0.95)
        'Academic'
        >>> get_authority_tier(0.5)
        'Unknown'
    """
    if score >= 0.95:
        return "Premium"
    elif score >= 0.9:
        return "Academic"
    elif score >= 0.85:
        return "Respected"
    elif score >= 0.8:
        return "Community"
    elif score >= 0.7:
        return "Mainstream"
    elif score >= 0.6:
        return "Reference"
    else:
        return "Unknown"

