-- DISABLE RLS ON MODULES AND LESSONS FOR MVP
-- This allows all authenticated users to manage content
-- Re-enable with proper policies for production

ALTER TABLE public.modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;
