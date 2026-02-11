import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, 
  FileText, TrendingUp, BarChart3, Calendar, Clock,
  Globe, Folder, Send, Save, ArrowLeft, Sparkles,
  Target, Wand2, Bot, Home, ChevronDown, Check, Cpu,
  CalendarPlus, CalendarCheck, KeyRound, BookOpen, ArrowRight, Eye as EyeIcon,
  Zap, LogIn, LogOut
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import {
  getAllPosts, getCategories, getTags, createPost, updatePost, deletePost,
  publishPost, unpublishPost, createCategory, deleteCategory, createTag, deleteTag,
  setPostTags, getBlogStats, BlogPost, BlogCategory, BlogTag, BlogStats
} from '@/services/blogService';
import { AIGeneratedArticle } from '@/services/blogAIService';
import { AIContentGenerator } from '@/components/blog-admin/AIContentGenerator';
import { AISEOOptimizer } from '@/components/blog-admin/AISEOOptimizer';
import { AIContentEnhancer } from '@/components/blog-admin/AIContentEnhancer';
import { EnhancedArticleEditor } from '@/components/blog-admin/EnhancedArticleEditor';
import { BlogCalendarView } from '@/components/blog-admin/BlogCalendarView';
import { MonthlyArticleGenerator } from '@/components/blog-admin/MonthlyArticleGenerator';
import { AIAutopilotPanel } from '@/components/blog-admin/AIAutopilotPanel';
import logoNf from '@/assets/logo-nf.png';

// ============================================
// STAT CARD
// ============================================

