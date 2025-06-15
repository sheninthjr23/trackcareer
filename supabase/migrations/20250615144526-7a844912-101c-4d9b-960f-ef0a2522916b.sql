
-- Create the resumes storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on tables if not already enabled
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_folders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them consistently
DROP POLICY IF EXISTS "Users can view their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can insert their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Public access to shared resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can manage their own resume folders" ON public.resume_folders;

-- Create RLS policies for the resumes table
CREATE POLICY "Users can view their own resumes" 
ON public.resumes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resumes" 
ON public.resumes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes" 
ON public.resumes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes" 
ON public.resumes FOR DELETE 
USING (auth.uid() = user_id);

-- Allow public access to shared resumes
CREATE POLICY "Public access to shared resumes" 
ON public.resumes FOR SELECT 
USING (shareable_token IS NOT NULL AND shareable_expiry > now());

-- Create RLS policies for the resume_folders table
CREATE POLICY "Users can manage their own resume folders" 
ON public.resume_folders FOR ALL 
USING (auth.uid() = user_id);
