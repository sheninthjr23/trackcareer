
-- Drop existing storage policies to recreate them properly
DROP POLICY IF EXISTS "Users can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Public access to shared resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own resumes" ON storage.objects;

-- Allow authenticated users to upload their own resumes
CREATE POLICY "Users can upload resumes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own resumes
CREATE POLICY "Users can view own resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to shared resumes - this is the key fix
CREATE POLICY "Public access to shared resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM public.resumes 
    WHERE resumes.file_path = objects.name 
    AND resumes.shareable_token IS NOT NULL 
    AND resumes.shareable_expiry > now()
  )
);

-- Allow users to delete their own resumes
CREATE POLICY "Users can delete own resumes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
