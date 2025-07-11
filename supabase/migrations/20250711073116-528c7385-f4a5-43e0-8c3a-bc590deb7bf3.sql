
-- Add columns to track live problem todos separately from general completion
ALTER TABLE public.dsa_problems 
ADD COLUMN youtube_link text,
ADD COLUMN code_solutions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN is_live_problem boolean DEFAULT false,
ADD COLUMN live_added_at timestamp with time zone,
ADD COLUMN live_todo_completed boolean DEFAULT false,
ADD COLUMN live_todo_completed_at timestamp with time zone;

-- Create index for better performance when querying live problems
CREATE INDEX idx_dsa_problems_live ON public.dsa_problems (is_live_problem, live_todo_completed);

-- Create trigger to automatically mark problems as live problems when completed this week
CREATE OR REPLACE FUNCTION public.mark_as_live_problem()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- If problem is being marked as completed and it's not already a live problem
  IF NEW.is_completed = true AND OLD.is_completed = false AND NEW.is_live_problem = false THEN
    NEW.is_live_problem = true;
    NEW.live_added_at = now();
    NEW.live_todo_completed = false;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Attach trigger to dsa_problems table
DROP TRIGGER IF EXISTS trigger_mark_as_live_problem ON public.dsa_problems;
CREATE TRIGGER trigger_mark_as_live_problem
  BEFORE UPDATE ON public.dsa_problems
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_as_live_problem();
