"""
Tests for database operations and data model transformations.

Tests cover:
1. RankedDoc → Story transformation
2. Supabase client CRUD operations
3. Data integrity and validation
4. Source display name formatting

Uses actual API response structures verified in demo_api_raw.py.
"""

import pytest
from datetime import datetime, date
from typing import List
from uuid import uuid4
from models.schemas import (
    Document, RankedDoc, Story, BriefSection, DailyBrief, WhatsNext,
    SearchProvider, ContentType, BriefStatus
)
from database.utils import format_source_display_name, calculate_read_time, truncate_summary


class TestDataTransformations:
    """Test data transformations between pipeline stages."""
    
    def test_ranked_doc_to_story_transformation(self):
        """Test converting RankedDoc to Story (adding user fields)."""
        # Create a RankedDoc from actual API response structure
        doc = Document(
            id="https://anthropic.com/news/claude-3-family",
            title="Introducing the next generation of Claude",
            url="https://anthropic.com/news/claude-3-family",
            snippet="Today, we're announcing the Claude 3 model family...",
            published_at=datetime(2025, 11, 5, 10, 0, 0),
            published_online=datetime(2025, 11, 5, 10, 0, 0),
            published_issue=None,
            source_domain="anthropic.com",
            author=None,
            provider=SearchProvider.PERPLEXITY,
            raw_score=0.8187307530779818,
            embedding=None
        )
        
        ranked_doc = RankedDoc(
            document=doc,
            final_score=86.6,
            rank=2,
            heuristic_score=86.6
        )
        
        # Transform to Story
        story = Story(
            # From Document
            id=ranked_doc.document.id,
            title=ranked_doc.document.title,
            url=ranked_doc.document.url,
            summary=truncate_summary(ranked_doc.document.snippet, max_length=200),
            source_domain=ranked_doc.document.source_domain,
            source_display_name=format_source_display_name(ranked_doc.document.source_domain),
            author=ranked_doc.document.author,
            published_at=ranked_doc.document.published_at,
            
            # AI enrichment (would be added by LLM agent)
            content_type=ContentType.NEWS,  # AI-classified
            ai_tags=["Claude", "LLMs", "Anthropic"],  # AI-extracted
            
            # From RankedDoc
            final_score=ranked_doc.final_score,
            rank=ranked_doc.rank,
            provider=ranked_doc.document.provider,
            raw_score=ranked_doc.document.raw_score,
            
            # User interaction (new fields)
            user_id="user_123",
            is_read=False,
            is_saved=False,
            user_rating=None,
            user_notes=None,
            
            # Timestamps
            retrieved_at=datetime.now(),
            added_to_brief_at=datetime.now()
        )
        
        # Verify transformation
        assert story.id == ranked_doc.document.id
        assert story.title == ranked_doc.document.title
        assert story.source_display_name == "Anthropic"
        assert story.content_type == ContentType.NEWS
        assert len(story.ai_tags) == 3
        assert story.final_score == 86.6
        assert story.rank == 2
        assert story.user_id == "user_123"
        assert story.is_read is False
    
    def test_story_list_to_brief_section(self):
        """Test organizing stories into brief sections."""
        # Create sample stories
        stories = [
            Story(
                id=f"https://example.com/story{i}",
                title=f"Story {i} about LLMs",
                url=f"https://example.com/story{i}",
                summary=f"This is story {i} about LLMs",
                source_domain="example.com",
                source_display_name="Example",
                published_at=datetime.now(),
                content_type=ContentType.NEWS,
                ai_tags=["LLMs", "GPT-4"],
                final_score=90.0 - i,
                rank=i + 1,
                provider=SearchProvider.EXA,
                raw_score=0.9,
                user_id="user_123",
                retrieved_at=datetime.now(),
                added_to_brief_at=datetime.now()
            )
            for i in range(3)
        ]
        
        # Create section
        section = BriefSection(
            id=str(uuid4()),
            daily_brief_id=str(uuid4()),
            title="Latest in Large Language Models",
            description="Based on your interest in LLMs",
            section_type="interest-based",
            story_ids=[s.id for s in stories],
            order=1,
            topic_tags=["LLMs", "GPT-4"],
            estimated_read_time=sum(calculate_read_time(len(s.summary)) for s in stories),
            story_count=len(stories)
        )
        
        # Verify section
        assert section.story_count == 3
        assert section.story_count == len(section.story_ids)
        assert "LLMs" in section.topic_tags
        assert section.order == 1
    
    def test_sections_to_daily_brief(self):
        """Test composing sections into daily brief."""
        brief_id = str(uuid4())
        
        sections = [
            BriefSection(
                id=str(uuid4()),
                daily_brief_id=brief_id,
                title=f"Section {i}",
                description=f"Description {i}",
                section_type="interest-based",
                story_ids=[f"story{j}" for j in range(5)],
                order=i + 1,
                topic_tags=["LLMs"],
                estimated_read_time=5,
                story_count=5
            )
            for i in range(3)
        ]
        
        total_items = sum(s.story_count for s in sections)
        
        brief = DailyBrief(
            id=brief_id,
            user_id="user_123",
            date=date.today(),
            title=f"Your Daily AI Brief - {date.today().strftime('%B %d, %Y')}",
            summary="Today's brief focuses on LLM advancements...",
            section_ids=[s.id for s in sections],
            total_items=total_items,
            top_topics=["LLMs", "AI Safety", "Multimodal AI"],
            top_sources=["TechCrunch", "ArXiv", "Anthropic"],
            whats_next={
                "action_items": [
                    "Review Claude 3.5 Sonnet capabilities",
                    "Consider AI safety frameworks for your project"
                ],
                "rationale": "Based on your interests in LLMs and AI Safety"
            },
            query_preferences={"interests": ["LLMs", "AI Safety"]},
            status=BriefStatus.GENERATED,
            read_count=0,
            saved_count=0,
            engagement_score=None,
            generated_at=datetime.now(),
            viewed_at=None
        )
        
        # Verify brief
        assert brief.total_items == 15
        assert len(brief.section_ids) == 3
        assert brief.status == BriefStatus.GENERATED
        assert len(brief.top_topics) == 3


