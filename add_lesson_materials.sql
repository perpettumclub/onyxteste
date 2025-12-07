-- Create lesson_materials table
CREATE TABLE IF NOT EXISTS public.lesson_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'PDF' CHECK (file_type IN ('PDF', 'LINK', 'DOWNLOAD')),
  order_index INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable RLS for MVP (consistent with modules/lessons)
ALTER TABLE public.lesson_materials DISABLE ROW LEVEL SECURITY;
