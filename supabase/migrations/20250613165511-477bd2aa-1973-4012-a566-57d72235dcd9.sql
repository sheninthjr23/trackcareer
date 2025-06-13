
-- Add support for nested folders in existing tables by updating foreign key constraints
ALTER TABLE public.doubt_folders 
ADD CONSTRAINT fk_doubt_folders_parent 
FOREIGN KEY (parent_folder_id) REFERENCES public.doubt_folders(id) ON DELETE CASCADE;

ALTER TABLE public.course_folders 
ADD CONSTRAINT fk_course_folders_parent 
FOREIGN KEY (parent_folder_id) REFERENCES public.course_folders(id) ON DELETE CASCADE;

-- Create tables for the Youtube section
CREATE TABLE public.youtube_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.youtube_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.youtube_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id UUID NOT NULL REFERENCES public.youtube_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  youtube_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.youtube_todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id UUID NOT NULL REFERENCES public.youtube_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for Youtube tables
ALTER TABLE public.youtube_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_todos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for youtube_folders
CREATE POLICY "Users can view their own youtube folders" 
  ON public.youtube_folders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own youtube folders" 
  ON public.youtube_folders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own youtube folders" 
  ON public.youtube_folders 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own youtube folders" 
  ON public.youtube_folders 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for youtube_videos
CREATE POLICY "Users can view their own youtube videos" 
  ON public.youtube_videos 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own youtube videos" 
  ON public.youtube_videos 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own youtube videos" 
  ON public.youtube_videos 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own youtube videos" 
  ON public.youtube_videos 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for youtube_todos
CREATE POLICY "Users can view their own youtube todos" 
  ON public.youtube_todos 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own youtube todos" 
  ON public.youtube_todos 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own youtube todos" 
  ON public.youtube_todos 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own youtube todos" 
  ON public.youtube_todos 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_youtube_folders_user_id ON public.youtube_folders(user_id);
CREATE INDEX idx_youtube_folders_parent_folder_id ON public.youtube_folders(parent_folder_id);
CREATE INDEX idx_youtube_videos_user_id ON public.youtube_videos(user_id);
CREATE INDEX idx_youtube_videos_folder_id ON public.youtube_videos(folder_id);
CREATE INDEX idx_youtube_todos_user_id ON public.youtube_todos(user_id);
CREATE INDEX idx_youtube_todos_folder_id ON public.youtube_todos(folder_id);
