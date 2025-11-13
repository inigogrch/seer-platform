-- Migration: Add section_ids column to daily_briefs table
-- This column stores the ordered list of section IDs for denormalized reads
--
-- Run this migration if you already applied schema.sql without section_ids

ALTER TABLE daily_briefs 
ADD COLUMN IF NOT EXISTS section_ids UUID[] DEFAULT '{}';

-- Add index for section_ids queries
CREATE INDEX IF NOT EXISTS idx_briefs_section_ids ON daily_briefs USING GIN(section_ids);

-- Add comment
COMMENT ON COLUMN daily_briefs.section_ids IS 'Ordered list of BriefSection IDs (denormalized for fast reads)';

