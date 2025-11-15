-- Create options cache table for storing generated onboarding options
CREATE TABLE IF NOT EXISTS options_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  step TEXT NOT NULL,
  role TEXT,
  industry TEXT,
  options JSONB NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on cache_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_options_cache_key ON options_cache(cache_key);

-- Create index on step for analytics
CREATE INDEX IF NOT EXISTS idx_options_cache_step ON options_cache(step);

-- Create index on last_used_at for potential cache eviction
CREATE INDEX IF NOT EXISTS idx_options_cache_last_used ON options_cache(last_used_at);

-- Add comment
COMMENT ON TABLE options_cache IS 'Caches AI-generated options for onboarding questions to reduce LLM costs';

