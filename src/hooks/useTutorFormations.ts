import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';

export interface TutorFormation {
  formation_id: string;
  formation_title: string;
  formation_level: string;
  formation_description?: string;
  formation_start_date: string;
  formation_end_date: string;
  formation_color?: string;
  formation_duration?: number;
  modules_count?: number;
  student_id: string;
  student_first_name: string;
  student_last_name: string;
  student_email: string;
}

export const useTutorFormations = () => {
  const { userId, userRole } = useCurrentUser();
  const [formations, setFormations] = useState<TutorFormation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTutorFormations = useCallback(async () => {
    if (!userId || userRole !== 'Tuteur') {
      setFormations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching tutor formations for userId:', userId);
      
      // Récupérer les apprentis du tuteur via la table d’assignation (autorisé côté RLS)
      const { data: assignments, error: assignmentsError } = await supabase
        .from('tutor_student_assignments')
        .select(
          `
          student_id,
          users:student_id(
            id,
            first_name,
            last_name,
            email
          )
        `
        )
        .eq('tutor_id', userId)
        .eq('is_active', true);

      if (assignmentsError) {
        console.error('❌ Error fetching tutor students assignments:', assignmentsError);
        throw assignmentsError;
      }

      const studentsData = (assignments ?? [])
        .map((a: any) => ({
          student_id: a.student_id,
          student_first_name: a.users?.first_name ?? '',
          student_last_name: a.users?.last_name ?? '',
          student_email: a.users?.email ?? '',
        }))
        .filter((s: any) => Boolean(s.student_id));

      console.log('📋 Students data from tutor_student_assignments:', studentsData);

      if (studentsData.length === 0) {
        console.log('ℹ️ No students found for this tutor');
        setFormations([]);
        return;
      }

      // Récupérer les IDs des étudiants
      const studentIds = [...new Set(studentsData.map((s: any) => s.student_id))];
      console.log('👥 Student IDs:', studentIds);

      if (studentIds.length === 0) {
        setFormations([]);
        return;
      }

      // Récupérer les formations des étudiants via user_formation_assignments
      const { data: formationAssignments, error: formationError } = await supabase
        .from('user_formation_assignments')
        .select(`
          user_id,
          formation_id,
          formations(
            id,
            title,
            level,
            description,
            start_date,
            end_date,
            color,
            duration,
            formation_modules(id)
          )
        `)
        .in('user_id', studentIds);
      
      if (formationError) {
        console.error('❌ Error fetching formation assignments:', formationError);
        throw formationError;
      }

      console.log('📚 Formation assignments:', formationAssignments);

      // Combiner les données
      const enrichedData: TutorFormation[] = [];
      
      formationAssignments?.forEach(fa => {
        const studentData = studentsData.find(s => s.student_id === fa.user_id);
        const formation = fa.formations as any;
        
        if (studentData && formation) {
          enrichedData.push({
            formation_id: formation.id,
            formation_title: formation.title,
            formation_level: formation.level,
            formation_description: formation.description,
            formation_start_date: formation.start_date,
            formation_end_date: formation.end_date,
            formation_color: formation.color,
            formation_duration: formation.duration,
            modules_count: formation.formation_modules?.length || 0,
            student_id: fa.user_id,
            student_first_name: studentData.student_first_name || '',
            student_last_name: studentData.student_last_name || '',
            student_email: studentData.student_email || ''
          });
        }
      });

      console.log('✅ Enriched formations data:', enrichedData);
      setFormations(enrichedData);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des formations tuteur:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  useEffect(() => {
    fetchTutorFormations();
  }, [fetchTutorFormations]);

  // Récupérer les formations uniques
  const getUniqueFormations = useCallback(() => {
    const uniqueFormations = new Map();
    formations.forEach(formation => {
      if (!uniqueFormations.has(formation.formation_id)) {
        uniqueFormations.set(formation.formation_id, {
          ...formation,
          students: []
        });
      }
      uniqueFormations.get(formation.formation_id).students.push({
        id: formation.student_id,
        first_name: formation.student_first_name,
        last_name: formation.student_last_name,
        email: formation.student_email
      });
    });
    return Array.from(uniqueFormations.values());
  }, [formations]);

  return {
    formations,
    loading,
    error,
    getUniqueFormations,
    refetch: fetchTutorFormations
  };
};