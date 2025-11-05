"""
Tests for ranking algorithms.

Following TDD approach: Define expected ranking behavior through tests.
Tests use realistic scenarios with actual domain names and date distributions.
"""

import pytest
from datetime import datetime, timedelta
from models.schemas import Document, RankedDoc, SearchProvider
from ranking.domain_authority import get_domain_authority, get_authority_tier
from ranking.heuristics import rank_by_heuristics, _calculate_recency_score, explain_score


class TestDomainAuthority:
    """Test suite for domain authority scoring."""
    
    def test_premium_domains_get_highest_score(self):
        """Test that premium tech news sources get maximum authority."""
        premium_domains = ["techcrunch.com", "anthropic.com", "openai.com"]
        
        for domain in premium_domains:
            assert get_domain_authority(domain) == 1.0
            assert get_authority_tier(1.0) == "Premium"
    
    def test_academic_domains_get_high_score(self):
        """Test that academic sources get high authority scores."""
        academic_domains = ["arxiv.org", "mit.edu", "stanford.edu"]
        
        for domain in academic_domains:
            score = get_domain_authority(domain)
            assert score >= 0.9
            assert get_authority_tier(score) in ["Premium", "Academic"]
    
    def test_unknown_domains_get_default_score(self):
        """Test that unknown domains get neutral default score."""
        unknown_domains = ["random-blog.com", "unknown-site.net", "personal-website.io"]
        
        for domain in unknown_domains:
            assert get_domain_authority(domain) == 0.5
            assert get_authority_tier(0.5) == "Unknown"
    
    def test_domain_normalization_handles_www_prefix(self):
        """Test that www prefix is handled correctly."""
        assert get_domain_authority("www.techcrunch.com") == get_domain_authority("techcrunch.com")
        assert get_domain_authority("www.openai.com") == get_domain_authority("openai.com")
    
    def test_domain_normalization_is_case_insensitive(self):
        """Test that domain matching is case-insensitive."""
        assert get_domain_authority("TechCrunch.com") == get_domain_authority("techcrunch.com")
        assert get_domain_authority("OPENAI.COM") == get_domain_authority("openai.com")
    
    def test_empty_domain_returns_default(self):
        """Test that empty/None domain returns default score."""
        assert get_domain_authority("") == 0.5
        assert get_domain_authority(None) == 0.5


class TestRecencyScoring:
    """Test suite for recency score calculation."""
    
    def test_today_content_gets_perfect_score(self):
        """Test that content published today gets maximum recency score."""
        now = datetime.now()
        today = now
        
        score = _calculate_recency_score(today, now, halflife_days=7)
        
        assert score == 1.0
    
    def test_halflife_decay_is_correct(self):
        """Test that content at halflife age gets 50% score."""
        now = datetime.now()
        week_ago = now - timedelta(days=7)
        
        score = _calculate_recency_score(week_ago, now, halflife_days=7)
        
        # Should be approximately 0.5 (within 1%)
        assert abs(score - 0.5) < 0.01
    
    def test_double_halflife_decay(self):
        """Test that content at 2x halflife gets 25% score."""
        now = datetime.now()
        two_weeks_ago = now - timedelta(days=14)
        
        score = _calculate_recency_score(two_weeks_ago, now, halflife_days=7)
        
        # Should be approximately 0.25 (within 1%)
        assert abs(score - 0.25) < 0.01
    
    def test_very_old_content_has_minimum_score(self):
        """Test that very old content doesn't score zero."""
        now = datetime.now()
        year_ago = now - timedelta(days=365)
        
        score = _calculate_recency_score(year_ago, now, halflife_days=7)
        
        # Should be at least 0.01 (our defined minimum)
        assert score >= 0.01
        assert score < 0.1
    
    def test_missing_date_returns_default_score(self):
        """Test that None date returns a low default score."""
        now = datetime.now()
        
        score = _calculate_recency_score(None, now, halflife_days=7)
        
        assert score == 0.3
    
    def test_future_date_returns_perfect_score(self):
        """Test that future dates (edge case) return maximum score."""
        now = datetime.now()
        tomorrow = now + timedelta(days=1)
        
        score = _calculate_recency_score(tomorrow, now, halflife_days=7)
        
        assert score == 1.0


