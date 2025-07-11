
-- Add columns to dsa_problems table for code storage and YouTube links
ALTER TABLE public.dsa_problems 
ADD COLUMN code_solutions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN youtube_link TEXT,
ADD COLUMN is_live_problem BOOLEAN DEFAULT false,
ADD COLUMN live_added_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on live problems
CREATE INDEX idx_dsa_problems_live ON public.dsa_problems (user_id, is_live_problem, live_added_at) WHERE is_live_problem = true;

-- Create index for completion order
CREATE INDEX idx_dsa_problems_completed_at ON public.dsa_problems (user_id, completed_at DESC) WHERE is_completed = true;
