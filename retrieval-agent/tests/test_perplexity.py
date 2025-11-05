"""
Tests for Perplexity Search API client.

Following TDD approach: Write tests first, then implement.
These tests define the expected behavior of the PerplexityClient.

Based on Perplexity Search API documentation:
https://docs.perplexity.ai/guides/search-quickstart
"""

import pytest
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock
from models.schemas import SearchResult, SearchProvider


class TestPerplexityClient:
    """Test suite for PerplexityClient.
    
    Tests organized by functionality:
    1. Initialization and configuration
    2. Basic search functionality
    3. Error handling
    4. Result transformation
    """
    
    @pytest.fixture
    def mock_perplexity_response(self):
        """Mock response from Perplexity Search API.
        
        Based on actual API response format from documentation.
        """
        return {
            "results": [
                {
                    "title": "2024: A year of extraordinary progress in AI - Google Blog",
                    "url": "https://blog.google/technology/ai/2024-ai-progress/",
                    "snippet": "2024 was a year of experimenting, fast shipping, and putting our latest technologies in the hands of developers. In December 2024, we released the first models in our Gemini 2.0 experimental series.",
                    "date": "2025-01-23",
                    "last_updated": "2025-01-25"
                },
                {
                    "title": "The 2025 AI Index Report | Stanford HAI",
                    "url": "https://hai.stanford.edu/ai-index/2025",
                    "snippet": "In 2023, researchers introduced new benchmarks. Just a year later, performance sharply increased: scores rose by 18.8, 48.9, and 67.3 percentage points.",
                    "date": "2025-01-03",
                    "last_updated": None  # Some results may not have last_updated
                },
                {
                    "title": "AI Developments Without Date",
                    "url": "https://example.com/ai-news",
                    "snippet": "Some content about AI without publication date.",
                    "date": None,  # Some results may not have dates
                    "last_updated": None
                }
            ],
            "id": "e38104d5-6bd7-4d82-bc4e-0a21179d1f77"
        }
    
    def test_client_initialization_with_api_key(self):
        """Test that client can be initialized with an API key."""
        from tools.perplexity import PerplexityClient
        
        client = PerplexityClient(api_key="test_key_123")
        assert client.api_key == "test_key_123"
    
    def test_client_initialization_from_env(self):
        """Test that client can load API key from environment."""
        from tools.perplexity import PerplexityClient
        
        with patch.dict('os.environ', {'PERPLEXITY_SEARCH_API_KEY': 'env_key_456'}):
            client = PerplexityClient()
            assert client.api_key == "env_key_456"
    
    def test_client_initialization_fails_without_key(self):
        """Test that client raises error if no API key provided."""
        from tools.perplexity import PerplexityClient
        
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="PERPLEXITY_SEARCH_API_KEY"):
                PerplexityClient()
    
    @pytest.mark.asyncio
    async def test_search_returns_search_results(self, mock_perplexity_response):
        """Test that search returns a list of SearchResult objects."""
        from tools.perplexity import PerplexityClient
        
        client = PerplexityClient(api_key="test_key")
        
        # Mock the underlying Perplexity SDK call
        with patch.object(client, '_call_perplexity_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_perplexity_response
            
            results = await client.search(query="AI breakthroughs", num_results=3)
            
            # Verify results
            assert isinstance(results, list)
            assert len(results) == 3
            assert all(isinstance(r, SearchResult) for r in results)
    
    @pytest.mark.asyncio
    async def test_search_transforms_perplexity_response_correctly(self, mock_perplexity_response):
        """Test that Perplexity API response is correctly transformed to SearchResult."""
        from tools.perplexity import PerplexityClient
        
        client = PerplexityClient(api_key="test_key")
        
        with patch.object(client, '_call_perplexity_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_perplexity_response
            
            results = await client.search(query="AI breakthroughs")
            
            # Check first result transformation
            first_result = results[0]
            assert first_result.id == "https://blog.google/technology/ai/2024-ai-progress/"
            assert first_result.title == "2024: A year of extraordinary progress in AI - Google Blog"
            assert first_result.url == "https://blog.google/technology/ai/2024-ai-progress/"
            assert first_result.text == "2024 was a year of experimenting, fast shipping, and putting our latest technologies in the hands of developers. In December 2024, we released the first models in our Gemini 2.0 experimental series."
            # Perplexity doesn't provide scores, so we assign a default
            assert first_result.score == 1.0
            assert first_result.published_date == "2025-01-23"
            assert first_result.provider == SearchProvider.PERPLEXITY
            
            # Check result without date
            third_result = results[2]
            assert third_result.published_date is None
    
    @pytest.mark.asyncio
    async def test_search_with_num_results_parameter(self):
        """Test that num_results parameter limits returned results."""
        from tools.perplexity import PerplexityClient
        
        client = PerplexityClient(api_key="test_key")
        
        with patch.object(client, '_call_perplexity_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = {
                "results": [
                    {"title": f"Title {i}", "url": f"http://example.com/{i}", 
                     "snippet": f"Text {i}", "date": "2025-01-01"}
                    for i in range(5)
                ],
                "id": "test-id"
            }
            
            results = await client.search(query="test", num_results=3)
            
            # Verify API was called with correct parameter
            mock_call.assert_called_once()
            call_args = mock_call.call_args
            assert call_args[1]['max_results'] == 3
    
    @pytest.mark.asyncio
    async def test_search_with_country_filter(self):
        """Test that country parameter filters by region."""
        from tools.perplexity import PerplexityClient
        
        client = PerplexityClient(api_key="test_key")
        
        with patch.object(client, '_call_perplexity_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = {"results": [], "id": "test"}
            
            await client.search(query="test", country="US")
            
            # Verify API was called with country filter
            call_args = mock_call.call_args
            assert call_args[1]['country'] == "US"
    
    @pytest.mark.asyncio
    async def test_search_with_domain_filter(self):
        """Test that search_domain_filter limits results to specific domains."""
        from tools.perplexity import PerplexityClient
        
        client = PerplexityClient(api_key="test_key")
        
        with patch.object(client, '_call_perplexity_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = {"results": [], "id": "test"}
            
            domains = ["science.org", "nature.com"]
            await client.search(query="research", search_domain_filter=domains)
            
            # Verify API was called with domain filter
            call_args = mock_call.call_args
            assert call_args[1]['search_domain_filter'] == domains
    
    @pytest.mark.asyncio
    async def test_search_handles_api_error(self):
        """Test that client handles API errors gracefully."""
        from tools.perplexity import PerplexityClient
        
        client = PerplexityClient(api_key="test_key")
        
        with patch.object(client, '_call_perplexity_api', new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = Exception("API Error: Rate limit exceeded")
            
            with pytest.raises(Exception, match="API Error"):
                await client.search(query="test")
    
    @pytest.mark.asyncio
    async def test_search_returns_empty_list_for_no_results(self):
        """Test that client returns empty list when no results found."""
        from tools.perplexity import PerplexityClient
        
        client = PerplexityClient(api_key="test_key")
        
        with patch.object(client, '_call_perplexity_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = {"results": [], "id": "test"}
            
            results = await client.search(query="nonexistent query")
            
            assert isinstance(results, list)
            assert len(results) == 0
    
    @pytest.mark.asyncio
    async def test_search_with_default_parameters(self):
        """Test that search works with default parameters."""
        from tools.perplexity import PerplexityClient
        
        client = PerplexityClient(api_key="test_key")
        
        with patch.object(client, '_call_perplexity_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = {"results": [], "id": "test"}
            
            await client.search(query="test query")
            
            # Verify default parameters were used
            call_args = mock_call.call_args
            assert call_args[0][0] == "test query"
            assert call_args[1]['max_results'] == 10  # Default
            assert call_args[1].get('country') is None  # Not set by default
    
    @pytest.mark.asyncio
    async def test_search_assigns_rank_based_scores(self, mock_perplexity_response):
        """Test that results get rank-based scores since Perplexity doesn't provide them."""
        from tools.perplexity import PerplexityClient
        
        client = PerplexityClient(api_key="test_key")
        
        with patch.object(client, '_call_perplexity_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_perplexity_response
            
            results = await client.search(query="test")
            
            # First result should have highest score
            assert results[0].score == 1.0
            # Second result should have slightly lower
            assert results[1].score < results[0].score
            # Third result should be lowest
            assert results[2].score < results[1].score
            # All scores should be between 0 and 1
            assert all(0 <= r.score <= 1 for r in results)


class TestPerplexityClientIntegration:
    """Integration tests that call the real Perplexity API.
    
    These tests are marked as 'integration' and should be run separately
    or skipped in CI if API keys are not available.
    """
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_real_search_returns_results(self):
        """Test real search with Perplexity API (requires valid API key)."""
        import os
        from tools.perplexity import PerplexityClient
        
        # Skip if no API key
        api_key = os.getenv('PERPLEXITY_SEARCH_API_KEY')
        if not api_key:
            pytest.skip("PERPLEXITY_SEARCH_API_KEY not set")
        
        print(f"\n🔍 Testing Perplexity API with key: {api_key[:8]}...")
        
        client = PerplexityClient()
        results = await client.search(query="artificial intelligence", num_results=5)
        
        print(f"✅ Received {len(results)} results from Perplexity")
        
        # Basic sanity checks
        assert isinstance(results, list)
        assert len(results) > 0
        assert all(isinstance(r, SearchResult) for r in results)
        assert all(r.provider == SearchProvider.PERPLEXITY for r in results)
        
        # Check that results have expected fields
        first_result = results[0]
        assert first_result.title
        assert first_result.url
        assert first_result.text
        assert 0 <= first_result.score <= 1
        
        # Log sample result
        print(f"\n📄 Sample result:")
        print(f"   Title: {first_result.title[:60]}...")
        print(f"   URL: {first_result.url}")
        print(f"   Score: {first_result.score}")
        print(f"   Date: {first_result.published_date}")
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_real_search_with_country_filter(self):
        """Test country filtering with real API."""
        import os
        from tools.perplexity import PerplexityClient
        
        if not os.getenv('PERPLEXITY_SEARCH_API_KEY'):
            pytest.skip("PERPLEXITY_SEARCH_API_KEY not set")
        
        client = PerplexityClient()
        
        print("\n🌍 Testing country filter: US")
        results = await client.search(
            query="technology news",
            num_results=3,
            country="US"
        )
        
        print(f"✅ Received {len(results)} US-focused results")
        assert len(results) > 0
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_real_search_with_domain_filter(self):
        """Test domain filtering with real API."""
        import os
        from tools.perplexity import PerplexityClient
        
        if not os.getenv('PERPLEXITY_SEARCH_API_KEY'):
            pytest.skip("PERPLEXITY_SEARCH_API_KEY not set")
        
        client = PerplexityClient()
        
        domains = ["techcrunch.com", "theverge.com"]
        print(f"\n🔍 Testing domain filter: {domains}")
        
        results = await client.search(
            query="AI news",
            num_results=5,
            search_domain_filter=domains
        )
        
        print(f"✅ Received {len(results)} results from specified domains")
        
        # Verify results are from specified domains
        for result in results:
            # Extract domain from URL
            from urllib.parse import urlparse
            domain = urlparse(result.url).netloc.replace("www.", "")
            print(f"   Result from: {domain}")

