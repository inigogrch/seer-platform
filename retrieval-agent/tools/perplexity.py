"""
Perplexity Search API client implementation.

This module provides a wrapper around the Perplexity Search API.
Implements the interface defined by our tests (TDD approach).

Based on documentation: https://docs.perplexity.ai/guides/search-quickstart
"""

import os
import time
from typing import List, Optional
from pathlib import Path
from dotenv import load_dotenv
from perplexity import Perplexity
from models.schemas import SearchResult, SearchProvider
from tools.logger import log_api_request, log_api_response, log_api_error

# Load environment variables from .env files
# Searches in order: .env, ../.env.local (for Next.js compatibility)
load_dotenv()  # Load from retrieval-agent/.env if exists
load_dotenv(Path(__file__).parent.parent.parent / '.env.local')  # Load from root .env.local


class PerplexityClient:
    """Client for interacting with Perplexity's Search API.
    
    Perplexity Search API provides ranked search results from their
    continuously refreshed index with advanced filtering options.
    
    Attributes:
        api_key: Perplexity API key for authentication
        client: Underlying Perplexity SDK client
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Perplexity client.
        
        Args:
            api_key: Perplexity API key. If not provided, reads from 
                    PERPLEXITY_SEARCH_API_KEY env var.
            
        Raises:
            ValueError: If no API key is provided or found in environment.
        """
        self.api_key = api_key or os.getenv('PERPLEXITY_SEARCH_API_KEY')
        
        if not self.api_key:
            raise ValueError(
                "PERPLEXITY_SEARCH_API_KEY must be provided as argument or environment variable"
            )
        
        self.client = Perplexity(api_key=self.api_key)
    
    async def search(
        self,
        query: str,
        num_results: int = 10,
        country: Optional[str] = None,
        search_domain_filter: Optional[List[str]] = None,
        max_tokens_per_page: int = 1024
    ) -> List[SearchResult]:
        """Execute search using Perplexity's Search API.
        
        Args:
            query: Search query string
            num_results: Maximum number of results to return (1-20, default: 10)
            country: ISO 3166-1 alpha-2 country code (e.g., "US", "GB")
            search_domain_filter: List of domains to limit results (max 20)
            max_tokens_per_page: Content extraction limit (default: 1024)
            
        Returns:
            List of SearchResult objects with normalized data
            
        Raises:
            Exception: If API call fails
        """
        try:
            # Call the real Perplexity API
            response = await self._call_perplexity_api(
                query,
                max_results=num_results,
                country=country,
                search_domain_filter=search_domain_filter,
                max_tokens_per_page=max_tokens_per_page
            )
            
            # Transform response to our SearchResult schema
            return self._transform_response(response)
            
        except Exception as e:
            log_api_error("Perplexity", "search", e)
            # Re-raise with context
            raise Exception(f"Perplexity search failed: {str(e)}") from e
    
    async def _call_perplexity_api(
        self,
        query: str,
        max_results: int = 10,
        country: Optional[str] = None,
        search_domain_filter: Optional[List[str]] = None,
        max_tokens_per_page: int = 1024
    ) -> dict:
        """Internal method to call Perplexity Search API.
        
        Separated for easier mocking in tests.
        
        Args:
            query: Search query
            max_results: Max results (1-20)
            country: ISO country code
            search_domain_filter: Domain filter list
            max_tokens_per_page: Content extraction limit
            
        Returns:
            Raw API response as dict
        """
        # Build request parameters
        params = {
            "query": query,
            "max_results": max_results,
            "max_tokens_per_page": max_tokens_per_page
        }
        
        if country:
            params["country"] = country
        
        if search_domain_filter:
            params["search_domain_filter"] = search_domain_filter
        
        # Log request
        log_api_request("Perplexity", "search.create", params)
        
        # Time the request
        start_time = time.time()
        
        # Call Perplexity Search API
        response = self.client.search.create(**params)
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Convert response to dict format
        response_dict = {
            "results": [
                {
                    "title": result.title,
                    "url": result.url,
                    "snippet": result.snippet,
                    "date": getattr(result, 'date', None),
                    "last_updated": getattr(result, 'last_updated', None)
                }
                for result in response.results
            ],
            "id": response.id
        }
        
        # Log response
        log_api_response("Perplexity", "search.create", response_dict, duration_ms)
        
        return response_dict
    
    def _transform_response(self, response: dict) -> List[SearchResult]:
        """Transform raw Perplexity API response to SearchResult objects.
        
        Note: Perplexity doesn't provide relevance scores in search results,
        so we assign rank-based scores (1.0 for first result, decreasing).
        
        Perplexity provides dual dates:
        - date: Official publication/issue date (preferred for recency ranking)
        - last_updated: When the webpage was last crawled/updated
        
        We prefer 'date' as it reflects actual content publication, not page updates.
        
        Args:
            response: Raw API response dict
            
        Returns:
            List of SearchResult objects with date metadata
        """
        results = []
        total_results = len(response.get("results", []))
        
        for rank, item in enumerate(response.get("results", []), start=1):
            # Assign rank-based score since Perplexity doesn't provide one
            # First result gets 1.0, each subsequent result gets slightly less
            # Using exponential decay: score = e^(-0.2 * (rank - 1))
            # This gives: 1.0, 0.82, 0.67, 0.55, 0.45, ...
            import math
            score = math.exp(-0.2 * (rank - 1))
            
            # Store the primary date in published_date
            # Prefer the actual publication date over last_updated
            # last_updated reflects when the page was crawled, not when content was published
            primary_date = item.get("date") or item.get("last_updated")
            
            result = SearchResult(
                id=item["url"],  # Use URL as ID since Perplexity doesn't provide one
                title=item["title"],
                url=item["url"],
                text=item["snippet"],  # Perplexity calls it 'snippet'
                score=score,
                published_date=primary_date,  # Use last_updated preferentially
                author=None,  # Perplexity doesn't provide author info
                provider=SearchProvider.PERPLEXITY
            )
            results.append(result)
        
        return results

