
-- Create storage policies for the resumes bucket

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

-- Allow public access to shared resumes (we'll handle expiry in the application)
CREATE POLICY "Public access to shared resumes" ON storage.objects
FOR SELECT USING (bucket_id = 'resumes');

-- Allow users to delete their own resumes
CREATE POLICY "Users can delete own resumes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