class TestHeuristicRanking:
    """Test suite for full heuristic ranking pipeline."""
    
    @pytest.fixture
    def sample_documents(self):
        """Create a realistic set of documents for ranking tests."""
        now = datetime.now()
        
        return [
            # Recent premium source - should rank highest
            Document(
                id="1",
                title="Claude 4 Released with Major Improvements",
                url="https://anthropic.com/blog/claude-4",
                snippet="Today we're announcing Claude 4...",
                published_at=now - timedelta(hours=2),
                source_domain="anthropic.com",
                author="Anthropic Team",
                provider=SearchProvider.EXA,
                raw_score=0.95
            ),
            # Week-old academic paper - good authority but older
            Document(
                id="2",
                title="Advances in Transformer Architecture",
                url="https://arxiv.org/abs/2025.12345",
                snippet="We present novel improvements to transformer models...",
                published_at=now - timedelta(days=7),
                source_domain="arxiv.org",
                author="Research Team",
                provider=SearchProvider.EXA,
                raw_score=0.92
            ),
            # Very recent but unknown source - high recency, low authority
            Document(
                id="3",
                title="AI News Roundup",
                url="https://random-blog.com/ai-news",
                snippet="Here's what happened in AI this week...",
                published_at=now - timedelta(hours=4),
                source_domain="random-blog.com",
                author="Blogger",
                provider=SearchProvider.PERPLEXITY,
                raw_score=0.88
            ),
            # Two-day-old respected source - balanced
            Document(
                id="4",
                title="The Future of AI Development",
                url="https://techcrunch.com/2025/ai-future",
                snippet="Industry leaders weigh in on AI trends...",
                published_at=now - timedelta(days=2),
                source_domain="techcrunch.com",
                author="Tech Journalist",
                provider=SearchProvider.EXA,
                raw_score=0.90
            ),
            # Month-old Wikipedia article - reference but not news
            Document(
                id="5",
                title="Artificial Intelligence",
                url="https://en.wikipedia.org/wiki/AI",
                snippet="Artificial intelligence is...",
                published_at=now - timedelta(days=30),
                source_domain="wikipedia.org",
                author=None,
                provider=SearchProvider.PERPLEXITY,
                raw_score=0.85
            ),
        ]
    
    def test_ranking_returns_ranked_docs(self, sample_documents):
        """Test that ranking returns RankedDoc objects."""
        ranked = rank_by_heuristics(sample_documents)
        
        assert len(ranked) == len(sample_documents)
        assert all(isinstance(doc, RankedDoc) for doc in ranked)
    
    def test_ranking_assigns_sequential_ranks(self, sample_documents):
        """Test that ranks are assigned sequentially from 1."""
        ranked = rank_by_heuristics(sample_documents)
        
        ranks = [doc.rank for doc in ranked]
        assert ranks == list(range(1, len(sample_documents) + 1))
    
    def test_ranking_is_descending_by_score(self, sample_documents):
        """Test that results are sorted by score (highest first)."""
        ranked = rank_by_heuristics(sample_documents)
        
        scores = [doc.final_score for doc in ranked]
        assert scores == sorted(scores, reverse=True)
    
    def test_recent_premium_source_ranks_first(self, sample_documents):
        """Test that very recent content from premium source ranks highest."""
        ranked = rank_by_heuristics(sample_documents)
        
        # Document 1 (Anthropic, 2 hours old) should rank first
        top_doc = ranked[0]
        assert top_doc.document.id == "1"
        assert top_doc.rank == 1
    
    def test_old_wikipedia_ranks_lowest(self, sample_documents):
        """Test that old reference content ranks lower."""
        ranked = rank_by_heuristics(sample_documents)
        
        # Document 5 (Wikipedia, 30 days old) should rank last or near-last
        wikipedia_doc = next(d for d in ranked if d.document.id == "5")
        assert wikipedia_doc.rank >= 4  # Should be in bottom 2
    
    def test_weights_must_sum_to_one(self, sample_documents):
        """Test that invalid weights raise an error."""
        with pytest.raises(ValueError, match="must sum to 1.0"):
            rank_by_heuristics(
                sample_documents,
                recency_weight=0.5,
                authority_weight=0.5,
                provider_weight=0.5  # Total = 1.5, invalid!
            )
    
    def test_empty_document_list_returns_empty(self):
        """Test that empty input returns empty output."""
        ranked = rank_by_heuristics([])
        
        assert ranked == []
    
    def test_single_document_ranks_first(self):
        """Test that single document gets rank 1."""
        doc = Document(
            id="1",
            title="Test",
            url="https://test.com/article",
            snippet="Test content",
            published_at=datetime.now(),
            source_domain="test.com",
            provider=SearchProvider.EXA,
            raw_score=0.8
        )
        
        ranked = rank_by_heuristics([doc])
        
        assert len(ranked) == 1
        assert ranked[0].rank == 1
    
    def test_heuristic_score_is_populated(self, sample_documents):
        """Test that heuristic_score field is populated correctly."""
        ranked = rank_by_heuristics(sample_documents)
        
        for doc in ranked:
            assert doc.heuristic_score is not None
            assert doc.heuristic_score == doc.final_score
            assert 0 <= doc.heuristic_score <= 100


