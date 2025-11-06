#!/usr/bin/env python3
"""
Raw API Response Demo

Shows the actual, full results from Exa and Perplexity APIs,
and verifies how they populate the Document object.
"""

import asyncio
import json
from typing import List
from datetime import datetime
from tools.exa import ExaClient
from tools.perplexity import PerplexityClient
from tools.normalize import normalize_batch
from models.schemas import SearchResult, Document


def truncate_long_fields(obj, max_length=150):
    """Truncate long text fields for readability."""
    if isinstance(obj, dict):
        result = {}
        for key, value in obj.items():
            if isinstance(value, str) and key in ['text', 'snippet'] and len(value) > max_length:
                result[key] = value[:max_length] + f"... [truncated, total: {len(value)} chars]"
            elif isinstance(value, (dict, list)):
                result[key] = truncate_long_fields(value, max_length)
            else:
                result[key] = value
        return result
    elif isinstance(obj, list):
        return [truncate_long_fields(item, max_length) for item in obj]
    else:
        return obj


def print_json(obj, title: str):
    """Pretty print JSON with a title."""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)
    if isinstance(obj, (list, dict)):
        truncated = truncate_long_fields(obj)
        print(json.dumps(truncated, indent=2, default=str))
    else:
        print(obj)


async def show_raw_api_data():
    """Fetch and display raw API responses."""
    
    query = "Claude AI model anthropic"
    num_results = 4  # Just 4 results per provider for brevity
    
    print("\n" + "🔍" * 40)
    print("RAW API RESPONSE ANALYZER")
    print("🔍" * 40)
    print(f"\nQuery: '{query}'")
    print(f"Results per provider: {num_results}")
    
    # ============================================================================
    # EXA API
    # ============================================================================
    
    print("\n\n" + "█"*80)
    print("  EXA API")
    print("█"*80)
    
    exa = ExaClient()
    
    # Get SearchResult objects
    exa_results: List[SearchResult] = await exa.search(query, num_results=num_results)
    
    print("\n" + "─"*80)
    print("  Step 1: Raw SearchResult Objects from Exa")
    print("─"*80)
    
    for i, result in enumerate(exa_results, 1):
        print(f"\n{'='*40} Result #{i} {'='*40}")
        # Convert to dict for pretty printing
        result_dict = result.model_dump()
        truncated = truncate_long_fields(result_dict)
        print(json.dumps(truncated, indent=2, default=str))
    
    # Normalize to Documents
    exa_docs: List[Document] = normalize_batch(exa_results)
    
    print("\n" + "─"*80)
    print("  Step 2: Normalized Document Objects from Exa")
    print("─"*80)
    
    for i, doc in enumerate(exa_docs, 1):
        print(f"\n{'='*40} Document #{i} {'='*40}")
        doc_dict = doc.model_dump()
        truncated = truncate_long_fields(doc_dict)
        print(json.dumps(truncated, indent=2, default=str))
    
    # ============================================================================
    # PERPLEXITY API
    # ============================================================================
    
    print("\n\n" + "█"*80)
    print("  PERPLEXITY API")
    print("█"*80)
    
    perplexity = PerplexityClient()
    
    # Get SearchResult objects
    perplexity_results: List[SearchResult] = await perplexity.search(query, num_results=num_results)
    
    print("\n" + "─"*80)
    print("  Step 1: Raw SearchResult Objects from Perplexity")
    print("─"*80)
    
    for i, result in enumerate(perplexity_results, 1):
        print(f"\n{'='*40} Result #{i} {'='*40}")
        result_dict = result.model_dump()
        truncated = truncate_long_fields(result_dict)
        print(json.dumps(truncated, indent=2, default=str))
    
    # Normalize to Documents
    perplexity_docs: List[Document] = normalize_batch(perplexity_results)
    
    print("\n" + "─"*80)
    print("  Step 2: Normalized Document Objects from Perplexity")
    print("─"*80)
    
    for i, doc in enumerate(perplexity_docs, 1):
        print(f"\n{'='*40} Document #{i} {'='*40}")
        doc_dict = doc.model_dump()
        truncated = truncate_long_fields(doc_dict)
        print(json.dumps(truncated, indent=2, default=str))
    
    # ============================================================================
    # FIELD COMPLETENESS ANALYSIS
    # ============================================================================
    
    all_docs = exa_docs + perplexity_docs
    
    print("\n\n" + "█"*80)
    print("  DOCUMENT FIELD COMPLETENESS ANALYSIS")
    print("█"*80)
    
    # Analyze which fields are populated
    field_stats = {
        "id": {"populated": 0, "null": 0},
        "title": {"populated": 0, "null": 0},
        "url": {"populated": 0, "null": 0},
        "snippet": {"populated": 0, "null": 0},
        "published_at": {"populated": 0, "null": 0},
        "published_online": {"populated": 0, "null": 0},
        "published_issue": {"populated": 0, "null": 0},
        "source_domain": {"populated": 0, "null": 0},
        "author": {"populated": 0, "null": 0},
        "provider": {"populated": 0, "null": 0},
        "raw_score": {"populated": 0, "null": 0},
        "embedding": {"populated": 0, "null": 0}
    }
    
    for doc in all_docs:
        for field in field_stats.keys():
            value = getattr(doc, field, None)
            if value is not None and value != "":
                field_stats[field]["populated"] += 1
            else:
                field_stats[field]["null"] += 1
    
    print(f"\nTotal Documents Analyzed: {len(all_docs)}")
    print(f"  - Exa: {len(exa_docs)}")
    print(f"  - Perplexity: {len(perplexity_docs)}")
    
    print("\n" + "─"*80)
    print(f"{'Field':<20} {'Populated':<12} {'Null':<12} {'Fill Rate':<12}")
    print("─"*80)
    
    for field, stats in field_stats.items():
        total = stats["populated"] + stats["null"]
        fill_rate = (stats["populated"] / total * 100) if total > 0 else 0
        print(f"{field:<20} {stats['populated']:<12} {stats['null']:<12} {fill_rate:.1f}%")
    
    # Field-by-field analysis
    print("\n" + "─"*80)
    print("  Field Details")
    print("─"*80)
    
    print("\n✅ ALWAYS POPULATED (Required fields):")
    print("   - id: Unique identifier (URL or API-provided ID)")
    print("   - title: Article/document title")
    print("   - url: Source URL")
    print("   - snippet: Text content (truncated to 1000 chars)")
    print("   - source_domain: Extracted from URL")
    print("   - provider: Search provider (exa/perplexity)")
    print("   - raw_score: Relevance score from provider")
    
    print("\n⚠️  CONDITIONALLY POPULATED:")
    print("   - published_at: Effective date for ranking (if date available)")
    print("   - published_online: When first available online (same as published_at for now)")
    print("   - published_issue: Journal issue date (only if clamped from future)")
    print("   - author: Article author (if provided by API)")
    
    print("\n❌ NOT POPULATED (Reserved for future use):")
    print("   - embedding: Vector embeddings (for MMR/novelty filtering)")
    
    # Provider-specific notes
    print("\n" + "─"*80)
    print("  Provider-Specific Behavior")
    print("─"*80)
    
    print("\n📡 EXA:")
    print("   - Provides: id, title, url, text, score, publishedDate, author")
    print("   - Scores: Semantic relevance scores (0.0-1.0)")
    print("   - Dates: publishedDate (ISO format, optional)")
    print("   - Author: Sometimes provided")
    
    print("\n📡 PERPLEXITY:")
    print("   - Provides: title, url, snippet, date, last_updated")
    print("   - Scores: Rank-based (we calculate using exponential decay)")
    print("   - Dates: Dual dates - 'date' (official) and 'last_updated' (online)")
    print("   - Author: Not provided")
    print("   - Note: We prefer last_updated over date for recency ranking")
    
    print("\n" + "█"*80)
    print("  ✅ ANALYSIS COMPLETE")
    print("█"*80 + "\n")


if __name__ == "__main__":
    asyncio.run(show_raw_api_data())