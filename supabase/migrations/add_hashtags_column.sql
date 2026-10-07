-- ===============================================================
-- SUPABASE MIGRATION: ADD HASHTAGS COLUMN TO JOBS & PROJECTS
-- Run in Supabase SQL Editor for automatic social media hashtags
-- ===============================================================

-- 1. Add hashtags column to job_requirements
ALTER TABLE IF EXISTS public.job_requirements 
ADD COLUMN IF NOT EXISTS hashtags text;

-- 2. Add hashtags column to projects
ALTER TABLE IF EXISTS public.projects 
ADD COLUMN IF NOT EXISTS hashtags text;

-- 3. Ensure Delete & Upsert Permissions for job_requirements
ALTER TABLE IF EXISTS public.job_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select job_requirements" ON public.job_requirements;
CREATE POLICY "Allow public select job_requirements" ON public.job_requirements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert job_requirements" ON public.job_requirements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update job_requirements" ON public.job_requirements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete job_requirements" ON public.job_requirements FOR DELETE USING (true);

GRANT ALL ON TABLE public.job_requirements TO anon, authenticated, public, service_role;
