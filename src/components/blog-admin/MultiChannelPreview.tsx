import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Linkedin, Instagram, Twitter, Music2, FileText, Loader2,
  CheckCircle2, XCircle, Clock, ChevronRight, Eye, ThumbsUp, ThumbsDown,
  Hash, Play, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

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
}

interface MultiChannelPreviewProps {
  articleId: string;
  articleTitle?: string;
  onApprovalChange?: () => void;
}

// ─── Carousel Slide Preview ───
const CarouselSlidePreview = ({ slides, platform }: { slides: any[]; platform: string }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  if (!slides || slides.length === 0) return null;

  const bgColors: Record<string, string> = {
    linkedin: 'from-blue-600 to-blue-800',
    instagram: 'from-purple-500 via-pink-500 to-orange-400',
    tiktok: 'from-black to-gray-900',
  };

  const slide = slides[currentSlide];

  return (
    <div className="space-y-3">
      <div className={`relative bg-gradient-to-br ${bgColors[platform] || 'from-primary to-primary/80'} rounded-xl p-6 text-white min-h-[280px] flex flex-col justify-center`}>
        {slide.type === 'cover' && (
          <div className="text-center space-y-3">
            <Badge className="bg-white/20 text-white border-0 text-[10px]">
              {platform === 'linkedin' ? 'LinkedIn' : platform === 'instagram' ? 'Instagram' : 'TikTok'}
            </Badge>
            <h3 className="text-xl font-bold leading-tight">{slide.title}</h3>
            {slide.subtitle && <p className="text-sm text-white/80">{slide.subtitle}</p>}
            {slide.content && <p className="text-xs text-white/70">{slide.content}</p>}
          </div>
        )}
        {(slide.type === 'content' || slide.type === 'solution' || slide.type === 'tips') && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold">{slide.title}</h3>
            {slide.content && <p className="text-sm text-white/90">{slide.content}</p>}
            {slide.bullet_points && (
              <ul className="space-y-1.5">
                {slide.bullet_points.map((bp: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {bp}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {(slide.type === 'stat' || slide.type === 'fact') && (
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">{slide.title}</h3>
            {slide.subtitle && <p className="text-lg text-white/80">{slide.subtitle}</p>}
            {slide.content && <p className="text-sm text-white/70">{slide.content}</p>}
          </div>
        )}
        {(slide.type === 'cta' || slide.type === 'result') && (
          <div className="text-center space-y-3">
            <h3 className="text-xl font-bold">{slide.title}</h3>
            {slide.subtitle && <p className="text-sm text-white/80">{slide.subtitle}</p>}
            {slide.content && <p className="text-xs text-white/70">{slide.content}</p>}
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm font-medium">
              Nectforma →
            </div>
          </div>
        )}
        
        {/* Slide indicator */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {slides.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentSlide === 0}
          onClick={() => setCurrentSlide(prev => prev - 1)}
        >
          ← Précédent
        </Button>
        <span className="text-xs text-muted-foreground">{currentSlide + 1} / {slides.length}</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentSlide === slides.length - 1}
          onClick={() => setCurrentSlide(prev => prev + 1)}
        >
          Suivant →
        </Button>
      </div>
    </div>
  );
};

// ─── Video Script Preview ───
const VideoScriptPreview = ({ script }: { script: any }) => {
  if (!script) return null;
  
  let parsed = script;
  if (typeof script === 'string') {
    try { parsed = JSON.parse(script); } catch { return null; }
  }

  return (
    <div className="space-y-3">
      <div className="bg-black rounded-xl p-4 text-white space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Play className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium">Script Vidéo TikTok</span>
          <Badge className="bg-red-500/20 text-red-300 border-0 text-[10px] ml-auto">
            {parsed.total_duration_seconds || '~20'}s
          </Badge>
        </div>
        
        {parsed.hook && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-[10px] uppercase text-red-400 font-bold mb-1">🎯 Hook (3s)</p>
            <p className="text-sm">{parsed.hook}</p>
          </div>
        )}
        
        {parsed.scenes?.map((scene: any, i: number) => (
          <div key={i} className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/50">Scène {i + 1}</span>
              <span className="text-[10px] text-white/50">{scene.duration_seconds}s</span>
            </div>
            <p className="text-sm font-medium">{scene.text}</p>
            <p className="text-xs text-white/60 mt-1">📹 {scene.action}</p>
          </div>
        ))}

        {parsed.music_suggestion && (
          <div className="flex items-center gap-2 text-xs text-white/50 pt-2 border-t border-white/10">
            <Music2 className="h-3 w-3" />
            {parsed.music_suggestion}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Twitter Thread Preview ───
const ThreadPreview = ({ tweets }: { tweets: string[] }) => {
  if (!tweets || tweets.length === 0) return null;

  return (
    <div className="space-y-0">
      {tweets.map((tweet, i) => (
        <div key={i} className="relative pl-8 pb-4">
          {i < tweets.length - 1 && (
            <div className="absolute left-[13px] top-8 bottom-0 w-0.5 bg-border" />
          )}
          <div className="absolute left-0 top-1 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
            <Twitter className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm whitespace-pre-wrap">{tweet}</p>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {tweet.length}/280 caractères
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───
export const MultiChannelPreview: React.FC<MultiChannelPreviewProps> = ({
  articleId,
  articleTitle,
  onApprovalChange,
}) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState('linkedin');

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('content-autopilot', {
        body: { action: 'get-social-posts', article_id: articleId },
      });
      if (error) throw error;
      setPosts(data.posts || []);
      if (data.posts?.length > 0) {
        setActiveChannel(data.posts[0].platform);
      }
    } catch (e) {
      console.error('Error loading social posts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, [articleId]);

  const handleApproval = async (postId: string, approved: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('content-autopilot', {
        body: { action: 'approve-post', post_id: postId, approved },
      });
      if (error) throw error;
      toast.success(approved ? 'Contenu approuvé ✅' : 'Contenu rejeté');
      await loadPosts();
      onApprovalChange?.();
    } catch (e) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getChannelIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'tiktok': return <Music2 className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getChannelName = (platform: string) => {
    switch (platform) {
      case 'linkedin': return 'LinkedIn';
      case 'instagram': return 'Instagram';
      case 'tiktok': return 'TikTok';
      case 'twitter': return 'X (Twitter)';
      default: return platform;
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500 text-white text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Approuvé</Badge>;
      case 'rejected': return <Badge variant="destructive" className="text-[10px]"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Chargement des contenus...</p>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p className="text-sm">Aucun contenu social généré pour cet article.</p>
        </CardContent>
      </Card>
    );
  }

  const activePost = posts.find(p => p.platform === activeChannel);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Contenus multi-canal
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {posts.map(p => (
              <div key={p.id} className="flex items-center gap-1">
                {getChannelIcon(p.platform)}
                {getApprovalBadge(p.approval_status)}
              </div>
            ))}
          </div>
        </div>
        {articleTitle && (
          <p className="text-xs text-muted-foreground truncate">Article: {articleTitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeChannel} onValueChange={setActiveChannel}>
          <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${posts.length}, 1fr)` }}>
            {posts.map(post => (
              <TabsTrigger key={post.platform} value={post.platform} className="gap-1.5 text-xs">
                {getChannelIcon(post.platform)}
                <span className="hidden sm:inline">{getChannelName(post.platform)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {posts.map(post => (
            <TabsContent key={post.platform} value={post.platform} className="mt-4 space-y-4">
              {/* Approval actions */}
              <div className="flex items-center justify-between">
                {getApprovalBadge(post.approval_status)}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApproval(post.id, false)}
                    className="text-destructive hover:text-destructive"
                  >
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    Rejeter
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApproval(post.id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Approuver
                  </Button>
                </div>
              </div>

              {/* Caption */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  {post.platform === 'twitter' ? 'Thread' : 'Caption'}
                </p>
                {post.platform === 'twitter' && post.thread_tweets ? (
                  <ThreadPreview tweets={
                    Array.isArray(post.thread_tweets) 
                      ? post.thread_tweets as string[]
                      : []
                  } />
                ) : (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
                  </div>
                )}
              </div>

              {/* Hashtags */}
              {post.hashtags && post.hashtags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Hash className="h-3 w-3" /> Hashtags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Carousel Preview */}
              {(post.content_type === 'carousel' || post.structured_content?.slides) && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" /> Carrousel ({post.slide_count || post.structured_content?.slides?.length || 0} slides)
                  </p>
                  <CarouselSlidePreview
                    slides={post.structured_content?.slides || []}
                    platform={post.platform}
                  />
                </div>
              )}

              {/* TikTok carousel (separate from video) */}
              {post.platform === 'tiktok' && post.structured_content?.carousel?.slides && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" /> Carrousel TikTok
                  </p>
                  <CarouselSlidePreview
                    slides={post.structured_content.carousel.slides}
                    platform="tiktok"
                  />
                </div>
              )}

              {/* Video Script */}
              {(post.content_type === 'video_script' || post.video_script || post.structured_content?.video_script) && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Play className="h-3 w-3" /> Script Vidéo
                  </p>
                  <VideoScriptPreview script={post.video_script || post.structured_content?.video_script} />
                </div>
              )}

              {/* Content type info */}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground border-t pt-3">
                <span>Type: {post.content_type}</span>
                <span>•</span>
                <span>IA: {post.ai_generated ? 'Oui' : 'Non'}</span>
                <span>•</span>
                <span>Statut: {post.status}</span>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
