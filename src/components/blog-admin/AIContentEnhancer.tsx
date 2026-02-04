import React, { useState } from 'react';
import { 
  Wand2, Loader2, Languages, Share2, Shrink, Expand,
  Sparkles, FileText, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  rewriteContent, 
  generateSocialPosts, 
  translateContent,
  summarizeContent,
  AIRewriteResult,
  AISocialPosts,
  AITranslation,
  AISummary
} from '@/services/blogAIService';

interface AIContentEnhancerProps {
  title: string;
  excerpt: string;
  content: string;
  onApplyContent: (content: string) => void;
}

export const AIContentEnhancer: React.FC<AIContentEnhancerProps> = ({
  title,
  excerpt,
  content,
  onApplyContent
}) => {
  const [activeTab, setActiveTab] = useState('rewrite');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Results
  const [rewriteResult, setRewriteResult] = useState<AIRewriteResult | null>(null);
  const [socialResult, setSocialResult] = useState<AISocialPosts | null>(null);
  const [translateResult, setTranslateResult] = useState<AITranslation | null>(null);
  const [summaryResult, setSummaryResult] = useState<AISummary | null>(null);

  // Options
  const [rewriteMode, setRewriteMode] = useState<'improve' | 'shorten' | 'expand' | 'simplify'>('improve');
  const [targetLanguage, setTargetLanguage] = useState('Anglais');

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copié !');
  };

  const handleRewrite = async () => {
    if (!content) {
      toast.error('Contenu requis');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await rewriteContent({
        content,
        mode: rewriteMode
      });
      setRewriteResult(result);
      toast.success('Contenu réécrit !');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateSocial = async () => {
    if (!title || !content) {
      toast.error('Titre et contenu requis');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await generateSocialPosts({
        title,
        excerpt,
        content
      });
      setSocialResult(result);
      toast.success('Posts sociaux générés !');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslate = async () => {
    if (!title || !content) {
      toast.error('Titre et contenu requis');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await translateContent({
        title,
        excerpt,
        content,
        target_language: targetLanguage
      });
      setTranslateResult(result);
      toast.success('Traduction terminée !');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSummarize = async () => {
    if (!title || !content) {
      toast.error('Titre et contenu requis');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await summarizeContent({
        title,
        content
      });
      setSummaryResult(result);
      toast.success('Résumé généré !');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Améliorateur de contenu IA
          </CardTitle>
          <CardDescription>
            Réécrivez, traduisez et partagez votre contenu
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="rewrite">
            <Sparkles className="h-4 w-4 mr-2" />
            Réécrire
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
          <TabsTrigger value="translate">
            <Languages className="h-4 w-4 mr-2" />
            Traduire
          </TabsTrigger>
          <TabsTrigger value="summary">
            <FileText className="h-4 w-4 mr-2" />
            Résumer
          </TabsTrigger>
        </TabsList>

        {/* Rewrite Tab */}
        <TabsContent value="rewrite" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-4">
                <Select value={rewriteMode} onValueChange={(v) => setRewriteMode(v as typeof rewriteMode)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="improve">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Améliorer
                      </div>
                    </SelectItem>
                    <SelectItem value="shorten">
                      <div className="flex items-center gap-2">
                        <Shrink className="h-4 w-4" />
                        Raccourcir
                      </div>
                    </SelectItem>
                    <SelectItem value="expand">
                      <div className="flex items-center gap-2">
                        <Expand className="h-4 w-4" />
                        Développer
                      </div>
                    </SelectItem>
                    <SelectItem value="simplify">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Simplifier
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleRewrite} 
                  disabled={isProcessing || !content}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  Réécrire
                </Button>
              </div>

              {rewriteResult && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline">{rewriteResult.readability_improvement}</Badge>
                    <Badge variant="outline">{rewriteResult.word_count_change}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Modifications effectuées:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {rewriteResult.changes_made.map((change, i) => (
                        <li key={i}>• {change}</li>
                      ))}
                    </ul>
                  </div>

                  <div 
                    className="prose prose-sm max-w-none max-h-64 overflow-y-auto border rounded-lg p-4 bg-muted/30"
                    dangerouslySetInnerHTML={{ __html: rewriteResult.rewritten_content.slice(0, 2000) + '...' }}
                  />

                  <Button onClick={() => onApplyContent(rewriteResult.rewritten_content)}>
                    Appliquer les modifications
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleGenerateSocial} 
                disabled={isProcessing || !title || !content}
                className="w-full"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                Générer les posts sociaux
              </Button>
            </CardContent>
          </Card>

          {socialResult && (
            <div className="space-y-4">
              {/* LinkedIn */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">LinkedIn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="relative">
                    <p className="text-sm whitespace-pre-wrap">{socialResult.linkedin.post}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-0 right-0"
                      onClick={() => copyToClipboard(socialResult.linkedin.post, 'linkedin')}
                    >
                      {copiedField === 'linkedin' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {socialResult.linkedin.hashtags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Twitter */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Twitter/X</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tweet unique:</p>
                    <div className="relative">
                      <p className="text-sm">{socialResult.twitter.single}</p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-0 right-0"
                        onClick={() => copyToClipboard(socialResult.twitter.single, 'twitter-single')}
                      >
                        {copiedField === 'twitter-single' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Thread:</p>
                    <div className="space-y-2">
                      {socialResult.twitter.thread.map((tweet, i) => (
                        <div key={i} className="text-sm p-2 bg-muted/50 rounded flex items-start gap-2">
                          <span className="text-xs text-muted-foreground">{i + 1}/</span>
                          <span className="flex-1">{tweet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Newsletter */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Newsletter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Objet:</p>
                    <p className="text-sm font-medium">{socialResult.newsletter.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prévisualisation:</p>
                    <p className="text-sm">{socialResult.newsletter.preview_text}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Introduction:</p>
                    <p className="text-sm">{socialResult.newsletter.intro}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Translate Tab */}
        <TabsContent value="translate" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-4">
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Anglais">🇬🇧 Anglais</SelectItem>
                    <SelectItem value="Espagnol">🇪🇸 Espagnol</SelectItem>
                    <SelectItem value="Allemand">🇩🇪 Allemand</SelectItem>
                    <SelectItem value="Italien">🇮🇹 Italien</SelectItem>
                    <SelectItem value="Portugais">🇵🇹 Portugais</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleTranslate} 
                  disabled={isProcessing || !title || !content}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Languages className="h-4 w-4 mr-2" />
                  )}
                  Traduire
                </Button>
              </div>

              {translateResult && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Titre traduit:</p>
                    <p className="font-medium">{translateResult.translated_title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Extrait traduit:</p>
                    <p className="text-sm">{translateResult.translated_excerpt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Adaptations culturelles:</p>
                    <ul className="text-sm text-muted-foreground">
                      {translateResult.cultural_adaptations.map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleSummarize} 
                disabled={isProcessing || !title || !content}
                className="w-full"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Générer les résumés
              </Button>
            </CardContent>
          </Card>

          {summaryResult && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">TL;DR</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{summaryResult.tl_dr}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Résumé court</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{summaryResult.summary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Points clés</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {summaryResult.key_points.map((point, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Résumé exécutif</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{summaryResult.executive_summary}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
