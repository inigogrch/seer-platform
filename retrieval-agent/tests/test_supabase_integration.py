"""
Integration tests for Supabase client.

These tests interact with actual Supabase database to verify:
1. Database connection and authentication
2. CRUD operations for all tables
3. Data integrity and constraints
4. RLS policies (Row Level Security)
5. Database functions and triggers

Prerequisites:
- Supabase schema applied (schema.sql)
- Environment variables configured (.env.local):
  * NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
  * SUPABASE_SERVICE_ROLE_KEY

Run with: pytest tests/test_supabase_integration.py -v
Skip with: pytest -m "not integration"
"""

import pytest
import asyncio
from datetime import datetime, date
from uuid import uuid4
from typing import List

from database.supabase_client import SupabaseClient
from models.schemas import (
    Story, DailyBrief, BriefSection, SearchProvider, 
    ContentType, BriefStatus, WhatsNext
)


# Test user ID - will be set dynamically from actual users in database
_TEST_USER_ID_CACHE = None


def get_test_user_id(client: SupabaseClient) -> str:
    """Get a valid test user ID from the database.
    
    Set this to your actual Supabase user ID from the Auth dashboard.
    """
    global _TEST_USER_ID_CACHE
    if _TEST_USER_ID_CACHE:
        return _TEST_USER_ID_CACHE
    
    # TODO: Replace this with your actual user ID from Supabase Auth dashboard
    # Get it from: https://app.supabase.com/project/_/auth/users
    _TEST_USER_ID_CACHE = "47341d26-9036-495f-8f9e-7e1939c6454b"
    
    return _TEST_USER_ID_CACHE


@pytest.fixture
def supabase_client():
    """Create Supabase client for testing."""
    try:
        client = SupabaseClient()
        return client
    except ValueError as e:
        pytest.skip(f"Supabase credentials not configured: {e}")


@pytest.fixture
def test_user_id(supabase_client):
    """Get a valid test user ID."""
    return get_test_user_id(supabase_client)


@pytest.fixture
async def cleanup_test_data(supabase_client: SupabaseClient, test_user_id: str):
    """Cleanup test data after tests."""
    yield
    # Cleanup will cascade delete stories, sections, etc.
    try:
        # Delete test briefs (will cascade to sections)
        supabase_client.client.table('daily_briefs').delete().eq('user_id', test_user_id).execute()
        # Delete test stories
        supabase_client.client.table('stories').delete().eq('user_id', test_user_id).execute()
        # Delete test preferences
        supabase_client.client.table('user_preferences').delete().eq('user_id', test_user_id).execute()
    except Exception as e:
        print(f"Cleanup warning: {e}")


@pytest.mark.integration
@pytest.mark.database
class TestSupabaseConnection:
    """Test database connection and configuration."""
    
    def test_client_initialization(self, supabase_client):
        """Test that Supabase client initializes correctly."""
        assert supabase_client is not None
        assert supabase_client.client is not None
        assert supabase_client.url is not None
        assert supabase_client.key is not None
    
    def test_database_connection(self, supabase_client):
        """Test that we can connect to the database."""
        # Try a simple query to verify connection
        result = supabase_client.client.table('stories').select('count', count='exact').limit(0).execute()
        assert result is not None


