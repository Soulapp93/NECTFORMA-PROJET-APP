import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseAdmin = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ─── STEP 1: Detect trending topics via Perplexity ───
async function detectTrends(topics: string[]): Promise<{ topic: string; context: string; sources: string[] }> {
  const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
  if (!PERPLEXITY_API_KEY) throw new Error('PERPLEXITY_API_KEY not configured');

  const topicsList = topics.join(', ');
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'Tu es un analyste de tendances spécialisé EdTech, formation professionnelle et SaaS éducation. Réponds TOUJOURS en JSON valide.'
        },
        {
          role: 'user',
          content: `Identifie LE sujet tendance le plus pertinent aujourd'hui pour un blog SaaS de gestion de formation (Nectforma). 
Domaines à explorer: ${topicsList}.
Cherche les actualités, réglementations, tendances du moment.

Réponds en JSON:
{
  "topic": "Le sujet tendance choisi (titre d'article potentiel)",
  "context": "Contexte détaillé (200 mots) expliquant pourquoi ce sujet est tendance et pertinent",
  "keywords": ["mot-clé1", "mot-clé2", "mot-clé3"],
  "angle": "L'angle éditorial recommandé"
}`
        }
      ],
      search_recency_filter: 'week',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Perplexity error:', response.status, err);
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const sources = data.citations || [];

  let parsed;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch {
    parsed = { topic: content.substring(0, 100), context: content, keywords: [] };
  }

  return {
    topic: parsed.topic || 'Formation professionnelle: tendances actuelles',
    context: parsed.context || content,
    sources,
  };
}

