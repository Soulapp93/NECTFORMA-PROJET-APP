import { supabase } from "@/integrations/supabase/client";

// ============================================
// BLOG AI SERVICE
// Nectforma AI-Powered Blog Content System
// ============================================

export interface AIGeneratedArticle {
  title: string;
  seo_title: string;
  seo_description: string;
  slug: string;
  excerpt: string;
  outline: Array<{ level: string; text: string }>;
  content: string;
  faq: Array<{ question: string; answer: string }>;
  suggested_tags: string[];
  suggested_category: string;
  estimated_read_time: number;
  cta: { text: string; description: string };
  seo_keywords: string[];
}

export interface AISEOAnalysis {
  score: number;
  title_analysis: {
    current_score: number;
    suggestions: string[];
    improved_title: string;
  };
  meta_analysis: {
    description_score: number;
    improved_description: string;
    keywords_density: Record<string, number>;
  };
  content_analysis: {
    readability_score: number;
    flesch_score: number;
    word_count: number;
    heading_structure: string;
    keyword_stuffing: boolean;
    suggestions: string[];
  };
  internal_linking: {
    suggestions: string[];
  };
  schema_markup: {
    type: string;
    json_ld: Record<string, unknown>;
  };
  improvements: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }>;
}

export interface AITopicSuggestions {
  trending_topics: Array<{
    title: string;
    description: string;
    target_keywords: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    estimated_traffic: 'high' | 'medium' | 'low';
    content_type: string;
  }>;
  content_clusters: Array<{
    pillar_topic: string;
    subtopics: string[];
  }>;
  content_calendar: Array<{
    week: number;
    topic: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  competitor_gaps: string[];
}

export interface AISocialPosts {
  linkedin: {
    post: string;
    hashtags: string[];
  };
  twitter: {
    thread: string[];
    single: string;
  };
  facebook: {
    post: string;
  };
  instagram: {
    caption: string;
    hashtags: string[];
  };
  newsletter: {
    subject: string;
    preview_text: string;
    intro: string;
  };
}

export interface AIScheduleSuggestion {
  best_publish_times: Array<{
    day: string;
    time: string;
    reason: string;
  }>;
  recommended_frequency: string;
  avoid_dates: string[];
  content_spacing: {
    min_days_between: number;
    reason: string;
  };
}

export interface AIRewriteResult {
  rewritten_content: string;
  changes_made: string[];
  readability_improvement: string;
  word_count_change: string;
}

export interface AIImagePrompts {
  cover_image: {
    prompt: string;
    alt_text: string;
    suggested_filename: string;
  };
  illustrations: Array<{
    purpose: string;
    prompt: string;
    alt_text: string;
  }>;
  style_guide: {
    colors: string[];
    mood: string;
    avoid: string[];
  };
}

export interface AIPerformanceAnalysis {
  overall_score: number;
  engagement_analysis: {
    strengths: string[];
    weaknesses: string[];
  };
  recommendations: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    expected_impact: string;
  }>;
  ab_test_suggestions: Array<{
    element: string;
    variant_a: string;
    variant_b: string;
  }>;
  update_suggestions: Array<{
    section: string;
    reason: string;
    new_content: string;
  }>;
}

async function callBlogAI<T>(action: string, payload: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke('blog-ai', {
    body: { action, payload }
  });

  if (error) {
    console.error('Blog AI error:', error);
    throw new Error(error.message || 'Erreur du service AI');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Erreur inconnue');
  }

  return data.data as T;
}

// ===== ARTICLE GENERATION =====

export interface GenerateArticleParams {
  topic: string;
  audience?: string;
  tone?: 'professional' | 'educational' | 'casual' | 'marketing';
  length?: 'short' | 'medium' | 'long';
  language?: 'fr' | 'en';
  keywords?: string[];
  category?: string;
  instructions?: string;
}

export async function generateArticle(params: GenerateArticleParams): Promise<AIGeneratedArticle> {
  return callBlogAI<AIGeneratedArticle>('generate-article', params);
}

// ===== SEO OPTIMIZATION =====

