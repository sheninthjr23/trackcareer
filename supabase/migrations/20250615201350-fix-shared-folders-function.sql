
-- Fix the get_shared_folders_for_user function to return the correct shared_by_email
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
DECLARE
  current_user_email TEXT;
BEGIN
  -- Get the current user's email from auth.jwt()
  current_user_email := auth.jwt() ->> 'email';
  
  RETURN QUERY
  SELECT 
    cf.id as folder_id,
    cf.name as folder_name,
    -- Get the email of the user who shared the folder by joining with profiles
    -- Since we can't access auth.users, we'll use a subquery to get the email from profiles
    (SELECT email FROM auth.users WHERE id = fs.shared_by LIMIT 1) as shared_by_email,
    fs.permission_level,
    fs.created_at as shared_at
  FROM public.folder_shares fs
  JOIN public.course_folders cf ON cf.id = fs.folder_id
  WHERE fs.shared_with_email = current_user_email
    AND fs.is_active = true
    AND (fs.expires_at IS NULL OR fs.expires_at > now());
END;
$$;
