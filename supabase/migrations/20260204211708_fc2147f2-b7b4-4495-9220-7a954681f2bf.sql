-- =============================================
-- SOCIAL MEDIA PUBLISHING SYSTEM
-- Tables for OAuth connections, scheduled posts, and analytics
-- =============================================

-- Social Platform Enum
CREATE TYPE public.social_platform AS ENUM (
  'linkedin',
  'twitter',
  'facebook',
  'instagram',
  'tiktok',
  'youtube',
  'threads',
  'pinterest'
);

-- Social Post Status Enum
CREATE TYPE public.social_post_status AS ENUM (
  'draft',
  'scheduled',
  'publishing',
  'published',
  'failed',
  'cancelled'
);

-- =============================================
-- 1. SOCIAL MEDIA CONNECTIONS (OAuth Storage)
-- =============================================
CREATE TABLE public.social_media_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform social_platform NOT NULL,
  account_name TEXT,
  account_id TEXT,
  page_id TEXT,
  channel_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  permissions_scope TEXT[],
  connection_status TEXT NOT NULL DEFAULT 'disconnected',
  last_connected_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(platform)
);

-- Enable RLS
ALTER TABLE public.social_media_connections ENABLE ROW LEVEL SECURITY;

-- Only Super Admins can manage social connections
CREATE POLICY "Super admins manage social connections"
ON public.social_media_connections
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- =============================================
-- 2. SOCIAL POSTS (Scheduled & Published)
-- =============================================
CREATE TABLE public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  platform social_platform NOT NULL,
  status social_post_status NOT NULL DEFAULT 'draft',
  caption TEXT NOT NULL,
  hashtags TEXT[],
  media_urls TEXT[],
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  external_post_id TEXT,
  external_post_url TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  ai_generated BOOLEAN DEFAULT false,
  auto_published BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- Super Admins can manage social posts
CREATE POLICY "Super admins manage social posts"
ON public.social_posts
FOR ALL
USING (is_super_admin() OR can_manage_blog())
WITH CHECK (is_super_admin() OR can_manage_blog());

-- =============================================
-- 3. SOCIAL ANALYTICS (Performance Tracking)
-- =============================================
CREATE TABLE public.social_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE NOT NULL,
  platform social_platform NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  watch_time_seconds INTEGER,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_analytics ENABLE ROW LEVEL SECURITY;

-- Analytics viewable by those who can manage blog
CREATE POLICY "Blog managers view social analytics"
ON public.social_analytics
FOR SELECT
USING (is_super_admin() OR can_manage_blog() OR has_platform_role(auth.uid(), 'analytics_viewer'));

-- Only system can insert analytics
CREATE POLICY "System inserts social analytics"
ON public.social_analytics
FOR INSERT
WITH CHECK (is_super_admin());

-- =============================================
-- 4. SOCIAL PUBLISHING SETTINGS
-- =============================================
CREATE TABLE public.social_publishing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_publish_enabled BOOLEAN DEFAULT false,
  auto_publish_platforms social_platform[] DEFAULT '{}',
  require_approval BOOLEAN DEFAULT true,
  brand_tone TEXT DEFAULT 'professional',
  forbidden_words TEXT[],
  default_hashtags JSONB DEFAULT '{}',
  best_posting_times JSONB DEFAULT '{}',
  content_rules JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_publishing_settings ENABLE ROW LEVEL SECURITY;

-- Super Admins manage settings
CREATE POLICY "Super admins manage publishing settings"
ON public.social_publishing_settings
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Insert default settings row
INSERT INTO public.social_publishing_settings (id, auto_publish_enabled, require_approval, brand_tone)
VALUES (gen_random_uuid(), false, true, 'professional');

-- =============================================
-- 5. SOCIAL PUBLICATION LOGS (Audit Trail)
-- =============================================
CREATE TABLE public.social_publication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  platform social_platform NOT NULL,
  details JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_publication_logs ENABLE ROW LEVEL SECURITY;

-- Viewable by blog managers
CREATE POLICY "Blog managers view publication logs"
ON public.social_publication_logs
FOR SELECT
USING (is_super_admin() OR can_manage_blog());

-- System can insert logs
CREATE POLICY "System inserts publication logs"
ON public.social_publication_logs
FOR INSERT
WITH CHECK (is_super_admin() OR can_manage_blog());

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update timestamps
CREATE TRIGGER update_social_connections_updated_at
BEFORE UPDATE ON public.social_media_connections
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_social_posts_updated_at
BEFORE UPDATE ON public.social_posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_social_settings_updated_at
BEFORE UPDATE ON public.social_publishing_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();