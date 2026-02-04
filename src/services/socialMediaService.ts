import { supabase } from '@/integrations/supabase/client';

export type SocialPlatform = 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'threads' | 'pinterest';

export type SocialPostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';

export interface SocialConnection {
  id: string;
  platform: SocialPlatform;
  account_name: string | null;
  account_id: string | null;
  connection_status: string;
  last_connected_at: string | null;
  token_expires_at: string | null;
}

export interface SocialPost {
  id: string;
  blog_post_id: string | null;
  platform: SocialPlatform;
  status: SocialPostStatus;
  caption: string;
  hashtags: string[];
  media_urls: string[];
  scheduled_for: string | null;
  published_at: string | null;
  external_post_id: string | null;
  external_post_url: string | null;
  error_message: string | null;
  ai_generated: boolean;
  auto_published: boolean;
  created_at: string;
}

export interface SocialAnalytics {
  id: string;
  social_post_id: string;
  platform: SocialPlatform;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  clicks: number;
  engagement_rate: number | null;
  reach: number;
  impressions: number;
  fetched_at: string;
}

export interface GeneratedCaption {
  caption: string;
  hashtags: string[];
  thread?: string[];
  title?: string;
  description?: string;
  tags?: string[];
  best_time?: string;
}

export interface PublishingSettings {
  id: string;
  auto_publish_enabled: boolean;
  auto_publish_platforms: SocialPlatform[];
  require_approval: boolean;
  brand_tone: string;
  forbidden_words: string[];
  default_hashtags: Record<SocialPlatform, string[]>;
  best_posting_times: Record<SocialPlatform, { day: string; time: string }[]>;
}

// Platform display info
export const PLATFORM_INFO: Record<SocialPlatform, {
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  charLimit: number;
}> = {
  linkedin: { name: 'LinkedIn', icon: '💼', color: '#0A66C2', bgColor: 'bg-blue-600', charLimit: 3000 },
  twitter: { name: 'X (Twitter)', icon: '𝕏', color: '#000000', bgColor: 'bg-black', charLimit: 280 },
  facebook: { name: 'Facebook', icon: '📘', color: '#1877F2', bgColor: 'bg-blue-500', charLimit: 63206 },
  instagram: { name: 'Instagram', icon: '📸', color: '#E4405F', bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500', charLimit: 2200 },
  tiktok: { name: 'TikTok', icon: '🎵', color: '#000000', bgColor: 'bg-black', charLimit: 2200 },
  youtube: { name: 'YouTube', icon: '▶️', color: '#FF0000', bgColor: 'bg-red-600', charLimit: 5000 },
  threads: { name: 'Threads', icon: '🧵', color: '#000000', bgColor: 'bg-black', charLimit: 500 },
  pinterest: { name: 'Pinterest', icon: '📌', color: '#E60023', bgColor: 'bg-red-600', charLimit: 500 },
};

// =============================================
// CONNECTIONS
// =============================================

export async function getConnections(): Promise<SocialConnection[]> {
  const { data, error } = await supabase
    .from('social_media_connections')
    .select('*')
    .order('platform');

  if (error) {
    console.error('Error fetching connections:', error);
    return [];
  }

  return data as SocialConnection[] || [];
}

export async function saveConnection(connection: Partial<SocialConnection>): Promise<SocialConnection | null> {
  const { data, error } = await supabase
    .from('social_media_connections')
    .upsert(connection as any, { onConflict: 'platform' })
    .select()
    .single();

  if (error) {
    console.error('Error saving connection:', error);
    throw error;
  }

  return data as SocialConnection;
}

export async function disconnectPlatform(platform: SocialPlatform): Promise<void> {
  const { error } = await supabase
    .from('social_media_connections')
    .update({
      connection_status: 'disconnected',
      access_token: null,
      refresh_token: null,
    })
    .eq('platform', platform);

  if (error) {
    console.error('Error disconnecting platform:', error);
    throw error;
  }
}

// =============================================
// SOCIAL POSTS
// =============================================

export async function getSocialPosts(filters?: {
  status?: SocialPostStatus;
  platform?: SocialPlatform;
  blog_post_id?: string;
}): Promise<SocialPost[]> {
  let query = supabase
    .from('social_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.platform) {
    query = query.eq('platform', filters.platform);
  }
  if (filters?.blog_post_id) {
    query = query.eq('blog_post_id', filters.blog_post_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching social posts:', error);
    return [];
  }

  return data as SocialPost[] || [];
}

export async function createSocialPost(post: Partial<SocialPost>): Promise<SocialPost | null> {
  const { data, error } = await supabase
    .from('social_posts')
    .insert(post as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating social post:', error);
    throw error;
  }

  return data as SocialPost;
}

export async function updateSocialPost(id: string, updates: Partial<SocialPost>): Promise<SocialPost | null> {
  const { data, error } = await supabase
    .from('social_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating social post:', error);
    throw error;
  }

  return data as SocialPost;
}

export async function deleteSocialPost(id: string): Promise<void> {
  const { error } = await supabase
    .from('social_posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting social post:', error);
    throw error;
  }
}

// =============================================
// AI GENERATION
// =============================================

export async function generateCaptions(
  title: string,
  excerpt: string,
  content: string,
  platforms: SocialPlatform[],
  url?: string
): Promise<Record<SocialPlatform, GeneratedCaption>> {
  const { data, error } = await supabase.functions.invoke('social-media', {
    body: {
      action: 'generate-captions',
      payload: { title, excerpt, content, url, platforms }
    }
  });

  if (error) {
    console.error('Error generating captions:', error);
    throw error;
  }

  return data.data || {};
}

