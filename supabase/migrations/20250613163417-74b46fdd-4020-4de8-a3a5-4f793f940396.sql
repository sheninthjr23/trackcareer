
-- Create tables for the Doubt section (Personal Question & Markdown Notes Organizer)
CREATE TABLE public.doubt_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.doubt_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.doubt_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id UUID NOT NULL REFERENCES public.doubt_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  markdown_content TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tables for the Course section (Structured Video Learning Content Manager)
CREATE TABLE public.course_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.course_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.course_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id UUID NOT NULL REFERENCES public.course_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  course_order INTEGER NOT NULL DEFAULT 1,
  google_drive_link TEXT,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) for all new tables
ALTER TABLE public.doubt_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_elements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for doubt_folders
CREATE POLICY "Users can view their own doubt folders" 
  ON public.doubt_folders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own doubt folders" 
  ON public.doubt_folders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own doubt folders" 
  ON public.doubt_folders 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own doubt folders" 
  ON public.doubt_folders 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for doubt_questions
CREATE POLICY "Users can view their own doubt questions" 
  ON public.doubt_questions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own doubt questions" 
  ON public.doubt_questions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own doubt questions" 
  ON public.doubt_questions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own doubt questions" 
  ON public.doubt_questions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for course_folders
CREATE POLICY "Users can view their own course folders" 
  ON public.course_folders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own course folders" 
  ON public.course_folders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course folders" 
  ON public.course_folders 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own course folders" 
  ON public.course_folders 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for course_elements
CREATE POLICY "Users can view their own course elements" 
  ON public.course_elements 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own course elements" 
  ON public.course_elements 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course elements" 
  ON public.course_elements 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own course elements" 
  ON public.course_elements 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_doubt_folders_user_id ON public.doubt_folders(user_id);
CREATE INDEX idx_doubt_folders_parent_folder_id ON public.doubt_folders(parent_folder_id);
CREATE INDEX idx_doubt_questions_user_id ON public.doubt_questions(user_id);
CREATE INDEX idx_doubt_questions_folder_id ON public.doubt_questions(folder_id);
CREATE INDEX idx_course_folders_user_id ON public.course_folders(user_id);
CREATE INDEX idx_course_folders_parent_folder_id ON public.course_folders(parent_folder_id);
CREATE INDEX idx_course_elements_user_id ON public.course_elements(user_id);
CREATE INDEX idx_course_elements_folder_id ON public.course_elements(folder_id);
CREATE INDEX idx_course_elements_order ON public.course_elements(folder_id, course_order);
