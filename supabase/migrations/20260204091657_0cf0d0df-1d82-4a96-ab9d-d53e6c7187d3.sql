-- ============================================
-- SUPER ADMIN ROLE SYSTEM
-- ============================================

-- Créer le type enum pour les rôles globaux de la plateforme
CREATE TYPE public.platform_role AS ENUM ('super_admin', 'blog_editor', 'seo_manager', 'analytics_viewer');

-- Table des rôles de plateforme (séparée des rôles par établissement)
CREATE TABLE public.platform_user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role platform_role NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Fonction sécurisée pour vérifier si un utilisateur a un rôle de plateforme
CREATE OR REPLACE FUNCTION public.has_platform_role(_user_id UUID, _role platform_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fonction pour vérifier si l'utilisateur courant est super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_platform_role(auth.uid(), 'super_admin')
$$;

-- Fonction pour vérifier si l'utilisateur peut gérer le blog
CREATE OR REPLACE FUNCTION public.can_manage_blog()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin() 
    OR public.has_platform_role(auth.uid(), 'blog_editor')
    OR public.has_platform_role(auth.uid(), 'seo_manager')
$$;

-- RLS pour platform_user_roles
ALTER TABLE public.platform_user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage platform roles"
ON public.platform_user_roles FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Users view own platform roles"
ON public.platform_user_roles FOR SELECT
USING (user_id = auth.uid());

-- ============================================
-- BLOG SYSTEM TABLES
-- ============================================

-- Catégories du blog
CREATE TABLE public.blog_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#8B5CF6',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tags du blog
CREATE TABLE public.blog_tags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Statut des articles
CREATE TYPE public.blog_post_status AS ENUM ('draft', 'published', 'scheduled', 'archived');

-- Articles du blog
CREATE TABLE public.blog_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image_url TEXT,
    category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
    author_id UUID NOT NULL,
    
    -- SEO fields
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT[],
    canonical_url TEXT,
    
    -- Status and scheduling
    status blog_post_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    views_count INTEGER NOT NULL DEFAULT 0,
    read_time_minutes INTEGER DEFAULT 5,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table de liaison articles-tags (many-to-many)
CREATE TABLE public.blog_post_tags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (post_id, tag_id)
);

-- Analytics internes du blog
CREATE TABLE public.blog_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    visitor_id TEXT, -- anonymous identifier
    ip_hash TEXT, -- hashed IP for uniqueness
    user_agent TEXT,
    referrer TEXT,
    scroll_depth INTEGER, -- percentage 0-100
    time_on_page INTEGER, -- seconds
    event_type TEXT NOT NULL DEFAULT 'view', -- view, scroll, click, share
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les performances
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX idx_blog_analytics_post ON public.blog_analytics(post_id);
CREATE INDEX idx_blog_analytics_date ON public.blog_analytics(created_at);

-- RLS Policies pour blog_categories
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories"
ON public.blog_categories FOR SELECT
USING (true);

CREATE POLICY "Admins manage categories"
ON public.blog_categories FOR ALL
USING (public.can_manage_blog())
WITH CHECK (public.can_manage_blog());

-- RLS Policies pour blog_tags
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tags"
ON public.blog_tags FOR SELECT
USING (true);

CREATE POLICY "Admins manage tags"
ON public.blog_tags FOR ALL
USING (public.can_manage_blog())
WITH CHECK (public.can_manage_blog());

-- RLS Policies pour blog_posts
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published posts"
ON public.blog_posts FOR SELECT
USING (status = 'published' AND published_at <= now());

CREATE POLICY "Admins manage all posts"
ON public.blog_posts FOR ALL
USING (public.can_manage_blog())
WITH CHECK (public.can_manage_blog());

-- RLS Policies pour blog_post_tags
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read post tags"
ON public.blog_post_tags FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.blog_posts 
    WHERE id = post_id 
    AND (status = 'published' AND published_at <= now())
));

CREATE POLICY "Admins manage post tags"
ON public.blog_post_tags FOR ALL
USING (public.can_manage_blog())
WITH CHECK (public.can_manage_blog());

-- RLS Policies pour blog_analytics
ALTER TABLE public.blog_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics"
ON public.blog_analytics FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins view analytics"
ON public.blog_analytics FOR SELECT
USING (public.can_manage_blog() OR public.has_platform_role(auth.uid(), 'analytics_viewer'));

-- Triggers pour updated_at
CREATE TRIGGER update_blog_categories_updated_at
BEFORE UPDATE ON public.blog_categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_platform_user_roles_updated_at
BEFORE UPDATE ON public.platform_user_roles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Fonction pour calculer le temps de lecture
CREATE OR REPLACE FUNCTION public.calculate_read_time(content TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    word_count INTEGER;
    words_per_minute INTEGER := 200;
BEGIN
    -- Count words (rough estimate)
    word_count := array_length(regexp_split_to_array(content, '\s+'), 1);
    RETURN GREATEST(1, CEIL(word_count::FLOAT / words_per_minute));
END;
$$;

-- Trigger pour auto-calculer le temps de lecture
CREATE OR REPLACE FUNCTION public.update_read_time()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.read_time_minutes := public.calculate_read_time(NEW.content);
    RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_blog_post_read_time
BEFORE INSERT OR UPDATE OF content ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_read_time();