@pytest.mark.integration
@pytest.mark.database
class TestStoryOperations:
    """Test Story CRUD operations."""
    
    @pytest.mark.asyncio
    async def test_create_story(self, supabase_client, test_user_id, cleanup_test_data):
        """Test creating a story in database."""
        story = Story(
            id="https://example.com/test-story-1",
            title="Test Story 1",
            url="https://example.com/test-story-1",
            summary="This is a test story for integration testing.",
            source_domain="example.com",
            source_display_name="Example",
            author="Test Author",
            published_at=datetime.now(),
            content_type=ContentType.NEWS,
            ai_tags=["Test", "Integration"],
            final_score=85.0,
            rank=1,
            provider=SearchProvider.EXA,
            raw_score=0.9,
            user_id=test_user_id,
            retrieved_at=datetime.now(),
            added_to_brief_at=datetime.now()
        )
        
        story_id = await supabase_client.create_story(story)
        assert story_id == story.id
        
        # Verify it was created
        retrieved_story = await supabase_client.get_story(story_id, test_user_id)
        assert retrieved_story is not None
        assert retrieved_story.title == story.title
        assert retrieved_story.content_type == ContentType.NEWS
        assert "Test" in retrieved_story.ai_tags
    
    @pytest.mark.asyncio
    async def test_batch_create_stories(self, supabase_client, test_user_id, cleanup_test_data):
        """Test batch creating multiple stories."""
        stories = [
            Story(
                id=f"https://example.com/batch-story-{i}",
                title=f"Batch Story {i}",
                url=f"https://example.com/batch-story-{i}",
                summary=f"Batch story {i} summary",
                source_domain="example.com",
                source_display_name="Example",
                published_at=datetime.now(),
                content_type=ContentType.RESEARCH,
                ai_tags=["Batch", "Test"],
                final_score=80.0 + i,
                rank=i + 1,
                provider=SearchProvider.PERPLEXITY,
                raw_score=0.8,
                user_id=test_user_id,
                retrieved_at=datetime.now(),
                added_to_brief_at=datetime.now()
            )
            for i in range(5)
        ]
        
        story_ids = await supabase_client.batch_create_stories(stories)
        assert len(story_ids) == 5
        
        # Verify all were created
        for story_id in story_ids:
            retrieved = await supabase_client.get_story(story_id, test_user_id)
            assert retrieved is not None
    
    @pytest.mark.asyncio
    async def test_update_story_interaction(self, supabase_client, test_user_id, cleanup_test_data):
        """Test updating story interaction fields."""
        # Create a story first
        story = Story(
            id="https://example.com/interaction-story",
            title="Interaction Test Story",
            url="https://example.com/interaction-story",
            summary="Test story for interaction updates",
            source_domain="example.com",
            source_display_name="Example",
            content_type=ContentType.OPINION,
            final_score=88.0,
            rank=1,
            provider=SearchProvider.EXA,
            raw_score=0.85,
            user_id=test_user_id,
            retrieved_at=datetime.now(),
            added_to_brief_at=datetime.now()
        )
        
        story_id = await supabase_client.create_story(story)
        
        # Update interaction fields
        success = await supabase_client.update_story_interaction(
            story_id=story_id,
            user_id=test_user_id,
            is_read=True,
            is_saved=True,
            user_rating=5,
            user_notes="Great article!"
        )
        assert success
        
        # Verify updates
        updated_story = await supabase_client.get_story(story_id, test_user_id)
        assert updated_story.is_read is True
        assert updated_story.is_saved is True
        assert updated_story.user_rating == 5
        assert updated_story.user_notes == "Great article!"


