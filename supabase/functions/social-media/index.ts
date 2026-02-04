import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type SocialPlatform = 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'threads' | 'pinterest';

interface SocialRequest {
  action: 
    | 'generate-captions'
    | 'publish-post'
    | 'schedule-post'
    | 'get-analytics'
    | 'refresh-token'
    | 'test-connection'
    | 'generate-image'
    | 'suggest-best-time';
  payload: Record<string, unknown>;
}

// Platform-specific character limits and rules
const PLATFORM_LIMITS = {
  linkedin: { caption: 3000, hashtags: 30 },
  twitter: { caption: 280, hashtags: 5 },
  facebook: { caption: 63206, hashtags: 30 },
  instagram: { caption: 2200, hashtags: 30 },
  tiktok: { caption: 2200, hashtags: 10 },
  youtube: { title: 100, description: 5000, tags: 500 },
  threads: { caption: 500, hashtags: 10 },
  pinterest: { title: 100, description: 500, hashtags: 20 },
};

// AI prompts for each platform
const PLATFORM_PROMPTS: Record<SocialPlatform, string> = {
  linkedin: `Tu es un expert LinkedIn. Génère un post professionnel et engageant:
- Ton: Professionnel, éducatif, inspirant
- Structure: Hook accrocheur → Valeur → CTA
- Longueur: 200-500 mots idéalement
- Utilise des emojis professionnels avec modération
- Inclus 3-5 hashtags pertinents B2B
- Termine par une question ou un CTA`,

  twitter: `Tu es un expert X (Twitter). Génère un tweet viral:
- Max 280 caractères
- Hook fort dès le début
- Utilise 1-3 hashtags max
- Ton: Direct, percutant, engageant
- Peut inclure un CTA court
- Si thread demandé, fais 3-5 tweets connectés`,

  facebook: `Tu es un expert Facebook. Génère un post engageant:
- Ton: Conversationnel, accessible
- Pose une question pour engager
- Inclus un CTA clair
- Utilise des emojis
- 3-5 hashtags max`,

  instagram: `Tu es un expert Instagram. Génère une légende captivante:
- Hook fort sur la première ligne
- Corps du texte engageant avec emojis
- CTA à la fin
- 20-30 hashtags pertinents (mélange populaires et niches)
- Ton: Authentique, visuel, inspirant`,

  tiktok: `Tu es un expert TikTok. Génère une description courte et accrocheuse:
- Max 150 caractères pour le texte principal
- Utilise des emojis tendance
- 5-7 hashtags viraux
- Ton: Décontracté, dynamique, jeune`,

  youtube: `Tu es un expert YouTube. Génère:
- Un titre accrocheur (max 100 chars)
- Une description complète avec timestamps
- 10-15 tags pertinents
- Un CTA pour s'abonner
- Inclus des mots-clés SEO`,

  threads: `Tu es un expert Threads. Génère un post concis:
- Max 500 caractères
- Ton: Conversationnel, authentique
- 3-5 hashtags
- Peut être un thread multi-posts`,

  pinterest: `Tu es un expert Pinterest. Génère:
- Un titre accrocheur (max 100 chars)
- Une description riche en mots-clés (max 500 chars)
- 5-10 hashtags de niche
- Focus SEO Pinterest`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !authData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, payload } = await req.json() as SocialRequest;
    console.log(`Social Media action: ${action}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    switch (action) {
      // =============================================
      // GENERATE AI CAPTIONS FOR ALL PLATFORMS
      // =============================================
      case 'generate-captions': {
        if (!LOVABLE_API_KEY) {
          return new Response(
            JSON.stringify({ error: 'AI service not configured' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { title, excerpt, content, url, platforms } = payload as {
          title: string;
          excerpt: string;
          content: string;
          url?: string;
          platforms: SocialPlatform[];
        };

        const results: Record<SocialPlatform, {
          caption: string;
          hashtags: string[];
          thread?: string[];
          title?: string;
          description?: string;
          tags?: string[];
        }> = {} as any;

        // Generate captions for each platform in parallel
        const generations = await Promise.all(
          platforms.map(async (platform) => {
            const systemPrompt = PLATFORM_PROMPTS[platform];
            const userMessage = `Génère du contenu pour ${platform.toUpperCase()} à partir de cet article:

Titre: ${title}
Extrait: ${excerpt}
URL: ${url || 'https://nectforma.com/blog'}

Contenu de l'article:
${content?.substring(0, 3000) || excerpt}

IMPORTANT: 
- Respecte la limite de ${PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS]?.caption || 2000} caractères
- Adapte le ton à ${platform}
- Inclus un lien vers l'article si pertinent

