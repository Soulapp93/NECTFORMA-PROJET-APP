
-- =====================================================
-- CORRECTION DES POLITIQUES RLS POUR LES FORMATIONS
-- Les utilisateurs ne doivent voir que les formations auxquelles ils sont assignés
-- =====================================================

-- Supprimer l'ancienne politique trop permissive
DROP POLICY IF EXISTS "View establishment formations" ON public.formations;

-- Politique pour les Admins: voir toutes les formations de l'établissement
CREATE POLICY "Admins view all establishment formations"
ON public.formations
FOR SELECT
TO authenticated
USING (
  establishment_id = public.get_current_user_establishment()
  AND public.is_current_user_admin()
);

-- Politique pour les Étudiants/Formateurs: voir uniquement les formations assignées
CREATE POLICY "Users view assigned formations"
ON public.formations
FOR SELECT
TO authenticated
USING (
  NOT public.is_current_user_admin()
  AND public.get_current_user_role() != 'Tuteur'
  AND id IN (
    SELECT formation_id 
    FROM public.user_formation_assignments 
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- CORRECTION DES POLITIQUES RLS POUR LES MODULES
-- =====================================================

-- Supprimer l'ancienne politique trop permissive
DROP POLICY IF EXISTS "View formation modules" ON public.formation_modules;

-- Politique pour les Admins: voir tous les modules de l'établissement
CREATE POLICY "Admins view all formation modules"
ON public.formation_modules
FOR SELECT
TO authenticated
USING (
  public.is_current_user_admin()
  AND formation_id IN (
    SELECT id FROM public.formations 
    WHERE establishment_id = public.get_current_user_establishment()
  )
);

-- Politique pour les Étudiants/Formateurs: voir uniquement les modules des formations assignées
CREATE POLICY "Users view assigned formation modules"
ON public.formation_modules
FOR SELECT
TO authenticated
USING (
  NOT public.is_current_user_admin()
  AND formation_id IN (
    SELECT formation_id 
    FROM public.user_formation_assignments 
    WHERE user_id = auth.uid()
  )
);

-- Politique pour les Tuteurs: voir les modules via leur apprenti
CREATE POLICY "Tutors view student formation modules"
ON public.formation_modules
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 'Tuteur'
  AND formation_id IN (
    SELECT ufa.formation_id 
    FROM public.user_formation_assignments ufa
    JOIN public.tutor_student_assignments tsa ON tsa.student_id = ufa.user_id
    WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true
  )
);

-- =====================================================
-- CORRECTION DES POLITIQUES RLS POUR LES EMPLOIS DU TEMPS
-- =====================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "View schedules" ON public.schedules;
DROP POLICY IF EXISTS "View schedule slots" ON public.schedule_slots;

-- Politique schedules pour Admins
CREATE POLICY "Admins view all schedules"
ON public.schedules
FOR SELECT
TO authenticated
USING (
  public.is_current_user_admin()
  AND formation_id IN (
    SELECT id FROM public.formations 
    WHERE establishment_id = public.get_current_user_establishment()
  )
);

-- Politique schedules pour Étudiants/Formateurs
CREATE POLICY "Users view assigned formation schedules"
ON public.schedules
FOR SELECT
TO authenticated
USING (
  NOT public.is_current_user_admin()
  AND public.get_current_user_role() != 'Tuteur'
  AND formation_id IN (
    SELECT formation_id 
    FROM public.user_formation_assignments 
    WHERE user_id = auth.uid()
  )
);

-- Politique schedules pour Tuteurs
CREATE POLICY "Tutors view student schedules"
ON public.schedules
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 'Tuteur'
  AND formation_id IN (
    SELECT ufa.formation_id 
    FROM public.user_formation_assignments ufa
    JOIN public.tutor_student_assignments tsa ON tsa.student_id = ufa.user_id
    WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true
  )
);

-- Politique schedule_slots pour Admins (en plus de la politique existante)
CREATE POLICY "Admins view all schedule slots"
ON public.schedule_slots
FOR SELECT
TO authenticated
USING (
  public.is_current_user_admin()
);

-- Politique schedule_slots pour Étudiants/Formateurs
CREATE POLICY "Users view assigned formation schedule slots"
ON public.schedule_slots
FOR SELECT
TO authenticated
USING (
  NOT public.is_current_user_admin()
  AND schedule_id IN (
    SELECT s.id FROM public.schedules s
    WHERE s.formation_id IN (
      SELECT formation_id 
      FROM public.user_formation_assignments 
      WHERE user_id = auth.uid()
    )
  )
);

-- Politique schedule_slots pour Tuteurs
CREATE POLICY "Tutors view student schedule slots"
ON public.schedule_slots
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 'Tuteur'
  AND schedule_id IN (
    SELECT s.id FROM public.schedules s
    WHERE s.formation_id IN (
      SELECT ufa.formation_id 
      FROM public.user_formation_assignments ufa
      JOIN public.tutor_student_assignments tsa ON tsa.student_id = ufa.user_id
      WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true
    )
  )
);

-- =====================================================
-- CORRECTION DES POLITIQUES RLS POUR LES CAHIERS DE TEXTE
-- =====================================================

DROP POLICY IF EXISTS "View text books" ON public.text_books;

-- Politique text_books pour Admins
CREATE POLICY "Admins view all text books"
ON public.text_books
FOR SELECT
TO authenticated
USING (
  public.is_current_user_admin()
  AND formation_id IN (
    SELECT id FROM public.formations 
    WHERE establishment_id = public.get_current_user_establishment()
  )
);

-- Politique text_books pour Étudiants/Formateurs
CREATE POLICY "Users view assigned formation text books"
ON public.text_books
FOR SELECT
TO authenticated
USING (
  NOT public.is_current_user_admin()
  AND public.get_current_user_role() != 'Tuteur'
  AND formation_id IN (
    SELECT formation_id 
    FROM public.user_formation_assignments 
    WHERE user_id = auth.uid()
  )
);

-- Politique text_books pour Tuteurs
CREATE POLICY "Tutors view student text books"
ON public.text_books
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 'Tuteur'
  AND formation_id IN (
    SELECT ufa.formation_id 
    FROM public.user_formation_assignments ufa
    JOIN public.tutor_student_assignments tsa ON tsa.student_id = ufa.user_id
    WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true
  )
);

-- =====================================================
-- CORRECTION DES POLITIQUES RLS POUR LES ENTRÉES CAHIERS DE TEXTE
-- =====================================================

DROP POLICY IF EXISTS "View entries" ON public.text_book_entries;

-- Politique text_book_entries pour Admins et Formateurs (gestion complète via politique existante)
-- Politique de visualisation pour tous les utilisateurs assignés
CREATE POLICY "Users view assigned formation text book entries"
ON public.text_book_entries
FOR SELECT
TO authenticated
USING (
  text_book_id IN (
    SELECT tb.id FROM public.text_books tb
    WHERE tb.formation_id IN (
      SELECT formation_id 
      FROM public.user_formation_assignments 
      WHERE user_id = auth.uid()
    )
  )
  OR public.is_current_user_admin()
  OR public.get_current_user_role() = 'Formateur'
);

-- Politique text_book_entries pour Tuteurs
CREATE POLICY "Tutors view student text book entries"
ON public.text_book_entries
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 'Tuteur'
  AND text_book_id IN (
    SELECT tb.id FROM public.text_books tb
    WHERE tb.formation_id IN (
      SELECT ufa.formation_id 
      FROM public.user_formation_assignments ufa
      JOIN public.tutor_student_assignments tsa ON tsa.student_id = ufa.user_id
      WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true
    )
  )
);
