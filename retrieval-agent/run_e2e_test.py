#!/usr/bin/env python3
"""
End-to-End Test Script for Search API Integration

This script demonstrates the full search pipeline with real API calls:
1. Initialize both search providers (Exa + Perplexity)
2. Execute parallel searches
3. Normalize results
4. Display comprehensive output

Requirements:
- EXA_API_KEY and PERPLEXITY_SEARCH_API_KEY in environment or .env.local
- Internet connection

Usage:
    python run_e2e_test.py
    python run_e2e_test.py --query "your custom query"
    python run_e2e_test.py --verbose
"""

import asyncio
import sys
import time
import argparse
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from tools.exa import ExaClient
from tools.perplexity import PerplexityClient
from tools.normalize import normalize_batch
from models.schemas import SearchProvider


async def run_e2e_test(query: str, num_results: int = 5, verbose: bool = False):
    """
    Execute full end-to-end search test with both providers.
    
    Args:
        query: Search query
        num_results: Number of results per provider
        verbose: Show detailed output
    """
    print("=" * 80)
    print("🚀 SEER SEARCH API - END-TO-END TEST")
    print("=" * 80)
    
    # Initialize clients
    print("\n📦 Step 1: Initialize Search Providers")
    print("-" * 80)
    
    try:
        exa_client = ExaClient()
        print(f"✅ Exa client initialized (key: ...{exa_client.api_key[-4:]})")
    except ValueError as e:
        print(f"❌ Exa initialization failed: {e}")
        print("   Make sure EXA_API_KEY is set in .env.local")
        return False
    
    try:
        perplexity_client = PerplexityClient()
        print(f"✅ Perplexity client initialized (key: ...{perplexity_client.api_key[-4:]})")
    except ValueError as e:
        print(f"❌ Perplexity initialization failed: {e}")
        print("   Make sure PERPLEXITY_SEARCH_API_KEY is set in .env.local")
        return False
    
    # Execute parallel searches
    print(f"\n🔍 Step 2: Execute Parallel Searches")
    print("-" * 80)
    print(f"Query: '{query}'")
    print(f"Results per provider: {num_results}")
    print(f"Starting searches in parallel...\n")
    
    start_time = time.time()
    
    # Create tasks for parallel execution
    exa_task = exa_client.search(
        query=query,
        num_results=num_results,
        days=7  # Last 7 days
    )
    
    perplexity_task = perplexity_client.search(
        query=query,
        num_results=num_results
    )
    
    # Execute in parallel with error handling
    exa_results, perplexity_results = await asyncio.gather(
        exa_task,
        perplexity_task,
        return_exceptions=True
    )
    
    elapsed = time.time() - start_time
    
    # Handle results
    all_results = []
    
    if isinstance(exa_results, Exception):
        print(f"❌ Exa search failed: {exa_results}")
    else:
        print(f"✅ Exa returned {len(exa_results)} results")
        all_results.extend(exa_results)
    
    if isinstance(perplexity_results, Exception):
        print(f"❌ Perplexity search failed: {perplexity_results}")
    else:
        print(f"✅ Perplexity returned {len(perplexity_results)} results")
        all_results.extend(perplexity_results)
    
    print(f"\n⚡ Parallel execution completed in {elapsed:.2f}s")
    
    if not all_results:
        print("\n❌ No results from either provider. Test failed.")
        return False
    
    # Normalize results
    print(f"\n📄 Step 3: Normalize Results")
    print("-" * 80)
    
    documents = normalize_batch(all_results)
    print(f"✅ Normalized {len(documents)} documents")
    
    # Analyze results
    print(f"\n📊 Step 4: Result Analysis")
    print("-" * 80)
    
    # Provider distribution
    provider_counts = {}
    for doc in documents:
        provider_counts[doc.provider.value] = provider_counts.get(doc.provider.value, 0) + 1
    
    print(f"\nProvider Distribution:")
    for provider, count in provider_counts.items():
        percentage = (count / len(documents)) * 100
        print(f"  {provider.upper()}: {count} documents ({percentage:.1f}%)")
    
    # Date analysis
    docs_with_dates = [d for d in documents if d.published_at]
    print(f"\nDate Coverage:")
    print(f"  Documents with dates: {len(docs_with_dates)}/{len(documents)} ({len(docs_with_dates)/len(documents)*100:.1f}%)")
    
    if docs_with_dates:
        dates = sorted([d.published_at for d in docs_with_dates])
        print(f"  Date range: {dates[0].date()} to {dates[-1].date()}")
    
    # Domain diversity
    unique_domains = len(set(d.source_domain for d in documents))
    print(f"\nDomain Diversity:")
    print(f"  Unique domains: {unique_domains}")
    
    # Score distribution
    avg_score = sum(d.raw_score for d in documents) / len(documents)
    max_score = max(d.raw_score for d in documents)
    min_score = min(d.raw_score for d in documents)
    
    print(f"\nScore Distribution:")
    print(f"  Average: {avg_score:.3f}")
    print(f"  Range: {min_score:.3f} - {max_score:.3f}")
    
    # Display sample results
    print(f"\n📋 Step 5: Sample Results")
    print("-" * 80)
    
    for provider in [SearchProvider.EXA, SearchProvider.PERPLEXITY]:
        provider_docs = [d for d in documents if d.provider == provider]
        if provider_docs:
            print(f"\n{provider.value.upper()} (showing top 2):")
            for i, doc in enumerate(provider_docs[:2], 1):
                print(f"\n  {i}. {doc.title[:70]}{'...' if len(doc.title) > 70 else ''}")
                print(f"     URL: {doc.url}")
                print(f"     Domain: {doc.source_domain}")
                print(f"     Score: {doc.raw_score:.3f}")
                print(f"     Date: {doc.published_at.date() if doc.published_at else 'N/A'}")
                
                if verbose:
                    snippet = doc.snippet[:150] + "..." if len(doc.snippet) > 150 else doc.snippet
                    print(f"     Snippet: {snippet}")
    
    # Show all results if verbose
    if verbose:
        print(f"\n🔍 Detailed Results (All {len(documents)} documents)")
        print("-" * 80)
        
        for i, doc in enumerate(documents, 1):
            print(f"\n{i}. [{doc.provider.value.upper()}] {doc.title}")
            print(f"   URL: {doc.url}")
            print(f"   Domain: {doc.source_domain}")
            print(f"   Score: {doc.raw_score:.3f}")
            print(f"   Date: {doc.published_at.date() if doc.published_at else 'N/A'}")
            snippet = doc.snippet[:200] + "..." if len(doc.snippet) > 200 else doc.snippet
            print(f"   Snippet: {snippet}")
    
    # Summary
    print("\n" + "=" * 80)
    print("✅ END-TO-END TEST COMPLETE")
    print("=" * 80)
    print(f"\nSummary:")
    print(f"  • Total documents: {len(documents)}")
    print(f"  • Providers: {', '.join(provider_counts.keys())}")
    print(f"  • Unique domains: {unique_domains}")
    print(f"  • Search time: {elapsed:.2f}s")
    print(f"  • Status: SUCCESS ✅")
    
    return True


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="End-to-end test for Seer search API integration"
    )
    parser.add_argument(
        "--query",
        "-q",
        default="artificial intelligence breakthroughs 2024",
        help="Search query (default: 'artificial intelligence breakthroughs 2024')"
    )
    parser.add_argument(
        "--num-results",
        "-n",
        type=int,
        default=5,
        help="Number of results per provider (default: 5)"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Show detailed output including all results"
    )
    
    args = parser.parse_args()
    
    # Run async test
    success = asyncio.run(run_e2e_test(
        query=args.query,
        num_results=args.num_results,
        verbose=args.verbose
    ))
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