export async function schedulePost(
  platform: SocialPlatform,
  caption: string,
  hashtags: string[],
  scheduledFor: string,
  blogPostId?: string,
  mediaUrls?: string[],
  aiGenerated?: boolean
): Promise<SocialPost | null> {
  const { data, error } = await supabase.functions.invoke('social-media', {
    body: {
      action: 'schedule-post',
      payload: {
        platform,
        caption,
        hashtags,
        scheduled_for: scheduledFor,
        blog_post_id: blogPostId,
        media_urls: mediaUrls,
        ai_generated: aiGenerated
      }
    }
  });

  if (error) {
    console.error('Error scheduling post:', error);
    throw error;
  }

  return data.data;
}

export async function publishPost(postId: string): Promise<{
  success: boolean;
  external_post_url?: string;
  message?: string;
  requires_connection?: boolean;
}> {
  const { data, error } = await supabase.functions.invoke('social-media', {
    body: {
      action: 'publish-post',
      payload: { post_id: postId }
    }
  });

  if (error) {
    console.error('Error publishing post:', error);
    throw error;
  }

  return data;
}

export async function suggestBestTime(
  platform: SocialPlatform,
  contentType?: string,
  audience?: string
): Promise<{
  best_times: { day: string; time: string; score: number; reason: string }[];
  avoid_times: { day: string; time: string; reason: string }[];
  frequency: string;
  tips: string[];
}> {
  const { data, error } = await supabase.functions.invoke('social-media', {
    body: {
      action: 'suggest-best-time',
      payload: { platform, content_type: contentType, audience }
    }
  });

  if (error) {
    console.error('Error suggesting best time:', error);
    throw error;
  }

  return data.data;
}

export async function testConnection(platform: SocialPlatform): Promise<{
  connected: boolean;
  account_name?: string;
  requires_refresh?: boolean;
  last_connected?: string;
}> {
  const { data, error } = await supabase.functions.invoke('social-media', {
    body: {
      action: 'test-connection',
      payload: { platform }
    }
  });

  if (error) {
    console.error('Error testing connection:', error);
    throw error;
  }

  return data;
}

export async function generateSocialImage(
  title: string,
  platform: SocialPlatform,
  style?: string
): Promise<{ image_url: string; platform: string }> {
  const { data, error } = await supabase.functions.invoke('social-media', {
    body: {
      action: 'generate-image',
      payload: { title, platform, style }
    }
  });

  if (error) {
    console.error('Error generating image:', error);
    throw error;
  }

  return data.data;
}

// =============================================
// ANALYTICS
// =============================================

export async function getPostAnalytics(postId: string): Promise<SocialAnalytics | null> {
  const { data, error } = await supabase
    .from('social_analytics')
    .select('*')
    .eq('social_post_id', postId)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }

  return data as SocialAnalytics;
}

export async function getAggregatedAnalytics(
  platform?: SocialPlatform,
  dateFrom?: string,
  dateTo?: string
): Promise<{
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_views: number;
  avg_engagement_rate: number;
}> {
  let query = supabase
    .from('social_analytics')
    .select('*');

  if (platform) {
    query = query.eq('platform', platform);
  }
  if (dateFrom) {
    query = query.gte('fetched_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('fetched_at', dateTo);
  }

  const { data, error } = await query;

  if (error || !data) {
    return {
      total_posts: 0,
      total_likes: 0,
      total_comments: 0,
      total_shares: 0,
      total_views: 0,
      avg_engagement_rate: 0,
    };
  }

  return {
    total_posts: data.length,
    total_likes: data.reduce((sum, d) => sum + (d.likes || 0), 0),
    total_comments: data.reduce((sum, d) => sum + (d.comments || 0), 0),
    total_shares: data.reduce((sum, d) => sum + (d.shares || 0), 0),
    total_views: data.reduce((sum, d) => sum + (d.views || 0), 0),
    avg_engagement_rate: data.length > 0 
      ? data.reduce((sum, d) => sum + (d.engagement_rate || 0), 0) / data.length 
      : 0,
  };
}

// =============================================
// SETTINGS
// =============================================

export async function getPublishingSettings(): Promise<PublishingSettings | null> {
  const { data, error } = await supabase
    .from('social_publishing_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }

  return data as unknown as PublishingSettings;
}

export async function updatePublishingSettings(settings: Partial<PublishingSettings>): Promise<void> {
  // Get existing settings first
  const existing = await getPublishingSettings();
  
  if (existing) {
    const { error } = await supabase
      .from('social_publishing_settings')
      .update(settings)
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  } else {
    const { error } = await supabase
      .from('social_publishing_settings')
      .insert(settings);

    if (error) {
      console.error('Error creating settings:', error);
      throw error;
    }
  }
}

// =============================================
// PUBLICATION LOGS
// =============================================

export async function getPublicationLogs(postId?: string, limit = 50): Promise<{
  id: string;
  social_post_id: string | null;
  action: string;
  status: string;
  platform: SocialPlatform;
  details: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
}[]> {
  let query = supabase
    .from('social_publication_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (postId) {
    query = query.eq('social_post_id', postId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  return (data || []).map(d => ({
    ...d,
    details: d.details as Record<string, unknown> | null,
  }));
}