class TestRankingScenarios:
    """Test realistic ranking scenarios with specific expectations."""
    
    def test_breaking_news_vs_research_paper(self):
        """Test that recent breaking news outranks older research."""
        now = datetime.now()
        
        documents = [
            # Week-old research paper
            Document(
                id="paper",
                title="Research Paper on AI Safety",
                url="https://arxiv.org/abs/2025.12345",
                snippet="We propose a novel approach...",
                published_at=now - timedelta(days=7),
                source_domain="arxiv.org",
                provider=SearchProvider.EXA,
                raw_score=0.95
            ),
            # Today's news article
            Document(
                id="news",
                title="OpenAI Announces New Model",
                url="https://techcrunch.com/openai-news",
                snippet="OpenAI today announced...",
                published_at=now - timedelta(hours=3),
                source_domain="techcrunch.com",
                provider=SearchProvider.EXA,
                raw_score=0.90
            ),
        ]
        
        ranked = rank_by_heuristics(documents)
        
        # Recent news should rank higher due to recency weight
        assert ranked[0].document.id == "news"
        assert ranked[1].document.id == "paper"
    
    def test_authority_beats_recency_for_official_announcements(self):
        """Test that official announcements can beat slightly newer blog posts."""
        now = datetime.now()
        
        documents = [
            # Yesterday's official announcement
            Document(
                id="official",
                title="Anthropic Releases Claude 4",
                url="https://anthropic.com/claude-4",
                snippet="We're excited to announce...",
                published_at=now - timedelta(days=1),
                source_domain="anthropic.com",
                provider=SearchProvider.EXA,
                raw_score=0.98
            ),
            # Today's third-party blog post
            Document(
                id="blog",
                title="Thoughts on New AI Release",
                url="https://medium.com/ai-thoughts",
                snippet="Here's what I think about...",
                published_at=now - timedelta(hours=2),
                source_domain="medium.com",
                provider=SearchProvider.PERPLEXITY,
                raw_score=0.75
            ),
        ]
        
        ranked = rank_by_heuristics(documents)
        
        # Official announcement should rank higher despite being older
        assert ranked[0].document.id == "official"
    
    def test_similar_age_prefers_higher_authority(self):
        """Test that similar-aged content prefers higher authority."""
        now = datetime.now()
        two_days_ago = now - timedelta(days=2)
        
        documents = [
            Document(
                id="premium",
                title="Article from Premium Source",
                url="https://openai.com/article",
                snippet="Content...",
                published_at=two_days_ago,
                source_domain="openai.com",
                provider=SearchProvider.EXA,
                raw_score=0.85
            ),
            Document(
                id="unknown",
                title="Article from Unknown Source",
                url="https://random-blog.com/article",
                snippet="Content...",
                published_at=two_days_ago,
                source_domain="random-blog.com",
                provider=SearchProvider.PERPLEXITY,
                raw_score=0.85
            ),
        ]
        
        ranked = rank_by_heuristics(documents)
        
        # Premium source should rank higher
        assert ranked[0].document.id == "premium"


class TestScoreExplainer:
    """Test the score explanation utility."""
    
    def test_explain_score_returns_string(self):
        """Test that explain_score returns a formatted string."""
        doc = Document(
            id="1",
            title="Test Article",
            url="https://techcrunch.com/test",
            snippet="Test content",
            published_at=datetime.now() - timedelta(days=2),
            source_domain="techcrunch.com",
            provider=SearchProvider.EXA,
            raw_score=0.9
        )
        
        ranked = rank_by_heuristics([doc])
        explanation = explain_score(ranked[0])
        
        assert isinstance(explanation, str)
        assert "Rank #1" in explanation
        assert "techcrunch.com" in explanation
        assert "Premium" in explanation
        assert "days old" in explanation
    
    def test_explain_score_handles_missing_date(self):
        """Test that explain_score handles documents without dates."""
        doc = Document(
            id="1",
            title="Test Article",
            url="https://test.com/article",
            snippet="Test content",
            published_at=None,  # No date
            source_domain="test.com",
            provider=SearchProvider.EXA,
            raw_score=0.8
        )
        
        ranked = rank_by_heuristics([doc])
        explanation = explain_score(ranked[0])
        
        assert "unknown age" in explanation


class TestRankingWithRealQueries:
    """Integration tests with realistic query scenarios."""
    
    @pytest.mark.integration
    async def test_ai_news_query_ranking(self):
        """Test ranking for 'AI breakthroughs' query with realistic results."""
        from tools.exa import ExaClient
        from tools.perplexity import PerplexityClient
        from tools.normalize import normalize_batch
        import asyncio
        
        # Execute real searches
        exa = ExaClient()
        perplexity = PerplexityClient()
        
        exa_results, perplexity_results = await asyncio.gather(
            exa.search("artificial intelligence breakthroughs", num_results=3, days=7),
            perplexity.search("artificial intelligence breakthroughs", num_results=3),
            return_exceptions=True
        )
        
        # Combine and normalize
        all_results = []
        if not isinstance(exa_results, Exception):
            all_results.extend(exa_results)
        if not isinstance(perplexity_results, Exception):
            all_results.extend(perplexity_results)
        
        documents = normalize_batch(all_results)
        
        # Rank the results
        ranked = rank_by_heuristics(documents)
        
        # Assertions
        assert len(ranked) > 0
        assert all(doc.rank > 0 for doc in ranked)
        assert ranked[0].rank == 1  # Top result has rank 1
        
        # Print top 3 for manual inspection
        print("\n=== Top 3 Ranked Results ===")
        for doc in ranked[:3]:
            print(f"\n{explain_score(doc)}")

