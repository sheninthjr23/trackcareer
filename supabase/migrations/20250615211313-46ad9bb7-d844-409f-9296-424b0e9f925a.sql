
-- First, let's check and fix the RLS policies for shared folder access

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view folders shared with them via email" ON public.course_folders;
DROP POLICY IF EXISTS "Users can view elements in folders shared with them" ON public.course_elements;
DROP POLICY IF EXISTS "Users can view their own folders" ON public.course_folders;
DROP POLICY IF EXISTS "Users can view their own course elements" ON public.course_elements;

-- Enable RLS on both tables
ALTER TABLE public.course_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_elements ENABLE ROW LEVEL SECURITY;

-- Create policies for course_folders
CREATE POLICY "Users can manage their own folders" 
  ON public.course_folders 
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Users can view folders shared with them" 
  ON public.course_folders 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.folder_shares fs
      WHERE fs.folder_id = course_folders.id 
        AND fs.shared_with_email = (auth.jwt() ->> 'email')
        AND fs.is_active = true
        AND (fs.expires_at IS NULL OR fs.expires_at > now())
    )
  );

-- Create policies for course_elements  
CREATE POLICY "Users can manage their own course elements" 
  ON public.course_elements 
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Users can view elements in shared folders" 
  ON public.course_elements 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.folder_shares fs
      WHERE fs.folder_id = course_elements.folder_id 
        AND fs.shared_with_email = (auth.jwt() ->> 'email')
        AND fs.is_active = true
        AND (fs.expires_at IS NULL OR fs.expires_at > now())
    )
  );

-- Also ensure folder_shares table has proper RLS
ALTER TABLE public.folder_shares ENABLE ROW LEVEL SECURITY;

-- Allow users to view shares they created or are recipients of
CREATE POLICY "Users can view their folder shares" 
  ON public.folder_shares 
  FOR ALL 
  USING (
    shared_by = auth.uid() OR 
    shared_with_email = (auth.jwt() ->> 'email')
  );
