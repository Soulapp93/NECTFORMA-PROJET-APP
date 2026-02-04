import React, { useState } from 'react';
import { 
  Lightbulb, Loader2, Calendar, TrendingUp, Target, 
  ChevronRight, BookOpen, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { suggestTopics, AITopicSuggestions } from '@/services/blogAIService';

interface AITopicPlannerProps {
  existingTopics?: string[];
  onSelectTopic: (topic: string) => void;
}

export const AITopicPlanner: React.FC<AITopicPlannerProps> = ({
  existingTopics = [],
  onSelectTopic
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<AITopicSuggestions | null>(null);
  const [period, setPeriod] = useState('3 mois');
  const [count, setCount] = useState(10);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await suggestTopics({
        existing_topics: existingTopics,
        period,
        count
      });
      setSuggestions(result);
      toast.success('Suggestions générées !');
    } catch (error) {
      console.error('Topic suggestion error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-700';
      case 'medium': return 'bg-yellow-500/20 text-yellow-700';
      case 'hard': return 'bg-red-500/20 text-red-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  const getTrafficColor = (traffic: string) => {
    switch (traffic) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">Haute</Badge>;
      case 'medium': return <Badge variant="secondary">Moyenne</Badge>;
      default: return <Badge variant="outline">Basse</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Planificateur de contenu IA
          </CardTitle>
          <CardDescription>
            Générez des idées d'articles et un calendrier éditorial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Période de planification</Label>
              <Input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Ex: 3 mois"
              />
            </div>
            <div>
              <Label>Nombre d'idées</Label>
              <Input
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                min={5}
                max={30}
              />
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Générer des idées
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {suggestions && (
        <Tabs defaultValue="topics" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="topics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Tendances
            </TabsTrigger>
            <TabsTrigger value="clusters">
              <Layers className="h-4 w-4 mr-2" />
              Clusters
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendrier
            </TabsTrigger>
            <TabsTrigger value="gaps">
              <Target className="h-4 w-4 mr-2" />
              Opportunités
            </TabsTrigger>
          </TabsList>

          {/* Trending Topics */}
          <TabsContent value="topics" className="space-y-4">
            {suggestions.trending_topics.map((topic, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{topic.title}</h3>
                        <Badge className={getDifficultyColor(topic.difficulty)}>
                          {topic.difficulty === 'easy' ? 'Facile' : 
                           topic.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                        </Badge>
                        <Badge variant="outline">{topic.content_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{topic.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`flex items-center gap-1 ${getTrafficColor(topic.estimated_traffic)}`}>
                          <TrendingUp className="h-3 w-3" />
                          Trafic {topic.estimated_traffic === 'high' ? 'élevé' : 
                                  topic.estimated_traffic === 'medium' ? 'moyen' : 'faible'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {topic.target_keywords.map((kw, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => onSelectTopic(topic.title)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Content Clusters */}
          <TabsContent value="clusters" className="space-y-4">
            {suggestions.content_clusters.map((cluster, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {cluster.pillar_topic}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cluster.subtopics.map((subtopic, j) => (
                      <div 
                        key={j} 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm">{subtopic}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onSelectTopic(subtopic)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Content Calendar */}
          <TabsContent value="calendar" className="space-y-4">
            <div className="grid gap-3">
              {suggestions.content_calendar.map((item, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">S{item.week}</span>
                        </div>
                        <div>
                          <p className="font-medium">{item.topic}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{item.type}</Badge>
                            {getPriorityBadge(item.priority)}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectTopic(item.topic)}
                      >
                        Créer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Competitor Gaps */}
          <TabsContent value="gaps" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Opportunités non couvertes</CardTitle>
                <CardDescription>
                  Sujets que vos concurrents ne traitent pas encore
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suggestions.competitor_gaps.map((gap, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Target className="h-4 w-4 text-primary" />
                        <span>{gap}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onSelectTopic(gap)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
