
-- Create table for folder shares
CREATE TABLE public.folder_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID REFERENCES public.course_folders(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_email TEXT NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'edit')),
  share_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(folder_id, shared_with_email)
);

-- Enable RLS
ALTER TABLE public.folder_shares ENABLE ROW LEVEL SECURITY;

-- Policies for folder shares
CREATE POLICY "Users can view shares they created" 
  ON public.folder_shares 
  FOR SELECT 
  USING (auth.uid() = shared_by);

CREATE POLICY "Users can create shares for their folders" 
  ON public.folder_shares 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = shared_by AND 
    EXISTS (
      SELECT 1 FROM public.course_folders cf
      WHERE cf.id = folder_id AND cf.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own shares" 
  ON public.folder_shares 
  FOR UPDATE 
  USING (auth.uid() = shared_by);

CREATE POLICY "Users can delete their own shares" 
  ON public.folder_shares 
  FOR DELETE 
  USING (auth.uid() = shared_by);

-- Allow access to shared folders for recipients
CREATE POLICY "Users can view folders shared with them via email" 
  ON public.course_folders 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.folder_shares fs
      JOIN auth.users u ON u.email = fs.shared_with_email
      WHERE fs.folder_id = course_folders.id 
        AND u.id = auth.uid()
        AND fs.is_active = true
        AND (fs.expires_at IS NULL OR fs.expires_at > now())
    )
  );

-- Allow access to course elements in shared folders
CREATE POLICY "Users can view elements in folders shared with them" 
  ON public.course_elements 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.folder_shares fs
      JOIN auth.users u ON u.email = fs.shared_with_email
      WHERE fs.folder_id = course_elements.folder_id 
        AND u.id = auth.uid()
        AND fs.is_active = true
        AND (fs.expires_at IS NULL OR fs.expires_at > now())
    )
  );

-- Create function to get shared folders for a user
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
  RETURN QUERY
  SELECT 
    cf.id as folder_id,
    cf.name as folder_name,
    u.email as shared_by_email,
    fs.permission_level,
    fs.created_at as shared_at
  FROM public.folder_shares fs
  JOIN public.course_folders cf ON cf.id = fs.folder_id
  JOIN auth.users u ON u.id = fs.shared_by
  JOIN auth.users recipient ON recipient.email = fs.shared_with_email
  WHERE recipient.id = auth.uid()
    AND fs.is_active = true
    AND (fs.expires_at IS NULL OR fs.expires_at > now());
END;
$$;

-- Create function to get share details for a folder
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
