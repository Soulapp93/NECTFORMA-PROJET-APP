import React, { useState } from 'react';
import { 
  Target, Loader2, AlertTriangle, CheckCircle2, 
  TrendingUp, Link, FileCode, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { optimizeSEO, AISEOAnalysis, calculateSEOScore } from '@/services/blogAIService';

interface AISEOOptimizerProps {
  title: string;
  content: string;
  seo_description?: string;
  seo_keywords?: string[];
  onApplySuggestions: (suggestions: {
    title?: string;
    seo_description?: string;
    seo_keywords?: string[];
  }) => void;
}

export const AISEOOptimizer: React.FC<AISEOOptimizerProps> = ({
  title,
  content,
  seo_description,
  seo_keywords,
  onApplySuggestions
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AISEOAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!title || !content) {
      toast.error('Titre et contenu requis pour l\'analyse');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await optimizeSEO({
        title,
        content,
        seo_description,
        seo_keywords
      });
      setAnalysis(result);
      toast.success('Analyse SEO terminée');
    } catch (error) {
      console.error('SEO analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'analyse');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyTitleSuggestion = () => {
    if (analysis?.title_analysis.improved_title) {
      onApplySuggestions({ title: analysis.title_analysis.improved_title });
      toast.success('Titre mis à jour');
    }
  };

  const applyDescriptionSuggestion = () => {
    if (analysis?.meta_analysis.improved_description) {
      onApplySuggestions({ seo_description: analysis.meta_analysis.improved_description });
      toast.success('Meta description mise à jour');
    }
  };

  const scoreInfo = analysis ? calculateSEOScore(analysis) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Optimiseur SEO IA
          </CardTitle>
          <CardDescription>
            Analysez et optimisez votre contenu pour les moteurs de recherche
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !title || !content}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Analyser le SEO
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && scoreInfo && (
        <>
          {/* Score Global */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Score SEO Global</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold ${scoreInfo.color}`}>
                      {scoreInfo.score}
                    </span>
                    <span className="text-2xl text-muted-foreground">/100</span>
                    <Badge className={scoreInfo.color.replace('text-', 'bg-').replace('-500', '-500/20')}>
                      Note {scoreInfo.grade}
                    </Badge>
                  </div>
                </div>
                <div className={`text-6xl font-bold ${scoreInfo.color}`}>
                  {scoreInfo.grade}
                </div>
              </div>
              <Progress value={scoreInfo.score} className="h-2" />
            </CardContent>
          </Card>

          {/* Title Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                Analyse du titre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <Badge variant="outline">{analysis.title_analysis.current_score}/100</Badge>
              </div>
              
              {analysis.title_analysis.suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Suggestions:</p>
                  <ul className="space-y-1">
                    {analysis.title_analysis.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Lightbulb className="h-3 w-3 mt-1 shrink-0 text-yellow-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.title_analysis.improved_title && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Titre amélioré suggéré:</p>
                  <p className="text-sm font-medium">{analysis.title_analysis.improved_title}</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={applyTitleSuggestion}>
                    Appliquer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meta Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                Meta Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <Badge variant="outline">{analysis.meta_analysis.description_score}/100</Badge>
              </div>

              {analysis.meta_analysis.improved_description && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Description améliorée:</p>
                  <p className="text-sm">{analysis.meta_analysis.improved_description}</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={applyDescriptionSuggestion}>
                    Appliquer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analyse du contenu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lisibilité</span>
                  <Badge variant="outline">{analysis.content_analysis.readability_score}/100</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Score Flesch</span>
                  <Badge variant="outline">{analysis.content_analysis.flesch_score}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nombre de mots</span>
                  <span>{analysis.content_analysis.word_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Structure titres</span>
                  {analysis.content_analysis.heading_structure === 'correct' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-muted-foreground">Keyword stuffing</span>
                  {analysis.content_analysis.keyword_stuffing ? (
                    <Badge variant="destructive">Détecté</Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-500">OK</Badge>
                  )}
                </div>
              </div>

              {analysis.content_analysis.suggestions.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Améliorations suggérées:</p>
                  <ul className="space-y-1">
                    {analysis.content_analysis.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Lightbulb className="h-3 w-3 mt-1 shrink-0 text-yellow-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal Linking */}
          {analysis.internal_linking.suggestions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Liens internes suggérés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {analysis.internal_linking.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <Link className="h-3 w-3 mt-1 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Priority Improvements */}
          {analysis.improvements.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Actions prioritaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.improvements.map((imp, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-lg border ${
                        imp.priority === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-950/20' :
                        imp.priority === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20' :
                        'border-gray-200 bg-gray-50 dark:bg-gray-950/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={imp.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {imp.priority === 'high' ? 'Haute' : imp.priority === 'medium' ? 'Moyenne' : 'Basse'}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{imp.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">Impact: {imp.impact}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
