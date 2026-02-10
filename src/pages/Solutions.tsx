import React from 'react';
import { Link } from 'react-router-dom';
import LandingHeader from '@/components/landing/LandingHeader';
import { 
  LayoutDashboard, ShieldCheck, Users, GraduationCap, BookText, CalendarDays, 
  ClipboardCheck, Mail, UsersRound, Building2, UserCircle, Briefcase,
  ArrowRight, CheckCircle2, Sparkles
} from 'lucide-react';

// Imports des illustrations
import tableauDeBordImg from '@/assets/illustrations/tableau-de-bord.png';
import administrationImg from '@/assets/illustrations/administration.png';
import gestionUtilisateursImg from '@/assets/illustrations/gestion-utilisateurs.png';
import gestionFormations1Img from '@/assets/illustrations/gestion-formations.png';
const gestionFormations2Img = gestionFormations1Img;
import cahiersTextesImg from '@/assets/illustrations/cahiers-textes.png';
import emploisTempsImg from '@/assets/illustrations/emplois-temps.png';
const emploisTempsCalendrierImg = emploisTempsImg;
const cahierTexteDetailImg = cahiersTextesImg;
import emargement1Img from '@/assets/illustrations/emargement.png';
const emargement2Img = emargement1Img;
import messagerie1Img from '@/assets/illustrations/messagerie.png';
const messagerie2Img = messagerie1Img;
import groupesImg from '@/assets/illustrations/groupes.png';
import gestionEtablissementImg from '@/assets/illustrations/gestion-etablissement.png';
import profilImg from '@/assets/illustrations/profils.png';
import espaceTuteursImg from '@/assets/illustrations/espace-tuteurs.png';

