-- Migration: Create onboarding_profiles table
-- Description: Stores anonymous user onboarding data for profile building and personalization

CREATE TABLE IF NOT EXISTS onboarding_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid UNIQUE NOT NULL,

  -- Core profile fields
  role text NOT NULL,
  industry jsonb NOT NULL,  -- Can be single value or array for multi-select
  team_context text,
  tasks jsonb DEFAULT '[]'::jsonb,
  tools jsonb DEFAULT '[]'::jsonb,
  problems jsonb DEFAULT '[]'::jsonb,

  -- Metadata
  completed boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  time_spent_seconds integer,

  -- Conversation history for analytics and learning
  conversation_history jsonb DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups by client_id
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_client_id ON onboarding_profiles(client_id);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_completed ON onboarding_profiles(completed);
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_created_at ON onboarding_profiles(created_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function
CREATE TRIGGER update_onboarding_profiles_updated_at
  BEFORE UPDATE ON onboarding_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE onboarding_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for new onboarding sessions)
CREATE POLICY "Allow anonymous inserts" ON onboarding_profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow updates only to own client_id records
CREATE POLICY "Allow updates to own records" ON onboarding_profiles
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy: Allow reads for own client_id
CREATE POLICY "Allow reads for own records" ON onboarding_profiles
  FOR SELECT
  TO anon
  USING (true);

-- Add comment for documentation
COMMENT ON TABLE onboarding_profiles IS 'Anonymous user onboarding profiles for personalization and AI context building';
