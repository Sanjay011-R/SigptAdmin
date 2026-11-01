-- ===============================================================
-- SUPABASE MIGRATION: ADD LINKEDIN POST STATUS & ERROR TRACKING
-- Run in Supabase SQL Editor to support Make.com webhook responses
-- ===============================================================

ALTER TABLE IF EXISTS public.job_requirements 
ADD COLUMN IF NOT EXISTS linkedin_post_status TEXT DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS linkedin_error_message TEXT,
ADD COLUMN IF NOT EXISTS linkedin_posted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS linkedin_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure permissions for service_role, authenticated, and anon
GRANT ALL ON TABLE public.job_requirements TO anon, authenticated, public, service_role;
