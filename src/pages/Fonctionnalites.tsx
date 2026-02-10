import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LandingHeader from '@/components/landing/LandingHeader';
import { 
  LayoutDashboard, ShieldCheck, Users, GraduationCap, BookText, CalendarDays, 
  ClipboardCheck, Mail, UsersRound, Building2, UserCircle, Briefcase,
  ArrowRight, CheckCircle2, Sparkles, Smartphone, FileDown, QrCode, 
  Upload, Bell, Search, Monitor
} from 'lucide-react';

// Imports des illustrations
import tableauDeBordIllust from '@/assets/illustrations/tableau-de-bord.png';
import administrationIllust from '@/assets/illustrations/administration.png';
import gestionUtilisateursIllust from '@/assets/illustrations/gestion-utilisateurs.png';
import gestionFormationsIllust from '@/assets/illustrations/gestion-formations.png';
import cahiersTextesIllust from '@/assets/illustrations/cahiers-textes.png';
import emploisTempsIllust from '@/assets/illustrations/emplois-temps.png';
import emargementIllust from '@/assets/illustrations/emargement.png';
import messagerieIllust from '@/assets/illustrations/messagerie.png';
import groupesIllust from '@/assets/illustrations/groupes.png';
import gestionEtablissementIllust from '@/assets/illustrations/gestion-etablissement.png';
import profilsIllust from '@/assets/illustrations/profils.png';
import espaceTuteursIllust from '@/assets/illustrations/espace-tuteurs.png';
import classesVirtuellesIllust from '@/assets/illustrations/classes-virtuelles.png';

