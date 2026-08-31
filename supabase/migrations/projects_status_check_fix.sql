
-- 1. Drop existing restrictive check constraint on projects.status if it exists
ALTER TABLE IF EXISTS public.projects 
  DROP CONSTRAINT IF EXISTS projects_status_check;

-- 2. Add updated check constraint to allow Draft, Published, Planning, In Progress, Active, Completed
ALTER TABLE IF EXISTS public.projects
  ADD CONSTRAINT projects_status_check 
  CHECK (status IN ('Draft', 'Published', 'Planning', 'In Progress', 'Active', 'Completed', 'Archived'));

-- 3. Ensure RLS permissions for public/anon/authenticated roles
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public insert projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public update projects" ON public.projects;

CREATE POLICY "Allow public select projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update projects" ON public.projects FOR UPDATE USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.projects TO anon, authenticated, public;
GRANT ALL ON TABLE public.projects TO service_role;
