
-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);

-- Create resume folders table
CREATE TABLE public.resume_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.resume_folders,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resumes table
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  folder_id UUID REFERENCES public.resume_folders,
  original_filename TEXT NOT NULL,
  custom_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  upload_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shareable_token TEXT UNIQUE,
  shareable_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  course_link TEXT,
  github_link TEXT,
  provider_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('In Progress', 'Completed')) DEFAULT 'In Progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL,
  start_date DATE NOT NULL,
  predicted_end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('In Progress', 'Completed', 'Overdue')) DEFAULT 'In Progress',
  completed_manually BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT,
  ctc TEXT,
  date_applied DATE NOT NULL,
  total_rounds INTEGER,
  rounds_passed INTEGER DEFAULT 0,
  next_round_date DATE,
  status TEXT NOT NULL CHECK (status IN ('In Progress', 'Shortlisted', 'Rejected', 'Accepted')) DEFAULT 'In Progress',
  initial_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create application updates table
CREATE TABLE public.application_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.job_applications ON DELETE CASCADE NOT NULL,
  update_type TEXT NOT NULL,
  details TEXT NOT NULL,
  update_date DATE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for resume folders
CREATE POLICY "Users can view their own folders" ON public.resume_folders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own folders" ON public.resume_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own folders" ON public.resume_folders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own folders" ON public.resume_folders
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for resumes
CREATE POLICY "Users can view their own resumes" ON public.resumes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own resumes" ON public.resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resumes" ON public.resumes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resumes" ON public.resumes
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public can view shared resumes" ON public.resumes
  FOR SELECT USING (
    shareable_token IS NOT NULL 
    AND shareable_expiry > now()
  );

-- Create RLS policies for courses
CREATE POLICY "Users can view their own courses" ON public.courses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own courses" ON public.courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own courses" ON public.courses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own courses" ON public.courses
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for activities
CREATE POLICY "Users can view their own activities" ON public.activities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own activities" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activities" ON public.activities
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own activities" ON public.activities
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for job applications
CREATE POLICY "Users can view their own job applications" ON public.job_applications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own job applications" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own job applications" ON public.job_applications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own job applications" ON public.job_applications
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for application updates
CREATE POLICY "Users can view updates for their applications" ON public.application_updates
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = application_updates.application_id
    )
  );
CREATE POLICY "Users can create updates for their applications" ON public.application_updates
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = application_updates.application_id
    )
  );
CREATE POLICY "Users can update their application updates" ON public.application_updates
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = application_updates.application_id
    )
  );
CREATE POLICY "Users can delete their application updates" ON public.application_updates
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = application_updates.application_id
    )
  );

-- Create storage policies for resumes bucket
CREATE POLICY "Users can upload their own resumes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own resumes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own resumes" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own resumes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'username', new.email)
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update activity status based on dates
CREATE OR REPLACE FUNCTION public.update_activity_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only update if not manually completed
  IF NOT NEW.completed_manually THEN
    IF CURRENT_DATE > NEW.predicted_end_date THEN
      NEW.status = 'Overdue';
    ELSE
      NEW.status = 'In Progress';
    END IF;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to auto-update activity status
CREATE OR REPLACE TRIGGER update_activity_status_trigger
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_activity_status();

-- Function to auto-update rounds_passed and other fields based on application updates
CREATE OR REPLACE FUNCTION public.handle_application_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update job application based on update type
  IF NEW.update_type = 'Round Passed' THEN
    UPDATE public.job_applications 
    SET rounds_passed = rounds_passed + 1,
        updated_at = now()
    WHERE id = NEW.application_id;
  ELSIF NEW.update_type = 'Interview Scheduled' AND NEW.update_date IS NOT NULL THEN
    UPDATE public.job_applications 
    SET next_round_date = NEW.update_date,
        updated_at = now()
    WHERE id = NEW.application_id;
  ELSIF NEW.update_type = 'Status Change' THEN
    -- Extract status from details if provided in a specific format
    -- This could be enhanced based on your needs
    UPDATE public.job_applications 
    SET updated_at = now()
    WHERE id = NEW.application_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for application updates
CREATE OR REPLACE TRIGGER handle_application_update_trigger
  AFTER INSERT ON public.application_updates
  FOR EACH ROW EXECUTE FUNCTION public.handle_application_update();