Réponds en JSON:
{
  "caption": "Texte du post",
  "hashtags": ["#tag1", "#tag2"],
  ${platform === 'twitter' ? '"thread": ["tweet1", "tweet2", "tweet3"],' : ''}
  ${platform === 'youtube' ? '"title": "Titre YouTube", "description": "Description", "tags": ["tag1", "tag2"],' : ''}
  "best_time": "Moment recommandé pour poster"
}`;

            try {
              const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'google/gemini-3-flash-preview',
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                  ],
                  temperature: 0.8,
                  max_tokens: 2000,
                }),
              });

              if (!response.ok) {
                console.error(`AI error for ${platform}:`, await response.text());
                return { platform, error: 'AI generation failed' };
              }

              const aiResponse = await response.json();
              let content = aiResponse.choices?.[0]?.message?.content || '';
              
              // Parse JSON
              content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const parsed = JSON.parse(content);
              
              return { platform, data: parsed };
            } catch (err) {
              console.error(`Error generating for ${platform}:`, err);
              return { platform, error: String(err) };
            }
          })
        );

        generations.forEach((result) => {
          if ('data' in result && result.data) {
            results[result.platform as SocialPlatform] = result.data;
          }
        });

        return new Response(
          JSON.stringify({ success: true, data: results }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // =============================================
      // SCHEDULE A POST
      // =============================================
      case 'schedule-post': {
        const { 
          blog_post_id, 
          platform, 
          caption, 
          hashtags, 
          media_urls, 
          scheduled_for,
          ai_generated
        } = payload as {
          blog_post_id?: string;
          platform: SocialPlatform;
          caption: string;
          hashtags: string[];
          media_urls?: string[];
          scheduled_for: string;
          ai_generated?: boolean;
        };

        const { data: post, error: insertError } = await supabase
          .from('social_posts')
          .insert({
            blog_post_id,
            platform,
            caption,
            hashtags,
            media_urls: media_urls || [],
            scheduled_for,
            status: 'scheduled',
            ai_generated: ai_generated || false,
            created_by: authData.claims.sub,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error scheduling post:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to schedule post' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log the action
        await supabase.from('social_publication_logs').insert({
          social_post_id: post.id,
          action: 'scheduled',
          status: 'success',
          platform,
          details: { scheduled_for }
        });

        return new Response(
          JSON.stringify({ success: true, data: post }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // =============================================
      // PUBLISH A POST (placeholder for real API integration)
      // =============================================
      case 'publish-post': {
        const { post_id } = payload as { post_id: string };

        // Get the post
        const { data: post, error: fetchError } = await supabase
          .from('social_posts')
          .select('*, social_media_connections!inner(*)')
          .eq('id', post_id)
          .single();

        if (fetchError || !post) {
          return new Response(
            JSON.stringify({ error: 'Post not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if platform is connected
        const { data: connection } = await supabase
          .from('social_media_connections')
          .select('*')
          .eq('platform', post.platform)
          .eq('connection_status', 'connected')
          .single();

        if (!connection) {
          await supabase.from('social_posts').update({
            status: 'failed',
            error_message: `${post.platform} n'est pas connecté`
          }).eq('id', post_id);

          return new Response(
            JSON.stringify({ 
              error: `Platform ${post.platform} is not connected`,
              requires_connection: true
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update status to publishing
        await supabase.from('social_posts').update({
          status: 'publishing'
        }).eq('id', post_id);

        // TODO: Implement actual API calls for each platform
        // For now, we simulate a successful publish
        const simulatedResult = {
          external_post_id: `sim_${Date.now()}`,
          external_post_url: `https://${post.platform}.com/post/${Date.now()}`,
        };

        // Update with success
        await supabase.from('social_posts').update({
          status: 'published',
          published_at: new Date().toISOString(),
          external_post_id: simulatedResult.external_post_id,
          external_post_url: simulatedResult.external_post_url,
        }).eq('id', post_id);

        // Log the publication
        await supabase.from('social_publication_logs').insert({
          social_post_id: post_id,
          action: 'published',
          status: 'success',
          platform: post.platform,
          details: simulatedResult
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: simulatedResult,
            message: 'Publication simulée (connectez les APIs pour publication réelle)'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // =============================================
      // SUGGEST BEST POSTING TIME
      // =============================================
      case 'suggest-best-time': {
        if (!LOVABLE_API_KEY) {
          return new Response(
            JSON.stringify({ error: 'AI service not configured' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { platform, content_type, audience } = payload as {
          platform: SocialPlatform;
          content_type?: string;
          audience?: string;
        };

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
                content: `Tu es un expert en stratégie social media. Analyse les meilleures heures de publication pour maximiser l'engagement.` 
              },
              { 
                role: 'user', 
                content: `Suggère les meilleurs moments pour publier sur ${platform}:
- Type de contenu: ${content_type || 'Article de blog'}
- Audience: ${audience || 'B2B - Formation professionnelle (France)'}
- Timezone: Europe/Paris

Réponds en JSON:
{
  "best_times": [
    { "day": "mardi", "time": "10:00", "score": 95, "reason": "Pic d'engagement B2B" }
  ],
  "avoid_times": [
    { "day": "dimanche", "time": "00:00-08:00", "reason": "Faible activité" }
  ],
  "frequency": "2-3 posts par semaine",
  "tips": ["Astuce 1", "Astuce 2"]
}` 
              }
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (!response.ok) {
          return new Response(
            JSON.stringify({ error: 'AI service error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const aiResponse = await response.json();
        let content = aiResponse.choices?.[0]?.message?.content || '';
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        return new Response(
          JSON.stringify({ success: true, data: JSON.parse(content) }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // =============================================
      // TEST CONNECTION (check if platform is properly connected)
      // =============================================
      case 'test-connection': {
        const { platform } = payload as { platform: SocialPlatform };

        const { data: connection } = await supabase
          .from('social_media_connections')
          .select('*')
          .eq('platform', platform)
          .single();

        if (!connection) {
          return new Response(
            JSON.stringify({ 
              connected: false, 
              message: `${platform} n'est pas encore connecté` 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check token expiry
        const isExpired = connection.token_expires_at && 
          new Date(connection.token_expires_at) < new Date();

        return new Response(
          JSON.stringify({
            connected: connection.connection_status === 'connected' && !isExpired,
            account_name: connection.account_name,
            requires_refresh: isExpired,
            last_connected: connection.last_connected_at,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // =============================================
      // GENERATE SOCIAL MEDIA IMAGE
      // =============================================
      case 'generate-image': {
        if (!LOVABLE_API_KEY) {
          return new Response(
            JSON.stringify({ error: 'AI service not configured' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { title, platform, style } = payload as {
          title: string;
          platform: SocialPlatform;
          style?: string;
        };

        // Generate image using Gemini image model
        const aspectRatios: Record<SocialPlatform, string> = {
          linkedin: '1200x627 (1.91:1)',
          twitter: '1200x675 (16:9)',
          facebook: '1200x630 (1.91:1)',
          instagram: '1080x1080 (1:1) ou 1080x1350 (4:5)',
          tiktok: '1080x1920 (9:16)',
          youtube: '1280x720 (16:9)',
          threads: '1080x1080 (1:1)',
          pinterest: '1000x1500 (2:3)',
        };

        const imagePrompt = `Crée une image de couverture professionnelle pour ${platform}:
- Titre de l'article: "${title}"
- Format: ${aspectRatios[platform]}
- Style: ${style || 'Moderne, professionnel, tech-friendly'}
- Couleurs: Palette bleu/violet professionnelle
- Inclure: Texte superposé avec le titre, design épuré
- Marque: Nectforma (plateforme SaaS de formation)`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [
              { role: 'user', content: imagePrompt }
            ],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) {
          console.error('Image generation failed:', await response.text());
          return new Response(
            JSON.stringify({ error: 'Image generation failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const aiResponse = await response.json();
        const imageUrl = aiResponse.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: { 
              image_url: imageUrl,
              platform,
              prompt_used: imagePrompt
            } 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Social Media function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
