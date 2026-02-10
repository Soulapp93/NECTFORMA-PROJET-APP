import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { rpcWithRetry } from '@/lib/supabaseRetry';

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(`${label}: timeout after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
};

interface AuthState {
  userId: string | null;
  userRole: string | null;
  isSuperAdmin: boolean;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthState>({
  userId: null,
  userRole: null,
  isSuperAdmin: false,
  loading: true,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    userId: null,
    userRole: null,
    isSuperAdmin: false,
    loading: true,
    error: null,
  });

  const fetchUserRole = useCallback(async (uid: string, mounted: { current: boolean }) => {
    try {
      const { data: isSA, error: isSuperAdminError } = await withTimeout(
        rpcWithRetry(() => supabase.rpc('is_super_admin'), { maxRetries: 2, baseDelayMs: 400 }),
        6000,
        'is_super_admin'
      );

      if (!mounted.current) return;

      if (isSuperAdminError) {
        console.error('Erreur is_super_admin:', isSuperAdminError);
      }

      const superAdmin = !!isSA;

      if (superAdmin) {
        setState(prev => ({ ...prev, userId: uid, userRole: 'SuperAdmin', isSuperAdmin: true, error: null }));
        return;
      }

      const { data, error: rpcError } = await withTimeout(
        rpcWithRetry(() => supabase.rpc('get_current_user_role'), {
          maxRetries: 3,
          baseDelayMs: 500,
          onRetry: (attempt, err) => console.warn(`Retry ${attempt} get_current_user_role:`, err.message),
        }),
        8000,
        'get_current_user_role'
      );

      if (!mounted.current) return;

      if (rpcError) {
        console.error('Erreur get_current_user_role:', rpcError);
        setState(prev => ({ ...prev, userId: uid, userRole: null, isSuperAdmin: false, error: 'Erreur de chargement du rôle' }));
        return;
      }

      setState(prev => ({ ...prev, userId: uid, userRole: (data as string) ?? null, isSuperAdmin: false, error: null }));
    } catch (err) {
      console.error('Erreur fetchUserRole:', err);
      if (mounted.current) {
        setState(prev => ({ ...prev, userId: uid, userRole: null, isSuperAdmin: false, error: 'Erreur de connexion' }));
      }
    }
  }, []);

  useEffect(() => {
    const mounted = { current: true };

    sessionStorage.removeItem('demo_user');

    // INITIAL load - controls loading state
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await withTimeout(
          supabase.auth.getSession(),
          6000,
          'getSession'
        );

        if (!mounted.current) return;

        if (sessionError) {
          console.error('Erreur de session:', sessionError);
          setState(prev => ({ ...prev, error: 'Erreur de session', loading: false }));
          return;
        }

        if (session?.user?.id) {
          // Fetch role BEFORE setting loading to false
          await fetchUserRole(session.user.id, mounted);
        } else {
          setState(prev => ({ ...prev, userId: null, userRole: null, isSuperAdmin: false }));
        }
      } catch (err) {
        console.error('Erreur initializeAuth:', err);
        if (mounted.current) {
          setState(prev => ({ ...prev, userId: null, userRole: null, isSuperAdmin: false, error: 'Erreur de connexion' }));
        }
      } finally {
        if (mounted.current) {
          setState(prev => ({ ...prev, loading: false }));
        }
      }
    };

    // Listener for ONGOING auth changes (does NOT control loading on INITIAL_SESSION)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted.current) return;

        // Ignore INITIAL_SESSION - initializeAuth handles it
        if (event === 'INITIAL_SESSION') return;

        if (event === 'SIGNED_OUT') {
          setState({ userId: null, userRole: null, isSuperAdmin: false, loading: false, error: null });
          return;
        }

        if (session?.user?.id) {
          // Set loading=true and clear previous role ATOMICALLY to prevent flash
          setState(prev => ({ ...prev, loading: true, userRole: null, isSuperAdmin: false }));
          
          // Defer to avoid Supabase auth deadlocks
          setTimeout(async () => {
            if (mounted.current) {
              await fetchUserRole(session.user.id, mounted);
              if (mounted.current) {
                setState(prev => ({ ...prev, loading: false }));
              }
            }
          }, 0);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
};
