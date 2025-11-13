-- ============================================================================
-- Seer AI Platform - Retrieval Agent Database Schema
-- ============================================================================
--
-- This schema supports the daily brief generation pipeline:
--   API → SearchResult → Document → RankedDoc → Story → BriefSection → DailyBrief
--
-- Design principles:
--   - Denormalized for read performance (dashboard is read-heavy)
--   - JSONB for flexible user preferences and AI-generated data
--   - GIN indexes for array/JSONB searches
--   - Cascade deletes to maintain referential integrity
--   - Timestamp tracking for analytics
--
-- Author: Retrieval Agent
-- Created: 2025-11-05
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Content type classification (matches Pydantic ContentType enum)
CREATE TYPE content_type AS ENUM (
    'Research',
    'Opinion',
    'Learning/Educational',
    'News',
    'Case Study',
    'Event Coverage',
    'Review/Benchmark',
    'Interview/Profile',
    'Dataset/Resource',
    'Discussion',
    'Regulatory/Policy'
);

-- Search provider (matches Pydantic SearchProvider enum)
CREATE TYPE search_provider AS ENUM ('exa', 'perplexity');

-- Brief status
CREATE TYPE brief_status AS ENUM ('draft', 'generated', 'viewed', 'archived');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- stories: Individual content items (final form after enrichment)
-- ---------------------------------------------------------------------------
CREATE TABLE stories (
    -- Identity
    id TEXT PRIMARY KEY,  -- URL or API-provided ID
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content metadata
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    summary TEXT NOT NULL,  -- 1-2 sentence summary (truncated snippet or AI-generated)
    
    -- Source information
    source_domain TEXT NOT NULL,  -- e.g., "techcrunch.com"
    source_display_name TEXT NOT NULL,  -- e.g., "TechCrunch" (formatted)
    author TEXT,
    published_at TIMESTAMPTZ,
    
    -- AI enrichment (to be populated by LLM agent)
    content_type content_type,  -- Classified content type
    ai_tags TEXT[] DEFAULT '{}',  -- Topic tags ["LLMs", "Claude", "Reasoning"]
    
    -- Ranking metadata (from heuristic ranking)
    final_score REAL NOT NULL,  -- Combined ranking score (0-100)
    rank INTEGER NOT NULL,  -- Position in daily ranking
    provider search_provider NOT NULL,
    raw_score REAL NOT NULL,  -- Original API relevance score
    
    -- User interaction state
    is_read BOOLEAN DEFAULT FALSE,
    is_saved BOOLEAN DEFAULT FALSE,
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    user_notes TEXT,
    
    -- Timestamps
    retrieved_at TIMESTAMPTZ NOT NULL,  -- When fetched from API
    added_to_brief_at TIMESTAMPTZ NOT NULL,  -- When added to daily brief
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(id, user_id)  -- Same story can appear for multiple users
);

-- Indexes for stories table
CREATE INDEX idx_stories_user_date ON stories(user_id, added_to_brief_at DESC);
CREATE INDEX idx_stories_source_domain ON stories(source_domain);
CREATE INDEX idx_stories_content_type ON stories(content_type) WHERE content_type IS NOT NULL;
CREATE INDEX idx_stories_tags ON stories USING GIN(ai_tags);  -- Fast tag searches
CREATE INDEX idx_stories_is_saved ON stories(user_id, is_saved) WHERE is_saved = TRUE;
CREATE INDEX idx_stories_published ON stories(published_at DESC NULLS LAST);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- daily_briefs: Top-level container for each user's daily brief
-- ---------------------------------------------------------------------------
CREATE TABLE daily_briefs (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Brief metadata
    title TEXT NOT NULL,  -- e.g., "Your Daily AI Brief - November 5, 2025"
    summary TEXT,  -- AI-generated overview
    
    -- Content organization
    section_ids UUID[] DEFAULT '{}',  -- Ordered list of section IDs (denormalized)
    total_items INTEGER NOT NULL DEFAULT 0,
    
    -- Insights (denormalized for fast reads)
    top_topics TEXT[] DEFAULT '{}',  -- Most prominent topics
    top_sources TEXT[] DEFAULT '{}',  -- Most frequent domains
    
    -- What's Next (AI-generated action items)
    whats_next JSONB DEFAULT NULL,  -- AI-generated priorities and action items
    
    -- User preferences applied during generation
    query_preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    status brief_status DEFAULT 'draft',
    
    -- Statistics
    read_count INTEGER DEFAULT 0,
    saved_count INTEGER DEFAULT 0,
    engagement_score REAL,  -- Calculated engagement metric (0.0-1.0)
    
    -- Timestamps
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, date)  -- One brief per user per day
);

