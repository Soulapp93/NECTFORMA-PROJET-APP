import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    checkResetFlow();
  }, []);

  const checkResetFlow = async () => {
    try {
      // Check for custom token from our edge function
      const customToken = searchParams.get('token');

      if (customToken) {
        // Validate custom token via edge function
        const { data, error: validateError } = await supabase.functions.invoke('validate-activation-token', {
          body: { token: customToken },
        });

        if (validateError || !data?.success) {
          setError("Le lien de réinitialisation est invalide ou a expiré.");
          setLoading(false);
          return;
        }

        setUserEmail(data.user?.email || null);
        setTokenValid(true);
        setLoading(false);
        return;
      }

      // Check for native Supabase recovery flow (hash params)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && refreshToken && type === 'recovery') {
        // Set the session
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError || !sessionData.session) {
          setError("Session invalide ou expirée.");
          setLoading(false);
          return;
        }

        setUserEmail(sessionData.session.user.email || null);
        setTokenValid(true);
        setLoading(false);
        return;
      }

      // Check if we have an existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || null);
        setTokenValid(true);
        setLoading(false);
        return;
      }

      // No valid token or session
      setError("Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.");
      setLoading(false);
    } catch (err: any) {
      console.error("Error checking reset flow:", err);
      setError("Erreur lors de la vérification du lien.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setSubmitting(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setSubmitting(false);
      return;
    }

    try {
      const customToken = searchParams.get('token');

      if (customToken) {
        // Use our custom activation/reset flow
        const { data, error: resetError } = await supabase.functions.invoke('activate-user-account', {
          body: {
            token: customToken,
            password: formData.password
          }
        });

        if (resetError) {
          setError('Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.');
          setSubmitting(false);
          return;
        }

        if (data?.error) {
          setError(data.error);
          setSubmitting(false);
          return;
        }

        setSuccess(true);
        toast.success('Mot de passe mis à jour avec succès !');

        // Auto-login if we have the email
        if (userEmail) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: formData.password
          });

          if (!signInError) {
            setTimeout(() => navigate('/dashboard'), 2000);
            return;
          }
        }

        setTimeout(() => navigate('/auth'), 2000);
      } else {
        // Native Supabase flow
        const { error: updateError } = await supabase.auth.updateUser({
          password: formData.password
        });

        if (updateError) {
          if (updateError.message.includes('Auth session missing')) {
            setError('Session expirée. Veuillez demander un nouveau lien de réinitialisation.');
          } else {
            setError('Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.');
          }
          setSubmitting(false);
          return;
        }

        setSuccess(true);
        toast.success('Mot de passe mis à jour avec succès !');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError('Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setError(null);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification du lien de réinitialisation...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Lien invalide ou expiré
          </h2>
          <p className="text-muted-foreground mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Mot de passe mis à jour !
            </h2>
            <p className="text-muted-foreground mb-6">
              Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers votre espace...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 nect-gradient text-white p-12 flex-col justify-center">
        <div className="max-w-md">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-xl">N</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">NECTFORMA</h1>
              <p className="text-white/80">Plateforme de gestion éducative</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-6">
            Sécurisez votre compte
          </h2>
          
          <p className="text-lg text-white/90 mb-8">
            Choisissez un nouveau mot de passe sécurisé pour protéger votre espace NECTFORMA.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white/60 rounded-full mr-3"></div>
              <span className="text-white/90">Au moins 8 caractères</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white/60 rounded-full mr-3"></div>
              <span className="text-white/90">Mélangez lettres et chiffres</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white/60 rounded-full mr-3"></div>
              <span className="text-white/90">Évitez les mots de passe communs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-xl p-6 sm:p-8 border">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold text-foreground">NECTFORMA</span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Nouveau mot de passe
              </h2>
              <p className="text-muted-foreground">
                Créez un nouveau mot de passe sécurisé
              </p>
              {userEmail && (
                <p className="text-sm text-primary mt-2">{userEmail}</p>
              )}
            </div>

            {error && (
              <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Lock className="inline h-4 w-4 mr-2" />
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 border border-input bg-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-12 text-foreground"
                    placeholder="Minimum 8 caractères"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Lock className="inline h-4 w-4 mr-2" />
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-3 border border-input bg-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-12 text-foreground"
                    placeholder="Confirmez votre mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Mise à jour en cours...' : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
