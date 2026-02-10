import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, LayoutDashboard, ShieldCheck, Users, GraduationCap, BookText, CalendarDays, ClipboardCheck, Mail, UsersRound, Building2, UserCircle, Briefcase, Monitor } from 'lucide-react';
import HeaderDropdown from './HeaderDropdown';
import MobileDrawerNavigation from './MobileDrawerNavigation';

const LandingHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-primary to-accent shadow-lg shadow-primary/20" style={{ overflow: 'visible' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 transition-colors mr-1"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5 text-white" />
              </button>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                <span className="text-white font-extrabold text-xs md:text-sm tracking-tight">NF</span>
              </div>
              <div>
                <Link to="/" className="text-lg md:text-2xl font-bold text-white tracking-tight">
                  Nectf<span className="text-white/70 font-extrabold">o</span>rma
                </Link>
              </div>
            </div>

            <nav className="hidden lg:flex items-center space-x-1">
              <HeaderDropdown
                label="Fonctionnalités"
                items={[
                  { label: 'Tableau de bord', href: '/fonctionnalites#tableau-de-bord', icon: LayoutDashboard },
                  { label: 'Administration', href: '/fonctionnalites#administration', icon: ShieldCheck },
                  { label: 'Gestion des utilisateurs', href: '/fonctionnalites#gestion-utilisateurs', icon: Users },
                  { label: 'Gestion des formations', href: '/fonctionnalites#gestion-formations', icon: GraduationCap },
                  { label: 'Cahiers de textes', href: '/fonctionnalites#cahiers-textes', icon: BookText },
                  { label: 'Emplois du temps', href: '/fonctionnalites#emplois-du-temps', icon: CalendarDays },
                  { label: 'Émargement numérique', href: '/fonctionnalites#emargement', icon: ClipboardCheck },
                  { label: 'Messagerie interne', href: '/fonctionnalites#messagerie', icon: Mail },
                  { label: 'Groupes de discussion', href: '/fonctionnalites#groupes', icon: UsersRound },
                  { label: 'Gestion établissement', href: '/fonctionnalites#etablissement', icon: Building2 },
                  { label: 'Profils utilisateurs', href: '/fonctionnalites#profils', icon: UserCircle },
                  { label: 'Espace tuteurs', href: '/fonctionnalites#tuteurs', icon: Briefcase },
                  { label: 'Classes virtuelles', href: '/fonctionnalites#classes-virtuelles', icon: Monitor },
                ]}
              />
              <Link to="/pourquoi-nous" className="px-4 py-2 text-white/80 hover:text-white font-medium transition-all duration-200 rounded-lg hover:bg-white/10">
                Pourquoi nous ?
              </Link>
              <Link to="/blog" className="px-4 py-2 text-white/80 hover:text-white font-medium transition-all duration-200 rounded-lg hover:bg-white/10">
                Articles & Blog
              </Link>
              <Link
                to="/#contact"
                className="px-4 py-2 text-white/80 hover:text-white font-medium transition-all duration-200 rounded-lg hover:bg-white/10"
                onClick={(e) => {
                  if (window.location.pathname === '/') {
                    e.preventDefault();
                    const el = document.getElementById('contact');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                Contact
              </Link>
            </nav>

            <div className="flex items-center space-x-2 md:space-x-4">
              <Link
                to="/auth"
                className="px-2 py-1.5 md:px-4 md:py-2 text-white/90 hover:text-white font-medium transition-all duration-300 text-sm md:text-base whitespace-nowrap hover:scale-105"
              >
                Se connecter
              </Link>
              <Link
                to="/create-establishment"
                className="hidden sm:inline-flex px-3 md:px-6 py-1.5 md:py-2 bg-white text-primary rounded-full hover:bg-white/90 hover:shadow-xl transform hover:scale-105 font-semibold transition-all duration-300 text-xs md:text-base whitespace-nowrap shadow-lg"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </header>

      <MobileDrawerNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};

export default LandingHeader;
