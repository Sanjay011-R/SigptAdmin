-- ===============================================================
-- SUPABASE MIGRATION: FIX CANDIDATE APPLICATIONS UPDATE RLS & POLICIES
-- Run this script in the Supabase SQL Editor for project `iknzewadfkudstompjqp`
-- ===============================================================

-- 1. Enable RLS on candidate_applications
ALTER TABLE IF EXISTS candidate_applications ENABLE ROW LEVEL SECURITY;

-- 2. Drop any previous conflicting RLS policies for update/select/insert
DROP POLICY IF EXISTS "Allow public update candidate_applications" ON candidate_applications;
DROP POLICY IF EXISTS "Allow public select candidate_applications" ON candidate_applications;
DROP POLICY IF EXISTS "Allow public insert candidate_applications" ON candidate_applications;

-- 3. Create permissive policies for anon/public/authenticated users
CREATE POLICY "Allow public select candidate_applications" 
  ON candidate_applications FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert candidate_applications" 
  ON candidate_applications FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update candidate_applications" 
  ON candidate_applications FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

-- 4. Grant table privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidate_applications TO anon, authenticated, public;
GRANT ALL ON TABLE public.candidate_applications TO service_role;

-- 5. Create RPC function with SECURITY DEFINER to guarantee status updates work
CREATE OR REPLACE FUNCTION update_candidate_application_status(p_app_id text, p_status text)
RETURNS jsonb AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE candidate_applications
  SET status = p_status
  WHERE id::text = p_app_id OR req_id = p_app_id OR email = p_app_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'updated_rows', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_candidate_application_status(text, text) TO anon, authenticated, public, service_role;
