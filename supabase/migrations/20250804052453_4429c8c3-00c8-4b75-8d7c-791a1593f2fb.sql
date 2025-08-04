-- Create story categories table
CREATE TABLE public.story_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  category_id UUID REFERENCES public.story_categories(id),
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story versions table for version control
CREATE TABLE public.story_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  version_number BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story views table for analytics
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.story_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for story_categories (public read, admin write)
CREATE POLICY "Anyone can view story categories" ON public.story_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create categories" ON public.story_categories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update categories" ON public.story_categories FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for stories
CREATE POLICY "Users can create their own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own stories" ON public.stories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own stories" ON public.stories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for story_versions
CREATE POLICY "Users can manage versions of their stories" ON public.story_versions FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.stories WHERE id = story_versions.story_id)
);

-- Create RLS policies for story_views
CREATE POLICY "Users can view analytics of their stories" ON public.story_views FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM public.stories WHERE id = story_views.story_id)
);
CREATE POLICY "Anyone can create story views" ON public.story_views FOR INSERT WITH CHECK (true);

-- Insert default categories
INSERT INTO public.story_categories (name, description, color) VALUES
('Personal', 'Personal stories and experiences', '#10b981'),
('Fiction', 'Creative fiction stories', '#8b5cf6'),
('Non-Fiction', 'Educational and informational content', '#f59e0b'),
('Technical', 'Technical tutorials and guides', '#06b6d4'),
('Business', 'Business-related content', '#ef4444');

-- Create trigger for auto-updating timestamps
CREATE OR REPLACE FUNCTION public.update_story_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_story_updated_at();

CREATE TRIGGER update_story_categories_updated_at
  BEFORE UPDATE ON public.story_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_story_updated_at();