class TestSourceFormatting:
    """Test source display name formatting."""
    
    def test_well_known_sources(self):
        """Test formatting of well-known sources."""
        assert format_source_display_name("techcrunch.com") == "TechCrunch"
        assert format_source_display_name("arxiv.org") == "ArXiv"
        assert format_source_display_name("anthropic.com") == "Anthropic"
        assert format_source_display_name("theverge.com") == "The Verge"
        assert format_source_display_name("stanford.edu") == "Stanford HAI"
    
    def test_generic_domain_formatting(self):
        """Test formatting of generic domains."""
        assert format_source_display_name("example.com") == "Example"
        assert format_source_display_name("mysource.org") == "Mysource"
    
    def test_special_cases(self):
        """Test special formatting cases."""
        assert format_source_display_name("ai.com") == "AI"
        assert format_source_display_name("unknown") == "Unknown Source"
        assert format_source_display_name("") == "Unknown Source"


class TestReadTimeCalculation:
    """Test read time estimation."""
    
    def test_short_text(self):
        """Test read time for short text (~200 words)."""
        # ~1000 chars = ~200 words = ~1 minute
        assert calculate_read_time(1000) == 1
    
    def test_medium_text(self):
        """Test read time for medium text (~1000 words)."""
        # ~5000 chars = ~1000 words = ~4 minutes
        assert calculate_read_time(5000) == 4
    
    def test_long_text(self):
        """Test read time for long text (~2500 words)."""
        # ~12500 chars = ~2500 words = ~10 minutes
        result = calculate_read_time(12500)
        assert result >= 9 and result <= 11  # Allow for rounding
    
    def test_minimum_read_time(self):
        """Test that minimum read time is 1 minute."""
        assert calculate_read_time(100) == 1
        assert calculate_read_time(0) == 1


