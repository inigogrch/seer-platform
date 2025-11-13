"""
Supabase client for the Seer AI retrieval agent.

Provides CRUD operations for:
    - Stories (enriched content items)
    - DailyBriefs (daily news briefs with AI-generated "What's Next")
    - BriefSections (personalized content groupings)
    - UserPreferences (user settings)
    - RetrievalLogs (API call audit log)

Environment variables required:
- SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (for server-side operations)
"""

import os
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from models.schemas import (
    Story,
    DailyBrief,
    BriefSection,
    WhatsNext,
    SearchProvider,
    BriefStatus
)

# Load environment variables
load_dotenv()  # Load from retrieval-agent/.env if exists
load_dotenv(Path(__file__).parent.parent.parent / '.env.local')  # Load from root .env.local


class SupabaseClient:
    """Client for Supabase database operations.
    
    Handles all database interactions for the retrieval agent, including:
    - Story management (create, read, update user interactions)
    - Daily brief management (create, fetch, update stats)
    - Section management (create sections within briefs)
    - Trending topics (fetch computed trends)
    - User preferences (get/update user settings)
    - Retrieval logging (audit trail of API calls)
    
    Example:
        >>> client = SupabaseClient()
        >>> brief = await client.get_daily_brief(user_id="user_123", date=date.today())
        >>> stories = await client.get_stories_for_brief(brief.id)
    """
    
    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None
    ):
        """Initialize Supabase client.
        
        Args:
            supabase_url: Supabase project URL. If not provided, reads from
                         NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL env vars.
            supabase_key: Supabase service role key. If not provided, reads from
                         SUPABASE_SERVICE_ROLE_KEY env var.
                         
        Raises:
            ValueError: If required environment variables are not set.
        """
        self.url = supabase_url or os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
        self.key = supabase_key or os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.url:
            raise ValueError(
                "Supabase URL must be provided or set in NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL"
            )
        
        if not self.key:
            raise ValueError(
                "Supabase key must be provided or set in SUPABASE_SERVICE_ROLE_KEY"
            )
        
        self.client: Client = create_client(self.url, self.key)
    
    # ========================================================================
    # STORY OPERATIONS
    # ========================================================================
    
    async def create_story(self, story: Story) -> str:
        """Create a new story in the database.
        
        Args:
            story: Story object to insert
            
        Returns:
            Story ID
            
        Raises:
            Exception: If insert fails
        """
        story_data = story.model_dump(mode='json')
        
        # Convert enums to strings
        story_data['provider'] = story_data['provider']
        if story_data.get('content_type'):
            story_data['content_type'] = story_data['content_type']
        
        result = self.client.table('stories').insert(story_data).execute()
        
        if not result.data:
            raise Exception("Failed to create story")
        
        return result.data[0]['id']
    
    async def batch_create_stories(self, stories: List[Story]) -> List[str]:
        """Create multiple stories in a single batch operation.
        
        Args:
            stories: List of Story objects to insert
            
        Returns:
            List of story IDs
            
        Raises:
            Exception: If batch insert fails
        """
        if not stories:
            return []
        
        stories_data = []
        for story in stories:
            data = story.model_dump(mode='json')
            # Convert enums
            data['provider'] = data['provider']
            if data.get('content_type'):
                data['content_type'] = data['content_type']
            stories_data.append(data)
        
        result = self.client.table('stories').insert(stories_data).execute()
        
        if not result.data:
            raise Exception("Failed to batch create stories")
        
        return [row['id'] for row in result.data]
    
    async def get_story(self, story_id: str, user_id: str) -> Optional[Story]:
        """Get a specific story by ID.
        
        Args:
            story_id: Story ID
            user_id: User ID (for RLS)
            
        Returns:
            Story object or None if not found
        """
        result = self.client.table('stories').select('*').eq('id', story_id).eq('user_id', user_id).execute()
        
        if not result.data:
            return None
        
        return Story(**result.data[0])
    
    async def get_stories_for_brief(self, brief_id: str, user_id: str) -> List[Story]:
        """Get all stories for a daily brief.
        
        Args:
            brief_id: Daily brief ID
            user_id: User ID
            
        Returns:
            List of Story objects
        """
        # Get section story IDs
        sections = self.client.table('brief_sections').select('story_ids').eq('daily_brief_id', brief_id).execute()
        
        if not sections.data:
            return []
        
        # Flatten story IDs from all sections
        story_ids = []
        for section in sections.data:
            story_ids.extend(section['story_ids'])
        
        if not story_ids:
            return []
        
        # Fetch stories
        result = self.client.table('stories').select('*').in_('id', story_ids).eq('user_id', user_id).execute()
        
        return [Story(**row) for row in result.data]
    
    async def update_story_interaction(
        self,
        story_id: str,
        user_id: str,
        is_read: Optional[bool] = None,
        is_saved: Optional[bool] = None,
        user_rating: Optional[int] = None,
        user_notes: Optional[str] = None
    ) -> bool:
        """Update user interaction fields on a story.
        
        Args:
            story_id: Story ID
            user_id: User ID
            is_read: Mark as read
            is_saved: Mark as saved
            user_rating: User rating (1-5)
            user_notes: User notes
            
        Returns:
            True if successful
            
        Raises:
            Exception: If update fails
        """
        update_data = {}
        if is_read is not None:
            update_data['is_read'] = is_read
        if is_saved is not None:
            update_data['is_saved'] = is_saved
        if user_rating is not None:
            update_data['user_rating'] = user_rating
        if user_notes is not None:
            update_data['user_notes'] = user_notes
        
        if not update_data:
            return True  # Nothing to update
        
        result = self.client.table('stories').update(update_data).eq('id', story_id).eq('user_id', user_id).execute()
        
        return len(result.data) > 0
    
    # ========================================================================
    # DAILY BRIEF OPERATIONS
    # ========================================================================
    
    async def create_daily_brief(self, brief: DailyBrief) -> str:
        """Create a new daily brief.
        
        Args:
            brief: DailyBrief object to insert
            
        Returns:
            Brief ID (UUID)
            
        Raises:
            Exception: If insert fails
        """
        brief_data = brief.model_dump(mode='json')
        
        result = self.client.table('daily_briefs').insert(brief_data).execute()
        
        if not result.data:
            raise Exception("Failed to create daily brief")
        
        return result.data[0]['id']
    
    async def get_daily_brief(self, user_id: str, date: date) -> Optional[DailyBrief]:
        """Get daily brief for a specific user and date.
        
        Args:
            user_id: User ID
            date: Brief date
            
        Returns:
            DailyBrief object or None if not found
        """
        result = (
            self.client.table('daily_briefs')
            .select('*')
            .eq('user_id', user_id)
            .eq('date', date.isoformat())
            .execute()
        )
        
        if not result.data:
            return None
        
        return DailyBrief(**result.data[0])
    
    async def get_daily_brief_by_id(self, brief_id: str) -> Optional[DailyBrief]:
        """Get daily brief by ID.
        
        Args:
            brief_id: Brief UUID
            
        Returns:
            DailyBrief object or None if not found
        """
        result = self.client.table('daily_briefs').select('*').eq('id', brief_id).execute()
        
        if not result.data:
            return None
        
        return DailyBrief(**result.data[0])
    
    async def update_daily_brief_status(
        self,
        brief_id: str,
        status: BriefStatus,
        viewed_at: Optional[datetime] = None
    ) -> bool:
        """Update daily brief status.
        
        Args:
            brief_id: Brief ID
            status: New status (BriefStatus enum)
            viewed_at: Timestamp when viewed (optional)
            
        Returns:
            True if successful
        """
        update_data = {'status': status.value}
        if viewed_at:
            update_data['viewed_at'] = viewed_at.isoformat()
        
        result = self.client.table('daily_briefs').update(update_data).eq('id', brief_id).execute()
        
        return len(result.data) > 0
    
    async def update_brief_stats(self, brief_id: str) -> bool:
        """Update daily brief statistics (calls database function).
        
        This updates read_count, saved_count, top_topics, and top_sources
        based on current story states.
        
        Args:
            brief_id: Brief ID
            
        Returns:
            True if successful
        """
        try:
            self.client.rpc('update_brief_stats', {'brief_id_param': brief_id}).execute()
            return True
        except Exception as e:
            print(f"Error updating brief stats: {e}")
            return False
    
    async def get_recent_briefs(self, user_id: str, limit: int = 7) -> List[DailyBrief]:
        """Get recent daily briefs for a user.
        
        Args:
            user_id: User ID
            limit: Maximum number of briefs to return
            
        Returns:
            List of DailyBrief objects, newest first
        """
        result = (
            self.client.table('daily_briefs')
            .select('*')
            .eq('user_id', user_id)
            .order('date', desc=True)
            .limit(limit)
            .execute()
        )
        
        return [DailyBrief(**row) for row in result.data]
    
    # ========================================================================
    # BRIEF SECTION OPERATIONS
    # ========================================================================
    
    async def create_brief_section(self, section: BriefSection) -> str:
        """Create a new brief section.
        
        Args:
            section: BriefSection object to insert
            
        Returns:
            Section ID (UUID)
            
        Raises:
            Exception: If insert fails
        """
        section_data = section.model_dump(mode='json')
        
        result = self.client.table('brief_sections').insert(section_data).execute()
        
        if not result.data:
            raise Exception("Failed to create brief section")
        
        return result.data[0]['id']
    
    async def batch_create_sections(self, sections: List[BriefSection]) -> List[str]:
        """Create multiple sections in a single batch operation.
        
        Args:
            sections: List of BriefSection objects to insert
            
        Returns:
            List of section IDs
            
        Raises:
            Exception: If batch insert fails
        """
        if not sections:
            return []
        
        sections_data = [section.model_dump(mode='json') for section in sections]
        
        result = self.client.table('brief_sections').insert(sections_data).execute()
        
        if not result.data:
            raise Exception("Failed to batch create sections")
        
        return [row['id'] for row in result.data]
    
    async def get_sections_for_brief(self, brief_id: str) -> List[BriefSection]:
        """Get all sections for a daily brief, ordered by display order.
        
        Args:
            brief_id: Daily brief ID
            
        Returns:
            List of BriefSection objects, ordered by 'order' field
        """
        result = (
            self.client.table('brief_sections')
            .select('*')
            .eq('daily_brief_id', brief_id)
            .order('order', desc=False)
            .execute()
        )
        
        return [BriefSection(**row) for row in result.data]
    
    # ========================================================================
    # USER PREFERENCES
    # ========================================================================
    
    async def get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user preferences.
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary of user preferences or None if not found
        """
        result = self.client.table('user_preferences').select('*').eq('user_id', user_id).execute()
        
        if not result.data:
            return None
        
        return result.data[0]
    
    async def upsert_user_preferences(
        self,
        user_id: str,
        preferences: Dict[str, Any]
    ) -> bool:
        """Create or update user preferences.
        
        Args:
            user_id: User ID
            preferences: Dictionary of preference fields
            
        Returns:
            True if successful
        """
        preferences['user_id'] = user_id
        
        result = self.client.table('user_preferences').upsert(preferences).execute()
        
        return len(result.data) > 0
    
    # ========================================================================
    # RETRIEVAL LOGS
    # ========================================================================
    
    async def log_retrieval(
        self,
        user_id: str,
        query: str,
        provider: SearchProvider,
        num_results_requested: int,
        results_count: int,
        duration_ms: int,
        error_message: Optional[str] = None
    ) -> str:
        """Log an API retrieval operation.
        
        Args:
            user_id: User ID
            query: Search query
            provider: Search provider (exa/perplexity)
            num_results_requested: Number of results requested
            results_count: Actual number of results returned
            duration_ms: API call duration in milliseconds
            error_message: Error message if call failed
            
        Returns:
            Log ID (UUID)
        """
        log_data = {
            'user_id': user_id,
            'query': query,
            'provider': provider.value,
            'num_results_requested': num_results_requested,
            'results_count': results_count,
            'duration_ms': duration_ms,
            'error_message': error_message
        }
        
        result = self.client.table('retrieval_logs').insert(log_data).execute()
        
        if not result.data:
            raise Exception("Failed to log retrieval")
        
        return result.data[0]['id']
    
    async def get_retrieval_logs(
        self,
        user_id: str,
        limit: int = 50,
        errors_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Get retrieval logs for a user.
        
        Args:
            user_id: User ID
            limit: Maximum number of logs to return
            errors_only: Only return logs with errors
            
        Returns:
            List of log dictionaries
        """
        query = (
            self.client.table('retrieval_logs')
            .select('*')
            .eq('user_id', user_id)
            .order('created_at', desc=True)
            .limit(limit)
        )
        
        if errors_only:
            query = query.not_.is_('error_message', 'null')
        
        result = query.execute()
        
        return result.data