const StatCard = ({ title, value, icon: Icon, trend, accent }: { 
  title: string; value: string | number; icon: React.ElementType; trend?: string; accent?: boolean;
}) => (
  <Card className={accent ? 'border-primary/30 bg-primary/5' : ''}>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold mt-1.5">{value}</p>
          {trend && <p className="text-xs text-green-500 mt-1 font-medium">{trend}</p>}
        </div>
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${accent ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
          <Icon className={`h-5 w-5 ${accent ? '' : 'text-primary'}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ============================================
// ARTICLE PREVIEW
// ============================================

const ArticlePreviewPanel = ({ formData, category }: { formData: Partial<BlogPost>; category?: BlogCategory }) => (
  <div className="space-y-6 p-4">
    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Aperçu page d'accueil</h3>
    <div className="bg-card rounded-2xl border-2 border-primary/20 overflow-hidden shadow-sm">
      <div className="flex flex-col">
        <div className="aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
          {formData.cover_image_url ? (
            <img src={formData.cover_image_url} alt={formData.title || ''} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-primary/30" />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {category && <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{category.name}</span>}
            <span className="text-[10px] text-muted-foreground">• {format(new Date(), 'dd/MM/yyyy', { locale: fr })}</span>
          </div>
          <h4 className="font-semibold text-sm leading-snug mb-2 line-clamp-2">{formData.title || 'Titre de l\'article'}</h4>
          {formData.excerpt && <p className="text-xs text-muted-foreground line-clamp-2">{formData.excerpt}</p>}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2">
            <ArrowRight className="h-3 w-3" /> Lire l'article
          </span>
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// AI POST EDITOR (with scheduling & auto-save)
// ============================================

const AIPostEditor = ({ 
  post, 
  categories,
  tags,
  onSave, 
  onClose,
  initialTopic
}: { 
  post?: BlogPost | null;
  categories: BlogCategory[];
  tags: BlogTag[];
  onSave: (data: Partial<BlogPost>, tagIds: string[]) => Promise<string | void>;
  onClose: () => void;
  initialTopic?: string;
}) => {
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: post?.title || '',
    slug: post?.slug || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    cover_image_url: post?.cover_image_url || '',
    category_id: post?.category_id || '',
    seo_title: post?.seo_title || '',
    seo_description: post?.seo_description || '',
    seo_keywords: post?.seo_keywords || [],
    status: post?.status || 'draft',
    scheduled_for: post?.scheduled_for || null
  });
  const [selectedTags, setSelectedTags] = useState<string[]>(
    post?.tags?.map(t => t.id) || []
  );
  const [saving, setSaving] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(!post);
  const [showPreview, setShowPreview] = useState(false);
  const [aiMode, setAiMode] = useState<'generate' | 'seo' | 'enhance'>('generate');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [postId, setPostId] = useState<string | null>(post?.id || null);
  const [scheduleDate, setScheduleDate] = useState(post?.scheduled_for ? post.scheduled_for.slice(0, 16) : '');

  const generateSlug = (title: string) => {
    const base = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
  };

  // Auto-save every 30 seconds
  const triggerAutoSave = useCallback(async () => {
    if (!formData.title?.trim()) return;
    try {
      const dataToSave = { ...formData, ...(postId ? { id: postId } : {}), status: formData.status || 'draft' as const };
      if (!postId) dataToSave.slug = generateSlug(formData.title || 'article');
      const savedId = await onSave(dataToSave, selectedTags);
      if (savedId && !postId) setPostId(savedId);
      setLastSaved(new Date());
    } catch (e) {
      console.error('Auto-save failed:', e);
    }
  }, [formData, selectedTags, onSave, postId]);

  useEffect(() => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => {
      if (formData.title?.trim()) triggerAutoSave();
    }, 30000);
    setAutoSaveTimer(timer);
    return () => clearTimeout(timer);
  }, [formData, selectedTags]);

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const handleSave = async (publish = false, schedule = false) => {
    if (!formData.title?.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    setSaving(true);
    try {
      const slug = postId ? formData.slug : generateSlug(formData.title || 'article');
      
      let status = formData.status;
      let scheduled_for = formData.scheduled_for;
      let published_at = formData.published_at;

      if (schedule && scheduleDate) {
        status = 'scheduled';
        scheduled_for = new Date(scheduleDate).toISOString();
      } else if (publish) {
        status = 'published';
        published_at = new Date().toISOString();
        scheduled_for = null;
      }

      const dataToSave = {
        ...formData,
        ...(postId ? { id: postId } : {}),
        slug,
        status,
        published_at,
        scheduled_for
      };

      const savedId = await onSave(dataToSave, selectedTags);
      if (savedId && !postId) setPostId(savedId);
      
      if (schedule) {
        toast.success(`Article programmé pour le ${format(new Date(scheduleDate), 'd MMMM yyyy à HH:mm', { locale: fr })}`);
      } else if (publish) {
        toast.success('Article publié sur la page d\'accueil !');
      } else {
        toast.success('Brouillon enregistré');
      }
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  // Import AI-generated article + auto-categorize + auto-save
  const handleAIArticleGenerated = async (article: AIGeneratedArticle) => {
    const newFormData: Partial<BlogPost> = {
      ...formData,
      title: article.title,
      slug: generateSlug(article.title),
      excerpt: article.excerpt,
      content: article.content,
      seo_title: article.seo_title,
      seo_description: article.seo_description,
      seo_keywords: article.seo_keywords
    };

    let matchingCat = categories.find(c => 
      c.name.toLowerCase().includes(article.suggested_category.toLowerCase()) ||
      article.suggested_category.toLowerCase().includes(c.name.toLowerCase())
    );
    if (matchingCat) {
      newFormData.category_id = matchingCat.id;
    } else if (categories.length > 0) {
      newFormData.category_id = categories[0].id;
    }

    setFormData(newFormData);

    const matchingTagIds = tags
      .filter(t => article.suggested_tags.some(st => 
        t.name.toLowerCase().includes(st.toLowerCase()) ||
        st.toLowerCase().includes(t.name.toLowerCase())
      ))
      .map(t => t.id);
    if (matchingTagIds.length > 0) setSelectedTags(matchingTagIds);

    setShowAIPanel(false);
    
    try {
      const dataToSave = { ...newFormData, status: 'draft' as const };
      const savedId = await onSave(dataToSave, matchingTagIds);
      if (savedId) setPostId(savedId);
      setLastSaved(new Date());
      toast.success('Article généré et sauvegardé automatiquement !');
    } catch (e) {
      console.error('Auto-save after generation failed:', e);
      toast.info('Article importé. Pensez à l\'enregistrer.');
    }
  };

  const handleApplySEOSuggestions = (suggestions: {
    title?: string; seo_description?: string; seo_keywords?: string[];
  }) => {
    setFormData(prev => ({
      ...prev,
      ...(suggestions.title && { seo_title: suggestions.title }),
      ...(suggestions.seo_description && { seo_description: suggestions.seo_description }),
      ...(suggestions.seo_keywords && { seo_keywords: suggestions.seo_keywords })
    }));
  };

  const handleApplyContent = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
    toast.success('Contenu mis à jour');
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden flex">
      <div className={`flex-1 overflow-auto ${showAIPanel ? 'lg:mr-[450px]' : showPreview ? 'lg:mr-[350px]' : ''}`}>
        <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-base font-semibold">
                  {post ? 'Modifier l\'article' : 'Nouvel article'}
                </h1>
                {lastSaved && (
                  <span className="text-[11px] text-muted-foreground">
                    Sauvegardé à {format(lastSaved, 'HH:mm')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={showPreview ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => { setShowPreview(!showPreview); if (!showPreview) setShowAIPanel(false); }}
              >
                <EyeIcon className="h-4 w-4 mr-1.5" />
                Aperçu
              </Button>
              <Button 
                variant={showAIPanel ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => { setShowAIPanel(!showAIPanel); if (!showAIPanel) setShowPreview(false); }}
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                IA
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving}>
                <Save className="h-4 w-4 mr-1.5" />
                Enregistrer
              </Button>
              
              {/* Schedule + Publish dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={saving} size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    <Send className="h-4 w-4 mr-1.5" />
                    Publier
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handleSave(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Publier maintenant
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    if (!scheduleDate) {
                      toast.error('Définissez une date de programmation dans les paramètres');
                      return;
                    }
                    handleSave(false, true);
                  }}>
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    Programmer la publication
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="grid lg:grid-cols-[1fr_280px] gap-8">
            <div className="space-y-6">
              <div>
                <Input
                  placeholder="Titre de l'article"
                  value={formData.title || ''}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-2xl font-bold h-auto py-3 border-0 border-b rounded-none focus-visible:ring-0 px-0"
                />
              </div>
              <div>
                <Label>Extrait</Label>
                <Textarea
                  placeholder="Un court résumé de l'article..."
                  value={formData.excerpt || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label className="mb-2 block">Contenu</Label>
                <EnhancedArticleEditor
                  content={formData.content || ''}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  title={formData.title}
                  onImageGenerated={(imageUrl) => {
                    if (!formData.cover_image_url) {
                      setFormData(prev => ({ ...prev, cover_image_url: imageUrl }));
                    }
                  }}
                />
              </div>
            </div>

            {/* Sidebar params */}
            <div className="space-y-5">
              {/* Schedule Card */}
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarPlus className="h-4 w-4 text-blue-500" />
                    Programmation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Date et heure de publication</Label>
                    <Input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="mt-1"
                    />
                  </div>
                  {scheduleDate && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(scheduleDate), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Paramètres</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Slug URL</Label>
                    <Input
                      value={formData.slug || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="mon-article"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Image de couverture</Label>
                    <Input
                      value={formData.cover_image_url || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Catégorie</Label>
                    <Select 
                      value={formData.category_id || ''} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Tags</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {tags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                          className="cursor-pointer text-[10px]"
                          onClick={() => {
                            setSelectedTags(prev => 
                              prev.includes(tag.id) 
                                ? prev.filter(id => id !== tag.id)
                                : [...prev, tag.id]
                            );
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    SEO
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Titre SEO</Label>
                    <Input
                      value={formData.seo_title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                      placeholder="Titre pour les moteurs de recherche"
                      className="mt-1"
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {(formData.seo_title || formData.title || '').length}/60
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Description SEO</Label>
                    <Textarea
                      value={formData.seo_description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                      placeholder="Description pour les moteurs de recherche"
                      rows={2}
                      className="mt-1"
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {(formData.seo_description || formData.excerpt || '').length}/160
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Mots-clés</Label>
                    <Input
                      value={formData.seo_keywords?.join(', ') || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        seo_keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                      }))}
                      placeholder="mot1, mot2, mot3"
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* AI Panel */}
      {showAIPanel && (
        <div className="fixed right-0 top-0 bottom-0 w-full lg:w-[450px] bg-background border-l overflow-auto z-20">
          <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Assistant IA</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowAIPanel(false)}>×</Button>
          </div>
          <div className="p-4">
            <Tabs value={aiMode} onValueChange={(v) => setAiMode(v as typeof aiMode)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="generate">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Générer
                </TabsTrigger>
                <TabsTrigger value="seo">
                  <Target className="h-4 w-4 mr-1" />
                  SEO
                </TabsTrigger>
                <TabsTrigger value="enhance">
                  <Wand2 className="h-4 w-4 mr-1" />
                  Améliorer
                </TabsTrigger>
              </TabsList>
              <div className="mt-4">
                <TabsContent value="generate">
                  <AIContentGenerator 
                    categories={categories}
                    onArticleGenerated={handleAIArticleGenerated}
                  />
                </TabsContent>
                <TabsContent value="seo">
                  <AISEOOptimizer
                    title={formData.title || ''}
                    content={formData.content || ''}
                    seo_description={formData.seo_description || undefined}
                    seo_keywords={formData.seo_keywords || undefined}
                    onApplySuggestions={handleApplySEOSuggestions}
                  />
                </TabsContent>
                <TabsContent value="enhance">
                  <AIContentEnhancer
                    title={formData.title || ''}
                    excerpt={formData.excerpt || ''}
                    content={formData.content || ''}
                    onApplyContent={handleApplyContent}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      )}

      {/* Preview Panel */}
      {showPreview && (
        <div className="fixed right-0 top-0 bottom-0 w-full lg:w-[350px] bg-background border-l overflow-auto z-20">
          <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeIcon className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Aperçu</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>×</Button>
          </div>
          <ArticlePreviewPanel 
            formData={formData} 
            category={categories.find(c => c.id === formData.category_id)}
          />
        </div>
      )}
    </div>
  );
};

// ============================================
// SEO TAB
// ============================================

const SEOTab = ({ posts }: { posts: BlogPost[] }) => {
  const keywordCounts: Record<string, number> = {};
  posts.forEach(post => {
    (post.seo_keywords || []).forEach(kw => {
      const k = kw.toLowerCase().trim();
      if (k) keywordCounts[k] = (keywordCounts[k] || 0) + 1;
    });
  });

  const sortedKeywords = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20);

  const postsWithSEO = posts.filter(p => p.seo_title || p.seo_description || (p.seo_keywords && p.seo_keywords.length > 0));
  const postsWithoutSEO = posts.filter(p => !p.seo_title && !p.seo_description && (!p.seo_keywords || p.seo_keywords.length === 0));

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard title="Articles optimisés SEO" value={postsWithSEO.length} icon={Target} />
        <StatCard title="Sans SEO" value={postsWithoutSEO.length} icon={Globe} />
        <StatCard title="Mots-clés uniques" value={Object.keys(keywordCounts).length} icon={KeyRound} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Mots-clés les plus utilisés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedKeywords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun mot-clé SEO défini</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sortedKeywords.map(([keyword, count]) => (
                <Badge key={keyword} variant="secondary" className="px-3 py-1.5">
                  {keyword} <span className="ml-1.5 text-xs bg-primary/20 text-primary rounded-full px-1.5">{count}</span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Articles sans optimisation SEO</CardTitle>
        </CardHeader>
        <CardContent>
          {postsWithoutSEO.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Tous les articles sont optimisés ! 🎉</p>
          ) : (
            <div className="space-y-2">
              {postsWithoutSEO.map(post => (
                <div key={post.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">{post.title}</span>
                  <Badge variant="outline" className="text-orange-500 border-orange-500">À optimiser</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================
// MAIN BLOG ADMIN
// ============================================

const BlogAdmin = () => {
  const navigate = useNavigate();
  const { canManageBlog, canViewAnalytics, loading: authLoading } = useSuperAdmin();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingPost, setEditingPost] = useState<BlogPost | null | 'new'>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeTab, setActiveTab] = useState('posts');

  // Track auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/blog-admin');
  };

  useEffect(() => {
    if (!authLoading && !canManageBlog) {
      navigate('/');
    }
  }, [authLoading, canManageBlog, navigate]);

  useEffect(() => {
    if (canManageBlog) loadData();
  }, [canManageBlog]);

  // Check for scheduled posts that should be published
  useEffect(() => {
    const checkScheduled = async () => {
      const now = new Date().toISOString();
      const toPublish = posts.filter(p => 
        p.status === 'scheduled' && p.scheduled_for && p.scheduled_for <= now
      );
      for (const post of toPublish) {
        try {
          await publishPost(post.id);
        } catch (e) {
          console.error(`Failed to auto-publish: ${post.title}`, e);
        }
      }
      if (toPublish.length > 0) {
        toast.success(`${toPublish.length} article(s) publié(s) automatiquement`);
        await loadData();
      }
    };

    if (posts.length > 0) checkScheduled();
    const interval = setInterval(checkScheduled, 60000);
    return () => clearInterval(interval);
  }, [posts]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsData, categoriesData, tagsData, statsData] = await Promise.all([
        getAllPosts(), getCategories(), getTags(), getBlogStats()
      ]);
      setPosts(postsData);
      setCategories(categoriesData);
      setTags(tagsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async (data: Partial<BlogPost>, tagIds: string[]): Promise<string | void> => {
    if (editingPost === 'new') {
      const existingId = data.id;
      if (existingId) {
        await updatePost(existingId, data);
        await setPostTags(existingId, tagIds);
        await loadData();
        return existingId;
      }
      const newPost = await createPost(data);
      if (tagIds.length > 0) await setPostTags(newPost.id, tagIds);
      await loadData();
      return newPost.id;
    } else if (editingPost) {
      await updatePost(editingPost.id, data);
      await setPostTags(editingPost.id, tagIds);
      await loadData();
      return editingPost.id;
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    try {
      await deletePost(id);
      toast.success('Article supprimé');
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      if (post.status === 'published') {
        await unpublishPost(post.id);
        toast.success('Article dépublié');
      } else {
        await publishPost(post.id);
        toast.success('Article publié');
      }
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleSchedulePost = async (postId: string, dateStr: string) => {
    const scheduledDate = new Date(dateStr).toISOString();
    await updatePost(postId, { status: 'scheduled', scheduled_for: scheduledDate });
    await loadData();
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await createCategory({
        name: newCategoryName,
        slug: newCategoryName.toLowerCase().replace(/\s+/g, '-')
      });
      setNewCategoryName('');
      setShowCategoryDialog(false);
      toast.success('Catégorie créée');
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allKeywords: Record<string, number> = {};
  posts.forEach(p => {
    (p.seo_keywords || []).forEach(kw => {
      const k = kw.toLowerCase().trim();
      if (k) allKeywords[k] = (allKeywords[k] || 0) + 1;
    });
  });
  const topKeyword = Object.entries(allKeywords).sort(([,a],[,b]) => b - a)[0];

  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;

  if (authLoading || (canManageBlog && loading)) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!canManageBlog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4">
          <img src={logoNf} alt="Nectforma" className="h-10 mx-auto" />
          <h1 className="text-xl font-semibold">Accès refusé</h1>
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas les droits nécessaires pour accéder à l'administration du blog.
          </p>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-green-500 text-white">Publié</Badge>;
      case 'draft': return <Badge variant="secondary">Brouillon</Badge>;
      case 'scheduled': return <Badge className="bg-blue-500 text-white">Programmé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoNf} alt="Nectforma" className="h-7" />
            <div>
              <h1 className="text-base font-bold flex items-center gap-2">
                Blog Admin
                <Badge variant="outline" className="text-[10px] h-5">
                  <Sparkles className="h-3 w-3 mr-0.5" />
                  IA
                </Badge>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.open('/blog', '_blank')}>
              <Eye className="h-4 w-4 mr-1.5" />
              Blog
            </Button>
            <Button size="sm" onClick={() => setEditingPost('new')}>
              <Plus className="h-4 w-4 mr-1.5" />
              Créer un article
            </Button>
            {isLoggedIn ? (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1.5" />
                Déconnexion
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                <LogIn className="h-4 w-4 mr-1.5" />
                Connexion
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatCard title="Total articles" value={stats.totalPosts} icon={FileText} />
            <StatCard title="Publiés" value={stats.publishedPosts} icon={Send} />
            <StatCard title="Programmés" value={scheduledCount} icon={CalendarCheck} accent={scheduledCount > 0} />
            <StatCard title="Vues totales" value={stats.totalViews.toLocaleString()} icon={TrendingUp} />
            <StatCard 
              title="Top mot-clé" 
              value={topKeyword ? topKeyword[0] : '—'} 
              icon={KeyRound}
              trend={topKeyword ? `${topKeyword[1]} article(s)` : undefined}
            />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="bg-background border h-auto p-1 flex-wrap">
            <TabsTrigger value="posts" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="scheduler" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              Planificateur
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-1.5">
              <Target className="h-4 w-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="autopilot" className="gap-1.5">
              <Cpu className="h-4 w-4" />
              Autopilot IA
            </TabsTrigger>
            {canViewAnalytics && (
              <TabsTrigger value="analytics" className="gap-1.5">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            )}
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row gap-3 justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="published">Publiés</SelectItem>
                      <SelectItem value="draft">Brouillons</SelectItem>
                      <SelectItem value="scheduled">Programmés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Vues</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Aucun article trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPosts.map(post => (
                        <TableRow key={post.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setEditingPost(post)}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{post.title}</p>
                              <p className="text-[11px] text-muted-foreground">/blog/{post.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{post.category?.name || '—'}</TableCell>
                          <TableCell>{getStatusBadge(post.status)}</TableCell>
                          <TableCell className="text-sm">{post.views_count}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {post.scheduled_for
                                ? <span className="text-blue-600 dark:text-blue-400">{format(new Date(post.scheduled_for), 'd MMM yyyy HH:mm', { locale: fr })}</span>
                                : post.published_at 
                                  ? format(new Date(post.published_at), 'd MMM yyyy', { locale: fr })
                                  : format(new Date(post.created_at), 'd MMM yyyy', { locale: fr })
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingPost(post); }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(`/blog/${post.slug}`, '_blank'); }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTogglePublish(post); }}>
                                  {post.status === 'published' ? (
                                    <><Clock className="h-4 w-4 mr-2" />Dépublier</>
                                  ) : (
                                    <><Send className="h-4 w-4 mr-2" />Publier</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduler Tab — Calendar + Monthly Generator */}
          <TabsContent value="scheduler">
            <div className="space-y-6">
              <MonthlyArticleGenerator 
                categories={categories} 
                onComplete={loadData} 
              />
              <BlogCalendarView
                posts={posts}
                onEditPost={(post) => setEditingPost(post)}
                onSchedulePost={handleSchedulePost}
              />
            </div>
          </TabsContent>


          {/* SEO Tab */}
          <TabsContent value="seo">
            <SEOTab posts={posts} />
          </TabsContent>

          {/* Autopilot Tab */}
          <TabsContent value="autopilot">
            <AIAutopilotPanel onContentGenerated={loadData} />
          </TabsContent>

          {/* Analytics Tab */}
          {canViewAnalytics && (
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques du Blog</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-4">Articles les plus vus</h3>
                        <div className="space-y-2">
                          {stats.topPosts.map((post, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span>{post.title}</span>
                              <Badge variant="outline">{post.views} vues</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-4">Vues par jour (30 derniers jours)</h3>
                        <div className="h-40 flex items-end gap-1">
                          {stats.viewsByDay.slice(-30).map((day, i) => (
                            <div 
                              key={i}
                              className="flex-1 bg-primary rounded-t min-h-[4px]"
                              style={{ 
                                height: `${Math.max(4, (day.views / Math.max(...stats.viewsByDay.map(d => d.views), 1) * 100))}%` 
                              }}
                              title={`${day.date}: ${day.views} vues`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* AI Post Editor */}
      {editingPost && (
        <AIPostEditor
          post={editingPost === 'new' ? null : editingPost}
          categories={categories}
          tags={tags}
          onSave={handleSavePost}
          onClose={() => setEditingPost(null)}
        />
      )}

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nom</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Tutoriels"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Annuler</Button>
            <Button onClick={handleCreateCategory}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogAdmin;
