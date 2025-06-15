
-- Fix the get_folder_shares function to resolve ambiguous column reference
CREATE OR REPLACE FUNCTION public.get_folder_shares(folder_uuid UUID)
RETURNS TABLE (
  id UUID,
  shared_with_email TEXT,
  permission_level TEXT,
  is_active BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns the folder
  IF NOT EXISTS (
    SELECT 1 FROM public.course_folders 
    WHERE course_folders.id = folder_uuid AND course_folders.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    folder_shares.id,
    folder_shares.shared_with_email,
    folder_shares.permission_level,
    folder_shares.is_active,
    folder_shares.expires_at,
    folder_shares.created_at
  FROM public.folder_shares
  WHERE folder_shares.folder_id = folder_uuid
  ORDER BY folder_shares.created_at DESC;
END;
$$;

-- Also fix the get_shared_folders_for_user function to properly return shared_by_email
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
    -- Get the email of the user who shared the folder
    (SELECT email FROM auth.users WHERE auth.users.id = fs.shared_by LIMIT 1) as shared_by_email,
    fs.permission_level,
    fs.created_at as shared_at
  FROM public.folder_shares fs
  JOIN public.course_folders cf ON cf.id = fs.folder_id
  WHERE fs.shared_with_email = current_user_email
    AND fs.is_active = true
    AND (fs.expires_at IS NULL OR fs.expires_at > now());
END;
$$;