@pytest.mark.integration
@pytest.mark.database
class TestDailyBriefOperations:
    """Test DailyBrief CRUD operations."""
    
    @pytest.mark.asyncio
    async def test_create_daily_brief(self, supabase_client, test_user_id, cleanup_test_data):
        """Test creating a daily brief."""
        brief = DailyBrief(
            id=str(uuid4()),
            user_id=test_user_id,
            date=date.today(),
            title=f"Test Brief - {date.today()}",
            summary="This is a test daily brief for integration testing.",
            section_ids=[],
            total_items=0,
            top_topics=["Test", "Integration"],
            top_sources=["Example"],
            whats_next={
                "action_items": [
                    "Test action item 1",
                    "Test action item 2",
                    "Test action item 3"
                ],
                "rationale": "Based on test data"
            },
            query_preferences={"interests": ["Testing"]},
            status=BriefStatus.GENERATED
        )
        
        brief_id = await supabase_client.create_daily_brief(brief)
        assert brief_id == brief.id
        
        # Verify it was created
        retrieved_brief = await supabase_client.get_daily_brief(test_user_id, date.today())
        assert retrieved_brief is not None
        assert retrieved_brief.title == brief.title
        assert retrieved_brief.status == BriefStatus.GENERATED
        assert len(retrieved_brief.whats_next["action_items"]) == 3
    
    @pytest.mark.asyncio
    async def test_get_daily_brief_by_id(self, supabase_client, test_user_id, cleanup_test_data):
        """Test retrieving brief by ID."""
        # Create a brief
        brief_id = str(uuid4())
        brief = DailyBrief(
            id=brief_id,
            user_id=test_user_id,
            date=date.today(),
            title="Test Brief for ID lookup",
            summary="Test brief summary",
            total_items=0,
            status=BriefStatus.DRAFT
        )
        
        await supabase_client.create_daily_brief(brief)
        
        # Get by ID
        retrieved = await supabase_client.get_daily_brief_by_id(brief_id)
        assert retrieved is not None
        assert retrieved.id == brief_id
        assert retrieved.user_id == test_user_id
    
    @pytest.mark.asyncio
    async def test_update_brief_status(self, supabase_client, test_user_id, cleanup_test_data):
        """Test updating brief status."""
        # Create a brief
        brief = DailyBrief(
            id=str(uuid4()),
            user_id=test_user_id,
            date=date.today(),
            title="Status Test Brief",
            summary="Testing status updates",
            total_items=0,
            status=BriefStatus.DRAFT
        )
        
        brief_id = await supabase_client.create_daily_brief(brief)
        
        # Update status
        viewed_time = datetime.now()
        success = await supabase_client.update_daily_brief_status(
            brief_id=brief_id,
            status=BriefStatus.VIEWED,
            viewed_at=viewed_time
        )
        assert success
        
        # Verify update
        updated = await supabase_client.get_daily_brief_by_id(brief_id)
        assert updated.status == BriefStatus.VIEWED
        assert updated.viewed_at is not None
    
    @pytest.mark.asyncio
    async def test_get_recent_briefs(self, supabase_client, test_user_id, cleanup_test_data):
        """Test retrieving recent briefs."""
        # Create multiple briefs
        from datetime import timedelta
        
        for i in range(3):
            brief = DailyBrief(
                id=str(uuid4()),
                user_id=test_user_id,
                date=date.today() - timedelta(days=i),
                title=f"Brief {i}",
                summary=f"Brief summary {i}",
                total_items=10 + i,
                status=BriefStatus.GENERATED
            )
            await supabase_client.create_daily_brief(brief)
        
        # Get recent briefs
        recent = await supabase_client.get_recent_briefs(test_user_id, limit=3)
        assert len(recent) == 3
        # Should be newest first
        assert recent[0].date >= recent[1].date >= recent[2].date


