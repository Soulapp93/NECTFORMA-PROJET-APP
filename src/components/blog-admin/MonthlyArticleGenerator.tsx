import React, { useState } from 'react';
import {
  Sparkles, Calendar, Loader2, Check, Clock, ChevronRight,
  Wand2, RefreshCw, CalendarPlus, FileText, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format, addWeeks, startOfWeek, addDays, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateArticle, GenerateArticleParams } from '@/services/blogAIService';
import { createPost, updatePost, BlogCategory } from '@/services/blogService';
import { supabase } from '@/integrations/supabase/client';

interface MonthlyArticleGeneratorProps {
  categories: BlogCategory[];
  onComplete: () => void;
}

interface GeneratedPlan {
  week: number;
  title: string;
  topic: string;
  scheduledDate: Date;
  status: 'pending' | 'generating' | 'generated' | 'scheduled' | 'error';
  postId?: string;
  error?: string;
}

export const MonthlyArticleGenerator: React.FC<MonthlyArticleGeneratorProps> = ({
  categories,
  onComplete
}) => {
  const [theme, setTheme] = useState('');
  const [autoMode, setAutoMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [publishTime, setPublishTime] = useState('09:00');
  const [publishDay, setPublishDay] = useState<'1' | '2' | '3' | '4' | '5'>('2'); // Tuesday by default
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<GeneratedPlan[]>([]);
  const [step, setStep] = useState<'config' | 'review' | 'progress'>('config');

  const dayLabels: Record<string, string> = {
    '1': 'Lundi', '2': 'Mardi', '3': 'Mercredi', '4': 'Jeudi', '5': 'Vendredi'
  };

  // Generate the 4 weekly dates starting from next week
  const getWeeklyDates = () => {
    const today = new Date();
    const nextWeek = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
    const dayOffset = parseInt(publishDay) - 1; // Monday = 0
    const [hours, minutes] = publishTime.split(':').map(Number);

    return Array.from({ length: 4 }, (_, i) => {
      const date = addDays(addWeeks(nextWeek, i), dayOffset);
      return setMinutes(setHours(date, hours), minutes);
    });
  };

  // Step 1: Generate topic plan
  const generatePlan = async () => {
    setGenerating(true);
    try {
      const dates = getWeeklyDates();
      const topics = autoMode
        ? [
          'Les tendances de la formation professionnelle',
          'Comment optimiser le suivi des apprenants',
          'L\'importance de la digitalisation de l\'émargement',
          'Guide pratique pour gérer un organisme de formation'
        ]
        : [];

      // If theme is provided, use AI to generate 4 related topics
      if (theme.trim() || autoMode) {
        const { data, error } = await supabase.functions.invoke('blog-ai', {
          body: {
            action: 'suggest-topics',
            payload: {
              existing_topics: [],
              period: 'month',
              count: 4,
              instructions: autoMode
                ? 'Génère 4 sujets d\'articles pertinents pour Nectforma, une plateforme SaaS de gestion de formations professionnelles. Thèmes: formation, e-learning, émargement, suivi pédagogique, digitalisation.'
                : `Génère 4 sujets d'articles sur le thème: "${theme}". Contexte: Nectforma, plateforme SaaS de gestion de formations professionnelles.`
            }
          }
        });

        if (!error && data?.success) {
          const suggestions = data.data?.content_calendar || data.data?.trending_topics || [];
          const newPlan: GeneratedPlan[] = dates.map((date, i) => ({
            week: i + 1,
            title: suggestions[i]?.topic || suggestions[i]?.title || `Article ${i + 1}`,
            topic: suggestions[i]?.topic || suggestions[i]?.title || theme || 'Formation professionnelle',
            scheduledDate: date,
            status: 'pending' as const
          }));
          setPlan(newPlan);
          setStep('review');
        } else {
          // Fallback: generate basic plan from theme
          const newPlan: GeneratedPlan[] = dates.map((date, i) => ({
            week: i + 1,
            title: `${theme || 'Formation'} - Partie ${i + 1}`,
            topic: theme || 'Formation professionnelle',
            scheduledDate: date,
            status: 'pending' as const
          }));
          setPlan(newPlan);
          setStep('review');
        }
      }
    } catch (error) {
      console.error('Plan generation error:', error);
      toast.error('Erreur lors de la génération du plan');
    } finally {
      setGenerating(false);
    }
  };

  // Step 2: Generate all articles and schedule them
  const executeGeneration = async () => {
    setStep('progress');

    for (let i = 0; i < plan.length; i++) {
      const item = plan[i];
      setPlan(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'generating' } : p));

      try {
        // Generate article content via AI
        const article = await generateArticle({
          topic: item.topic,
          audience: 'professionnels de la formation, organismes de formation, CFA',
          tone: 'professional',
          length: 'medium',
          language: 'fr',
          category: selectedCategory
            ? categories.find(c => c.id === selectedCategory)?.name
            : undefined
        });

        // Create the post
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const slug = article.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          + '-' + Date.now().toString(36);

        const post = await createPost({
          title: article.title,
          slug,
          content: article.content,
          excerpt: article.excerpt,
          category_id: selectedCategory || null,
          seo_title: article.seo_title,
          seo_description: article.seo_description,
          seo_keywords: article.seo_keywords,
          status: 'scheduled',
          scheduled_for: item.scheduledDate.toISOString()
        });

        setPlan(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'scheduled', postId: post.id, title: article.title } : p
        ));
      } catch (error) {
        console.error(`Error generating article ${i + 1}:`, error);
        setPlan(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'error', error: 'Échec de la génération' } : p
        ));
      }
    }

    toast.success('Plan éditorial mensuel généré et programmé !');
    onComplete();
  };

  const updatePlanTitle = (index: number, newTitle: string) => {
    setPlan(prev => prev.map((p, i) => i === index ? { ...p, title: newTitle, topic: newTitle } : p));
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Générateur mensuel d'articles
        </CardTitle>
        <CardDescription>
          Créez automatiquement 4 articles (1 par semaine) pour le mois à venir
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'config' && (
          <div className="space-y-6">
            {/* Auto mode toggle */}
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wand2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Mode 100% IA automatique</p>
                  <p className="text-xs text-muted-foreground">L'IA choisit les sujets pertinents pour Nectforma</p>
                </div>
              </div>
              <Switch checked={autoMode} onCheckedChange={setAutoMode} />
            </div>

            {/* Theme input */}
            {!autoMode && (
              <div>
                <Label>Thème général</Label>
                <Input
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex: Formation en ligne, E-learning, Digitalisation..."
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  L'IA générera 4 articles autour de ce thème
                </p>
              </div>
            )}

            {/* Category */}
            <div>
              <Label>Catégorie (optionnel)</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Choisir une catégorie..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule config */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jour de publication</Label>
                <Select value={publishDay} onValueChange={(v) => setPublishDay(v as any)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(dayLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Heure de publication</Label>
                <Input
                  type="time"
                  value={publishTime}
                  onChange={(e) => setPublishTime(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <Button
              onClick={generatePlan}
              disabled={generating || (!autoMode && !theme.trim())}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération du plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer le plan éditorial
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Vérifiez et ajustez les titres avant de lancer la génération complète.
            </p>

            <div className="space-y-3">
              {plan.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl border">
                  <div className="text-center shrink-0 w-12 pt-1">
                    <Badge variant="outline" className="text-xs">S{item.week}</Badge>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Input
                      value={item.title}
                      onChange={(e) => updatePlanTitle(idx, e.target.value)}
                      className="font-medium"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarPlus className="h-3 w-3" />
                      {format(item.scheduledDate, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('config')} className="flex-1">
                Retour
              </Button>
              <Button variant="outline" onClick={generatePlan} disabled={generating}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Régénérer
              </Button>
              <Button onClick={executeGeneration} className="flex-1">
                <Sparkles className="h-4 w-4 mr-2" />
                Générer les 4 articles
              </Button>
            </div>
          </div>
        )}

        {step === 'progress' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Génération et programmation en cours...
            </p>

            <div className="space-y-3">
              {plan.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border">
                  <div className="shrink-0">
                    {item.status === 'generating' && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
                    {item.status === 'scheduled' && <Check className="h-5 w-5 text-green-500" />}
                    {item.status === 'error' && <span className="text-red-500 text-sm">✗</span>}
                    {item.status === 'pending' && <Clock className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(item.scheduledDate, 'd MMM yyyy', { locale: fr })}
                      {item.status === 'scheduled' && ' — Programmé ✓'}
                      {item.status === 'error' && ` — ${item.error}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    Semaine {item.week}
                  </Badge>
                </div>
              ))}
            </div>

            {plan.every(p => p.status === 'scheduled' || p.status === 'error') && (
              <Button onClick={() => { setStep('config'); setPlan([]); }} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Terminé — Voir le calendrier
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
