import React, { useState } from 'react';
import { 
  Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp,
  FileText, Hash, Target, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { generateArticle, AIGeneratedArticle } from '@/services/blogAIService';

interface AIContentGeneratorProps {
  onArticleGenerated: (article: AIGeneratedArticle) => void;
  categories: Array<{ id: string; name: string }>;
}

export const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({
  onArticleGenerated,
  categories
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<AIGeneratedArticle | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    topic: '',
    audience: '',
    tone: 'professional' as const,
    length: 'medium' as const,
    language: 'fr' as const,
    keywords: '',
    category: '',
    instructions: ''
  });

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      toast.error('Veuillez entrer un sujet');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateArticle({
        topic: formData.topic,
        audience: formData.audience || undefined,
        tone: formData.tone,
        length: formData.length,
        language: formData.language,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : undefined,
        category: formData.category || undefined,
        instructions: formData.instructions || undefined
      });
      
      setGeneratedArticle(result);
      toast.success('Article généré avec succès !');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copié !');
  };

  const handleUseArticle = () => {
    if (generatedArticle) {
      onArticleGenerated(generatedArticle);
      toast.success('Article importé dans l\'éditeur');
    }
  };

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Générateur d'articles IA
          </CardTitle>
          <CardDescription>
            Créez des articles optimisés SEO en quelques secondes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="topic">Sujet de l'article *</Label>
              <Input
                id="topic"
                placeholder="Ex: Comment digitaliser l'émargement en centre de formation"
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="tone">Ton</Label>
              <Select 
                value={formData.tone} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, tone: v as typeof formData.tone }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professionnel</SelectItem>
                  <SelectItem value="educational">Éducatif</SelectItem>
                  <SelectItem value="casual">Décontracté</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="length">Longueur</Label>
              <Select 
                value={formData.length} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, length: v as typeof formData.length }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Court (500-800 mots)</SelectItem>
                  <SelectItem value="medium">Moyen (1000-1500 mots)</SelectItem>
                  <SelectItem value="long">Long (2000+ mots)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full">
                {showAdvanced ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                Options avancées
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="audience">Audience cible</Label>
                  <Input
                    id="audience"
                    placeholder="Ex: Responsables formation, RH"
                    value={formData.audience}
                    onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="keywords">Mots-clés cibles (séparés par virgules)</Label>
                  <Input
                    id="keywords"
                    placeholder="Ex: émargement digital, gestion formation, CFA"
                    value={formData.keywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="instructions">Instructions supplémentaires</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Ex: Inclure des exemples concrets, mentionner la réglementation Qualiopi..."
                    value={formData.instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !formData.topic.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer l'article
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Result */}
      {generatedArticle && (
        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Article généré
              </CardTitle>
              <Button onClick={handleUseArticle}>
                Utiliser cet article
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title & SEO */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Titre</Label>
                <div className="flex items-start gap-2">
                  <p className="font-semibold text-lg flex-1">{generatedArticle.title}</p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0"
                    onClick={() => copyToClipboard(generatedArticle.title, 'title')}
                  >
                    {copiedField === 'title' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Slug URL</Label>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm flex-1">{generatedArticle.slug}</code>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyToClipboard(generatedArticle.slug, 'slug')}
                  >
                    {copiedField === 'slug' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Extrait</Label>
              <p className="text-muted-foreground">{generatedArticle.excerpt}</p>
            </div>

            {/* SEO */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4" />
                SEO
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Meta Title:</span>
                  <p>{generatedArticle.seo_title}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Meta Description:</span>
                  <p>{generatedArticle.seo_description}</p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Keywords:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {generatedArticle.seo_keywords.map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Outline */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-2">
                <Hash className="h-3 w-3" />
                Structure de l'article
              </Label>
              <div className="space-y-1">
                {generatedArticle.outline.map((item, i) => (
                  <div 
                    key={i} 
                    className={`text-sm ${item.level === 'h2' ? 'font-medium' : 'pl-4 text-muted-foreground'}`}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Content Preview */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Contenu (aperçu)</Label>
              <div 
                className="prose prose-sm max-w-none max-h-64 overflow-y-auto border rounded-lg p-4 bg-background"
                dangerouslySetInnerHTML={{ __html: generatedArticle.content.slice(0, 2000) + '...' }}
              />
            </div>

            {/* FAQ */}
            {generatedArticle.faq.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" />
                  FAQ générée ({generatedArticle.faq.length} questions)
                </Label>
                <div className="space-y-2">
                  {generatedArticle.faq.slice(0, 3).map((faq, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-medium">{faq.question}</p>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags & Meta */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tags suggérés:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {generatedArticle.suggested_tags.map((tag, i) => (
                    <Badge key={i} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Catégorie:</span>
                <Badge className="ml-2">{generatedArticle.suggested_category}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Temps de lecture:</span>
                <span className="ml-1">{generatedArticle.estimated_read_time} min</span>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm font-medium">CTA suggéré</p>
              <p className="text-sm text-muted-foreground">{generatedArticle.cta.description}</p>
              <Badge className="mt-2">{generatedArticle.cta.text}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