export interface OptimizeSEOParams {
  title: string;
  content: string;
  seo_description?: string;
  seo_keywords?: string[];
}

export async function optimizeSEO(params: OptimizeSEOParams): Promise<AISEOAnalysis> {
  return callBlogAI<AISEOAnalysis>('optimize-seo', params);
}

// ===== TOPIC SUGGESTIONS =====

export interface SuggestTopicsParams {
  existing_topics?: string[];
  period?: string;
  count?: number;
  instructions?: string;
}

export async function suggestTopics(params: SuggestTopicsParams): Promise<AITopicSuggestions> {
  return callBlogAI<AITopicSuggestions>('suggest-topics', params);
}

// ===== CONTENT REWRITING =====

export interface RewriteContentParams {
  content: string;
  mode?: 'improve' | 'shorten' | 'expand' | 'simplify';
  tone?: string;
  target_length?: string;
  instructions?: string;
}

export async function rewriteContent(params: RewriteContentParams): Promise<AIRewriteResult> {
  return callBlogAI<AIRewriteResult>('rewrite-content', params);
}

// ===== SOCIAL MEDIA GENERATION =====

export interface GenerateSocialParams {
  title: string;
  excerpt: string;
  content: string;
  url?: string;
  platforms?: string[];
}

export async function generateSocialPosts(params: GenerateSocialParams): Promise<AISocialPosts> {
  return callBlogAI<AISocialPosts>('generate-social', params);
}

// ===== PERFORMANCE ANALYSIS =====

export interface AnalyzePerformanceParams {
  title: string;
  content: string;
  views?: number;
  avg_time?: string;
  bounce_rate?: string;
  scroll_depth?: string;
  avg_position?: string;
  published_at?: string;
}

export async function analyzePerformance(params: AnalyzePerformanceParams): Promise<AIPerformanceAnalysis> {
  return callBlogAI<AIPerformanceAnalysis>('analyze-performance', params);
}

// ===== SCHEDULE SUGGESTIONS =====

export interface SuggestScheduleParams {
  content_type?: string;
  category?: string;
  audience?: string;
  current_frequency?: string;
  last_publish_date?: string;
  scheduled_posts?: string[];
}

export async function suggestSchedule(params: SuggestScheduleParams): Promise<AIScheduleSuggestion> {
  return callBlogAI<AIScheduleSuggestion>('suggest-schedule', params);
}

// ===== IMAGE PROMPTS =====

export interface GenerateImagePromptsParams {
  title: string;
  topic?: string;
  tone?: string;
  category?: string;
  style?: string;
}

export async function generateImagePrompts(params: GenerateImagePromptsParams): Promise<AIImagePrompts> {
  return callBlogAI<AIImagePrompts>('generate-image-prompt', params);
}

// ===== TRANSLATION =====

export interface TranslateContentParams {
  title: string;
  excerpt: string;
  content: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  target_language: string;
}

export interface AITranslation {
  translated_title: string;
  translated_content: string;
  translated_excerpt: string;
  translated_seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  cultural_adaptations: string[];
}

export async function translateContent(params: TranslateContentParams): Promise<AITranslation> {
  return callBlogAI<AITranslation>('translate', params);
}

// ===== SUMMARIZATION =====

export interface SummarizeContentParams {
  title: string;
  content: string;
  format?: string;
}

export interface AISummary {
  summary: string;
  key_points: string[];
  executive_summary: string;
  tl_dr: string;
}

export async function summarizeContent(params: SummarizeContentParams): Promise<AISummary> {
  return callBlogAI<AISummary>('summarize', params);
}

// ===== UTILITY =====

export function calculateSEOScore(analysis: AISEOAnalysis): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
} {
  const score = analysis.score;
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  let color: string;

  if (score >= 90) {
    grade = 'A';
    color = 'text-green-500';
  } else if (score >= 80) {
    grade = 'B';
    color = 'text-lime-500';
  } else if (score >= 70) {
    grade = 'C';
    color = 'text-yellow-500';
  } else if (score >= 60) {
    grade = 'D';
    color = 'text-orange-500';
  } else {
    grade = 'F';
    color = 'text-red-500';
  }

  return { score, grade, color };
}
