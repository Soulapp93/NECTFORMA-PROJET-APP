import React, { useState, useEffect } from 'react';
import {
  Send, Clock, Sparkles, RefreshCw, Check, AlertCircle,
  Calendar, Eye, Edit2, Copy, Image, ExternalLink, Zap
} from 'lucide-react';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  SocialPlatform, PLATFORM_INFO, GeneratedCaption,
  generateCaptions, schedulePost, publishPost, suggestBestTime,
  getConnections, getSocialPosts, generateSocialImage,
  SocialConnection, SocialPost
} from '@/services/socialMediaService';

interface SocialPublishPanelProps {
  blogPostId?: string;
  title: string;
  excerpt: string;
  content: string;
  blogUrl?: string;
  onClose?: () => void;
}

const AVAILABLE_PLATFORMS: SocialPlatform[] = [
  'linkedin', 'twitter', 'facebook', 'instagram', 'tiktok', 'youtube'
];

export const SocialPublishPanel = ({
  blogPostId,
  title,
  excerpt,
  content,
  blogUrl,
  onClose
}: SocialPublishPanelProps) => {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [generatedCaptions, setGeneratedCaptions] = useState<Record<SocialPlatform, GeneratedCaption>>({} as any);
  const [editedCaptions, setEditedCaptions] = useState<Record<SocialPlatform, GeneratedCaption>>({} as any);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [existingPosts, setExistingPosts] = useState<SocialPost[]>([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [bestTimes, setBestTimes] = useState<Record<SocialPlatform, { day: string; time: string; reason: string }[]>>({} as any);
  const [generatingImage, setGeneratingImage] = useState<SocialPlatform | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<SocialPlatform, string>>({} as any);

  useEffect(() => {
    loadData();
  }, [blogPostId]);

  const loadData = async () => {
    try {
      const [conns, posts] = await Promise.all([
        getConnections(),
        blogPostId ? getSocialPosts({ blog_post_id: blogPostId }) : Promise.resolve([])
      ]);
      setConnections(conns);
      setExistingPosts(posts);

      // Auto-select connected platforms
      const connected = conns
        .filter(c => c.connection_status === 'connected')
        .map(c => c.platform);
      setSelectedPlatforms(connected.slice(0, 3)); // Default to first 3 connected
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleGenerateCaptions = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Sélectionnez au moins une plateforme');
      return;
    }

    setGenerating(true);
    try {
      const captions = await generateCaptions(
        title,
        excerpt,
        content,
        selectedPlatforms,
        blogUrl
      );
      setGeneratedCaptions(captions);
      setEditedCaptions(captions);
      toast.success('Contenus générés avec succès !');
    } catch (error) {
      console.error('Error generating captions:', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateCaption = async (platform: SocialPlatform) => {
    setGenerating(true);
    try {
      const captions = await generateCaptions(title, excerpt, content, [platform], blogUrl);
      if (captions[platform]) {
        setGeneratedCaptions(prev => ({ ...prev, [platform]: captions[platform] }));
        setEditedCaptions(prev => ({ ...prev, [platform]: captions[platform] }));
        toast.success(`${PLATFORM_INFO[platform].name} régénéré`);
      }
    } catch (error) {
      toast.error('Erreur lors de la régénération');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImage = async (platform: SocialPlatform) => {
    setGeneratingImage(platform);
    try {
      const result = await generateSocialImage(title, platform);
      if (result.image_url) {
        setGeneratedImages(prev => ({ ...prev, [platform]: result.image_url }));
        toast.success('Image générée !');
      }
    } catch (error) {
      toast.error("Erreur lors de la génération d'image");
    } finally {
      setGeneratingImage(null);
    }
  };

  const handleSuggestBestTime = async (platform: SocialPlatform) => {
    try {
      const result = await suggestBestTime(platform);
      setBestTimes(prev => ({ ...prev, [platform]: result.best_times }));
    } catch (error) {
      console.error('Error suggesting best time:', error);
    }
  };

  const handlePublishNow = async () => {
    const platformsToPublish = selectedPlatforms.filter(p => editedCaptions[p]);
    
    if (platformsToPublish.length === 0) {
      toast.error('Générez d\'abord les contenus');
      return;
    }

    setPublishing(true);
    const results: { platform: SocialPlatform; success: boolean; message?: string }[] = [];

    for (const platform of platformsToPublish) {
      try {
        // First schedule with immediate time
        const post = await schedulePost(
          platform,
          editedCaptions[platform].caption,
          editedCaptions[platform].hashtags || [],
          new Date().toISOString(),
          blogPostId,
          generatedImages[platform] ? [generatedImages[platform]] : undefined,
          true
        );

        if (post) {
          // Then publish
          const result = await publishPost(post.id);
          results.push({
            platform,
            success: result.success,
            message: result.message
          });
        }
      } catch (error) {
        results.push({
          platform,
          success: false,
          message: String(error)
        });
      }
    }

    setPublishing(false);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (successCount > 0) {
      toast.success(`${successCount} publication(s) réussie(s)`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} publication(s) échouée(s)`);
    }

    await loadData();
  };

  const handleSchedulePosts = async () => {
    if (!scheduledDate) {
      toast.error('Sélectionnez une date');
      return;
    }

    const platformsToSchedule = selectedPlatforms.filter(p => editedCaptions[p]);
    
    if (platformsToSchedule.length === 0) {
      toast.error('Générez d\'abord les contenus');
      return;
    }

    setScheduling(true);

    // Combine date and time
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduleDateTime = setMinutes(setHours(scheduledDate, hours), minutes);

    let successCount = 0;

    for (const platform of platformsToSchedule) {
      try {
        await schedulePost(
          platform,
          editedCaptions[platform].caption,
          editedCaptions[platform].hashtags || [],
          scheduleDateTime.toISOString(),
          blogPostId,
          generatedImages[platform] ? [generatedImages[platform]] : undefined,
          true
        );
        successCount++;
      } catch (error) {
        console.error(`Error scheduling ${platform}:`, error);
      }
    }

    setScheduling(false);
    setShowScheduleDialog(false);

    if (successCount > 0) {
      toast.success(`${successCount} publication(s) programmée(s) pour ${format(scheduleDateTime, 'PPP à HH:mm', { locale: fr })}`);
    }

    await loadData();
  };

  const isConnected = (platform: SocialPlatform) => {
    return connections.some(c => c.platform === platform && c.connection_status === 'connected');
  };

  const togglePlatform = (platform: SocialPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié !');
  };

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" />
            Plateformes de publication
          </CardTitle>
          <CardDescription>
            Sélectionnez les réseaux sociaux où publier cet article
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AVAILABLE_PLATFORMS.map(platform => {
              const info = PLATFORM_INFO[platform];
              const connected = isConnected(platform);
              const selected = selectedPlatforms.includes(platform);

              return (
                <div
                  key={platform}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                    ${!connected ? 'opacity-50' : ''}
                  `}
                  onClick={() => connected && togglePlatform(platform)}
                >
                  <Checkbox
                    checked={selected}
                    disabled={!connected}
                    onCheckedChange={() => connected && togglePlatform(platform)}
                  />
                  <span className="text-xl">{info.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{info.name}</p>
                    {!connected && (
                      <p className="text-xs text-muted-foreground">Non connecté</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleGenerateCaptions}
        disabled={generating || selectedPlatforms.length === 0}
      >
        {generating ? (
          <>
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            Génération en cours...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            Générer les contenus IA
          </>
        )}
      </Button>

      {/* Generated Content */}
      {Object.keys(editedCaptions).length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Edit2 className="h-4 w-4" />
            Contenus générés
          </h3>

          <Tabs defaultValue={selectedPlatforms[0]} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              {selectedPlatforms.filter(p => editedCaptions[p]).map(platform => (
                <TabsTrigger key={platform} value={platform} className="gap-2">
                  <span>{PLATFORM_INFO[platform].icon}</span>
                  {PLATFORM_INFO[platform].name}
                </TabsTrigger>
              ))}
            </TabsList>

            {selectedPlatforms.filter(p => editedCaptions[p]).map(platform => {
              const caption = editedCaptions[platform];
              const info = PLATFORM_INFO[platform];

              return (
                <TabsContent key={platform} value={platform} className="mt-4 space-y-4">
                  {/* Caption */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Texte du post</Label>
                      <span className="text-xs text-muted-foreground">
                        {caption.caption?.length || 0}/{info.charLimit} caractères
                      </span>
                    </div>
                    <Textarea
                      value={caption.caption || ''}
                      onChange={(e) => setEditedCaptions(prev => ({
                        ...prev,
                        [platform]: { ...prev[platform], caption: e.target.value }
                      }))}
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegenerateCaption(platform)}
                        disabled={generating}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Régénérer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(caption.caption || '')}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copier
                      </Button>
                    </div>
                  </div>

                  {/* Hashtags */}
                  {caption.hashtags && caption.hashtags.length > 0 && (
                    <div className="space-y-2">
                      <Label>Hashtags</Label>
                      <div className="flex flex-wrap gap-2">
                        {caption.hashtags.map((tag, i) => (
                          <Badge key={i} variant="secondary">
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(caption.hashtags?.join(' ') || '')}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copier les hashtags
                      </Button>
                    </div>
                  )}

                  {/* Twitter Thread */}
                  {platform === 'twitter' && caption.thread && caption.thread.length > 1 && (
                    <div className="space-y-2">
                      <Label>Thread ({caption.thread.length} tweets)</Label>
                      <div className="space-y-2">
                        {caption.thread.map((tweet, i) => (
                          <div key={i} className="p-3 bg-muted rounded-lg text-sm">
                            <span className="text-muted-foreground mr-2">{i + 1}.</span>
                            {tweet}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image Generation */}
                  <div className="space-y-2">
                    <Label>Image de couverture</Label>
                    {generatedImages[platform] ? (
                      <div className="relative">
                        <img
                          src={generatedImages[platform]}
                          alt="Generated cover"
                          className="w-full rounded-lg border"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute bottom-2 right-2"
                          onClick={() => handleGenerateImage(platform)}
                          disabled={generatingImage === platform}
                        >
                          {generatingImage === platform ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => handleGenerateImage(platform)}
                        disabled={generatingImage === platform}
                        className="w-full"
                      >
                        {generatingImage === platform ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Image className="h-4 w-4 mr-2" />
                            Générer une image IA
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Best Time Suggestion */}
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSuggestBestTime(platform)}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Meilleur moment pour publier
                    </Button>
                    {bestTimes[platform] && (
                      <div className="flex flex-wrap gap-2">
                        {bestTimes[platform].slice(0, 3).map((time, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {time.day} {time.time} - {time.reason}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      )}

      {/* Existing Posts */}
      {existingPosts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Publications existantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {existingPosts.map(post => (
                <div key={post.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>{PLATFORM_INFO[post.platform].icon}</span>
                    <span className="text-sm">{PLATFORM_INFO[post.platform].name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      post.status === 'published' ? 'default' :
                      post.status === 'scheduled' ? 'secondary' :
                      post.status === 'failed' ? 'destructive' : 'outline'
                    }>
                      {post.status === 'published' && <Check className="h-3 w-3 mr-1" />}
                      {post.status === 'scheduled' && <Clock className="h-3 w-3 mr-1" />}
                      {post.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {post.status}
                    </Badge>
                    {post.external_post_url && (
                      <a href={post.external_post_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {Object.keys(editedCaptions).length > 0 && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowScheduleDialog(true)}
            disabled={scheduling}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Programmer
          </Button>
          <Button
            className="flex-1"
            onClick={handlePublishNow}
            disabled={publishing}
          >
            {publishing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Publication...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Publier maintenant
              </>
            )}
          </Button>
        </div>
      )}

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programmer la publication</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date de publication</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {scheduledDate 
                      ? format(scheduledDate, 'PPP', { locale: fr })
                      : 'Sélectionner une date'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarPicker
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Heure de publication</Label>
              <Select value={scheduledTime} onValueChange={setScheduledTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, h) => (
                    <React.Fragment key={h}>
                      <SelectItem value={`${h.toString().padStart(2, '0')}:00`}>
                        {h.toString().padStart(2, '0')}:00
                      </SelectItem>
                      <SelectItem value={`${h.toString().padStart(2, '0')}:30`}>
                        {h.toString().padStart(2, '0')}:30
                      </SelectItem>
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plateformes sélectionnées</Label>
              <div className="flex flex-wrap gap-2">
                {selectedPlatforms.filter(p => editedCaptions[p]).map(platform => (
                  <Badge key={platform}>
                    {PLATFORM_INFO[platform].icon} {PLATFORM_INFO[platform].name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSchedulePosts} disabled={scheduling || !scheduledDate}>
              {scheduling ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Programmation...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Programmer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