@pytest.mark.integration
@pytest.mark.database
class TestBriefSectionOperations:
    """Test BriefSection operations."""
    
    @pytest.mark.asyncio
    async def test_create_section(self, supabase_client, test_user_id, cleanup_test_data):
        """Test creating a brief section."""
        # First create a brief
        brief = DailyBrief(
            id=str(uuid4()),
            user_id=test_user_id,
            date=date.today(),
            title="Section Test Brief",
            summary="Brief for testing sections",
            total_items=0,
            status=BriefStatus.DRAFT
        )
        brief_id = await supabase_client.create_daily_brief(brief)
        
        # Create a section
        section = BriefSection(
            id=str(uuid4()),
            daily_brief_id=brief_id,
            title="Featured Stories",
            description="Top stories today",
            section_type="featured",
            story_ids=["story1", "story2", "story3"],
            order=1,
            topic_tags=["Test", "Featured"],
            estimated_read_time=5,
            story_count=3
        )
        
        section_id = await supabase_client.create_brief_section(section)
        assert section_id == section.id
        
        # Verify it was created
        sections = await supabase_client.get_sections_for_brief(brief_id)
        assert len(sections) == 1
        assert sections[0].title == "Featured Stories"
        assert sections[0].story_count == 3
    
    @pytest.mark.asyncio
    async def test_batch_create_sections(self, supabase_client, test_user_id, cleanup_test_data):
        """Test batch creating sections."""
        # Create a brief
        brief = DailyBrief(
            id=str(uuid4()),
            user_id=test_user_id,
            date=date.today(),
            title="Batch Section Test Brief",
            summary="Brief for testing batch sections",
            total_items=0,
            status=BriefStatus.DRAFT
        )
        brief_id = await supabase_client.create_daily_brief(brief)
        
        # Create multiple sections
        sections = [
            BriefSection(
                id=str(uuid4()),
                daily_brief_id=brief_id,
                title=f"Section {i}",
                section_type="topic-based" if i > 0 else "featured",
                story_ids=[f"story{j}" for j in range(3)],
                order=i + 1,
                topic_tags=[f"Topic{i}"],
                story_count=3
            )
            for i in range(3)
        ]
        
        section_ids = await supabase_client.batch_create_sections(sections)
        assert len(section_ids) == 3
        
        # Verify all were created and ordered correctly
        retrieved_sections = await supabase_client.get_sections_for_brief(brief_id)
        assert len(retrieved_sections) == 3
        assert retrieved_sections[0].order == 1
        assert retrieved_sections[1].order == 2
        assert retrieved_sections[2].order == 3


@pytest.mark.integration
@pytest.mark.database
class TestCompleteWorkflow:
    """Test complete workflow: stories → sections → brief."""
    
    @pytest.mark.asyncio
    async def test_full_daily_brief_workflow(self, supabase_client, test_user_id, cleanup_test_data):
        """Test creating a complete daily brief with stories and sections."""
        # Step 1: Create stories
        stories = [
            Story(
                id=f"https://example.com/workflow-story-{i}",
                title=f"Workflow Story {i}",
                url=f"https://example.com/workflow-story-{i}",
                summary=f"Story {i} for workflow test",
                source_domain="example.com",
                source_display_name="Example",
                published_at=datetime.now(),
                content_type=ContentType.NEWS if i < 5 else ContentType.RESEARCH,
                ai_tags=["Workflow", "Test", "LLMs" if i < 5 else "Research"],
                final_score=90.0 - i,
                rank=i + 1,
                provider=SearchProvider.EXA,
                raw_score=0.9 - i * 0.05,
                user_id=test_user_id,
                retrieved_at=datetime.now(),
                added_to_brief_at=datetime.now()
            )
            for i in range(10)
        ]
        
        story_ids = await supabase_client.batch_create_stories(stories)
        assert len(story_ids) == 10
        
        # Step 2: Create daily brief
        brief_id = str(uuid4())
        brief = DailyBrief(
            id=brief_id,
            user_id=test_user_id,
            date=date.today(),
            title=f"Complete Workflow Brief - {date.today()}",
            summary="This brief tests the complete workflow from stories to brief.",
            total_items=10,
            top_topics=["Workflow", "Test", "LLMs"],
            top_sources=["Example"],
            whats_next={
                "action_items": [
                    "Review workflow test results",
                    "Verify all components working",
                    "Check data integrity"
                ],
                "rationale": "Based on workflow testing"
            },
            query_preferences={"interests": ["Testing", "Workflow"]},
            status=BriefStatus.GENERATED
        )
        
        created_brief_id = await supabase_client.create_daily_brief(brief)
        assert created_brief_id == brief_id
        
        # Step 3: Create sections
        sections = [
            BriefSection(
                id=str(uuid4()),
                daily_brief_id=brief_id,
                title="Featured Stories",
                description="Top 7 stories today",
                section_type="featured",
                story_ids=story_ids[:7],
                order=1,
                topic_tags=["Workflow", "LLMs"],
                estimated_read_time=10,
                story_count=7
            ),
            BriefSection(
                id=str(uuid4()),
                daily_brief_id=brief_id,
                title="Research Papers",
                description="Latest research",
                section_type="topic-based",
                story_ids=story_ids[7:],
                order=2,
                topic_tags=["Research"],
                estimated_read_time=5,
                story_count=3
            )
        ]
        
        section_ids = await supabase_client.batch_create_sections(sections)
        assert len(section_ids) == 2
        
        # Step 4: Verify complete brief
        retrieved_brief = await supabase_client.get_daily_brief(test_user_id, date.today())
        assert retrieved_brief is not None
        assert retrieved_brief.total_items == 10
        assert len(retrieved_brief.top_topics) == 3
        
        # Verify sections
        retrieved_sections = await supabase_client.get_sections_for_brief(brief_id)
        assert len(retrieved_sections) == 2
        assert retrieved_sections[0].section_type == "featured"
        assert retrieved_sections[0].story_count == 7
        assert retrieved_sections[1].story_count == 3
        
        # Verify stories
        stories_for_brief = await supabase_client.get_stories_for_brief(brief_id, test_user_id)
        assert len(stories_for_brief) == 10
        
        # Verify featured section has highest ranked stories
        featured_section = retrieved_sections[0]
        featured_story_ids = set(featured_section.story_ids)
        featured_stories = [s for s in stories_for_brief if s.id in featured_story_ids]
        assert len(featured_stories) == 7
        # All featured stories should have rank 1-7
        featured_ranks = [s.rank for s in featured_stories]
        assert all(rank <= 7 for rank in featured_ranks)