const Fonctionnalites = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash]);
  const features = [
    {
      id: 'tableau-de-bord',
      icon: LayoutDashboard,
      title: 'Tableau de bord intelligent',
      description: 'Vue synthétique de votre établissement avec indicateurs clés en temps réel. Suivez l\'activité de vos formations, la présence des étudiants et les événements à venir depuis un tableau de bord centralisé et personnalisable.',
      features: [
        'Statistiques de présence en temps réel',
        'Alertes sur cahiers de textes manquants',
        'Prochaines sessions planifiées',
        'Filtres par formation et période',
        'Top étudiants assidus et à risque',
        'Heures de cours par semaine, mois, année'
      ],
      images: [tableauDeBordIllust]
    },
    {
      id: 'administration',
      icon: ShieldCheck,
      title: 'Administration centralisée',
      description: 'Centre de contrôle unifié avec onglets dédiés pour chaque module. Gérez l\'ensemble de votre établissement depuis une interface unique : utilisateurs, formations, emplois du temps, émargement et cahiers de textes.',
      features: [
        'Gestion utilisateurs avec import Excel',
        'Formations et modules personnalisés',
        'Cahiers de textes par formation',
        'Emplois du temps visuels',
        'Feuilles d\'émargement automatiques',
        'Accès rapide à toutes les fonctionnalités'
      ],
      images: [administrationIllust]
    },
    {
      id: 'gestion-utilisateurs',
      icon: Users,
      title: 'Gestion des utilisateurs',
      description: 'Gérez tous les profils de votre établissement avec des outils puissants. Créez des comptes individuellement ou importez-les en masse via Excel, attribuez des rôles et suivez l\'état d\'activation de chaque utilisateur.',
      features: [
        'Création individuelle ou import Excel',
        'Rôles : AdminPrincipal, Admin, Formateur, Étudiant',
        'Invitations automatiques par email',
        'Activation/désactivation des comptes',
        'Attribution des tuteurs entreprises',
        'Filtrage par rôle et statut'
      ],
      images: [gestionUtilisateursIllust]
    },
    {
      id: 'gestion-formations',
      icon: GraduationCap,
      title: 'Gestion des formations',
      description: 'Créez des formations structurées avec modules, devoirs et documents. Définissez les niveaux, assignez des formateurs, partagez du contenu pédagogique et suivez les soumissions des étudiants.',
      features: [
        'Structure modulaire flexible',
        'Niveaux : BAC+1 à BAC+5',
        'Devoirs et travaux avec soumissions',
        'Documents partagés et corrections',
        'Contenu multimédia par module',
        'Sessions d\'émargement intégrées'
      ],
      images: [gestionFormationsIllust]
    },
    {
      id: 'cahiers-textes',
      icon: BookText,
      title: 'Cahiers de textes',
      description: 'Suivi pédagogique détaillé et complet de vos formations. Chaque entrée est reliée à un créneau de l\'emploi du temps et permet de documenter le contenu du cours, les objectifs et le travail à faire.',
      features: [
        'Entrées liées aux créneaux EDT',
        'Matière, contenu, travail à faire',
        'Upload de documents de cours',
        'Export PDF des cahiers',
        'Filtrage par formation et année',
        'Archivage des cahiers terminés'
      ],
      images: [cahiersTextesIllust]
    },
    {
      id: 'emplois-du-temps',
      icon: CalendarDays,
      title: 'Emplois du temps',
      description: 'Planning intelligent avec navigation par semaines. Créez et gérez les emplois du temps de vos formations avec des vues multiples et un système d\'import Excel pour une mise en place rapide.',
      features: [
        'Vues jour, semaine, mois, liste',
        'Modules, formateurs, salles',
        'Import Excel des plannings',
        'Notifications des changements',
        'Navigation par semaines de l\'année',
        'Création rapide de créneaux'
      ],
      images: [emploisTempsIllust]
    },
    {
      id: 'emargement',
      icon: ClipboardCheck,
      title: 'Émargement numérique',
      description: 'Signatures numériques conformes et sécurisées. Générez automatiquement les feuilles de présence, permettez la signature via QR code ou écran tactile et exportez les feuilles en PDF.',
      features: [
        'QR Code dynamique par session',
        'Signature sur écran tactile',
        'Motifs d\'absence configurables',
        'Export PDF des feuilles signées',
        'Validation par les formateurs',
        'Historique complet des présences'
      ],
      images: [emargementIllust]
    },
    {
      id: 'messagerie',
      icon: Mail,
      title: 'Messagerie interne',
      description: 'Communication professionnelle intégrée à l\'établissement. Envoyez des messages individuels ou groupés avec pièces jointes, organisez vos échanges et retrouvez facilement vos conversations.',
      features: [
        'Messages avec pièces jointes',
        'Envoi individuel ou groupé',
        'Dossiers organisés',
        'Recherche et historique',
        'Transfert de messages',
        'Favoris et archivage'
      ],
      images: [messagerieIllust]
    },
    {
      id: 'groupes',
      icon: UsersRound,
      title: 'Groupes de discussion',
      description: 'Collaboration en temps réel avec votre établissement. Des groupes sont automatiquement créés par formation pour favoriser les échanges entre étudiants et formateurs.',
      features: [
        'Groupes automatiques par formation',
        'Chat temps réel',
        'Partage de fichiers',
        'Notifications instantanées',
        'Réponses aux messages',
        'Historique des conversations'
      ],
      images: [groupesIllust]
    },
    {
      id: 'etablissement',
      icon: Building2,
      title: 'Gestion établissement',
      description: 'Configuration et personnalisation complète de votre établissement. Renseignez vos informations légales, ajoutez votre logo et paramétrez les notifications pour tous vos utilisateurs.',
      features: [
        'Logo et identité visuelle',
        'Informations légales (SIRET)',
        'Coordonnées et contacts',
        'Paramètres de notifications',
        'Type d\'établissement',
        'Nombre d\'étudiants et formateurs'
      ],
      images: [gestionEtablissementIllust]
    },
    {
      id: 'profils',
      icon: UserCircle,
      title: 'Profils utilisateurs',
      description: 'Espace personnel pour chaque utilisateur. Gérez votre photo de profil, enregistrez votre signature électronique, configurez vos préférences de notifications et scannez les QR codes d\'émargement.',
      features: [
        'Photo de profil',
        'Signature électronique enregistrée',
        'Préférences de notifications',
        'Gestion du mot de passe',
        'Informations personnelles',
        'Scanner QR pour émargement'
      ],
      images: [profilsIllust]
    },
    {
      id: 'tuteurs',
      icon: Briefcase,
      title: 'Espace tuteurs entreprises',
      description: 'Suivi dédié pour les tuteurs d\'alternants. Consultez le planning et les présences de vos apprentis, communiquez avec l\'établissement et recevez des notifications en cas d\'absence.',
      features: [
        'Planning de l\'alternant',
        'Consultation des présences',
        'Communication avec l\'établissement',
        'Notifications des absences',
        'Informations de contrat',
        'Accès limité et sécurisé'
      ],
      images: [espaceTuteursIllust]
    },
    {
      id: 'classes-virtuelles',
      icon: Monitor,
      title: 'Classes virtuelles',
      description: 'Sessions de formation en ligne avec visioconférence intégrée. Organisez des cours à distance en HD avec partage d\'écran, enregistrement et chat en direct.',
      features: [
        'Visioconférence HD',
        'Partage d\'écran',
        'Enregistrement sessions',
        'Chat en direct'
      ],
      images: [classesVirtuellesIllust],
      comingSoon: true
    }
  ];

  const additionalFeatures = [
    { icon: QrCode, title: 'QR code dynamique', description: 'Émargement rapide et sécurisé via scan mobile' },
    { icon: Upload, title: 'Import Excel', description: 'Importez utilisateurs et plannings massivement' },
    { icon: FileDown, title: 'Export PDF', description: 'Exportez feuilles de présence et cahiers de textes' },
    { icon: Bell, title: 'Notifications', description: 'Alertes en temps réel sur les événements importants' },
    { icon: Search, title: 'Recherche avancée', description: 'Trouvez rapidement utilisateurs et formations' },
    { icon: Smartphone, title: 'Mobile responsive', description: 'Accès complet depuis tous vos appareils' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <div className="h-14 md:h-16" />

      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-accent/5 to-background"></div>
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-5 py-2.5 bg-primary/10 rounded-full mb-8 backdrop-blur-sm border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary mr-2" />
            <span className="text-primary font-semibold">13 modules complets</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight">
            Toutes nos <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Fonctionnalités</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Découvrez l'ensemble des modules NECTFORMA pour digitaliser 
            et automatiser la gestion de votre établissement de formation.
          </p>
        </div>
      </section>

      {/* Features - Staggered layout with screenshots */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-32">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;
              const hasImages = feature.images && feature.images.length > 0;
              const isComingSoon = 'comingSoon' in feature && feature.comingSoon;
              
              return (
                <div 
                  key={index}
                  id={feature.id}
                  className="scroll-mt-24"
                >
                  <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12 items-center`}>
                    {/* Content */}
                    <div className="flex-1 space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
                          <Icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full tracking-wide uppercase">
                          Module {index + 1}
                        </span>
                        {isComingSoon && (
                          <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-full">
                            À venir
                          </span>
                        )}
                      </div>
                      
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground">{feature.title}</h2>
                      <p className="text-muted-foreground leading-relaxed text-[15px]">{feature.description}</p>
                      
                      <div className="bg-card/80 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-border/30">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {feature.features.map((feat, featIndex) => (
                            <li key={featIndex} className="flex items-start gap-2.5">
                              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-foreground/80">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Illustration - rounded, floating */}
                    <div className="flex-1 w-full flex items-center justify-center relative group">
                      {hasImages ? (
                        <div className="relative">
                          <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <img 
                            src={feature.images[0]} 
                            alt={feature.title}
                            className="relative w-full max-w-lg h-auto object-contain rounded-2xl drop-shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-full max-w-lg aspect-[4/3] flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5">
                          <Icon className="h-24 w-24 text-primary/20" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-24 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-5 py-2.5 bg-primary/10 rounded-full mb-6 backdrop-blur-sm border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary mr-2" />
              <span className="text-primary font-semibold text-sm">Outils intégrés</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-4">
              Fonctionnalités <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Additionnelles</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Des outils supplémentaires pour optimiser votre productivité au quotidien
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {additionalFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group relative p-6 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/15 to-accent/15 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:from-primary/25 group-hover:to-accent/25 transition-all duration-300">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/15 to-accent/15 rounded-3xl mb-6 border border-primary/20">
              <Smartphone className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-4">
              Accessible <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">partout</span>, à tout moment
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              NECTFORMA est optimisé pour tous vos appareils : ordinateur, tablette et smartphone.
              Gérez vos formations où que vous soyez.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Testez toutes ces fonctionnalités gratuitement
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-10">
            14 jours d'essai gratuit • Sans engagement • Support inclus
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
                <span className="text-primary-foreground font-bold text-sm">NF</span>
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

export default Fonctionnalites;