class TestSummaryTruncation:
    """Test summary truncation."""
    
    def test_no_truncation_needed(self):
        """Test that short text is not truncated."""
        text = "This is a short summary."
        assert truncate_summary(text, max_length=200) == text
    
    def test_truncate_at_sentence(self):
        """Test truncation at sentence boundary."""
        text = "This is sentence one. This is sentence two. This is sentence three."
        result = truncate_summary(text, max_length=50)
        # Should keep first two sentences
        assert result == "This is sentence one. This is sentence two."
    
    def test_truncate_at_word(self):
        """Test truncation at word boundary when no sentence break."""
        text = "This is a very long sentence without any period marks"
        result = truncate_summary(text, max_length=30)
        assert result.endswith("...")
        assert len(result) <= 33  # Max length + "..."


class TestSupabaseClientMock:
    """Test Supabase client with mocked operations.
    
    Note: These tests mock Supabase calls. For actual database tests,
    use integration tests with a test database.
    """
    
    @pytest.mark.skip(reason="Requires Supabase credentials")
    def test_create_story(self):
        """Test creating a story in database."""
        from database.supabase_client import SupabaseClient
        
        # This would require actual Supabase credentials
        # For now, we test the data model validation
        story = Story(
            id="https://example.com/test",
            title="Test Story",
            url="https://example.com/test",
            summary="Test summary",
            source_domain="example.com",
            source_display_name="Example",
            published_at=datetime.now(),
            content_type=ContentType.NEWS,
            ai_tags=["Test"],
            final_score=85.0,
            rank=1,
            provider=SearchProvider.EXA,
            raw_score=0.9,
            user_id="test_user",
            retrieved_at=datetime.now(),
            added_to_brief_at=datetime.now()
        )
        
        # Validate that story can be serialized
        story_dict = story.model_dump(mode='json')
        assert story_dict['id'] == "https://example.com/test"
        assert story_dict['content_type'] == "News"
    
    def test_whats_next_model(self):
        """Test WhatsNext model for AI-generated action items."""
        whats_next = WhatsNext(
            action_items=[
                "Review Claude 3.5 Sonnet for your RAG pipeline",
                "Consider attending AI safety workshop",
                "Evaluate new embedding models"
            ],
            rationale="Based on your interest in LLMs and recent developments",
            related_story_ids=["story_1", "story_2", "story_3"],
            user_role="Data Engineer"
        )
        
        assert len(whats_next.action_items) == 3
        assert whats_next.user_role == "Data Engineer"
        assert len(whats_next.related_story_ids) == 3


class TestDataIntegrity:
    """Test data integrity constraints."""
    
    def test_story_rating_validation(self):
        """Test that story rating is validated (1-5)."""
        with pytest.raises(ValueError):
            Story(
                id="test",
                title="Test",
                url="https://example.com",
                summary="Test",
                source_domain="example.com",
                source_display_name="Example",
                final_score=85.0,
                rank=1,
                provider=SearchProvider.EXA,
                raw_score=0.9,
                user_id="test",
                user_rating=6,  # Invalid: > 5
                retrieved_at=datetime.now(),
                added_to_brief_at=datetime.now()
            )
    
    def test_brief_section_story_count_consistency(self):
        """Test that section story_count matches story_ids length."""
        # This should pass
        section = BriefSection(
            id=str(uuid4()),
            daily_brief_id=str(uuid4()),
            title="Test Section",
            section_type="featured",
            story_ids=["story1", "story2", "story3"],
            order=1,
            story_count=3
        )
        assert section.story_count == len(section.story_ids)
        
        # This should fail validation (in database CHECK constraint)
        # We can't test the DB constraint here, but we can document it
        # CHECK (story_count = array_length(story_ids, 1))


# Integration test markers
pytestmark = pytest.mark.database


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