// ─── STEP 2: Scrape additional context via Firecrawl ───
async function scrapeContext(topic: string): Promise<string> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
  if (!FIRECRAWL_API_KEY) {
    console.log('Firecrawl not configured, skipping scraping');
    return '';
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${topic} formation professionnelle EdTech France`,
        limit: 3,
        lang: 'fr',
        tbs: 'qdr:w',
        scrapeOptions: { formats: ['markdown'] },
      }),
    });

    if (!response.ok) {
      console.error('Firecrawl search error:', response.status);
      return '';
    }

    const data = await response.json();
    const results = data.data || [];
    return results
      .map((r: any) => `Source: ${r.url}\n${(r.markdown || r.description || '').substring(0, 500)}`)
      .join('\n\n---\n\n');
  } catch (e) {
    console.error('Firecrawl error:', e);
    return '';
  }
}

// ─── STEP 3: Generate ALL content simultaneously via Lovable AI ───
async function generateMultiChannelContent(topic: string, context: string, scrapedContent: string, tone: string): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en content marketing multi-canal pour Nectforma, une plateforme SaaS de gestion de formation professionnelle.
Ton: ${tone}.
Tu dois générer SIMULTANÉMENT un article de blog ET du contenu adapté pour chaque réseau social.
Tu dois TOUJOURS répondre en JSON valide.`
        },
        {
          role: 'user',
          content: `Génère un contenu COMPLET multi-canal sur ce sujet tendance:

SUJET: ${topic}

CONTEXTE TENDANCE:
${context}

${scrapedContent ? `SOURCES WEB RÉCENTES:\n${scrapedContent.substring(0, 2000)}` : ''}

Réponds en JSON avec cette structure EXACTE:
{
  "article": {
    "title": "Titre optimisé SEO (max 60 chars)",
    "seo_title": "Meta title (max 60 chars)",
    "seo_description": "Meta description (max 160 chars)",
    "slug": "url-slug-optimise",
    "excerpt": "Résumé accrocheur (max 200 chars)",
    "content": "<article HTML complet avec h2, h3, p, ul, li, strong, em - min 1000 mots>",
    "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
  },
  "linkedin": {
    "caption": "Post LinkedIn professionnel (max 1500 chars) avec emojis et hashtags",
    "hashtags": ["#EdTech", "#Formation", "#Nectforma"],
    "carousel": {
      "slides": [
        {
          "slide_number": 1,
          "title": "Titre accrocheur de couverture",
          "subtitle": "Sous-titre",
          "content": "Texte court",
          "type": "cover"
        },
        {
          "slide_number": 2,
          "title": "Point clé 1",
          "subtitle": "",
          "content": "Explication concise du point",
          "bullet_points": ["Point A", "Point B", "Point C"],
          "type": "content"
        },
        {
          "slide_number": 3,
          "title": "Point clé 2",
          "subtitle": "",
          "content": "Explication",
          "bullet_points": ["Point A", "Point B"],
          "type": "content"
        },
        {
          "slide_number": 4,
          "title": "Point clé 3",
          "subtitle": "",
          "content": "Explication",
          "bullet_points": ["Point A", "Point B"],
          "type": "content"
        },
        {
          "slide_number": 5,
          "title": "Statistique clé",
          "subtitle": "Chiffre marquant",
          "content": "Contexte du chiffre",
          "type": "stat"
        },
        {
          "slide_number": 6,
          "title": "Passez à l'action",
          "subtitle": "Découvrez Nectforma",
          "content": "CTA engageant",
          "type": "cta"
        }
      ]
    }
  },
  "instagram": {
    "caption": "Caption Instagram engageante avec emojis (max 2200 chars)",
    "hashtags": ["#EdTech", "#Formation", "#DigitalLearning", "#Nectforma"],
    "carousel": {
      "slides": [
        {
          "slide_number": 1,
          "title": "Titre visuel accrocheur",
          "content": "Texte court et impactant",
          "type": "cover",
          "color_accent": "#8B5CF6"
        },
        {
          "slide_number": 2,
          "title": "Saviez-vous que...",
          "content": "Fait surprenant ou statistique",
          "type": "fact"
        },
        {
          "slide_number": 3,
          "title": "La solution",
          "content": "Comment résoudre le problème",
          "bullet_points": ["Étape 1", "Étape 2", "Étape 3"],
          "type": "solution"
        },
        {
          "slide_number": 4,
          "title": "Résultat",
          "content": "Ce que vous obtenez",
          "type": "result"
        },
        {
          "slide_number": 5,
          "title": "Suivez-nous !",
          "content": "Pour plus de conseils formation",
          "type": "cta"
        }
      ]
    }
  },
  "tiktok": {
    "caption": "Caption TikTok courte et punchy (max 300 chars)",
    "hashtags": ["#EdTech", "#Formation", "#ApprendreAutrement", "#fyp"],
    "video_script": {
      "hook": "Les 3 premières secondes qui captent l'attention (question choc ou fait surprenant)",
      "scenes": [
        { "duration_seconds": 3, "text": "Hook visuel", "action": "Texte à l'écran avec zoom rapide" },
        { "duration_seconds": 5, "text": "Le problème", "action": "Description du problème courant" },
        { "duration_seconds": 5, "text": "La solution", "action": "Présentation de la solution" },
        { "duration_seconds": 4, "text": "Le résultat", "action": "Montrer le bénéfice" },
        { "duration_seconds": 3, "text": "CTA", "action": "Appel à l'action + lien en bio" }
      ],
      "music_suggestion": "Son tendance suggéré",
      "total_duration_seconds": 20
    },
    "carousel": {
      "slides": [
        {
          "slide_number": 1,
          "title": "Titre punchy",
          "content": "Accroche courte",
          "type": "cover"
        },
        {
          "slide_number": 2,
          "title": "Le saviez-vous ?",
          "content": "Fait viral",
          "type": "fact"
        },
        {
          "slide_number": 3,
          "title": "3 astuces",
          "content": "Tips pratiques",
          "bullet_points": ["Astuce 1", "Astuce 2", "Astuce 3"],
          "type": "tips"
        },
        {
          "slide_number": 4,
          "title": "Lien en bio 👆",
          "content": "Découvrez Nectforma",
          "type": "cta"
        }
      ]
    }
  },
  "twitter": {
    "thread": [
      "🧵 Tweet 1/5 - Accroche du thread avec emoji (max 280 chars)",
      "2/5 - Développement du point principal",
      "3/5 - Statistique ou fait marquant",
      "4/5 - Solution ou conseil actionnable",
      "5/5 - CTA + mention @Nectforma + hashtags"
    ],
    "hashtags": ["#EdTech", "#Formation"]
  }
}`
        }
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('Rate limit exceeded');
    if (response.status === 402) throw new Error('Payment required');
    const err = await response.text();
    throw new Error(`AI generation error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch {
    throw new Error('Failed to parse AI response as JSON');
  }
}

// ─── STEP 3b: Generate TikTok scene images via Lovable AI ───
async function generateTikTokImages(videoScript: any, topic: string): Promise<string[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.log('LOVABLE_API_KEY not configured, skipping image generation');
    return [];
  }

  const sb = supabaseAdmin();
  const scenes = videoScript?.scenes || [];
  if (scenes.length === 0) return [];

  const imageUrls: string[] = [];
  console.log(`🎨 Generating ${scenes.length} TikTok scene images...`);

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    try {
      const prompt = `Create a vertical 9:16 TikTok-style scene image for a professional education/EdTech video.
Scene ${i + 1}: "${scene.text}"
Action: "${scene.action}"
Topic: "${topic}"
Style: Modern, clean, vibrant colors, bold typography overlay area at bottom, professional but dynamic.
The image should be visually striking and suitable for a short-form vertical video about professional training and education technology.
Ultra high resolution.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-image-preview',
          messages: [
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        console.error(`Image generation failed for scene ${i + 1}:`, response.status);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      // Check if the response contains base64 image data
      let imageBase64: string | null = null;
      
      if (data.choices?.[0]?.message?.parts) {
        for (const part of data.choices[0].message.parts) {
          if (part.inline_data?.data) {
            imageBase64 = part.inline_data.data;
            break;
          }
        }
      }
      
      // Try extracting from content if it's a data URI
      if (!imageBase64 && typeof content === 'string') {
        const dataUriMatch = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
        if (dataUriMatch) {
          imageBase64 = dataUriMatch[1];
        }
      }

      if (imageBase64) {
        // Convert base64 to Uint8Array and upload to storage
        const binaryString = atob(imageBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        
        const fileName = `tiktok-scene-${Date.now()}-${i + 1}.png`;
        const filePath = `tiktok/${fileName}`;

        const { error: uploadError } = await sb.storage
          .from('blog-assets')
          .upload(filePath, bytes.buffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for scene ${i + 1}:`, uploadError);
          continue;
        }

        const { data: publicUrl } = sb.storage.from('blog-assets').getPublicUrl(filePath);
        imageUrls.push(publicUrl.publicUrl);
        console.log(`✅ Scene ${i + 1} image generated and uploaded`);
      } else {
        console.log(`⚠️ No image data in response for scene ${i + 1}`);
      }
    } catch (e) {
      console.error(`Error generating scene ${i + 1} image:`, e);
    }
  }

  return imageUrls;
}

// ─── STEP 4: Save article + ALL social posts to DB ───
async function saveMultiChannelContent(
  generated: any,
  trendTopic: string,
  trendSources: string[],
  runId: string,
  autoPublish: boolean
) {
  const sb = supabaseAdmin();
  const article = generated.article || generated;

  const generateSlug = (title: string) => {
    const base = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${base}-${Date.now().toString(36)}`;
  };

  // Get author (super admin)
  const { data: superAdmin } = await sb
    .from('platform_user_roles')
    .select('user_id')
    .eq('role', 'super_admin')
    .limit(1)
    .single();

  const authorId = superAdmin?.user_id;
  if (!authorId) throw new Error('No super admin found for authoring');

  // Save blog post
  const postData: any = {
    title: article.title,
    slug: generateSlug(article.title || 'article-auto'),
    excerpt: article.excerpt,
    content: article.content,
    seo_title: article.seo_title,
    seo_description: article.seo_description,
    seo_keywords: article.seo_keywords || [],
    author_id: authorId,
    status: autoPublish ? 'published' : 'draft',
    published_at: autoPublish ? new Date().toISOString() : null,
  };

  const { data: savedPost, error: postError } = await sb
    .from('blog_posts')
    .insert(postData)
    .select()
    .single();

  if (postError) {
    console.error('Error saving post:', postError);
    throw postError;
  }

  console.log('Article saved:', savedPost.id, savedPost.title);

  // Save multi-channel social posts
  let socialCount = 0;
  const channelConfigs = [
    {
      platform: 'linkedin',
      data: generated.linkedin,
      getPost: (d: any) => ({
        caption: d.caption || '',
        hashtags: d.hashtags || [],
        content_type: 'carousel',
        structured_content: d.carousel || {},
        slide_count: d.carousel?.slides?.length || 0,
      })
    },
    {
      platform: 'instagram',
      data: generated.instagram,
      getPost: (d: any) => ({
        caption: d.caption || '',
        hashtags: d.hashtags || [],
        content_type: 'carousel',
        structured_content: d.carousel || {},
        slide_count: d.carousel?.slides?.length || 0,
      })
    },
    {
      platform: 'tiktok',
      data: generated.tiktok,
      getPost: (d: any) => ({
        caption: d.caption || '',
        hashtags: d.hashtags || [],
        content_type: 'video_script',
        structured_content: { carousel: d.carousel || {}, video_script: d.video_script || {} },
        video_script: JSON.stringify(d.video_script || {}),
        slide_count: d.carousel?.slides?.length || 0,
        media_urls: d._media_urls || [],
      })
    },
    {
      platform: 'twitter',
      data: generated.twitter,
      getPost: (d: any) => ({
        caption: (d.thread || [])[0] || '',
        hashtags: d.hashtags || [],
        content_type: 'thread',
        structured_content: { thread: d.thread || [] },
        thread_tweets: d.thread || [],
        slide_count: 0,
      })
    },
  ];

  for (const channel of channelConfigs) {
    if (!channel.data) continue;
    
    const postPayload = channel.getPost(channel.data);
    const { error: socialError } = await sb
      .from('social_posts')
      .insert({
        blog_post_id: savedPost.id,
        platform: channel.platform,
        caption: postPayload.caption,
        hashtags: postPayload.hashtags,
        content_type: postPayload.content_type,
        structured_content: postPayload.structured_content,
        slide_count: postPayload.slide_count,
        video_script: postPayload.video_script || null,
        thread_tweets: postPayload.thread_tweets || [],
        media_urls: postPayload.media_urls || [],
        status: 'draft',
        approval_status: 'pending',
        ai_generated: true,
        created_by: authorId,
      });

    if (socialError) {
      console.error(`Error saving ${channel.platform} post:`, socialError);
    } else {
      socialCount++;
      console.log(`✅ ${channel.platform} content saved`);
    }
  }

  // Update run with results
  await sb
    .from('ai_autopilot_runs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      trend_topic: trendTopic,
      trend_sources: trendSources,
      article_id: savedPost.id,
      social_posts_generated: socialCount,
      metadata: {
        channels: channelConfigs.filter(c => c.data).map(c => c.platform),
        has_carousel: !!(generated.linkedin?.carousel || generated.instagram?.carousel),
        has_video_script: !!generated.tiktok?.video_script,
        has_thread: !!generated.twitter?.thread,
      }
    })
    .eq('id', runId);

  // Update last run timestamp
  await sb
    .from('social_publishing_settings')
    .update({ autopilot_last_run: new Date().toISOString() })
    .limit(1);

  return { articleId: savedPost.id, socialCount };
}

// ─── MAIN HANDLER ───
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'run';

    const sb = supabaseAdmin();

    // ── Toggle autopilot ──
    if (action === 'toggle') {
      const { enabled } = body;
      const { data: existing } = await sb.from('social_publishing_settings').select('id').limit(1).single();
      
      if (existing) {
        await sb.from('social_publishing_settings').update({
          autopilot_enabled: enabled,
          emergency_stop: !enabled,
        }).eq('id', existing.id);
      } else {
        await sb.from('social_publishing_settings').insert({
          autopilot_enabled: enabled,
          emergency_stop: !enabled,
        });
      }

      return new Response(
        JSON.stringify({ success: true, autopilot_enabled: enabled }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Get status ──
    if (action === 'status') {
      const { data: settings } = await sb.from('social_publishing_settings').select('*').limit(1).single();
      const { data: runs } = await sb
        .from('ai_autopilot_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      return new Response(
        JSON.stringify({ success: true, settings, runs: runs || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Get social posts for an article ──
    if (action === 'get-social-posts') {
      const { article_id } = body;
      if (!article_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'article_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: socialPosts } = await sb
        .from('social_posts')
        .select('*')
        .eq('blog_post_id', article_id)
        .order('platform');

      return new Response(
        JSON.stringify({ success: true, posts: socialPosts || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Update social post approval ──
    if (action === 'approve-post') {
      const { post_id, approved } = body;
      await sb.from('social_posts').update({
        approval_status: approved ? 'approved' : 'rejected',
        approved_at: approved ? new Date().toISOString() : null,
      }).eq('id', post_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Test trend detection only ──
    if (action === 'test-trends') {
      const topics = body.topics || ['EdTech', 'Formation professionnelle', 'Digital learning'];
      const trends = await detectTrends(topics);
      return new Response(
        JSON.stringify({ success: true, trends }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Update settings ──
    if (action === 'update-settings') {
      const { topics, tone, frequency, require_approval, auto_publish_enabled } = body;
      const { data: existing } = await sb.from('social_publishing_settings').select('id').limit(1).single();
      
      const updates: any = {};
      if (topics) updates.autopilot_topics = topics;
      if (tone) updates.autopilot_tone = tone;
      if (frequency) updates.autopilot_frequency = frequency;
      if (require_approval !== undefined) updates.require_approval = require_approval;
      if (auto_publish_enabled !== undefined) updates.auto_publish_enabled = auto_publish_enabled;

      if (existing) {
        await sb.from('social_publishing_settings').update(updates).eq('id', existing.id);
      } else {
        await sb.from('social_publishing_settings').insert(updates);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Full autopilot run ──
    if (!body.force) {
      const { data: settings } = await sb.from('social_publishing_settings').select('autopilot_enabled, emergency_stop').limit(1).single();
      if (settings?.emergency_stop) {
        return new Response(
          JSON.stringify({ success: false, error: 'Emergency stop is active' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!settings?.autopilot_enabled && action !== 'run-once') {
        return new Response(
          JSON.stringify({ success: false, error: 'Autopilot is not enabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create run record
    const { data: run, error: runError } = await sb
      .from('ai_autopilot_runs')
      .insert({
        run_type: 'multi_channel_content',
        status: 'running',
        ai_model: 'google/gemini-3-flash-preview',
      })
      .select()
      .single();

    if (runError) throw runError;
    const runId = run.id;

    try {
      const { data: settings } = await sb.from('social_publishing_settings').select('*').limit(1).single();
      const topics = settings?.autopilot_topics || ['EdTech', 'Formation professionnelle', 'SaaS éducation'];
      const tone = settings?.autopilot_tone || 'professionnel';
      const autoPublish = settings?.auto_publish_enabled && !settings?.require_approval;

      console.log('🚀 Multi-channel autopilot run started:', runId);

      // Step 1: Detect trends
      console.log('📊 Step 1: Detecting trends...');
      const trends = await detectTrends(topics);
      console.log('📊 Trend detected:', trends.topic);

      // Step 2: Scrape additional context
      console.log('🔍 Step 2: Scraping context...');
      const scrapedContent = await scrapeContext(trends.topic);

      // Step 3: Generate ALL content simultaneously
      console.log('✍️ Step 3: Generating multi-channel content...');
      const generated = await generateMultiChannelContent(trends.topic, trends.context, scrapedContent, tone);
      console.log('✍️ Content generated for all channels');

      // Step 3b: Generate TikTok scene images
      let tiktokImageUrls: string[] = [];
      if (generated.tiktok?.video_script) {
        console.log('🎬 Step 3b: Generating TikTok scene images...');
        tiktokImageUrls = await generateTikTokImages(generated.tiktok.video_script, trends.topic);
        console.log(`🎬 Generated ${tiktokImageUrls.length} TikTok scene images`);
      }

      // Attach media_urls to tiktok data
      if (tiktokImageUrls.length > 0 && generated.tiktok) {
        generated.tiktok._media_urls = tiktokImageUrls;
      }

      // Step 4: Save everything to database
      console.log('💾 Step 4: Saving multi-channel content...');
      const result = await saveMultiChannelContent(generated, trends.topic, trends.sources, runId, !!autoPublish);
      console.log('✅ Multi-channel autopilot run completed!', result);

      return new Response(
        JSON.stringify({
          success: true,
          runId,
          articleId: result.articleId,
          socialPostsGenerated: result.socialCount,
          topic: trends.topic,
          autoPublished: !!autoPublish,
          channels: ['article', 'linkedin', 'instagram', 'tiktok', 'twitter'],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Autopilot run failed:', error);
      await sb
        .from('ai_autopilot_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', runId);

      return new Response(
        JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Run failed', runId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Content autopilot error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
