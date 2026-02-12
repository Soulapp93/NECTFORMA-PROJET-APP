import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Linkedin, Instagram, Twitter, Music2, Loader2, Eye,
  ChevronRight, Play, Image as ImageIcon, Hash, Filter,
  CheckCircle2, XCircle, Clock, ThumbsUp, ThumbsDown, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SocialPost {
  id: string;
  platform: string;
  caption: string;
  hashtags: string[];
  content_type: string;
  structured_content: any;
  slide_count: number;
  video_script: string | null;
  thread_tweets: any;
  status: string;
  approval_status: string;
  ai_generated: boolean;
  created_at: string;
  blog_post_id: string | null;
}

// ─── Carousel Slide Preview (visual, like Canva) ───
const CarouselPreview = ({ slides, platform }: { slides: any[]; platform: string }) => {
  const [current, setCurrent] = useState(0);
  if (!slides || slides.length === 0) return <p className="text-xs text-muted-foreground">Aucun slide</p>;

  const gradients: Record<string, string> = {
    linkedin: 'from-[#0077B5] to-[#005885]',
    instagram: 'from-[#833AB4] via-[#E1306C] to-[#F77737]',
    tiktok: 'from-[#010101] via-[#25F4EE]/20 to-[#FE2C55]/20',
  };

  const aspectClass = platform === 'instagram' ? 'aspect-square' : 'aspect-[4/5]';
  const slide = slides[current];

  return (
    <div className="space-y-2">
      <div className={`relative bg-gradient-to-br ${gradients[platform] || 'from-primary to-primary/80'} rounded-2xl overflow-hidden text-white ${aspectClass} max-h-[420px] flex flex-col justify-center items-center p-8`}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 w-full text-center space-y-3">
          {slide.type === 'cover' && (
            <>
              <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider mb-2">
                {platform === 'linkedin' ? 'LinkedIn Carrousel' : platform === 'instagram' ? 'Instagram' : 'TikTok'}
              </div>
              <h3 className="text-xl md:text-2xl font-extrabold leading-tight">{slide.title}</h3>
              {slide.subtitle && <p className="text-sm text-white/80 font-medium">{slide.subtitle}</p>}
              {slide.content && <p className="text-xs text-white/60">{slide.content}</p>}
            </>
          )}
          {(slide.type === 'content' || slide.type === 'solution' || slide.type === 'tips') && (
            <div className="text-left space-y-3">
              <div className="inline-block bg-white/20 backdrop-blur-sm rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase">
                Slide {current + 1}
              </div>
              <h3 className="text-lg font-bold leading-tight">{slide.title}</h3>
              {slide.content && <p className="text-sm text-white/90">{slide.content}</p>}
              {slide.bullet_points && (
                <ul className="space-y-2 mt-2">
                  {slide.bullet_points.map((bp: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="mt-1 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold">{i + 1}</span>
                      </div>
                      <span>{bp}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {(slide.type === 'stat' || slide.type === 'fact') && (
            <>
              <h3 className="text-4xl font-black">{slide.title}</h3>
              {slide.subtitle && <p className="text-lg text-white/80 font-medium">{slide.subtitle}</p>}
              {slide.content && <p className="text-sm text-white/60">{slide.content}</p>}
            </>
          )}
          {(slide.type === 'cta' || slide.type === 'result') && (
            <>
              <h3 className="text-xl font-bold">{slide.title}</h3>
              {slide.subtitle && <p className="text-sm text-white/80">{slide.subtitle}</p>}
              <div className="inline-flex items-center gap-2 bg-white text-black rounded-full px-5 py-2.5 text-sm font-semibold mt-3 shadow-lg">
                En savoir plus →
              </div>
            </>
          )}
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {slides.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between px-1">
        <Button variant="ghost" size="sm" disabled={current === 0} onClick={() => setCurrent(p => p - 1)}>
          ← Précédent
        </Button>
        <span className="text-xs text-muted-foreground font-medium">{current + 1} / {slides.length}</span>
        <Button variant="ghost" size="sm" disabled={current === slides.length - 1} onClick={() => setCurrent(p => p + 1)}>
          Suivant →
        </Button>
      </div>
    </div>
  );
};

// ─── TikTok Video Script Preview (phone mockup) ───
const TikTokScriptPreview = ({ script }: { script: any }) => {
  if (!script) return null;
  let parsed = script;
  if (typeof script === 'string') {
    try { parsed = JSON.parse(script); } catch { return null; }
  }

  return (
    <div className="mx-auto max-w-[280px]">
      <div className="bg-black rounded-[2rem] p-3 shadow-2xl border-4 border-gray-800">
        <div className="bg-gradient-to-b from-gray-900 to-black rounded-[1.5rem] overflow-hidden">
          {/* Status bar mockup */}
          <div className="flex items-center justify-between px-4 py-2 text-white/60 text-[9px]">
            <span>9:41</span>
            <span className="font-bold text-white text-xs">TikTok</span>
            <span>📶 🔋</span>
          </div>

          <div className="px-4 pb-4 space-y-3 min-h-[380px] flex flex-col justify-between">
            {/* Hook */}
            {parsed.hook && (
              <div className="bg-gradient-to-r from-[#FE2C55] to-[#FF6B81] rounded-xl p-3 shadow-lg">
                <p className="text-[9px] uppercase text-white/80 font-bold mb-1">🎯 Hook</p>
                <p className="text-white text-sm font-bold leading-snug">{parsed.hook}</p>
              </div>
            )}

            {/* Scenes */}
            <div className="flex-1 space-y-2">
              {parsed.scenes?.map((scene: any, i: number) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-[#25F4EE] font-bold">Scène {i + 1}</span>
                    <span className="text-[9px] text-white/50">{scene.duration_seconds}s</span>
                  </div>
                  <p className="text-white text-xs leading-snug">{scene.text}</p>
                  <p className="text-white/50 text-[10px] mt-1 flex items-center gap-1">
                    📹 {scene.action}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA + Music */}
            <div className="space-y-2">
              {parsed.cta && (
                <div className="bg-[#FE2C55] rounded-full py-2 px-4 text-center">
                  <p className="text-white text-xs font-bold">{parsed.cta}</p>
                </div>
              )}
              {parsed.music_suggestion && (
                <div className="flex items-center gap-2 text-[10px] text-white/40">
                  <Music2 className="h-3 w-3" />
                  <span className="truncate">{parsed.music_suggestion}</span>
                </div>
              )}
            </div>
          </div>

          {/* Duration badge */}
          <div className="text-center pb-3">
            <Badge className="bg-white/10 text-white/70 border-0 text-[10px]">
              Durée : ~{parsed.total_duration_seconds || 20}s
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Twitter Thread Preview ───
const ThreadPreview = ({ tweets }: { tweets: string[] }) => {
  if (!tweets || tweets.length === 0) return null;

  return (
    <div className="space-y-0 max-w-md mx-auto">
      {tweets.map((tweet, i) => (
        <div key={i} className="relative pl-10 pb-4">
          {i < tweets.length - 1 && (
            <div className="absolute left-[17px] top-10 bottom-0 w-0.5 bg-border" />
          )}
          <div className="absolute left-0 top-1 h-9 w-9 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
            <Twitter className="h-4 w-4 text-sky-500" />
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 rounded-full bg-primary/20" />
              <span className="text-xs font-bold">Nectforma</span>
              <span className="text-[10px] text-muted-foreground">@nectforma</span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{tweet}</p>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
              <span>{tweet.length}/280</span>
              <span>Tweet {i + 1}/{tweets.length}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Gallery Component ───
export const SocialContentGallery = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('social_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (platformFilter !== 'all') {
        query = query.eq('platform', platformFilter as any);
      }
      if (statusFilter !== 'all') {
        query = query.eq('approval_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts((data || []) as SocialPost[]);
    } catch (e) {
      console.error('Error loading social posts:', e);
      toast.error('Erreur de chargement des contenus sociaux');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, [platformFilter, statusFilter]);

  const handleApproval = async (postId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('social_posts')
        .update({ 
          approval_status: approved ? 'approved' : 'rejected',
          ...(approved ? { approved_at: new Date().toISOString() } : {})
        })
        .eq('id', postId);
      if (error) throw error;
      toast.success(approved ? 'Contenu approuvé ✅' : 'Contenu rejeté');
      await loadPosts();
    } catch (e) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'tiktok': return <Music2 className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'linkedin': return 'LinkedIn';
      case 'instagram': return 'Instagram';
      case 'tiktok': return 'TikTok';
      case 'twitter': return 'X (Twitter)';
      default: return platform;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'linkedin': return 'bg-[#0077B5]/10 text-[#0077B5] border-[#0077B5]/20';
      case 'instagram': return 'bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/20';
      case 'tiktok': return 'bg-black/10 text-foreground border-black/20';
      case 'twitter': return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
      default: return '';
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Approuvé</Badge>;
      case 'rejected': return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    }
  };

  const getSlides = (post: SocialPost) => {
    if (post.structured_content?.slides) return post.structured_content.slides;
    if (post.structured_content?.carousel?.slides) return post.structured_content.carousel.slides;
    return null;
  };

  const getVideoScript = (post: SocialPost) => {
    return post.video_script || post.structured_content?.video_script || null;
  };

  const getThreadTweets = (post: SocialPost): string[] | null => {
    if (!post.thread_tweets) return null;
    if (Array.isArray(post.thread_tweets)) return post.thread_tweets as string[];
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-44">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Plateforme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les plateformes</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="twitter">X (Twitter)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvés</SelectItem>
            <SelectItem value="rejected">Rejetés</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadPosts}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Actualiser
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {posts.length} contenu(s)
        </div>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg mb-1">Aucun contenu social</h3>
            <p className="text-sm text-muted-foreground">
              Lancez l'Autopilot IA pour générer automatiquement des contenus pour vos réseaux sociaux.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {posts.map(post => {
            const slides = getSlides(post);
            const videoScript = getVideoScript(post);
            const tweets = getThreadTweets(post);

            return (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`gap-1.5 ${getPlatformColor(post.platform)}`}>
                      {getPlatformIcon(post.platform)}
                      {getPlatformLabel(post.platform)}
                    </Badge>
                    {getApprovalBadge(post.approval_status)}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(post.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Visual Content Preview */}
                  {slides && slides.length > 0 && (
                    <CarouselPreview slides={slides} platform={post.platform} />
                  )}

                  {videoScript && post.platform === 'tiktok' && (
                    <TikTokScriptPreview script={videoScript} />
                  )}

                  {tweets && post.platform === 'twitter' && (
                    <ThreadPreview tweets={tweets} />
                  )}

                  {/* Caption */}
                  {post.caption && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Caption</p>
                      <p className="text-sm line-clamp-4 whitespace-pre-wrap">{post.caption}</p>
                    </div>
                  )}

                  {/* Hashtags */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.hashtags.slice(0, 8).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">
                          <Hash className="h-2.5 w-2.5 mr-0.5" />{tag.replace('#', '')}
                        </Badge>
                      ))}
                      {post.hashtags.length > 8 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{post.hashtags.length - 8}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Approval actions */}
                  {post.approval_status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => handleApproval(post.id, false)}
                      >
                        <ThumbsDown className="h-3 w-3 mr-1.5" />
                        Rejeter
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApproval(post.id, true)}
                      >
                        <ThumbsUp className="h-3 w-3 mr-1.5" />
                        Approuver
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
