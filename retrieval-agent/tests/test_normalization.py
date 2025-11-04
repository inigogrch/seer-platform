"""
Tests for result normalization.

Following TDD approach: Define expected normalization behavior through tests.
Normalization converts SearchResult (raw API) → Document (standardized internal format).
"""

import pytest
from datetime import datetime
from models.schemas import SearchResult, Document, SearchProvider


class TestNormalization:
    """Test suite for search result normalization."""
    
    @pytest.fixture
    def sample_search_result(self):
        """Sample SearchResult with all fields populated."""
        return SearchResult(
            id="https://techcrunch.com/2025/01/04/ai-news",
            title="AI Breakthrough: New Model Achieves 95% Accuracy",
            url="https://techcrunch.com/2025/01/04/ai-news",
            text="Researchers announced a breakthrough in AI reasoning capabilities that could transform enterprise software. The new model demonstrates unprecedented accuracy in complex reasoning tasks, achieving 95% on standard benchmarks. This represents a 15% improvement over previous state-of-the-art systems.",
            score=0.92,
            published_date="2025-01-04",
            author="Jane Smith",
            provider=SearchProvider.EXA
        )
    
    @pytest.fixture
    def search_result_no_date(self):
        """SearchResult without published date."""
        return SearchResult(
            id="https://arxiv.org/abs/2025.12345",
            title="Advances in AI Reasoning",
            url="https://arxiv.org/abs/2025.12345",
            text="This paper presents novel approaches...",
            score=0.85,
            published_date=None,
            author="Research Team",
            provider=SearchProvider.EXA
        )
    
    @pytest.fixture
    def search_result_long_text(self):
        """SearchResult with very long text content."""
        long_text = " ".join(["Lorem ipsum dolor sit amet."] * 100)  # ~2800 chars
        return SearchResult(
            id="https://example.com/article",
            title="Long Article",
            url="https://example.com/article",
            text=long_text,
            score=0.75,
            published_date="2025-01-01",
            author=None,
            provider=SearchProvider.EXA
        )
    
    def test_normalize_converts_search_result_to_document(self, sample_search_result):
        """Test that normalize returns a Document object."""
        from tools.normalize import normalize_search_result
        
        doc = normalize_search_result(sample_search_result)
        
        assert isinstance(doc, Document)
    
    def test_normalize_preserves_basic_fields(self, sample_search_result):
        """Test that basic fields are preserved."""
        from tools.normalize import normalize_search_result
        
        doc = normalize_search_result(sample_search_result)
        
        assert doc.id == sample_search_result.id
        assert doc.title == sample_search_result.title
        assert doc.url == sample_search_result.url
        assert doc.author == sample_search_result.author
        assert doc.provider == sample_search_result.provider
        assert doc.raw_score == sample_search_result.score
    
    def test_normalize_extracts_domain_from_url(self, sample_search_result):
        """Test that source_domain is correctly extracted from URL."""
        from tools.normalize import normalize_search_result
        
        doc = normalize_search_result(sample_search_result)
        
        assert doc.source_domain == "techcrunch.com"
    
    def test_normalize_extracts_domain_with_subdomain(self):
        """Test domain extraction handles subdomains correctly."""
        from tools.normalize import normalize_search_result
        
        result = SearchResult(
            id="test",
            title="Test",
            url="https://blog.openai.com/article",
            text="Content",
            score=0.8,
            provider=SearchProvider.EXA
        )
        
        doc = normalize_search_result(result)
        
        # Should extract just the domain, not subdomain
        assert doc.source_domain == "openai.com"
    
    def test_normalize_parses_date_string_to_datetime(self, sample_search_result):
        """Test that published_date string is parsed to datetime."""
        from tools.normalize import normalize_search_result
        
        doc = normalize_search_result(sample_search_result)
        
        assert isinstance(doc.published_at, datetime)
        assert doc.published_at.year == 2025
        assert doc.published_at.month == 1
        assert doc.published_at.day == 4
    
    def test_normalize_handles_iso_format_dates(self):
        """Test parsing of ISO format dates."""
        from tools.normalize import normalize_search_result
        
        result = SearchResult(
            id="test",
            title="Test",
            url="https://example.com",
            text="Content",
            score=0.8,
            published_date="2025-01-04T14:30:00Z",
            provider=SearchProvider.EXA
        )
        
        doc = normalize_search_result(result)
        
        assert doc.published_at.hour == 14
        assert doc.published_at.minute == 30
    
    def test_normalize_handles_missing_date(self, search_result_no_date):
        """Test that missing published_date results in None."""
        from tools.normalize import normalize_search_result
        
        doc = normalize_search_result(search_result_no_date)
        
        assert doc.published_at is None
    
    def test_normalize_truncates_long_text_to_snippet(self, search_result_long_text):
        """Test that long text is truncated to reasonable snippet length."""
        from tools.normalize import normalize_search_result
        
        doc = normalize_search_result(search_result_long_text)
        
        # Should truncate to ~1000 chars (configurable, optimized for ranking)
        assert len(doc.snippet) <= 1000
        # Should end with ellipsis if truncated
        if len(search_result_long_text.text) > 1000:
            assert doc.snippet.endswith("...")
    
    def test_normalize_preserves_short_text(self, sample_search_result):
        """Test that short text is not truncated."""
        from tools.normalize import normalize_search_result
        
        doc = normalize_search_result(sample_search_result)
        
        # Original text is ~250 chars, should be preserved
        assert doc.snippet == sample_search_result.text
    
    def test_normalize_batch_processes_multiple_results(self, sample_search_result, search_result_no_date):
        """Test that normalize_batch handles list of results."""
        from tools.normalize import normalize_batch
        
        results = [sample_search_result, search_result_no_date]
        docs = normalize_batch(results)
        
        assert isinstance(docs, list)
        assert len(docs) == 2
        assert all(isinstance(doc, Document) for doc in docs)
    
    def test_normalize_batch_returns_empty_list_for_empty_input(self):
        """Test that normalize_batch handles empty input."""
        from tools.normalize import normalize_batch
        
        docs = normalize_batch([])
        
        assert docs == []
    
    def test_normalize_handles_invalid_url_gracefully(self):
        """Test that normalize handles malformed URLs without crashing."""
        from tools.normalize import normalize_search_result
        
        result = SearchResult(
            id="test",
            title="Test",
            url="not-a-valid-url",
            text="Content",
            score=0.8,
            provider=SearchProvider.EXA
        )
        
        # Should not raise exception, but extract something reasonable
        doc = normalize_search_result(result)
        assert doc.source_domain is not None  # Even if it's just "unknown"
    
    def test_normalize_handles_various_date_formats(self):
        """Test parsing of various date format strings."""
        from tools.normalize import normalize_search_result
        
        date_formats = [
            ("2025-01-04", datetime(2025, 1, 4)),
            ("2025-01-04T10:30:00Z", datetime(2025, 1, 4, 10, 30)),
            ("2025-01-04T10:30:00.123Z", datetime(2025, 1, 4, 10, 30, 0)),
        ]
        
        for date_str, expected_dt in date_formats:
            result = SearchResult(
                id="test",
                title="Test",
                url="https://example.com",
                text="Content",
                score=0.8,
                published_date=date_str,
                provider=SearchProvider.EXA
            )
            
            doc = normalize_search_result(result)
            
            # Check date components (ignoring microseconds)
            assert doc.published_at.year == expected_dt.year
            assert doc.published_at.month == expected_dt.month
            assert doc.published_at.day == expected_dt.day
            if expected_dt.hour:
                assert doc.published_at.hour == expected_dt.hour


class TestDomainExtraction:
    """Focused tests for domain extraction logic."""
    
    def test_extract_domain_standard_urls(self):
        """Test domain extraction for standard URLs."""
        from tools.normalize import extract_domain
        
        test_cases = [
            ("https://techcrunch.com/article", "techcrunch.com"),
            ("https://www.techcrunch.com/article", "techcrunch.com"),
            ("https://blog.openai.com/post", "openai.com"),
            ("http://example.com", "example.com"),
            ("https://news.ycombinator.com/item?id=123", "ycombinator.com"),
        ]
        
        for url, expected_domain in test_cases:
            assert extract_domain(url) == expected_domain
    
    def test_extract_domain_handles_special_cases(self):
        """Test domain extraction for edge cases."""
        from tools.normalize import extract_domain
        
        # Should handle these gracefully
        assert extract_domain("not-a-url") == "unknown"
        assert extract_domain("") == "unknown"
        assert extract_domain("localhost") == "localhost"

