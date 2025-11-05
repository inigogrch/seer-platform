"""
Ranking module for the retrieval agent.

Components:
- domain_authority: Domain scoring and authority configuration
- heuristics: Fast heuristic-based scoring (recency + domain + provider)
- rrf: Reciprocal Rank Fusion (future)
- mmr: Maximal Marginal Relevance for diversity (future)
- novelty: Deduplication against recent briefs (future)
"""

from ranking.heuristics import rank_by_heuristics

__all__ = [
    "rank_by_heuristics",
]

