
-- Table pour les logs d'exécution de l'autopilot IA
CREATE TABLE public.ai_autopilot_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_type TEXT NOT NULL DEFAULT 'daily_content', -- daily_content, trend_analysis, performance_review
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  trend_topic TEXT,
  trend_sources JSONB DEFAULT '[]'::jsonb,
  article_id UUID REFERENCES public.blog_posts(id),
  social_posts_generated INTEGER DEFAULT 0,
  error_message TEXT,
  ai_model TEXT DEFAULT 'google/gemini-3-flash-preview',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_autopilot_runs ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage autopilot runs
CREATE POLICY "Super admins manage autopilot runs"
ON public.ai_autopilot_runs
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Add autopilot_enabled to social_publishing_settings if not exists
ALTER TABLE public.social_publishing_settings 
ADD COLUMN IF NOT EXISTS autopilot_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS autopilot_frequency TEXT DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS autopilot_topics TEXT[] DEFAULT ARRAY['EdTech', 'Formation professionnelle', 'SaaS éducation', 'Digital learning'],
ADD COLUMN IF NOT EXISTS autopilot_tone TEXT DEFAULT 'professionnel',
ADD COLUMN IF NOT EXISTS autopilot_last_run TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS emergency_stop BOOLEAN DEFAULT false;