const Solutions = () => {
  const solutions = [
    {
      icon: LayoutDashboard,
      title: 'Tableau de bord intelligent',
      description: 'Vue synthétique de votre établissement avec indicateurs clés en temps réel',
      features: [
        'Statistiques de présence en temps réel',
        'Alertes sur cahiers de textes manquants',
        'Prochaines sessions planifiées',
        'Filtres par formation et période',
        'Top étudiants assidus et à risque',
        'Heures de cours par semaine, mois, année'
      ],
      images: [tableauDeBordImg]
    },
    {
      icon: ShieldCheck,
      title: 'Administration centralisée',
      description: 'Centre de contrôle unifié avec onglets dédiés pour chaque module',
      features: [
        'Gestion utilisateurs avec import Excel',
        'Formations et modules personnalisés',
        'Cahiers de textes par formation',
        'Emplois du temps visuels',
        'Feuilles d\'émargement automatiques',
        'Accès rapide à toutes les fonctionnalités'
      ],
      images: [administrationImg]
    },
    {
      icon: Users,
      title: 'Gestion des utilisateurs',
      description: 'Gérez tous les profils de votre établissement avec des outils puissants',
      features: [
        'Création individuelle ou import Excel',
        'Rôles : AdminPrincipal, Admin, Formateur, Étudiant',
        'Invitations automatiques par email',
        'Activation/désactivation des comptes',
        'Attribution des tuteurs entreprises',
        'Filtrage par rôle et statut'
      ],
      images: [gestionUtilisateursImg]
    },
    {
      icon: GraduationCap,
      title: 'Gestion des formations',
      description: 'Créez des formations structurées avec modules, devoirs et documents',
      features: [
        'Structure modulaire flexible',
        'Niveaux : BAC+1 à BAC+5',
        'Devoirs et travaux avec soumissions',
        'Documents partagés et corrections',
        'Contenu multimédia par module',
        'Sessions d\'émargement intégrées'
      ],
      images: [gestionFormations1Img]
    },
    {
      icon: BookText,
      title: 'Cahiers de textes',
      description: 'Suivi pédagogique détaillé et complet de vos formations',
      features: [
        'Entrées liées aux créneaux EDT',
        'Matière, contenu, travail à faire',
        'Upload de documents de cours',
        'Export PDF des cahiers',
        'Filtrage par formation et année',
        'Archivage des cahiers terminés'
      ],
      images: [cahiersTextesImg]
    },
    {
      icon: CalendarDays,
      title: 'Emplois du temps',
      description: 'Planning intelligent avec navigation par semaines',
      features: [
        'Vues jour, semaine, mois, liste',
        'Modules, formateurs, salles',
        'Import Excel des plannings',
        'Notifications des changements',
        'Navigation par semaines de l\'année',
        'Création rapide de créneaux'
      ],
      images: [emploisTempsImg]
    },
    {
      icon: ClipboardCheck,
      title: 'Émargement numérique',
      description: 'Signatures numériques conformes et sécurisées',
      features: [
        'QR Code dynamique par session',
        'Signature sur écran tactile',
        'Motifs d\'absence configurables',
        'Export PDF des feuilles signées',
        'Validation par les formateurs',
        'Historique complet des présences'
      ],
      images: [emargement1Img]
    },
    {
      icon: Mail,
      title: 'Messagerie interne',
      description: 'Communication professionnelle intégrée',
      features: [
        'Messages avec pièces jointes',
        'Envoi individuel ou groupé',
        'Dossiers organisés',
        'Recherche et historique',
        'Transfert de messages',
        'Favoris et archivage'
      ],
      images: [messagerie1Img]
    },
    {
      icon: UsersRound,
      title: 'Groupes de discussion',
      description: 'Collaboration en temps réel avec votre établissement',
      features: [
        'Groupes automatiques par formation',
        'Chat temps réel',
        'Partage de fichiers',
        'Notifications instantanées',
        'Réponses aux messages',
        'Historique des conversations'
      ],
      images: [groupesImg]
    },
    {
      icon: Building2,
      title: 'Gestion établissement',
      description: 'Configuration et personnalisation de votre établissement',
      features: [
        'Logo et identité visuelle',
        'Informations légales (SIRET)',
        'Coordonnées et contacts',
        'Paramètres de notifications',
        'Type d\'établissement',
        'Nombre d\'étudiants et formateurs'
      ],
      images: [gestionEtablissementImg]
    },
    {
      icon: UserCircle,
      title: 'Profils utilisateurs',
      description: 'Espace personnel pour chaque utilisateur',
      features: [
        'Photo de profil',
        'Signature électronique enregistrée',
        'Préférences de notifications',
        'Gestion du mot de passe',
        'Informations personnelles',
        'Scanner QR pour émargement'
      ],
      images: [profilImg]
    },
    {
      icon: Briefcase,
      title: 'Espace tuteurs entreprises',
      description: 'Suivi dédié pour les tuteurs d\'alternants',
      features: [
        'Planning de l\'alternant',
        'Consultation des présences',
        'Communication avec l\'établissement',
        'Notifications des absences',
        'Informations de contrat',
        'Accès limité et sécurisé'
      ],
      images: [espaceTuteursImg]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <div className="h-14 md:h-16" />

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-primary mr-2" />
            <span className="text-primary font-medium">12 modules complets</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Nos Solutions
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Découvrez l'ensemble des modules NECTFORMA pour digitaliser 
            et automatiser la gestion de votre établissement de formation.
          </p>
        </div>
      </section>

      {/* Solutions avec captures */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              const isEven = index % 2 === 0;
              const hasImages = solution.images && solution.images.length > 0;
              
              return (
                <div 
                  key={index}
                  className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
                >
                  {/* Contenu */}
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                        <Icon className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                          Module {index + 1}
                        </span>
                      </div>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-foreground">{solution.title}</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">{solution.description}</p>
                    
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {solution.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Capture d'écran */}
                  <div className="flex-1 w-full">
                    {hasImages ? (
                      <div className={`space-y-4 ${solution.images.length > 1 ? 'grid grid-cols-1 gap-4' : ''}`}>
                        {solution.images.map((img, imgIndex) => (
                          <div 
                            key={imgIndex}
                            className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-card"
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none z-10"></div>
                            <img 
                              src={img} 
                              alt={`${solution.title} - Capture ${imgIndex + 1}`}
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-gradient-to-br from-muted to-muted/50 aspect-video flex items-center justify-center">
                        <div className="text-center p-8">
                          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Icon className="h-10 w-10 text-primary" />
                          </div>
                          <p className="text-muted-foreground font-medium">Capture d'écran à venir</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Prêt à découvrir toutes nos solutions ?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-10">
            Testez gratuitement NECTFORMA pendant 14 jours
          </p>
          <Link 
            to="/create-establishment" 
            className="inline-flex items-center px-8 py-4 bg-background text-primary rounded-lg hover:shadow-2xl transform hover:scale-105 font-bold text-lg transition-all"
          >
            Commencer gratuitement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-foreground py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">N</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">NECTFORMA</h3>
                <p className="text-muted-foreground text-sm">© 2024 Tous droits réservés</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
              <Link to="/fonctionnalites" className="hover:text-primary transition-colors">Fonctionnalités</Link>
              <Link to="/pourquoi-nous" className="hover:text-primary transition-colors">Pourquoi nous ?</Link>
              <Link to="/cgu" className="hover:text-primary transition-colors">CGU</Link>
              <Link to="/politique-confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Solutions;
