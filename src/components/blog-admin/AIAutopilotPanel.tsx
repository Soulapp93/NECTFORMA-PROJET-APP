import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Bot, Play, Square, RefreshCw, Settings, Clock, CheckCircle2, XCircle,
  Zap, TrendingUp, AlertTriangle, Loader2, ChevronDown, ChevronUp,
  Linkedin, Instagram, Twitter, Music2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MultiChannelPreview } from './MultiChannelPreview';

interface AutopilotSettings {
  autopilot_enabled: boolean;
  autopilot_frequency: string;
  autopilot_topics: string[];
  autopilot_tone: string;
  autopilot_last_run: string | null;
  emergency_stop: boolean;
  require_approval: boolean;
  auto_publish_enabled: boolean;
}

interface AutopilotRun {
  id: string;
  run_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  trend_topic: string | null;
  social_posts_generated: number;
  error_message: string | null;
  ai_model: string;
  article_id: string | null;
  metadata: Record<string, any> | null;
}

export const AIAutopilotPanel = ({ onContentGenerated }: { onContentGenerated?: () => void }) => {
  const [settings, setSettings] = useState<AutopilotSettings | null>(null);
  const [runs, setRuns] = useState<AutopilotRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [testingTrends, setTestingTrends] = useState(false);
  const [trendResult, setTrendResult] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [topicsInput, setTopicsInput] = useState('');
  const [selectedRunArticleId, setSelectedRunArticleId] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('content-autopilot', {
        body: { action: 'status' },
      });
      if (error) throw error;
      setSettings(data.settings || {
        autopilot_enabled: false,
        autopilot_frequency: 'daily',
        autopilot_topics: ['EdTech', 'Formation professionnelle', 'SaaS éducation', 'Digital learning'],
        autopilot_tone: 'professionnel',
        autopilot_last_run: null,
        emergency_stop: false,
        require_approval: true,
        auto_publish_enabled: false,
      });
      setRuns(data.runs || []);
      if (data.settings?.autopilot_topics) {
        setTopicsInput(data.settings.autopilot_topics.join(', '));
      }
    } catch (e) {
      console.error('Error loading autopilot status:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const toggleAutopilot = async (enabled: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('content-autopilot', {
        body: { action: 'toggle', enabled },
      });
      if (error) throw error;
      setSettings(prev => prev ? { ...prev, autopilot_enabled: enabled, emergency_stop: !enabled } : prev);
      toast.success(enabled ? '🤖 Autopilot IA activé !' : 'Autopilot IA désactivé');
    } catch (e) {
      toast.error('Erreur lors du changement');
    }
  };

  const runOnce = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('content-autopilot', {
        body: { action: 'run-once', force: true },
      });
      if (error) throw error;
      if (data.success) {
        toast.success(`✅ Article généré: "${data.topic}"`, { duration: 5000 });
        onContentGenerated?.();
      } else {
        toast.error(data.error || 'Échec de la génération');
      }
      await loadStatus();
    } catch (e) {
      console.error('Run error:', e);
      toast.error('Erreur lors de l\'exécution');
    } finally {
      setRunning(false);
    }
  };

  const testTrends = async () => {
    setTestingTrends(true);
    setTrendResult(null);
    try {
      const topics = topicsInput.split(',').map(t => t.trim()).filter(Boolean);
      const { data, error } = await supabase.functions.invoke('content-autopilot', {
        body: { action: 'test-trends', topics },
      });
      if (error) throw error;
      setTrendResult(data.trends);
      toast.success('Tendance détectée !');
    } catch (e) {
      toast.error('Erreur lors de la détection');
    } finally {
      setTestingTrends(false);
    }
  };

  const updateSettings = async (updates: Partial<AutopilotSettings>) => {
    try {
      const { error } = await supabase.functions.invoke('content-autopilot', {
        body: {
          action: 'update-settings',
          ...(updates.autopilot_topics && { topics: updates.autopilot_topics }),
          ...(updates.autopilot_tone && { tone: updates.autopilot_tone }),
          ...(updates.autopilot_frequency && { frequency: updates.autopilot_frequency }),
          ...(updates.require_approval !== undefined && { require_approval: updates.require_approval }),
          ...(updates.auto_publish_enabled !== undefined && { auto_publish_enabled: updates.auto_publish_enabled }),
        },
      });
      if (error) throw error;
      setSettings(prev => prev ? { ...prev, ...updates } : prev);
      toast.success('Paramètres mis à jour');
    } catch (e) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card><CardContent className="p-6 text-center text-muted-foreground">Chargement de l'autopilot...</CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Control Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Moteur IA Autonome
                  {settings?.autopilot_enabled && (
                    <Badge className="bg-green-500 text-white text-[10px] h-5">ACTIF</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Détection de tendances → Génération d'articles → Publication automatique
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={settings?.autopilot_enabled || false}
              onCheckedChange={toggleAutopilot}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-background rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{runs.filter(r => r.status === 'completed').length}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Exécutions réussies</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{runs.reduce((s, r) => s + (r.social_posts_generated || 0), 0)}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Posts sociaux</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-xs">
                {settings?.autopilot_last_run
                  ? format(new Date(settings.autopilot_last_run), 'dd/MM HH:mm', { locale: fr })
                  : 'Jamais'}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">Dernière exécution</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={runOnce}
              disabled={running}
              className="flex-1"
              variant={running ? 'secondary' : 'default'}
            >
              {running ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Génération en cours...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" />Lancer maintenant</>
              )}
            </Button>
            <Button variant="outline" onClick={testTrends} disabled={testingTrends}>
              {testingTrends ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Trend Test Result */}
          {trendResult && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">Tendance détectée</span>
              </div>
              <p className="text-sm font-semibold">{trendResult.topic}</p>
              <p className="text-xs text-muted-foreground">{trendResult.context?.substring(0, 200)}...</p>
              {trendResult.sources?.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {trendResult.sources.length} source(s) trouvée(s)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Paramètres de l'Autopilot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Sujets à surveiller (séparés par des virgules)</Label>
              <Input
                value={topicsInput}
                onChange={(e) => setTopicsInput(e.target.value)}
                placeholder="EdTech, Formation professionnelle, Digital learning"
                className="mt-1"
              />
              <Button
                variant="ghost"
                size="sm"
                className="mt-1"
                onClick={() => updateSettings({
                  autopilot_topics: topicsInput.split(',').map(t => t.trim()).filter(Boolean)
                })}
              >
                Sauvegarder les sujets
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Ton éditorial</Label>
                <Select
                  value={settings?.autopilot_tone || 'professionnel'}
                  onValueChange={(v) => updateSettings({ autopilot_tone: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professionnel">Professionnel</SelectItem>
                    <SelectItem value="educatif">Éducatif</SelectItem>
                    <SelectItem value="engageant">Engageant</SelectItem>
                    <SelectItem value="expert">Expert technique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Fréquence</Label>
                <Select
                  value={settings?.autopilot_frequency || 'daily'}
                  onValueChange={(v) => updateSettings({ autopilot_frequency: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="3x_week">3x / semaine</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Publication automatique</Label>
                <Switch
                  checked={settings?.auto_publish_enabled || false}
                  onCheckedChange={(v) => updateSettings({ auto_publish_enabled: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Approbation manuelle requise</Label>
                <Switch
                  checked={settings?.require_approval ?? true}
                  onCheckedChange={(v) => updateSettings({ require_approval: v })}
                />
              </div>
            </div>

            {settings?.emergency_stop && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                  Arrêt d'urgence actif — Autopilot désactivé
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Execution Logs */}
      <Card>
        <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowLogs(!showLogs)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historique d'exécution
              <Badge variant="outline" className="text-[10px]">{runs.length}</Badge>
            </CardTitle>
            {showLogs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {showLogs && (
          <CardContent className="pt-0">
            {runs.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">Aucune exécution</p>
            ) : (
              <div className="space-y-2">
                {runs.map(run => (
                  <React.Fragment key={run.id}>
                    <div className="flex flex-col gap-2 p-2.5 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(run.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {run.trend_topic || run.run_type}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(run.started_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            {run.social_posts_generated > 0 && ` • ${run.social_posts_generated} posts`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {run.metadata && typeof run.metadata === 'object' && (run.metadata as any).channels && (
                            <div className="flex items-center gap-0.5">
                              {((run.metadata as any).channels as string[]).map((ch: string) => {
                                switch (ch) {
                                  case 'linkedin': return <Linkedin key={ch} className="h-3 w-3 text-blue-600" />;
                                  case 'instagram': return <Instagram key={ch} className="h-3 w-3 text-pink-500" />;
                                  case 'tiktok': return <Music2 key={ch} className="h-3 w-3" />;
                                  case 'twitter': return <Twitter key={ch} className="h-3 w-3 text-sky-500" />;
                                  default: return null;
                                }
                              })}
                            </div>
                          )}
                          <Badge
                            variant={run.status === 'completed' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'}
                            className="text-[10px]"
                          >
                            {run.status === 'completed' ? 'OK' : run.status === 'failed' ? 'Erreur' : run.status}
                          </Badge>
                          {run.status === 'completed' && run.article_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRunArticleId(
                                  selectedRunArticleId === run.article_id ? null : run.article_id
                                );
                              }}
                            >
                              Voir contenus
                            </Button>
                          )}
                        </div>
                      </div>
                      {selectedRunArticleId === run.article_id && run.article_id && (
                        <MultiChannelPreview
                          articleId={run.article_id}
                          articleTitle={run.trend_topic || undefined}
                        />
                      )}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};