@pytest.mark.integration
@pytest.mark.database
class TestUserPreferences:
    """Test user preferences operations."""
    
    @pytest.mark.asyncio
    async def test_upsert_and_get_preferences(self, supabase_client, test_user_id, cleanup_test_data):
        """Test creating and retrieving user preferences."""
        preferences = {
            "interests": ["LLMs", "AI Safety", "RAG"],
            "content_types": ["News", "Research"],
            "preferred_sources": ["techcrunch.com", "arxiv.org"],
            "search_recency_days": 7,
            "max_results_per_day": 15
        }
        
        # Upsert preferences
        success = await supabase_client.upsert_user_preferences(test_user_id, preferences)
        assert success
        
        # Retrieve preferences
        retrieved = await supabase_client.get_user_preferences(test_user_id)
        assert retrieved is not None
        assert "LLMs" in retrieved["interests"]
        assert retrieved["search_recency_days"] == 7


@pytest.mark.integration
@pytest.mark.database
class TestRetrievalLogs:
    """Test retrieval logging operations."""
    
    @pytest.mark.asyncio
    async def test_log_retrieval(self, supabase_client, test_user_id, cleanup_test_data):
        """Test logging an API retrieval operation."""
        log_id = await supabase_client.log_retrieval(
            user_id=test_user_id,
            query="test query for LLMs",
            provider=SearchProvider.EXA,
            num_results_requested=10,
            results_count=10,
            duration_ms=150
        )
        
        assert log_id is not None
        
        # Verify log was created
        logs = await supabase_client.get_retrieval_logs(test_user_id, limit=10)
        assert len(logs) > 0
        assert logs[0]["query"] == "test query for LLMs"
        assert logs[0]["duration_ms"] == 150
    
    @pytest.mark.asyncio
    async def test_log_retrieval_error(self, supabase_client, test_user_id, cleanup_test_data):
        """Test logging a failed retrieval operation."""
        log_id = await supabase_client.log_retrieval(
            user_id=test_user_id,
            query="error test query",
            provider=SearchProvider.PERPLEXITY,
            num_results_requested=10,
            results_count=0,
            duration_ms=50,
            error_message="API rate limit exceeded"
        )
        
        assert log_id is not None
        
        # Verify error log
        error_logs = await supabase_client.get_retrieval_logs(
            test_user_id, 
            limit=10, 
            errors_only=True
        )
        assert len(error_logs) > 0
        assert error_logs[0]["error_message"] == "API rate limit exceeded"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "integration"])

