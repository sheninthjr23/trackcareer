
-- Create table for DSA folders (with nested support)
CREATE TABLE public.dsa_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  parent_folder_id UUID REFERENCES public.dsa_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for DSA problems
CREATE TABLE public.dsa_problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id UUID NOT NULL REFERENCES public.dsa_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  problem_link TEXT,
  topic TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Easy', 'Medium', 'Hard')),
  github_solution_link TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security for DSA folders
ALTER TABLE public.dsa_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own DSA folders" 
ON public.dsa_folders 
FOR ALL 
USING (auth.uid() = user_id);

-- Add Row Level Security for DSA problems
ALTER TABLE public.dsa_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own DSA problems" 
ON public.dsa_problems 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_dsa_folders_user_id ON public.dsa_folders(user_id);
CREATE INDEX idx_dsa_folders_parent_id ON public.dsa_folders(parent_folder_id);
CREATE INDEX idx_dsa_problems_user_id ON public.dsa_problems(user_id);
CREATE INDEX idx_dsa_problems_folder_id ON public.dsa_problems(folder_id);
CREATE INDEX idx_dsa_problems_completed_at ON public.dsa_problems(completed_at);
CREATE INDEX idx_dsa_problems_topic ON public.dsa_problems(topic);
CREATE INDEX idx_dsa_problems_level ON public.dsa_problems(level);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dsa_folders_updated_at
    BEFORE UPDATE ON public.dsa_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dsa_problems_updated_at
    BEFORE UPDATE ON public.dsa_problems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a trigger to set completed_at when is_completed changes to true
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_completed = true AND OLD.is_completed = false THEN
        NEW.completed_at = now();
    ELSIF NEW.is_completed = false THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_dsa_problems_completed_at
    BEFORE UPDATE ON public.dsa_problems
    FOR EACH ROW
    EXECUTE FUNCTION set_completed_at();
