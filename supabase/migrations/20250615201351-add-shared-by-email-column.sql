
-- Add shared_by_email column to folder_shares table for easier access
ALTER TABLE public.folder_shares ADD COLUMN IF NOT EXISTS shared_by_email TEXT;

-- Update the get_shared_folders_for_user function to use the new column
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
    fs.shared_by_email,
    fs.permission_level,
    fs.created_at as shared_at
  FROM public.folder_shares fs
  JOIN public.course_folders cf ON cf.id = fs.folder_id
  WHERE fs.shared_with_email = current_user_email
    AND fs.is_active = true
    AND (fs.expires_at IS NULL OR fs.expires_at > now());
END;
$$;

-- Create a trigger to automatically populate shared_by_email when a new share is created
CREATE OR REPLACE FUNCTION public.populate_shared_by_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the email of the user who is sharing
  NEW.shared_by_email := (SELECT email FROM auth.users WHERE id = NEW.shared_by LIMIT 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS populate_shared_by_email_trigger ON public.folder_shares;
CREATE TRIGGER populate_shared_by_email_trigger
  BEFORE INSERT ON public.folder_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_shared_by_email();
