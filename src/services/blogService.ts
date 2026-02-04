import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category_id: string | null;
  author_id: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  canonical_url: string | null;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  published_at: string | null;
  scheduled_for: string | null;
  views_count: number;
  read_time_minutes: number;
  created_at: string;
  updated_at: string;
  category?: BlogCategory | null;
  tags?: BlogTag[];
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BlogAnalytics {
  id: string;
  post_id: string;
  visitor_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  referrer: string | null;
  scroll_depth: number | null;
  time_on_page: number | null;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

// ===== PUBLIC METHODS =====

export async function getPublishedPosts(limit = 10, offset = 0): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(*)
    `)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data as unknown as BlogPost[];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(*)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Fetch tags for the post
  if (data) {
    const { data: tagData } = await supabase
      .from('blog_post_tags')
      .select('tag:blog_tags(*)')
      .eq('post_id', data.id);

    (data as BlogPost).tags = tagData?.map((t: { tag: BlogTag }) => t.tag) || [];
  }

  return data as unknown as BlogPost;
}

export async function getPostsByCategory(categorySlug: string, limit = 10): Promise<BlogPost[]> {
  const { data: category } = await supabase
    .from('blog_categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

  if (!category) return [];

  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(*)
    `)
    .eq('category_id', category.id)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as unknown as BlogPost[];
}

