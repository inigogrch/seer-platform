-- ============================================================================
-- COMPLETE WAITLIST TABLE SETUP FOR SUPABASE
-- Run this entire script in Supabase SQL Editor
-- ============================================================================

-- Drop existing table if you want to start fresh (CAREFUL - this deletes data!)
-- DROP TABLE IF EXISTS public.waitlist_emails CASCADE;

-- 1) Create the waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist_emails (
  id           BIGSERIAL PRIMARY KEY,
  email        TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta         JSONB  -- Optional metadata (UTM params, referrer, etc.)
);

-- 2) Add email format check (FIXED - simpler regex that actually works)
-- Remove old constraint if it exists
ALTER TABLE public.waitlist_emails 
  DROP CONSTRAINT IF EXISTS waitlist_emails_email_format_chk;

-- Add new working constraint
ALTER TABLE public.waitlist_emails
  ADD CONSTRAINT waitlist_emails_email_format_chk
  CHECK (
    -- no spaces, exactly one "@", at least one dot after "@"
    email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    AND length(email) <= 320  -- RFC max length (practical guard)
  );

-- 3) Enforce one signup per email (case-insensitive)
DROP INDEX IF EXISTS ux_waitlist_emails_email_nocase;
CREATE UNIQUE INDEX ux_waitlist_emails_email_nocase
  ON public.waitlist_emails (LOWER(email));

-- 4) Index for sorting by date
DROP INDEX IF EXISTS idx_waitlist_emails_created_at;
CREATE INDEX idx_waitlist_emails_created_at
  ON public.waitlist_emails (created_at DESC);

-- 5) Enable Row Level Security
ALTER TABLE public.waitlist_emails ENABLE ROW LEVEL SECURITY;

-- 6) Drop existing policies
DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.waitlist_emails;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.waitlist_emails;
DROP POLICY IF EXISTS "Enable select for service role" ON public.waitlist_emails;
DROP POLICY IF EXISTS "Service role full access" ON public.waitlist_emails;

-- 7) Create policy for service_role (your API route uses this)
-- Service role bypasses RLS by default, but we'll be explicit
CREATE POLICY "Service role full access"
  ON public.waitlist_emails
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 8) Optional: Allow anonymous users to insert directly (if you want client-side inserts)
-- Uncomment if you want to allow direct client-side submissions:
CREATE POLICY "Anyone can join the waitlist"
  ON public.waitlist_emails
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 9) Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.waitlist_emails TO service_role;
-- Only grant INSERT to anon if you uncommented the policy above:
GRANT INSERT ON public.waitlist_emails TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.waitlist_emails_id_seq TO anon, authenticated;

-- 10) Grant sequence usage (needed for BIGSERIAL)
GRANT USAGE, SELECT ON SEQUENCE public.waitlist_emails_id_seq TO service_role;

