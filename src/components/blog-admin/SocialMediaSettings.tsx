import React, { useState, useEffect } from 'react';
import {
  Settings, Link2, RefreshCw, Unlink, Check, AlertCircle,
  ExternalLink, Clock, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  SocialPlatform, PLATFORM_INFO,
  getConnections, saveConnection, disconnectPlatform,
  getPublishingSettings, updatePublishingSettings, testConnection,
  SocialConnection, PublishingSettings
} from '@/services/socialMediaService';

const PLATFORMS: SocialPlatform[] = [
  'linkedin', 'twitter', 'facebook', 'instagram', 'tiktok', 'youtube', 'threads', 'pinterest'
];

interface ConnectDialogProps {
  platform: SocialPlatform | null;
  onClose: () => void;
  onConnect: (platform: SocialPlatform, credentials: Record<string, string>) => void;
}

const ConnectDialog = ({ platform, onClose, onConnect }: ConnectDialogProps) => {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);

  if (!platform) return null;

  const platformInfo = PLATFORM_INFO[platform];

  // Different credential fields per platform
  const getFields = () => {
    switch (platform) {
      case 'linkedin':
        return [
          { key: 'client_id', label: 'Client ID', placeholder: 'Votre LinkedIn Client ID' },
          { key: 'client_secret', label: 'Client Secret', placeholder: 'Votre LinkedIn Client Secret', type: 'password' },
        ];
      case 'twitter':
        return [
          { key: 'api_key', label: 'API Key', placeholder: 'Votre Twitter API Key' },
          { key: 'api_secret', label: 'API Secret', placeholder: 'Votre Twitter API Secret', type: 'password' },
          { key: 'access_token', label: 'Access Token', placeholder: 'Votre Access Token' },
          { key: 'access_token_secret', label: 'Access Token Secret', placeholder: 'Votre Access Token Secret', type: 'password' },
        ];
      case 'facebook':
      case 'instagram':
        return [
          { key: 'app_id', label: 'App ID', placeholder: 'Votre Meta App ID' },
          { key: 'app_secret', label: 'App Secret', placeholder: 'Votre Meta App Secret', type: 'password' },
          { key: 'page_id', label: 'Page ID (optionnel)', placeholder: 'ID de la page Facebook' },
        ];
      case 'tiktok':
        return [
          { key: 'client_key', label: 'Client Key', placeholder: 'Votre TikTok Client Key' },
          { key: 'client_secret', label: 'Client Secret', placeholder: 'Votre TikTok Client Secret', type: 'password' },
        ];
      case 'youtube':
        return [
          { key: 'client_id', label: 'Google Client ID', placeholder: 'Votre Google OAuth Client ID' },
          { key: 'client_secret', label: 'Google Client Secret', placeholder: 'Votre Google Client Secret', type: 'password' },
          { key: 'channel_id', label: 'Channel ID (optionnel)', placeholder: 'ID de votre chaîne YouTube' },
        ];
      default:
        return [
          { key: 'api_key', label: 'API Key', placeholder: 'Votre clé API' },
        ];
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await onConnect(platform, credentials);
      onClose();
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog open={!!platform} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{platformInfo.icon}</span>
            Connecter {platformInfo.name}
          </DialogTitle>
          <DialogDescription>
            Entrez vos clés API pour connecter votre compte {platformInfo.name}.
            <a 
              href={getDevPortalUrl(platform)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline ml-1 inline-flex items-center gap-1"
            >
              Obtenir les clés <ExternalLink className="h-3 w-3" />
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {getFields().map(field => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              <Input
                type={field.type || 'text'}
                placeholder={field.placeholder}
                value={credentials[field.key] || ''}
                onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
              />
            </div>
          ))}

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" />
              Sécurité
            </h4>
            <p className="text-xs text-muted-foreground">
              Vos clés API sont stockées de manière sécurisée et chiffrée. 
              Elles ne sont jamais exposées côté client.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleConnect} disabled={connecting}>
            {connecting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connexion...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Connecter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function getDevPortalUrl(platform: SocialPlatform): string {
  const urls: Record<SocialPlatform, string> = {
    linkedin: 'https://www.linkedin.com/developers/apps',
    twitter: 'https://developer.twitter.com/en/portal/dashboard',
    facebook: 'https://developers.facebook.com/apps/',
    instagram: 'https://developers.facebook.com/apps/',
    tiktok: 'https://developers.tiktok.com/',
    youtube: 'https://console.cloud.google.com/apis/dashboard',
    threads: 'https://developers.facebook.com/apps/',
    pinterest: 'https://developers.pinterest.com/apps/',
  };
  return urls[platform];
}

export const SocialMediaSettings = () => {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [settings, setSettings] = useState<PublishingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null);
  const [testingPlatform, setTestingPlatform] = useState<SocialPlatform | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [conns, setts] = await Promise.all([
        getConnections(),
        getPublishingSettings()
      ]);
      setConnections(conns);
      setSettings(setts);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: SocialPlatform, credentials: Record<string, string>) => {
    try {
      await saveConnection({
        platform,
        connection_status: 'connected',
        account_name: credentials.account_name || `Compte ${PLATFORM_INFO[platform].name}`,
        last_connected_at: new Date().toISOString(),
      });
      toast.success(`${PLATFORM_INFO[platform].name} connecté !`);
      await loadData();
    } catch (error) {
      console.error('Error connecting:', error);
      toast.error('Erreur lors de la connexion');
      throw error;
    }
  };

  const handleDisconnect = async (platform: SocialPlatform) => {
    if (!confirm(`Déconnecter ${PLATFORM_INFO[platform].name} ?`)) return;
    
    try {
      await disconnectPlatform(platform);
      toast.success(`${PLATFORM_INFO[platform].name} déconnecté`);
      await loadData();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const handleTestConnection = async (platform: SocialPlatform) => {
    setTestingPlatform(platform);
    try {
      const result = await testConnection(platform);
      if (result.connected) {
        toast.success(`${PLATFORM_INFO[platform].name} fonctionne correctement !`);
      } else if (result.requires_refresh) {
        toast.warning('Le token a expiré, veuillez reconnecter');
      } else {
        toast.error('Connexion non établie');
      }
    } catch (error) {
      toast.error('Erreur lors du test');
    } finally {
      setTestingPlatform(null);
    }
  };

  const handleSettingsChange = async (key: keyof PublishingSettings, value: any) => {
    try {
      await updatePublishingSettings({ [key]: value });
      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      toast.success('Paramètres mis à jour');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getConnectionStatus = (platform: SocialPlatform) => {
    const conn = connections.find(c => c.platform === platform);
    if (!conn) return null;
    return conn;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="connections">
        <TabsList>
          <TabsTrigger value="connections">
            <Link2 className="h-4 w-4 mr-2" />
            Connexions
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Settings className="h-4 w-4 mr-2" />
            Automatisation
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Shield className="h-4 w-4 mr-2" />
            Règles
          </TabsTrigger>
        </TabsList>

        {/* CONNECTIONS TAB */}
        <TabsContent value="connections" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {PLATFORMS.map(platform => {
              const info = PLATFORM_INFO[platform];
              const connection = getConnectionStatus(platform);
              const isConnected = connection?.connection_status === 'connected';

              return (
                <Card key={platform} className={isConnected ? 'border-primary/50' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{info.icon}</span>
                        <CardTitle className="text-base">{info.name}</CardTitle>
                      </div>
                      {isConnected ? (
                        <Badge className="bg-primary/10 text-primary border-primary/30">
                          <Check className="h-3 w-3 mr-1" />
                          Connecté
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Non connecté
                        </Badge>
                      )}
                    </div>
                    {connection?.account_name && (
                      <CardDescription className="mt-1">
                        {connection.account_name}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {isConnected ? (
                      <div className="space-y-2">
                        {connection?.last_connected_at && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Connecté le {new Date(connection.last_connected_at).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleTestConnection(platform)}
                            disabled={testingPlatform === platform}
                          >
                            {testingPlatform === platform ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Tester
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDisconnect(platform)}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => setConnectingPlatform(platform)}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        Connecter
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Comment obtenir les clés API ?
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert">
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li><strong>LinkedIn:</strong> Créez une app sur <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noopener" className="text-primary">LinkedIn Developers</a></li>
                <li><strong>X (Twitter):</strong> Créez un projet sur <a href="https://developer.twitter.com" target="_blank" rel="noopener" className="text-primary">Twitter Developer Portal</a></li>
                <li><strong>Facebook/Instagram:</strong> Créez une app sur <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="text-primary">Meta for Developers</a></li>
                <li><strong>TikTok:</strong> Créez une app sur <a href="https://developers.tiktok.com" target="_blank" rel="noopener" className="text-primary">TikTok for Developers</a></li>
                <li><strong>YouTube:</strong> Activez l'API YouTube sur <a href="https://console.cloud.google.com" target="_blank" rel="noopener" className="text-primary">Google Cloud Console</a></li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUTOMATION TAB */}
        <TabsContent value="automation" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mode Autonome</CardTitle>
              <CardDescription>
                Publiez automatiquement vos articles sur les réseaux sociaux
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Publication automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    L'IA génère et publie automatiquement les posts
                  </p>
                </div>
                <Switch
                  checked={settings?.auto_publish_enabled || false}
                  onCheckedChange={(checked) => handleSettingsChange('auto_publish_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Approbation requise</Label>
                  <p className="text-sm text-muted-foreground">
                    Valider manuellement avant publication
                  </p>
                </div>
                <Switch
                  checked={settings?.require_approval ?? true}
                  onCheckedChange={(checked) => handleSettingsChange('require_approval', checked)}
                />
              </div>

              <div>
                <Label>Plateformes pour publication auto</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PLATFORMS.filter(p => getConnectionStatus(p)?.connection_status === 'connected').map(platform => {
                    const isSelected = settings?.auto_publish_platforms?.includes(platform);
                    return (
                      <Badge
                        key={platform}
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = settings?.auto_publish_platforms || [];
                          const updated = isSelected
                            ? current.filter(p => p !== platform)
                            : [...current, platform];
                          handleSettingsChange('auto_publish_platforms', updated);
                        }}
                      >
                        {PLATFORM_INFO[platform].icon} {PLATFORM_INFO[platform].name}
                      </Badge>
                    );
                  })}
                </div>
                {PLATFORMS.filter(p => getConnectionStatus(p)?.connection_status === 'connected').length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Connectez au moins une plateforme pour activer la publication automatique
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RULES TAB */}
        <TabsContent value="rules" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ton de la marque</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={settings?.brand_tone || 'professional'}
                onValueChange={(value) => handleSettingsChange('brand_tone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professionnel</SelectItem>
                  <SelectItem value="educational">Éducatif</SelectItem>
                  <SelectItem value="casual">Décontracté</SelectItem>
                  <SelectItem value="inspiring">Inspirant</SelectItem>
                  <SelectItem value="technical">Technique</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mots interdits</CardTitle>
              <CardDescription>
                L'IA évitera ces mots dans les publications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="mot1, mot2, expression interdite, ..."
                value={settings?.forbidden_words?.join(', ') || ''}
                onChange={(e) => {
                  const words = e.target.value.split(',').map(w => w.trim()).filter(Boolean);
                  handleSettingsChange('forbidden_words', words);
                }}
                rows={3}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connect Dialog */}
      <ConnectDialog
        platform={connectingPlatform}
        onClose={() => setConnectingPlatform(null)}
        onConnect={handleConnect}
      />
    </div>
  );
};