export async function getPostsByTag(tagSlug: string, limit = 10): Promise<BlogPost[]> {
  const { data: tag } = await supabase
    .from('blog_tags')
    .select('id')
    .eq('slug', tagSlug)
    .single();

  if (!tag) return [];

  const { data: postIds } = await supabase
    .from('blog_post_tags')
    .select('post_id')
    .eq('tag_id', tag.id);

  if (!postIds || postIds.length === 0) return [];

  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(*)
    `)
    .in('id', postIds.map(p => p.post_id))
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as unknown as BlogPost[];
}

export async function getCategories(): Promise<BlogCategory[]> {
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data as BlogCategory[];
}

export async function getTags(): Promise<BlogTag[]> {
  const { data, error } = await supabase
    .from('blog_tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as BlogTag[];
}

// ===== ANALYTICS =====

export async function trackPageView(postId: string, referrer?: string): Promise<void> {
  const visitorId = getOrCreateVisitorId();
  
  await supabase.from('blog_analytics').insert({
    post_id: postId,
    visitor_id: visitorId,
    user_agent: navigator.userAgent,
    referrer: referrer || document.referrer || null,
    event_type: 'view'
  });

  // Increment view count directly
  await supabase
    .from('blog_posts')
    .update({ views_count: (await supabase.from('blog_posts').select('views_count').eq('id', postId).single()).data?.views_count + 1 || 1 })
    .eq('id', postId);

}

export async function trackScrollDepth(postId: string, depth: number): Promise<void> {
  const visitorId = getOrCreateVisitorId();
  
  await supabase.from('blog_analytics').insert({
    post_id: postId,
    visitor_id: visitorId,
    scroll_depth: depth,
    event_type: 'scroll'
  });
}

export async function trackTimeOnPage(postId: string, seconds: number): Promise<void> {
  const visitorId = getOrCreateVisitorId();
  
  await supabase.from('blog_analytics').insert({
    post_id: postId,
    visitor_id: visitorId,
    time_on_page: seconds,
    event_type: 'time'
  });
}

function getOrCreateVisitorId(): string {
  const key = 'nf_visitor_id';
  let visitorId = localStorage.getItem(key);
  
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(key, visitorId);
  }
  
  return visitorId;
}

// ===== ADMIN METHODS =====

export async function getAllPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as BlogPost[];
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Fetch tags
  if (data) {
    const { data: tagData } = await supabase
      .from('blog_post_tags')
      .select('tag:blog_tags(*)')
      .eq('post_id', data.id);

    (data as BlogPost).tags = tagData?.map((t: { tag: BlogTag }) => t.tag) || [];
  }

  return data as unknown as BlogPost;
}

export async function createPost(post: Partial<BlogPost>): Promise<BlogPost> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const insertData = {
    title: post.title || 'Untitled',
    slug: post.slug || `post-${Date.now()}`,
    content: post.content || '',
    excerpt: post.excerpt || null,
    cover_image_url: post.cover_image_url || null,
    category_id: post.category_id || null,
    author_id: user.id,
    seo_title: post.seo_title || null,
    seo_description: post.seo_description || null,
    seo_keywords: post.seo_keywords || null,
    canonical_url: post.canonical_url || null,
    status: post.status || 'draft',
    published_at: post.published_at || null,
    scheduled_for: post.scheduled_for || null
  };

  const { data, error } = await supabase
    .from('blog_posts')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as BlogPost;
}

export async function updatePost(id: string, post: Partial<BlogPost>): Promise<BlogPost> {
  const { data, error } = await supabase
    .from('blog_posts')
    .update(post)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as BlogPost;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function publishPost(id: string): Promise<BlogPost> {
  return updatePost(id, {
    status: 'published',
    published_at: new Date().toISOString()
  });
}

export async function unpublishPost(id: string): Promise<BlogPost> {
  return updatePost(id, {
    status: 'draft',
    published_at: null
  });
}

// ===== CATEGORY MANAGEMENT =====

export async function createCategory(category: Partial<BlogCategory>): Promise<BlogCategory> {
  const insertData = {
    name: category.name || 'Untitled',
    slug: category.slug || `cat-${Date.now()}`,
    description: category.description,
    color: category.color || '#8B5CF6',
    order_index: category.order_index || 0
  };

  const { data, error } = await supabase
    .from('blog_categories')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data as BlogCategory;
}

export async function updateCategory(id: string, category: Partial<BlogCategory>): Promise<BlogCategory> {
  const { data, error } = await supabase
    .from('blog_categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BlogCategory;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('blog_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ===== TAG MANAGEMENT =====

export async function createTag(tag: Partial<BlogTag>): Promise<BlogTag> {
  const insertData = {
    name: tag.name || 'Untitled',
    slug: tag.slug || `tag-${Date.now()}`
  };

  const { data, error } = await supabase
    .from('blog_tags')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data as BlogTag;
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase
    .from('blog_tags')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function setPostTags(postId: string, tagIds: string[]): Promise<void> {
  // Remove existing tags
  await supabase
    .from('blog_post_tags')
    .delete()
    .eq('post_id', postId);

  // Add new tags
  if (tagIds.length > 0) {
    await supabase
      .from('blog_post_tags')
      .insert(tagIds.map(tagId => ({ post_id: postId, tag_id: tagId })));
  }
}

// ===== ANALYTICS DASHBOARD =====

export interface BlogStats {
  totalViews: number;
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  topPosts: { title: string; views: number; slug: string }[];
  viewsByDay: { date: string; views: number }[];
}

export async function getBlogStats(): Promise<BlogStats> {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, status, views_count');

  const allPosts = posts || [];
  const totalViews = allPosts.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const publishedPosts = allPosts.filter(p => p.status === 'published').length;
  const draftPosts = allPosts.filter(p => p.status === 'draft').length;

  const topPosts = allPosts
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 5)
    .map(p => ({ title: p.title, views: p.views_count || 0, slug: p.slug }));

  // Get views by day for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: analytics } = await supabase
    .from('blog_analytics')
    .select('created_at')
    .eq('event_type', 'view')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const viewsByDay: Record<string, number> = {};
  (analytics || []).forEach(a => {
    const date = a.created_at.split('T')[0];
    viewsByDay[date] = (viewsByDay[date] || 0) + 1;
  });

  return {
    totalViews,
    totalPosts: allPosts.length,
    publishedPosts,
    draftPosts,
    topPosts,
    viewsByDay: Object.entries(viewsByDay).map(([date, views]) => ({ date, views }))
  };
}
