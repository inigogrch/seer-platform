"""
Tests for Exa search client.

Following TDD approach: Write tests first, then implement.
These tests define the expected behavior of the ExaClient.
"""

import pytest
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock
from models.schemas import SearchResult, SearchProvider


class TestExaClient:
    """Test suite for ExaClient.
    
    Tests are organized by functionality:
    1. Initialization and configuration
    2. Basic search functionality
    3. Error handling
    4. Result transformation
    """
    
    @pytest.fixture
    def mock_exa_response(self):
        """Mock response from Exa API."""
        return {
            "results": [
                {
                    "id": "https://techcrunch.com/2025/01/04/ai-news",
                    "title": "AI Breakthrough: New Model Achieves 95% Accuracy",
                    "url": "https://techcrunch.com/2025/01/04/ai-news",
                    "text": "Researchers announced a breakthrough in AI reasoning capabilities...",
                    "score": 0.92,
                    "publishedDate": "2025-01-04",
                    "author": "Jane Smith"
                },
                {
                    "id": "https://venturebeat.com/ai/new-llm-release",
                    "title": "New LLM Release Doubles Performance",
                    "url": "https://venturebeat.com/ai/new-llm-release",
                    "text": "A new large language model was released today with impressive benchmarks...",
                    "score": 0.88,
                    "publishedDate": "2025-01-03",
                    "author": None
                },
                {
                    "id": "https://arxiv.org/abs/2025.12345",
                    "title": "Advances in AI Reasoning",
                    "url": "https://arxiv.org/abs/2025.12345",
                    "text": "This paper presents novel approaches to AI reasoning...",
                    "score": 0.85,
                    "publishedDate": None,  # Some results may not have dates
                    "author": "Research Team"
                }
            ]
        }
    
    def test_client_initialization_with_api_key(self):
        """Test that client can be initialized with an API key."""
        from tools.exa import ExaClient
        
        client = ExaClient(api_key="test_key_123")
        assert client.api_key == "test_key_123"
    
    def test_client_initialization_from_env(self):
        """Test that client can load API key from environment."""
        from tools.exa import ExaClient
        
        with patch.dict('os.environ', {'EXA_API_KEY': 'env_key_456'}):
            client = ExaClient()
            assert client.api_key == "env_key_456"
    
    def test_client_initialization_fails_without_key(self):
        """Test that client raises error if no API key provided."""
        from tools.exa import ExaClient
        
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="EXA_API_KEY"):
                ExaClient()
    
    @pytest.mark.asyncio
    async def test_search_returns_search_results(self, mock_exa_response):
        """Test that search returns a list of SearchResult objects."""
        from tools.exa import ExaClient
        
        client = ExaClient(api_key="test_key")
        
        # Mock the underlying Exa SDK call
        with patch.object(client, '_call_exa_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_exa_response
            
            results = await client.search(query="AI breakthroughs", num_results=3)
            
            # Verify results
            assert isinstance(results, list)
            assert len(results) == 3
            assert all(isinstance(r, SearchResult) for r in results)
    
    @pytest.mark.asyncio
    async def test_search_transforms_exa_response_correctly(self, mock_exa_response):
        """Test that Exa API response is correctly transformed to SearchResult."""
        from tools.exa import ExaClient
        
        client = ExaClient(api_key="test_key")
        
        with patch.object(client, '_call_exa_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_exa_response
            
            results = await client.search(query="AI breakthroughs")
            
            # Check first result transformation
            first_result = results[0]
            assert first_result.id == "https://techcrunch.com/2025/01/04/ai-news"
            assert first_result.title == "AI Breakthrough: New Model Achieves 95% Accuracy"
            assert first_result.url == "https://techcrunch.com/2025/01/04/ai-news"
            assert first_result.score == 0.92
            assert first_result.published_date == "2025-01-04"
            assert first_result.author == "Jane Smith"
            assert first_result.provider == SearchProvider.EXA
            
            # Check result without author
            second_result = results[1]
            assert second_result.author is None
            
            # Check result without published date
            third_result = results[2]
            assert third_result.published_date is None
    
    @pytest.mark.asyncio
    async def test_search_with_num_results_parameter(self):
        """Test that num_results parameter limits returned results."""
        from tools.exa import ExaClient
        
        client = ExaClient(api_key="test_key")
        
        with patch.object(client, '_call_exa_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = {"results": [{"id": f"url_{i}", "title": f"Title {i}", 
                                                   "url": f"http://example.com/{i}", 
                                                   "text": f"Text {i}", "score": 0.9}
                                                  for i in range(5)]}
            
            results = await client.search(query="test", num_results=3)
            
            # Verify API was called with correct parameter
            mock_call.assert_called_once()
            call_args = mock_call.call_args
            assert call_args[1]['num_results'] == 3
    
    @pytest.mark.asyncio
    async def test_search_with_days_parameter(self):
        """Test that days parameter filters by recency."""
        from tools.exa import ExaClient
        
        client = ExaClient(api_key="test_key")
        
        with patch.object(client, '_call_exa_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = {"results": []}
            
            await client.search(query="test", days=7)
            
            # Verify API was called with recency filter
            call_args = mock_call.call_args
            assert call_args[1]['days'] == 7
    
    @pytest.mark.asyncio
    async def test_search_handles_api_error(self):
        """Test that client handles API errors gracefully."""
        from tools.exa import ExaClient
        
        client = ExaClient(api_key="test_key")
        
        with patch.object(client, '_call_exa_api', new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = Exception("API Error: Rate limit exceeded")
            
            with pytest.raises(Exception, match="API Error"):
                await client.search(query="test")
    
    @pytest.mark.asyncio
    async def test_search_returns_empty_list_for_no_results(self):
        """Test that client returns empty list when no results found."""
        from tools.exa import ExaClient
        
        client = ExaClient(api_key="test_key")
        
        with patch.object(client, '_call_exa_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = {"results": []}
            
            results = await client.search(query="nonexistent query")
            
            assert isinstance(results, list)
            assert len(results) == 0
    
    @pytest.mark.asyncio
    async def test_search_with_default_parameters(self):
        """Test that search works with default parameters."""
        from tools.exa import ExaClient
        
        client = ExaClient(api_key="test_key")
        
        with patch.object(client, '_call_exa_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = {"results": []}
            
            await client.search(query="test query")
            
            # Verify default parameters were used
            call_args = mock_call.call_args
            assert call_args[0][0] == "test query"
            assert call_args[1]['num_results'] == 10  # Default from architecture
            assert call_args[1]['days'] == 7  # Default from architecture


class TestExaClientIntegration:
    """Integration tests that call the real Exa API.
    
    These tests are marked as 'integration' and should be run separately
    or skipped in CI if API keys are not available.
    """
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_real_search_returns_results(self):
        """Test real search with Exa API (requires valid API key)."""
        import os
        from tools.exa import ExaClient
        
        # Skip if no API key
        if not os.getenv('EXA_API_KEY'):
            pytest.skip("EXA_API_KEY not set")
        
        client = ExaClient()
        results = await client.search(query="artificial intelligence", num_results=5)
        
        # Basic sanity checks
        assert isinstance(results, list)
        assert len(results) > 0
        assert all(isinstance(r, SearchResult) for r in results)
        assert all(r.provider == SearchProvider.EXA for r in results)
        
        # Check that results have expected fields
        first_result = results[0]
        assert first_result.title
        assert first_result.url
        assert first_result.text
        assert 0 <= first_result.score <= 1

