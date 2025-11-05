#!/usr/bin/env python3
"""
Ranking Pipeline Demo

Demonstrates the complete search → normalize → rank pipeline with real API data.
Shows how date clamping, domain authority, and recency scoring work together.

Usage:
    python demo_ranking.py
    python demo_ranking.py --query "machine learning papers"
    python demo_ranking.py --num-results 5 --verbose
"""

import asyncio
import argparse
from typing import List
from datetime import datetime

from tools.exa import ExaClient
from tools.perplexity import PerplexityClient
from tools.normalize import normalize_batch
from ranking.heuristics import rank_by_heuristics, explain_score
from models.schemas import Document, RankedDoc


def print_section(title: str, char: str = "="):
    """Print a formatted section header."""
    print(f"\n{char * 80}")
    print(f"  {title}")
    print(f"{char * 80}\n")


async def search_and_rank(query: str, num_results: int = 5, verbose: bool = False):
    """Execute search, normalization, and ranking pipeline.
    
    Args:
        query: Search query string
        num_results: Results per provider
        verbose: Show detailed information
    """
    
    print_section("🔍 RANKING PIPELINE DEMO", "=")
    
    print(f"Query: '{query}'")
    print(f"Results per provider: {num_results}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Step 1: Search with both providers
    print_section("Step 1: Parallel Search Execution", "-")
    
    exa = ExaClient()
    perplexity = PerplexityClient()
    
    print("Starting parallel searches...")
    start_time = asyncio.get_event_loop().time()
    
    exa_results, perplexity_results = await asyncio.gather(
        exa.search(query, num_results=num_results, days=7),
        perplexity.search(query, num_results=num_results),
        return_exceptions=True
    )
    
    duration = asyncio.get_event_loop().time() - start_time
    
    # Handle results
    all_results = []
    if isinstance(exa_results, Exception):
        print(f"⚠️  Exa failed: {exa_results}")
    else:
        print(f"✅ Exa returned {len(exa_results)} results")
        all_results.extend(exa_results)
    
    if isinstance(perplexity_results, Exception):
        print(f"⚠️  Perplexity failed: {perplexity_results}")
    else:
        print(f"✅ Perplexity returned {len(perplexity_results)} results")
        all_results.extend(perplexity_results)
    
    print(f"⚡ Completed in {duration:.2f}s")
    print(f"📊 Total raw results: {len(all_results)}")
    
    if not all_results:
        print("\n❌ No results to rank. Exiting.")
        return
    
    # Step 2: Normalize results
    print_section("Step 2: Result Normalization", "-")
    
    print("Normalizing results (date parsing, domain extraction, clamping)...")
    documents = normalize_batch(all_results)
    
    print(f"✅ Normalized {len(documents)} documents")
    
    # Show date distribution
    dated_docs = [d for d in documents if d.published_at]
    if dated_docs:
        dates = [d.published_at for d in dated_docs]
        oldest = min(dates)
        newest = max(dates)
        print(f"📅 Date range: {oldest.strftime('%Y-%m-%d')} to {newest.strftime('%Y-%m-%d')}")
        print(f"   (Note: Future dates clamped to today)")
    
    # Show domain distribution
    domains = {}
    for doc in documents:
        domains[doc.source_domain] = domains.get(doc.source_domain, 0) + 1
    print(f"🌐 Unique domains: {len(domains)}")
    
    if verbose:
        print("\nDomain breakdown:")
        for domain, count in sorted(domains.items(), key=lambda x: x[1], reverse=True):
            print(f"  - {domain}: {count} doc(s)")
    
    # Step 3: Rank documents
    print_section("Step 3: Heuristic Ranking", "-")
    
    print("Applying heuristic ranking (recency + authority + provider score)...")
    print("Weights: recency=0.4, authority=0.3, provider=0.3")
    
    ranked = rank_by_heuristics(
        documents,
        recency_weight=0.4,
        authority_weight=0.3,
        provider_weight=0.3,
        recency_halflife_days=7
    )
    
    print(f"✅ Ranked {len(ranked)} documents")
    
    # Show score distribution
    scores = [doc.final_score for doc in ranked]
    print(f"📊 Score range: {min(scores):.1f} - {max(scores):.1f}")
    print(f"   Average: {sum(scores)/len(scores):.1f}")
    
    # Step 4: Display ranked results
    print_section("Step 4: Top Ranked Results", "-")
    
    top_n = min(5, len(ranked))
    print(f"Showing top {top_n} results:\n")
    
    for doc in ranked[:top_n]:
        print(explain_score(doc))
        print()
    
    # Verbose: Show all results in table format
    if verbose and len(ranked) > top_n:
        print_section(f"All {len(ranked)} Results (Table View)", "-")
        
        print(f"{'Rank':<6} {'Score':<8} {'Domain':<25} {'Age':<12} {'Title':<40}")
        print("-" * 95)
        
        now = datetime.now()
        for doc in ranked:
            if doc.document.published_at:
                age_days = (now - doc.document.published_at).days
                age_str = f"{age_days}d ago"
            else:
                age_str = "unknown"
            
            title_short = doc.document.title[:37] + "..." if len(doc.document.title) > 40 else doc.document.title
            
            print(f"#{doc.rank:<5} {doc.final_score:<7.1f} {doc.document.source_domain:<25} {age_str:<12} {title_short:<40}")
    
    # Step 5: Ranking insights
    print_section("Step 5: Ranking Insights", "-")
    
    # Top domain by rank
    top_domain = ranked[0].document.source_domain
    print(f"🥇 Top-ranked domain: {top_domain}")
    
    # Provider distribution in top 5
    top_providers = {}
    for doc in ranked[:5]:
        provider = doc.document.provider.value
        top_providers[provider] = top_providers.get(provider, 0) + 1
    
    print(f"📡 Top-5 provider distribution:")
    for provider, count in top_providers.items():
        print(f"   - {provider.upper()}: {count}/{min(5, len(ranked))}")
    
    # Recency impact
    top_doc = ranked[0]
    if top_doc.document.published_at:
        age_days = (datetime.now() - top_doc.document.published_at).days
        print(f"⏰ Top result age: {age_days} days")
    
    print_section("✅ Demo Complete", "=")


def main():
    """Parse arguments and run demo."""
    parser = argparse.ArgumentParser(
        description="Demonstrate the search → normalize → rank pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python demo_ranking.py
  python demo_ranking.py --query "Claude AI model"
  python demo_ranking.py --num-results 10 --verbose
        """
    )
    
    parser.add_argument(
        "--query",
        type=str,
        default="artificial intelligence breakthroughs 2025",
        help="Search query (default: 'artificial intelligence breakthroughs 2025')"
    )
    
    parser.add_argument(
        "--num-results",
        type=int,
        default=5,
        help="Results per provider (default: 5)"
    )
    
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Show detailed information including all results"
    )
    
    args = parser.parse_args()
    
    # Run the pipeline
    try:
        asyncio.run(search_and_rank(
            query=args.query,
            num_results=args.num_results,
            verbose=args.verbose
        ))
    except KeyboardInterrupt:
        print("\n\n⚠️  Demo interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        raise


if __name__ == "__main__":
    main()

