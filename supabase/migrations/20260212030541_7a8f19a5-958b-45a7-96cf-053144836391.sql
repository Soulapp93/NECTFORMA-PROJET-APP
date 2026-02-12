
-- Add structured content columns to social_posts for multi-channel support
ALTER TABLE public.social_posts 
ADD COLUMN IF NOT EXISTS structured_content jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'text',
ADD COLUMN IF NOT EXISTS slide_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_script text,
ADD COLUMN IF NOT EXISTS thread_tweets jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Add comment for documentation
COMMENT ON COLUMN public.social_posts.structured_content IS 'JSON structure for carousel slides, video scripts, etc.';
COMMENT ON COLUMN public.social_posts.content_type IS 'text, carousel, video_script, thread';
COMMENT ON COLUMN public.social_posts.approval_status IS 'pending, approved, rejected';
