import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COOKIE_CONSENT_KEY = 'nectforma_cookie_consent';

type ConsentChoice = 'accepted' | 'rejected' | 'essential_only';

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Petit délai pour ne pas gêner le chargement initial
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (choice: ConsentChoice) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      choice,
      timestamp: new Date().toISOString(),
    }));
    setVisible(false);

    // Si analytics accepté et GA configuré, on pourrait activer GA ici
    if (choice === 'accepted') {
      // Google Analytics sera activé si VITE_GA_MEASUREMENT_ID est configuré
      console.log('Cookies analytiques acceptés');
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-background border-2 border-border rounded-2xl shadow-2xl p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 flex-shrink-0">
            <Cookie className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                🍪 Respect de votre vie privée
              </h3>
              <button
                onClick={() => handleConsent('essential_only')}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Nectforma utilise des cookies essentiels au fonctionnement du site. 
              Nous pouvons également utiliser des cookies analytiques pour améliorer votre expérience.
              {' '}
              <Link 
                to="/politique-confidentialite" 
                className="text-primary hover:underline font-medium"
                target="_blank"
              >
                En savoir plus
              </Link>
            </p>

            {showDetails && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Cookies essentiels</span>
                  <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">Toujours actifs</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Nécessaires au fonctionnement du site (authentification, session, préférences).
                </p>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Cookies analytiques</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Optionnels</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Nous aident à comprendre comment vous utilisez le site (Google Analytics).
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs sm:text-sm order-3 sm:order-1"
              >
                {showDetails ? 'Masquer les détails' : 'Personnaliser'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConsent('essential_only')}
                className="text-xs sm:text-sm order-2"
              >
                Essentiels uniquement
              </Button>
              <Button
                size="sm"
                onClick={() => handleConsent('accepted')}
                className="text-xs sm:text-sm order-1 sm:order-3"
              >
                Tout accepter
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
