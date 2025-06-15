
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
    WHERE id = folder_uuid AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    fs.id,
    fs.shared_with_email,
    fs.permission_level,
    fs.is_active,
    fs.expires_at,
    fs.created_at
  FROM public.folder_shares fs
  WHERE fs.folder_id = folder_uuid
  ORDER BY fs.created_at DESC;
END;
$$;