-- Indexes for daily_briefs table
CREATE INDEX idx_briefs_user_date ON daily_briefs(user_id, date DESC);
CREATE INDEX idx_briefs_status ON daily_briefs(status);
CREATE INDEX idx_briefs_generated ON daily_briefs(generated_at DESC);
CREATE INDEX idx_briefs_section_ids ON daily_briefs USING GIN(section_ids);

CREATE TRIGGER update_daily_briefs_updated_at BEFORE UPDATE ON daily_briefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- brief_sections: Personalized groupings within a daily brief
-- ---------------------------------------------------------------------------
CREATE TABLE brief_sections (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_brief_id UUID NOT NULL REFERENCES daily_briefs(id) ON DELETE CASCADE,
    
    -- Section metadata
    title TEXT NOT NULL,  -- e.g., "Latest in Large Language Models"
    description TEXT,  -- e.g., "Based on your interest in LLMs"
    section_type TEXT,  -- e.g., "interest-based", "trending", "recommended"
    
    -- Content organization
    story_ids TEXT[] NOT NULL,  -- Array of story IDs in this section
    "order" INTEGER NOT NULL,  -- Display order within brief (1-based)
    
    -- Section insights
    topic_tags TEXT[] DEFAULT '{}',
    estimated_read_time INTEGER,  -- Total minutes for all stories
    story_count INTEGER NOT NULL,  -- Number of stories in section
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CHECK (story_count = array_length(story_ids, 1))
);

-- Indexes for brief_sections table
CREATE INDEX idx_sections_brief ON brief_sections(daily_brief_id, "order");
CREATE INDEX idx_sections_type ON brief_sections(section_type);

CREATE TRIGGER update_brief_sections_updated_at BEFORE UPDATE ON brief_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ANALYTICS & TRACKING TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- retrieval_logs: Track API calls for debugging and analytics
-- ---------------------------------------------------------------------------
CREATE TABLE retrieval_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Request details
    query TEXT NOT NULL,
    provider search_provider NOT NULL,
    num_results_requested INTEGER NOT NULL,
    
    -- Response details
    results_count INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for retrieval_logs table
CREATE INDEX idx_retrieval_logs_user ON retrieval_logs(user_id, created_at DESC);
CREATE INDEX idx_retrieval_logs_provider ON retrieval_logs(provider, created_at DESC);
CREATE INDEX idx_retrieval_logs_errors ON retrieval_logs(created_at DESC) 
    WHERE error_message IS NOT NULL;

-- ---------------------------------------------------------------------------
-- user_preferences: Store user search preferences and interests
-- ---------------------------------------------------------------------------
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Interests and topics
    interests TEXT[] DEFAULT '{}',  -- ["LLMs", "AI Safety", "RAG"]
    content_types TEXT[] DEFAULT '{}',  -- ["News", "Research"]
    preferred_sources TEXT[] DEFAULT '{}',  -- ["techcrunch.com", "arxiv.org"]
    excluded_sources TEXT[] DEFAULT '{}',  -- Domains to exclude
    
    -- Search parameters
    search_recency_days INTEGER DEFAULT 7,
    max_results_per_day INTEGER DEFAULT 15,
    
    -- Notification preferences
    daily_brief_time TIME DEFAULT '06:00:00',  -- When to generate brief
    enable_email_notifications BOOLEAN DEFAULT FALSE,
    
    -- Customization
    custom_queries JSONB DEFAULT '[]'::jsonb,  -- Advanced search queries
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- v_user_stats: User engagement statistics
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_user_stats AS
SELECT 
    user_id,
    COUNT(DISTINCT DATE(added_to_brief_at)) AS days_active,
    COUNT(*) AS total_stories,
    COUNT(*) FILTER (WHERE is_read) AS stories_read,
    COUNT(*) FILTER (WHERE is_saved) AS stories_saved,
    AVG(user_rating) FILTER (WHERE user_rating IS NOT NULL) AS avg_rating,
    COUNT(DISTINCT source_domain) AS unique_sources,
    (
        SELECT ARRAY_AGG(DISTINCT topic)
        FROM (
            SELECT unnest(ai_tags) AS topic
            FROM stories s2
            WHERE s2.user_id = stories.user_id
                AND s2.ai_tags IS NOT NULL
        ) topics
    ) AS all_topics,
    MAX(added_to_brief_at) AS last_activity
