import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Linkedin, Instagram, Twitter, Music2, Loader2, Eye,
  ChevronRight, Play, Image as ImageIcon, Hash, Filter,
  CheckCircle2, XCircle, Clock, ThumbsUp, ThumbsDown, RefreshCw,
  X, ChevronLeft, Maximize2, Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  media_urls: string[] | null;
}

// ─── Carousel Slide Preview (visual, like Canva) ───
const CarouselPreview = ({ slides, platform, fullscreen = false }: { slides: any[]; platform: string; fullscreen?: boolean }) => {
  const [current, setCurrent] = useState(0);
  if (!slides || slides.length === 0) return <p className="text-xs text-muted-foreground">Aucun slide</p>;

  const gradients: Record<string, string> = {
    linkedin: 'from-[#0077B5] to-[#005885]',
    instagram: 'from-[#833AB4] via-[#E1306C] to-[#F77737]',
    tiktok: 'from-[#010101] via-[#25F4EE]/20 to-[#FE2C55]/20',
  };

  const aspectClass = platform === 'instagram' ? 'aspect-square' : 'aspect-[4/5]';
  const slide = slides[current];
  const maxH = fullscreen ? 'max-h-[70vh]' : 'max-h-[420px]';

  return (
    <div className="space-y-3">
      <div className={`relative bg-gradient-to-br ${gradients[platform] || 'from-primary to-primary/80'} rounded-2xl overflow-hidden text-white ${aspectClass} ${maxH} flex flex-col justify-center items-center ${fullscreen ? 'p-10' : 'p-8'}`}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

        <div className={`relative z-10 w-full text-center space-y-3 ${fullscreen ? 'text-lg' : ''}`}>
          {slide.type === 'cover' && (
            <>
              <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider mb-2">
                {platform === 'linkedin' ? 'LinkedIn Carrousel' : platform === 'instagram' ? 'Instagram' : 'TikTok'}
              </div>
              <h3 className={`${fullscreen ? 'text-3xl' : 'text-xl md:text-2xl'} font-extrabold leading-tight`}>{slide.title}</h3>
              {slide.subtitle && <p className={`${fullscreen ? 'text-base' : 'text-sm'} text-white/80 font-medium`}>{slide.subtitle}</p>}
              {slide.content && <p className="text-xs text-white/60">{slide.content}</p>}
            </>
          )}
          {(slide.type === 'content' || slide.type === 'solution' || slide.type === 'tips') && (
            <div className="text-left space-y-3">
              <div className="inline-block bg-white/20 backdrop-blur-sm rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase">
                Slide {current + 1}
              </div>
              <h3 className={`${fullscreen ? 'text-2xl' : 'text-lg'} font-bold leading-tight`}>{slide.title}</h3>
              {slide.content && <p className={`${fullscreen ? 'text-base' : 'text-sm'} text-white/90`}>{slide.content}</p>}
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
              <h3 className={`${fullscreen ? 'text-5xl' : 'text-4xl'} font-black`}>{slide.title}</h3>
              {slide.subtitle && <p className={`${fullscreen ? 'text-xl' : 'text-lg'} text-white/80 font-medium`}>{slide.subtitle}</p>}
              {slide.content && <p className="text-sm text-white/60">{slide.content}</p>}
            </>
          )}
          {(slide.type === 'cta' || slide.type === 'result') && (
            <>
              <h3 className={`${fullscreen ? 'text-2xl' : 'text-xl'} font-bold`}>{slide.title}</h3>
              {slide.subtitle && <p className="text-sm text-white/80">{slide.subtitle}</p>}
              <div className="inline-flex items-center gap-2 bg-white text-black rounded-full px-5 py-2.5 text-sm font-semibold mt-3 shadow-lg">
                En savoir plus →
              </div>
            </>
          )}
        </div>

        {/* Navigation arrows for fullscreen */}
        {fullscreen && (
          <>
            {current > 0 && (
              <button onClick={() => setCurrent(p => p - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {current < slides.length - 1 && (
              <button onClick={() => setCurrent(p => p + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </>
        )}

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
const TikTokScriptPreview = ({ script, fullscreen = false }: { script: any; fullscreen?: boolean }) => {
  if (!script) return null;
  let parsed = script;
  if (typeof script === 'string') {
    try { parsed = JSON.parse(script); } catch { return null; }
  }

  return (
    <div className={`mx-auto ${fullscreen ? 'max-w-[340px]' : 'max-w-[280px]'}`}>
      <div className="bg-black rounded-[2rem] p-3 shadow-2xl border-4 border-gray-800">
        <div className="bg-gradient-to-b from-gray-900 to-black rounded-[1.5rem] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 text-white/60 text-[9px]">
            <span>9:41</span>
            <span className="font-bold text-white text-xs">TikTok</span>
            <span>📶 🔋</span>
          </div>

          <div className={`px-4 pb-4 space-y-3 ${fullscreen ? 'min-h-[500px]' : 'min-h-[380px]'} flex flex-col justify-between`}>
            {parsed.hook && (
              <div className="bg-gradient-to-r from-[#FE2C55] to-[#FF6B81] rounded-xl p-3 shadow-lg">
                <p className="text-[9px] uppercase text-white/80 font-bold mb-1">🎯 Hook</p>
                <p className="text-white text-sm font-bold leading-snug">{parsed.hook}</p>
              </div>
            )}

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

// ─── TikTok Animated Scene Player ───
const TikTokScenePlayer = ({ mediaUrls, script, fullscreen = false }: { mediaUrls: string[] | null; script: any; fullscreen?: boolean }) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  let parsed = script;
  if (typeof script === 'string') {
    try { parsed = JSON.parse(script); } catch { parsed = null; }
  }

  const scenes = parsed?.scenes || [];
  const images = mediaUrls?.filter(url => url.match(/\.(png|jpg|jpeg|webp)(\?|$)/i)) || [];
  const videoUrl = mediaUrls?.find(url => url.match(/\.(mp4|webm|mov)(\?|$)/i));

  // Auto-play through scenes
  useEffect(() => {
    if (!isPlaying || images.length === 0) return;
    const sceneDuration = (scenes[currentScene]?.duration_seconds || 4) * 1000;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 50;
      setProgress((elapsed / sceneDuration) * 100);
      if (elapsed >= sceneDuration) {
        if (currentScene < images.length - 1) {
          setCurrentScene(prev => prev + 1);
          elapsed = 0;
          setProgress(0);
        } else {
          setIsPlaying(false);
          setCurrentScene(0);
          setProgress(0);
        }
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, currentScene, images.length, scenes]);

  // If there's a real video file, use the native player
  if (videoUrl) {
    return (
      <div className={`mx-auto ${fullscreen ? 'max-w-[340px]' : 'max-w-[280px]'}`}>
        <div className="bg-black rounded-[2rem] p-3 shadow-2xl border-4 border-gray-800">
          <div className="rounded-[1.5rem] overflow-hidden">
            <video src={videoUrl} controls className="w-full aspect-[9/16] object-cover bg-black" playsInline />
          </div>
        </div>
      </div>
    );
  }

  // If there are scene images, show animated player
  if (images.length > 0) {
    const scene = scenes[currentScene] || {};
    return (
      <div className={`mx-auto ${fullscreen ? 'max-w-[340px]' : 'max-w-[280px]'}`}>
        <div className="bg-black rounded-[2rem] p-3 shadow-2xl border-4 border-gray-800">
          <div className="bg-black rounded-[1.5rem] overflow-hidden relative aspect-[9/16]">
            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 text-white/60 text-[9px]">
              <span>9:41</span>
              <span className="font-bold text-white text-xs">TikTok</span>
              <span>📶 🔋</span>
            </div>

            {/* Scene image */}
            <img
              src={images[currentScene] || images[0]}
              alt={`Scène ${currentScene + 1}`}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            />

            {/* Dark overlay for text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10" />

            {/* Scene text overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 space-y-2">
              {scene.text && (
                <p className="text-white text-sm font-bold drop-shadow-lg">{scene.text}</p>
              )}
              {scene.action && (
                <p className="text-white/70 text-[10px] flex items-center gap-1">📹 {scene.action}</p>
              )}

              {/* Progress bars */}
              <div className="flex gap-1 pt-2">
                {images.map((_: string, i: number) => (
                  <div key={i} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{
                        width: i < currentScene ? '100%' : i === currentScene ? `${progress}%` : '0%'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Scene indicator */}
            <div className="absolute top-10 right-3 z-20">
              <Badge className="bg-black/50 text-white border-0 text-[10px] backdrop-blur-sm">
                {currentScene + 1}/{images.length}
              </Badge>
            </div>

            {/* Play/Pause overlay */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute inset-0 z-15 flex items-center justify-center"
            >
              {!isPlaying && (
                <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="h-8 w-8 text-white fill-white ml-1" />
                </div>
              )}
            </button>

            {/* Right side TikTok actions mockup */}
            <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-4">
              <div className="text-center">
                <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">❤️</div>
                <span className="text-[9px] text-white">12.5k</span>
              </div>
              <div className="text-center">
                <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">💬</div>
                <span className="text-[9px] text-white">845</span>
              </div>
              <div className="text-center">
                <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">↗️</div>
                <span className="text-[9px] text-white">2.1k</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation controls below */}
        <div className="flex items-center justify-between mt-3 px-1">
          <Button variant="ghost" size="sm" disabled={currentScene === 0} onClick={() => { setCurrentScene(p => p - 1); setIsPlaying(false); setProgress(0); }}>
            ← Précédent
          </Button>
          <span className="text-xs text-muted-foreground">Scène {currentScene + 1}/{images.length}</span>
          <Button variant="ghost" size="sm" disabled={currentScene >= images.length - 1} onClick={() => { setCurrentScene(p => p + 1); setIsPlaying(false); setProgress(0); }}>
            Suivant →
          </Button>
        </div>
      </div>
    );
  }

  // Fallback: no images or video available
  return null;
};

// ─── Twitter Thread Preview ───
const ThreadPreview = ({ tweets, fullscreen = false }: { tweets: string[]; fullscreen?: boolean }) => {
  if (!tweets || tweets.length === 0) return null;

  return (
    <div className={`space-y-0 ${fullscreen ? 'max-w-lg' : 'max-w-md'} mx-auto`}>
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
            <p className={`${fullscreen ? 'text-base' : 'text-sm'} whitespace-pre-wrap leading-relaxed`}>{tweet}</p>
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

// ─── Content Detail Modal ───
const ContentDetailModal = ({ post, isOpen, onClose, onApprove, onReject }: {
  post: SocialPost | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) => {
  if (!post) return null;

  const slides = (() => {
    if (post.structured_content?.slides) return post.structured_content.slides;
    if (post.structured_content?.carousel?.slides) return post.structured_content.carousel.slides;
    return null;
  })();

  const videoScript = post.video_script || post.structured_content?.video_script || null;
  const tweets = (() => {
    if (!post.thread_tweets) return null;
    if (Array.isArray(post.thread_tweets)) return post.thread_tweets as string[];
    return null;
  })();

  const platformLabels: Record<string, string> = {
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    twitter: 'X (Twitter)',
  };

  const platformIcons: Record<string, React.ReactNode> = {
    linkedin: <Linkedin className="h-5 w-5" />,
    instagram: <Instagram className="h-5 w-5" />,
    tiktok: <Music2 className="h-5 w-5" />,
    twitter: <Twitter className="h-5 w-5" />,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {platformIcons[post.platform]}
            </div>
            <div>
              <h2 className="font-bold text-lg">{platformLabels[post.platform] || post.platform}</h2>
              <p className="text-xs text-muted-foreground">
                {format(new Date(post.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.approval_status === 'approved' && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Approuvé</Badge>
            )}
            {post.approval_status === 'rejected' && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>
            )}
            {post.approval_status === 'pending' && (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Visual preview */}
          {slides && slides.length > 0 && (
            <CarouselPreview slides={slides} platform={post.platform} fullscreen />
          )}

          {post.platform === 'tiktok' && (
            <>
              {(post.media_urls && post.media_urls.length > 0) || videoScript ? (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Video className="h-4 w-4" /> {post.media_urls && post.media_urls.length > 0 ? 'Vidéo / Scènes générées' : 'Script vidéo'}
                  </h3>
                  <TikTokScenePlayer mediaUrls={post.media_urls} script={videoScript} fullscreen />
                </div>
              ) : null}
              {videoScript && !(post.media_urls && post.media_urls.length > 0) && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Play className="h-4 w-4" /> Script vidéo
                  </h3>
                  <TikTokScriptPreview script={videoScript} fullscreen />
                </div>
              )}
            </>
          )}

          {tweets && post.platform === 'twitter' && (
            <ThreadPreview tweets={tweets} fullscreen />
          )}

          {/* Caption */}
          {post.caption && (
            <div className="bg-muted/50 rounded-xl p-5">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Caption</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.caption}</p>
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Hashtags</p>
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    <Hash className="h-3 w-3 mr-0.5" />{tag.replace('#', '')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {post.approval_status === 'pending' && (
          <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => { onReject(post.id); onClose(); }}
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => { onApprove(post.id); onClose(); }}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Approuver
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Gallery Component ───
export const SocialContentGallery = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

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
          {posts.map(post => (
            <Card 
              key={post.id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group"
              onClick={() => setSelectedPost(post)}
            >
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
                {/* Caption preview */}
                {post.caption && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Caption</p>
                    <p className="text-sm line-clamp-3 whitespace-pre-wrap">{post.caption}</p>
                  </div>
                )}

                {/* Content type indicator */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {post.content_type === 'carousel' && <><ImageIcon className="h-3.5 w-3.5" /> Carrousel ({post.slide_count || '?'} slides)</>}
                  {post.content_type === 'video_script' && <><Video className="h-3.5 w-3.5" /> Script vidéo</>}
                  {post.content_type === 'thread' && <><Twitter className="h-3.5 w-3.5" /> Thread</>}
                  {post.content_type === 'text' && <><Hash className="h-3.5 w-3.5" /> Texte</>}
                </div>

                {/* View button */}
                <div className="flex items-center justify-center pt-1">
                  <Button variant="outline" size="sm" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Eye className="h-4 w-4" />
                    Visualiser le contenu
                  </Button>
                </div>

                {/* Approval actions */}
                {post.approval_status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t" onClick={e => e.stopPropagation()}>
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
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <ContentDetailModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onApprove={(id) => handleApproval(id, true)}
        onReject={(id) => handleApproval(id, false)}
      />
    </div>
  );
};
