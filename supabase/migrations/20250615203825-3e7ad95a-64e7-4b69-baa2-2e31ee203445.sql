
-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view folders shared with them via email" ON public.course_folders;
DROP POLICY IF EXISTS "Users can view elements in folders shared with them" ON public.course_elements;
DROP POLICY IF EXISTS "Users can view their own folders" ON public.course_folders;
DROP POLICY IF EXISTS "Users can view their own course elements" ON public.course_elements;

-- Fix the get_shared_folders_for_user function to avoid auth.users permission issues
CREATE OR REPLACE FUNCTION public.get_shared_folders_for_user()
RETURNS TABLE (
  folder_id UUID,
  folder_name TEXT,
  shared_by_email TEXT,
  permission_level TEXT,
  shared_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get the current user's email from auth.jwt()
  RETURN QUERY
  SELECT 
    cf.id as folder_id,
    cf.name as folder_name,
    fs.shared_with_email as shared_by_email, -- We'll use a workaround since we can't access auth.users
    fs.permission_level,
    fs.created_at as shared_at
  FROM public.folder_shares fs
  JOIN public.course_folders cf ON cf.id = fs.folder_id
  WHERE fs.shared_with_email = (auth.jwt() ->> 'email')
    AND fs.is_active = true
    AND (fs.expires_at IS NULL OR fs.expires_at > now());
END;
$$;

-- Enable RLS on course_folders and course_elements if not already enabled
ALTER TABLE public.course_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_elements ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies for course_folders and course_elements for owners
CREATE POLICY "Users can view their own folders" 
  ON public.course_folders 
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own course elements" 
  ON public.course_elements 
  FOR ALL 
  USING (user_id = auth.uid());

-- Add RLS policies for course_folders and course_elements to work with shared folders
CREATE POLICY "Users can view folders shared with them via email" 
  ON public.course_folders 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.folder_shares fs
      WHERE fs.folder_id = course_folders.id 
        AND fs.shared_with_email = (auth.jwt() ->> 'email')
        AND fs.is_active = true
        AND (fs.expires_at IS NULL OR fs.expires_at > now())
    )
  );

-- Add RLS policy for course_elements to access shared content
CREATE POLICY "Users can view elements in folders shared with them" 
  ON public.course_elements 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.folder_shares fs
      WHERE fs.folder_id = course_elements.folder_id 
        AND fs.shared_with_email = (auth.jwt() ->> 'email')
        AND fs.is_active = true
        AND (fs.expires_at IS NULL OR fs.expires_at > now())
    )
  );
