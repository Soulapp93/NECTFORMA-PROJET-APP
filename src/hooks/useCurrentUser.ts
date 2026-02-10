import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { retryQuery } from '@/lib/supabaseRetry';

// Re-export useAuth as useCurrentUser for backward compatibility
// All components now share the SAME auth state via context - no more race conditions
export const useCurrentUser = () => {
  const { userId, userRole, isSuperAdmin, loading, error } = useAuth();
  return { userId, userRole, isSuperAdmin, loading, error };
};

// Créer un hook pour récupérer les informations utilisateur avec tuteur/apprenti
export const useUserWithRelations = () => {
  const { userId, userRole, loading: userLoading, error: userError } = useCurrentUser();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [relationInfo, setRelationInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mounted = { current: true };
    
    const fetchUserRelations = async () => {
      if (!userId) {
        if (mounted.current) {
          setUserInfo(null);
          setRelationInfo(null);
          setLoading(false);
        }
        return;
      }

      try {
        if (userRole === 'Tuteur') {
          const { data: tutorData, error: tutorError } = await retryQuery(
            () => supabase.from('tutors').select('*').eq('id', userId).maybeSingle(),
            { maxRetries: 2 }
          );

          if (!mounted.current) return;

          if (tutorError) console.error('Erreur tutor data:', tutorError);

          if (tutorData) {
            setUserInfo({
              id: userId, email: tutorData.email, first_name: tutorData.first_name,
              last_name: tutorData.last_name, phone: tutorData.phone,
              profile_photo_url: tutorData.profile_photo_url, role: 'Tuteur',
            });
          } else {
            const { data: sessionData } = await supabase.auth.getSession();
            const u = sessionData.session?.user;
            setUserInfo({
              id: userId, email: u?.email ?? null,
              first_name: (u?.user_metadata as any)?.first_name ?? null,
              last_name: (u?.user_metadata as any)?.last_name ?? null,
              phone: null, profile_photo_url: null, role: 'Tuteur',
            });
          }

          const { data: assignments, error: assignmentError } = await retryQuery(
            () => supabase.from('tutor_student_assignments').select('student_id, is_active')
              .eq('tutor_id', userId).eq('is_active', true).limit(1),
            { maxRetries: 2 }
          );

          if (!mounted.current) return;

          if (!assignmentError && assignments && assignments.length > 0) {
            const { data: studentInfo } = await supabase.from('users')
              .select('first_name, last_name').eq('id', assignments[0].student_id).single();
            if (studentInfo) {
              setRelationInfo({ type: 'student', name: `${studentInfo.first_name} ${studentInfo.last_name}` });
            } else {
              setRelationInfo(null);
            }
          } else {
            setRelationInfo(null);
          }

          setLoading(false);
          return;
        }

        const { data: userData, error: userDataError } = await retryQuery(
          () => supabase.from('users').select('*').eq('id', userId).maybeSingle(),
          { maxRetries: 2 }
        );

        if (!mounted.current) return;

        if (userDataError) {
          console.error('Erreur récupération infos utilisateur:', userDataError);
          setUserInfo(null);
          setError('Erreur de chargement du profil');
        } else {
          setUserInfo(userData ?? null);
          setError(null);
        }

        if (userRole === 'Étudiant') {
          const { data: assignments, error: assignmentError } = await retryQuery(
            () => supabase.from('tutor_student_assignments').select('tutor_id, is_active')
              .eq('student_id', userId).eq('is_active', true).limit(1),
            { maxRetries: 2 }
          );

          if (!mounted.current) return;

          if (!assignmentError && assignments && assignments.length > 0) {
            const { data: tutorInfo } = await supabase.from('tutors')
              .select('first_name, last_name, company_name, position')
              .eq('id', assignments[0].tutor_id).single();
            if (tutorInfo) {
              setRelationInfo({
                type: 'tutor', name: `${tutorInfo.first_name} ${tutorInfo.last_name}`,
                company: tutorInfo.company_name || undefined, position: tutorInfo.position || undefined,
              });
            } else {
              setRelationInfo(null);
            }
          } else {
            setRelationInfo(null);
          }
        }
      } catch (err) {
        console.error('Erreur relations:', err);
        if (mounted.current) setError('Erreur de chargement des données');
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    fetchUserRelations();
    return () => { mounted.current = false; };
  }, [userId, userRole]);

  return { userInfo, relationInfo, loading: loading || userLoading, error: error || userError };
};