FROM stories
GROUP BY user_id;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- update_brief_stats: Update daily brief statistics
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_brief_stats(brief_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE daily_briefs
    SET 
        total_items = (
            SELECT COUNT(*)
            FROM stories s
            JOIN brief_sections bs ON bs.daily_brief_id = brief_id_param
            WHERE s.id = ANY(bs.story_ids)
                AND s.user_id = daily_briefs.user_id
        ),
        read_count = (
            SELECT COUNT(*)
            FROM stories s
            JOIN brief_sections bs ON bs.daily_brief_id = brief_id_param
            WHERE s.id = ANY(bs.story_ids)
                AND s.user_id = daily_briefs.user_id
                AND s.is_read = TRUE
        ),
        saved_count = (
            SELECT COUNT(*)
            FROM stories s
            JOIN brief_sections bs ON bs.daily_brief_id = brief_id_param
            WHERE s.id = ANY(bs.story_ids)
                AND s.user_id = daily_briefs.user_id
                AND s.is_saved = TRUE
        ),
        top_topics = (
            SELECT ARRAY_AGG(DISTINCT topic)
            FROM (
                SELECT unnest(ai_tags) AS topic
                FROM stories s
                JOIN brief_sections bs ON bs.daily_brief_id = brief_id_param
                WHERE s.id = ANY(bs.story_ids)
                    AND s.user_id = daily_briefs.user_id
                    AND ai_tags IS NOT NULL
                LIMIT 10
            ) topics
        ),
        top_sources = (
            SELECT ARRAY_AGG(DISTINCT source_display_name ORDER BY COUNT(*) DESC)
            FROM stories s
            JOIN brief_sections bs ON bs.daily_brief_id = brief_id_param
            WHERE s.id = ANY(bs.story_ids)
                AND s.user_id = daily_briefs.user_id
            GROUP BY source_display_name
            LIMIT 5
        )
    WHERE id = brief_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE brief_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE retrieval_logs ENABLE ROW LEVEL SECURITY;

-- Stories: Users can only see their own stories
CREATE POLICY "Users can view their own stories"
    ON stories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stories"
    ON stories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories"
    ON stories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
    ON stories FOR DELETE
    USING (auth.uid() = user_id);

-- Daily briefs: Users can only see their own briefs
CREATE POLICY "Users can view their own briefs"
    ON daily_briefs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own briefs"
    ON daily_briefs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own briefs"
    ON daily_briefs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own briefs"
    ON daily_briefs FOR DELETE
    USING (auth.uid() = user_id);

-- Brief sections: Users can only see sections from their briefs
CREATE POLICY "Users can view their brief sections"
    ON brief_sections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM daily_briefs
            WHERE daily_briefs.id = brief_sections.daily_brief_id
                AND daily_briefs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their brief sections"
    ON brief_sections FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM daily_briefs
            WHERE daily_briefs.id = brief_sections.daily_brief_id
                AND daily_briefs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their brief sections"
    ON brief_sections FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM daily_briefs
            WHERE daily_briefs.id = brief_sections.daily_brief_id
                AND daily_briefs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their brief sections"
    ON brief_sections FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM daily_briefs
            WHERE daily_briefs.id = brief_sections.daily_brief_id
                AND daily_briefs.user_id = auth.uid()
        )
    );

-- User preferences: Users can only see/modify their own preferences
CREATE POLICY "Users can view their own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- Retrieval logs: Users can only see their own logs
CREATE POLICY "Users can view their own retrieval logs"
    ON retrieval_logs FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE stories IS 'Individual content items after API retrieval, normalization, ranking, and AI enrichment';
COMMENT ON TABLE daily_briefs IS 'Top-level container for daily personalized news briefs';
COMMENT ON TABLE brief_sections IS 'Personalized groupings of stories within a daily brief';
COMMENT ON TABLE retrieval_logs IS 'Audit log of API calls for debugging and analytics';
COMMENT ON TABLE user_preferences IS 'User search preferences and customization settings';

COMMENT ON COLUMN stories.summary IS '1-2 sentence summary for dashboard cards';
COMMENT ON COLUMN stories.ai_tags IS 'AI-generated topic tags like ["LLMs", "Claude", "Reasoning"]';
COMMENT ON COLUMN stories.final_score IS 'Combined ranking score (0-100) from heuristics';
COMMENT ON COLUMN brief_sections.section_type IS 'Type of section: "interest-based", "trending", "recommended"';
COMMENT ON COLUMN daily_briefs.section_ids IS 'Ordered list of BriefSection IDs (denormalized for fast reads)';
COMMENT ON COLUMN daily_briefs.engagement_score IS 'Calculated engagement metric based on reads, saves, ratings';
COMMENT ON COLUMN daily_briefs.whats_next IS 'AI-generated action items and priorities synthesized from daily stories';

-- ============================================================================
-- SAMPLE DATA (Optional - for development/testing)
-- ============================================================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO user_preferences (user_id, interests, content_types)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 
     ARRAY['LLMs', 'AI Safety', 'RAG'], 
     ARRAY['News', 'Research']);
*/