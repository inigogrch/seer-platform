"""
Integration tests for the full search + normalize pipeline.

These tests verify that all components work together correctly:
- Exa search client
- Result normalization
- End-to-end data flow

Tests are marked as 'integration' and can be run separately or skipped in CI.
"""

import pytest
import os
from unittest.mock import patch, AsyncMock
from models.schemas import SearchResult, Document, SearchProvider
from tools.exa import ExaClient
from tools.normalize import normalize_batch


class TestSearchAndNormalizePipeline:
    """Test the complete pipeline from search to normalized documents."""
    
    @pytest.fixture
    def mock_exa_api_response(self):
        """Realistic mock response from Exa API."""
        return {
            "results": [
                {
                    "id": "https://techcrunch.com/2025/01/04/anthropic-claude-4",
                    "title": "Anthropic Announces Claude 4 with Advanced Reasoning",
                    "url": "https://techcrunch.com/2025/01/04/anthropic-claude-4",
                    "text": "Anthropic today announced Claude 4, the latest version of its AI assistant with significantly improved reasoning capabilities. The model demonstrates state-of-the-art performance on complex logic puzzles and mathematical reasoning tasks, outperforming previous models by up to 30% on standard benchmarks.",
                    "score": 0.95,
                    "publishedDate": "2025-01-04T08:00:00Z",
                    "author": "Sarah Johnson"
                },
                {
                    "id": "https://openai.com/blog/gpt-5-preview",
                    "title": "GPT-5 Preview: What to Expect",
                    "url": "https://openai.com/blog/gpt-5-preview",
                    "text": "OpenAI provides an early look at GPT-5's capabilities, showcasing improvements in contextual understanding, multi-step reasoning, and reduced hallucinations. The model will support longer context windows and more reliable outputs for enterprise applications.",
                    "score": 0.92,
                    "publishedDate": "2025-01-03T14:30:00Z",
                    "author": "OpenAI Team"
                },
                {
                    "id": "https://arxiv.org/abs/2025.01234",
                    "title": "Scaling Laws for AI Reasoning: A Comprehensive Analysis",
                    "url": "https://arxiv.org/abs/2025.01234",
                    "text": "This paper presents a comprehensive analysis of scaling laws for AI reasoning capabilities. We demonstrate that reasoning performance scales predictably with model size and training compute, following power law relationships. Our findings suggest continued improvements are possible with additional scale.",
                    "score": 0.88,
                    "publishedDate": "2025-01-02",
                    "author": "Research Consortium"
                }
            ]
        }
    
    @pytest.mark.asyncio
    async def test_search_returns_normalized_documents(self, mock_exa_api_response):
        """Test that search + normalize pipeline produces correct Documents."""
        client = ExaClient(api_key="test_key")
        
        # Mock the Exa API call
        with patch.object(client, '_call_exa_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_exa_api_response
            
            # Execute search
            search_results = await client.search(query="AI reasoning advances", num_results=3)
            
            # Normalize results
            documents = normalize_batch(search_results)
            
            # Verify pipeline output
            assert len(documents) == 3
            assert all(isinstance(doc, Document) for doc in documents)
            
            # Check first document
            first_doc = documents[0]
            assert first_doc.title == "Anthropic Announces Claude 4 with Advanced Reasoning"
            assert first_doc.source_domain == "techcrunch.com"
            assert first_doc.published_at is not None
            assert first_doc.published_at.year == 2025
            assert first_doc.provider == SearchProvider.EXA
            assert 0 <= first_doc.raw_score <= 1
    
    @pytest.mark.asyncio
    async def test_pipeline_handles_mixed_data_quality(self):
        """Test pipeline with missing fields and edge cases."""
        client = ExaClient(api_key="test_key")
        
        # Response with missing/malformed data
        mixed_response = {
            "results": [
                {
                    "id": "https://example.com/article1",
                    "title": "Complete Article",
                    "url": "https://blog.example.com/article1",
                    "text": "Full content here",
                    "score": 0.9,
                    "publishedDate": "2025-01-04T10:00:00Z",
                    "author": "John Doe"
                },
                {
                    "id": "https://example.com/article2",
                    "title": "No Date Article",
                    "url": "https://example.com/article2",
                    "text": "Content without date",
                    "score": 0.85,
                    "publishedDate": None,
                    "author": None
                },
                {
                    "id": "https://example.com/article3",
                    "title": "Long Article",
                    "url": "https://example.com/article3",
                    "text": " ".join(["Lorem ipsum dolor sit amet."] * 100),
                    "score": 0.8,
                    "publishedDate": "invalid-date",
                    "author": "Jane Smith"
                }
            ]
        }
        
        with patch.object(client, '_call_exa_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mixed_response
            
            search_results = await client.search(query="test")
            documents = normalize_batch(search_results)
            
            # All results should be processed without errors
            assert len(documents) == 3
            
            # Check handling of missing date
            assert documents[1].published_at is None
            
            # Check text truncation
            assert len(documents[2].snippet) <= 1000
            
            # Check domain extraction from subdomain
            assert documents[0].source_domain == "example.com"
    
    @pytest.mark.asyncio
    async def test_pipeline_preserves_search_ranking(self, mock_exa_api_response):
        """Test that document order matches search result ranking."""
        client = ExaClient(api_key="test_key")
        
        with patch.object(client, '_call_exa_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_exa_api_response
            
            search_results = await client.search(query="AI models")
            documents = normalize_batch(search_results)
            
            # Verify order is preserved (scores should be descending)
            scores = [doc.raw_score for doc in documents]
            assert scores == sorted(scores, reverse=True)
            
            # Verify highest scored document is first
            assert documents[0].raw_score == 0.95
    
    @pytest.mark.asyncio
    async def test_empty_search_results_handled_gracefully(self):
        """Test pipeline with no search results."""
        client = ExaClient(api_key="test_key")
        
        empty_response = {"results": []}
        
        with patch.object(client, '_call_exa_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = empty_response
            
            search_results = await client.search(query="nonexistent query")
            documents = normalize_batch(search_results)
            
            assert documents == []


class TestRealExaIntegration:
    """Real integration tests with Exa API.
    
    These require a valid EXA_API_KEY environment variable.
    Run with: pytest -m integration
    """
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_real_search_and_normalize_pipeline(self):
        """Test real search with actual Exa API."""
        if not os.getenv('EXA_API_KEY'):
            pytest.skip("EXA_API_KEY not set")
        
        # Use real client
        client = ExaClient()
        
        # Search for something likely to have results
        query = "artificial intelligence breakthroughs"
        num_results = 5
        days = 7
        
        print(f"\n🔍 REAL API TEST - Query: '{query}', Results: {num_results}, Days: {days}")
        
        search_results = await client.search(
            query=query,
            num_results=num_results,
            days=days
        )
        
        print(f"✅ Received {len(search_results)} raw search results from Exa API")
        
        # Normalize results
        documents = normalize_batch(search_results)
        
        print(f"📄 Normalized to {len(documents)} documents")
        print("\n--- Sample Results ---")
        for i, doc in enumerate(documents[:3], 1):
            print(f"{i}. {doc.title[:60]}... (score: {doc.raw_score:.3f})")
            print(f"   URL: {doc.url}")
            print(f"   Domain: {doc.source_domain}")
            print(f"   Snippet length: {len(doc.snippet)} chars")
            print()
        
        # Basic validations
        assert len(documents) > 0, "Should return at least some results"
        assert len(documents) <= 5, "Should respect num_results limit"
        
        for doc in documents:
            # Verify all documents are properly structured
            assert doc.title, "Should have title"
            assert doc.url, "Should have URL"
            assert doc.snippet, "Should have snippet"
            assert doc.source_domain, "Should have extracted domain"
            assert doc.source_domain != "unknown", "Should extract real domain"
            assert doc.provider == SearchProvider.EXA
            assert 0 <= doc.raw_score <= 1, "Score should be normalized"
            
            # Check snippet length
            assert len(doc.snippet) <= 1000, "Snippet should be truncated"
        
        # Check that results are ordered by score
        scores = [doc.raw_score for doc in documents]
        assert scores == sorted(scores, reverse=True), "Results should be ordered by score"
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_real_search_with_date_filtering(self):
        """Test that date filtering works with real API."""
        if not os.getenv('EXA_API_KEY'):
            pytest.skip("EXA_API_KEY not set")
        
        client = ExaClient()
        
        query = "AI news"
        days = 3
        print(f"\n🔍 DATE FILTER TEST - Query: '{query}', Days: {days}")
        
        # Search with recent date filter
        search_results = await client.search(
            query=query,
            num_results=3,
            days=days
        )
        
        documents = normalize_batch(search_results)
        print(f"✅ Received {len(documents)} documents within last {days} days")
        
        # All results should have recent dates (if available)
        from datetime import datetime, timedelta
        cutoff = datetime.now() - timedelta(days=4)
        
        for doc in documents:
            if doc.published_at:  # Some results might not have dates
                assert doc.published_at >= cutoff, \
                    f"Result date {doc.published_at} should be within last 3 days"


class TestPipelinePerformance:
    """Performance tests for the pipeline."""
    
    @pytest.mark.asyncio
    async def test_normalize_batch_performance(self):
        """Test that normalization is fast even with many results."""
        import time
        
        # Create 100 mock search results
        results = [
            SearchResult(
                id=f"https://example.com/article{i}",
                title=f"Article {i}",
                url=f"https://example.com/article{i}",
                text=f"Content for article {i}" * 20,
                score=0.9 - (i * 0.001),
                published_date="2025-01-04",
                provider=SearchProvider.EXA
            )
            for i in range(100)
        ]
        
        # Measure normalization time
        start = time.time()
        documents = normalize_batch(results)
        elapsed = time.time() - start
        
        # Should process 100 results in under 1 second
        assert elapsed < 1.0, f"Normalization took {elapsed:.3f}s, should be <1s"
        assert len(documents) == 100

