"""
Exa search client implementation.

This module provides a wrapper around the Exa API for semantic search.
Implements the interface defined by our tests (TDD approach).
"""

import os
from typing import List, Optional
from datetime import datetime, timedelta
from exa_py import Exa
from models.schemas import SearchResult, SearchProvider


class ExaClient:
    """Client for interacting with Exa's neural search API.
    
    Attributes:
        api_key: Exa API key for authentication
        client: Underlying Exa SDK client
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Exa client.
        
        Args:
            api_key: Exa API key. If not provided, reads from EXA_API_KEY env var.
            
        Raises:
            ValueError: If no API key is provided or found in environment.
        """
        self.api_key = api_key or os.getenv('EXA_API_KEY')
        
        if not self.api_key:
            raise ValueError(
                "EXA_API_KEY must be provided as argument or environment variable"
            )
        
        self.client = Exa(api_key=self.api_key)
    
    async def search(
        self,
        query: str,
        num_results: int = 10,
        days: int = 7
    ) -> List[SearchResult]:
        """Execute semantic search using Exa's neural API.
        
        Args:
            query: Search query string
            num_results: Maximum number of results to return (default: 10)
            days: Number of days back to search (default: 7)
            
        Returns:
            List of SearchResult objects with normalized data
            
        Raises:
            Exception: If API call fails
        """
        try:
            # Call the real Exa API
            response = await self._call_exa_api(
                query,
                num_results=num_results,
                days=days
            )
            
            # Transform response to our SearchResult schema
            return self._transform_response(response)
            
        except Exception as e:
            # Re-raise with context
            raise Exception(f"Exa search failed: {str(e)}") from e
    
    async def _call_exa_api(
        self,
        query: str,
        num_results: int = 10,
        days: int = 7
    ) -> dict:
        """Internal method to call Exa API.
        
        Separated for easier mocking in tests.
        
        Args:
            query: Search query
            num_results: Max results
            days: Recency filter in days
            
        Returns:
            Raw API response as dict
        """
        # Calculate start date for recency filter
        start_date = datetime.now() - timedelta(days=days)
        start_date_str = start_date.strftime("%Y-%m-%d")
        
        # Call Exa API with neural search
        response = self.client.search_and_contents(
            query=query,
            type="neural",  # Semantic search
            use_autoprompt=True,  # Let Exa enhance query
            num_results=num_results,
            start_published_date=start_date_str,
            text=True,  # Get text content
        )
        
        # Convert to dict format expected by tests
        return {
            "results": [
                {
                    "id": result.id or result.url,
                    "title": result.title,
                    "url": result.url,
                    "text": result.text or "",
                    "score": result.score,
                    "publishedDate": result.published_date,
                    "author": result.author
                }
                for result in response.results
            ]
        }
    
    def _transform_response(self, response: dict) -> List[SearchResult]:
        """Transform raw Exa API response to SearchResult objects.
        
        Args:
            response: Raw API response dict
            
        Returns:
            List of SearchResult objects
        """
        results = []
        
        for item in response.get("results", []):
            result = SearchResult(
                id=item["id"],
                title=item["title"],
                url=item["url"],
                text=item["text"],
                score=item["score"],
                published_date=item.get("publishedDate"),
                author=item.get("author"),
                provider=SearchProvider.EXA
            )
            results.append(result)
        
        return results

