import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const RGPDSettings: React.FC = () => {
  const { userId, userRole } = useCurrentUser();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    if (!userId) return;
    setIsExporting(true);

    try {
      // Récupérer les données du profil via RPC sécurisée
      const { data: profile, error: profileError } = await supabase.rpc('get_my_profile');
      if (profileError) throw profileError;

      // Récupérer les signatures
      const { data: signatures } = await supabase
        .from('user_signatures')
        .select('created_at, updated_at')
        .eq('user_id', userId);

      // Récupérer les formations assignées
      const { data: formations } = await supabase
        .from('user_formation_assignments')
        .select('assigned_at, formation_id, formations(title)')
        .eq('user_id', userId);

      // Récupérer les présences
      const { data: attendances } = await supabase
        .from('attendance_signatures')
        .select('signed_at, present, absence_reason, absence_reason_type, attendance_sheet_id')
        .eq('user_id', userId);

      // Récupérer les messages envoyés (métadonnées uniquement)
      const { data: messages } = await supabase
        .from('messages')
        .select('id, subject, created_at, is_draft')
        .eq('sender_id', userId);

      // Construire l'objet d'export
      const exportData = {
        export_date: new Date().toISOString(),
        export_type: 'RGPD - Droit à la portabilité (Article 20)',
        platform: 'Nectforma',
        profile: profile,
        signatures_count: signatures?.length || 0,
        formations: formations?.map(f => ({
          formation: (f.formations as any)?.title || 'N/A',
          assigned_at: f.assigned_at,
        })) || [],
        attendance_records: attendances?.map(a => ({
          signed_at: a.signed_at,
          present: a.present,
          absence_reason: a.absence_reason,
        })) || [],
        messages_sent: messages?.map(m => ({
          subject: m.subject,
          created_at: m.created_at,
          is_draft: m.is_draft,
        })) || [],
      };

      // Télécharger en JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nectforma-mes-donnees-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Vos données ont été exportées avec succès');
    } catch (error) {
      console.error('Erreur export données:', error);
      toast.error('Erreur lors de l\'export de vos données');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    setIsDeleting(true);

    try {
      // Anonymiser les données utilisateur (ne pas supprimer pour l'intégrité référentielle)
      if (userRole === 'Tuteur') {
        await supabase
          .from('tutors')
          .update({
            first_name: 'Utilisateur',
            last_name: 'Supprimé',
            email: `deleted_${userId.substring(0, 8)}@removed.nectforma.com`,
            phone: null,
            profile_photo_url: null,
          })
          .eq('id', userId);
      } else {
        await supabase
          .from('users')
          .update({
            first_name: 'Utilisateur',
            last_name: 'Supprimé',
            email: `deleted_${userId.substring(0, 8)}@removed.nectforma.com`,
            phone: null,
            profile_photo_url: null,
            status: 'Supprimé',
          })
          .eq('id', userId);
      }

      // Supprimer les signatures
      await supabase
        .from('user_signatures')
        .delete()
        .eq('user_id', userId);

      // Déconnecter l'utilisateur
      await supabase.auth.signOut();

      toast.success('Votre compte a été supprimé. Vous allez être redirigé.');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Erreur suppression compte:', error);
      toast.error('Erreur lors de la suppression du compte. Contactez le support.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Informations RGPD */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
            Vos droits RGPD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants sur vos données personnelles :
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li><strong>Droit d'accès</strong> — Consulter vos données personnelles</li>
            <li><strong>Droit à la portabilité</strong> — Exporter vos données dans un format lisible</li>
            <li><strong>Droit à l'effacement</strong> — Demander la suppression de vos données</li>
            <li><strong>Droit de rectification</strong> — Modifier vos informations personnelles (via votre profil)</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Pour toute demande complémentaire, contactez-nous à : <strong>rgpd@nectforma.com</strong>
          </p>
        </CardContent>
      </Card>

      {/* Export des données */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Exporter mes données
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Téléchargez l'ensemble de vos données personnelles au format JSON. Ce fichier contient vos informations de profil, vos formations, vos émargements et vos messages.
          </p>
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exporter mes données (JSON)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Suppression du compte */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base sm:text-lg text-destructive">
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Supprimer mon compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-destructive/80">
              <strong>Attention :</strong> Cette action est irréversible. Vos données personnelles seront anonymisées et votre compte sera désactivé. Les données nécessaires à la traçabilité (émargements, formations) seront conservées de manière anonyme conformément aux obligations légales.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer mon compte
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirmer la suppression
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est <strong>irréversible</strong>.
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Vos données personnelles seront anonymisées</li>
                    <li>Votre signature sera supprimée</li>
                    <li>Vous ne pourrez plus vous connecter</li>
                    <li>Les données d'émargement seront conservées (obligation légale)</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Oui, supprimer mon compte
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default RGPDSettings;
