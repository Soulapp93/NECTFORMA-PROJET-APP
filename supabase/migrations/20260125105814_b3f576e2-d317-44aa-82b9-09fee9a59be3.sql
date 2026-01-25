-- =====================================================
-- NECTFORMA - SCHÉMA COMPLET DE BASE DE DONNÉES
-- Version propre pour Lovable Cloud
-- =====================================================

-- 1. TYPES ÉNUMÉRÉS
-- =====================================================
CREATE TYPE public.user_role AS ENUM ('AdminPrincipal', 'Admin', 'Formateur', 'Étudiant');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- 2. TABLE ESTABLISHMENTS (Établissements)
-- =====================================================
CREATE TABLE public.establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  siret TEXT,
  director TEXT,
  logo_url TEXT,
  number_of_students TEXT,
  number_of_instructors TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;

-- 3. TABLE USERS (Utilisateurs)
-- =====================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role public.user_role NOT NULL,
  status TEXT NOT NULL DEFAULT 'En attente',
  profile_photo_url TEXT,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  is_activated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. TABLE TUTORS (Tuteurs entreprise)
-- =====================================================
CREATE TABLE public.tutors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  position TEXT,
  profile_photo_url TEXT,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  is_activated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;

-- 5. TABLE TUTOR_STUDENT_ASSIGNMENTS (Liens tuteur-apprenti)
-- =====================================================
CREATE TABLE public.tutor_student_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tutor_id, student_id)
);

ALTER TABLE public.tutor_student_assignments ENABLE ROW LEVEL SECURITY;

-- 6. TABLE FORMATIONS
-- =====================================================
CREATE TABLE public.formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Actif',
  color TEXT DEFAULT '#8B5CF6',
  duration INTEGER NOT NULL,
  max_students INTEGER NOT NULL DEFAULT 25,
  price NUMERIC,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

-- 7. TABLE USER_FORMATION_ASSIGNMENTS (Inscriptions formations)
-- =====================================================
CREATE TABLE public.user_formation_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, formation_id)
);

ALTER TABLE public.user_formation_assignments ENABLE ROW LEVEL SECURITY;

-- 8. TABLE FORMATION_MODULES
-- =====================================================
CREATE TABLE public.formation_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_hours INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.formation_modules ENABLE ROW LEVEL SECURITY;

-- 9. TABLE SCHEDULES (Emplois du temps)
-- =====================================================
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 10. TABLE SCHEDULE_SLOTS (Créneaux)
-- =====================================================
CREATE TABLE public.schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.formation_modules(id) ON DELETE SET NULL,
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  notes TEXT,
  color TEXT DEFAULT '#8B5CF6',
  session_type TEXT DEFAULT 'encadree',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;

-- 11. TABLE ATTENDANCE_SHEETS (Feuilles d'émargement)
-- =====================================================
CREATE TABLE public.attendance_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_slot_id UUID NOT NULL REFERENCES public.schedule_slots(id) ON DELETE CASCADE,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  status TEXT NOT NULL DEFAULT 'En attente',
  session_type TEXT DEFAULT 'presentiel',
  qr_code TEXT,
  is_open_for_signing BOOLEAN DEFAULT false,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES public.users(id),
  signature_link_token TEXT,
  signature_link_expires_at TIMESTAMPTZ,
  signature_link_sent_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(schedule_slot_id)
);

ALTER TABLE public.attendance_sheets ENABLE ROW LEVEL SECURITY;

-- 12. TABLE ATTENDANCE_SIGNATURES
-- =====================================================
CREATE TABLE public.attendance_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_sheet_id UUID NOT NULL REFERENCES public.attendance_sheets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL,
  present BOOLEAN NOT NULL DEFAULT true,
  signature_data TEXT,
  absence_reason TEXT,
  absence_reason_type TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_signatures ENABLE ROW LEVEL SECURITY;

-- 13. TABLE INVITATIONS
-- =====================================================
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role public.user_role NOT NULL,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 14. TABLE USER_ACTIVATION_TOKENS
-- =====================================================
CREATE TABLE public.user_activation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activation_tokens ENABLE ROW LEVEL SECURITY;

-- 15. TABLE NOTIFICATIONS
-- =====================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 16. TABLE USER_SIGNATURES (Signatures enregistrées)
-- =====================================================
CREATE TABLE public.user_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  signature_data TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_signatures ENABLE ROW LEVEL SECURITY;

-- 17. TABLE TEXT_BOOKS (Cahiers de textes)
-- =====================================================
CREATE TABLE public.text_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.text_books ENABLE ROW LEVEL SECURITY;

-- 18. TABLE TEXT_BOOK_ENTRIES
-- =====================================================
CREATE TABLE public.text_book_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_book_id UUID NOT NULL REFERENCES public.text_books(id) ON DELETE CASCADE,
  schedule_slot_id UUID REFERENCES public.schedule_slots(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  objectives TEXT,
  homework TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.text_book_entries ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FONCTIONS UTILITAIRES RLS
-- =====================================================

-- Fonction pour obtenir l'établissement de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_current_user_establishment()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_establishment_id UUID;
BEGIN
  SELECT establishment_id INTO user_establishment_id FROM public.tutors WHERE id = auth.uid();
  IF user_establishment_id IS NULL THEN
    SELECT establishment_id INTO user_establishment_id FROM public.users WHERE id = auth.uid();
  END IF;
  RETURN user_establishment_id;
END;
$$;

-- Fonction pour obtenir le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.tutors WHERE id = auth.uid()) THEN
    RETURN 'Tuteur';
  END IF;
  SELECT role::TEXT INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN user_role;
END;
$$;

-- Fonction pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN get_current_user_role() IN ('Admin', 'AdminPrincipal');
END;
$$;

-- Fonction get_my_profile
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT jsonb_build_object(
    'id', t.id, 'email', t.email, 'first_name', t.first_name, 'last_name', t.last_name,
    'phone', t.phone, 'profile_photo_url', t.profile_photo_url, 'role', 'Tuteur',
    'status', CASE WHEN t.is_activated THEN 'Actif' ELSE 'En attente' END,
    'establishment_id', t.establishment_id, 'is_activated', t.is_activated
  ) INTO v_result FROM tutors t WHERE t.id = v_user_id;

  IF v_result IS NOT NULL THEN RETURN v_result; END IF;

  SELECT jsonb_build_object(
    'id', u.id, 'email', u.email, 'first_name', u.first_name, 'last_name', u.last_name,
    'phone', u.phone, 'profile_photo_url', u.profile_photo_url, 'role', u.role,
    'status', u.status, 'establishment_id', u.establishment_id, 'is_activated', u.is_activated
  ) INTO v_result FROM users u WHERE u.id = v_user_id;

  RETURN COALESCE(v_result, jsonb_build_object('error', 'User not found'));
END;
$$;

-- Fonction get_my_context
CREATE OR REPLACE FUNCTION public.get_my_context()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_data JSONB;
  v_relation_data JSONB;
  v_establishment_data JSONB;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('error', 'Not authenticated'); END IF;

  SELECT jsonb_build_object(
    'id', t.id, 'email', t.email, 'first_name', t.first_name, 'last_name', t.last_name,
    'phone', t.phone, 'profile_photo_url', t.profile_photo_url, 'role', 'Tuteur',
    'company_name', t.company_name, 'position', t.position, 'establishment_id', t.establishment_id
  ) INTO v_user_data FROM tutors t WHERE t.id = v_user_id;

  IF v_user_data IS NOT NULL THEN
    v_role := 'Tuteur';
    SELECT jsonb_build_object('type', 'student', 'id', u.id, 'name', u.first_name || ' ' || u.last_name, 'email', u.email)
    INTO v_relation_data FROM tutor_student_assignments tsa JOIN users u ON u.id = tsa.student_id
    WHERE tsa.tutor_id = v_user_id AND tsa.is_active = true LIMIT 1;
  ELSE
    SELECT jsonb_build_object(
      'id', u.id, 'email', u.email, 'first_name', u.first_name, 'last_name', u.last_name,
      'phone', u.phone, 'profile_photo_url', u.profile_photo_url, 'role', u.role, 'establishment_id', u.establishment_id
    ) INTO v_user_data FROM users u WHERE u.id = v_user_id;

    IF v_user_data IS NOT NULL THEN
      v_role := v_user_data->>'role';
      IF v_role = 'Étudiant' THEN
        SELECT jsonb_build_object('type', 'tutor', 'id', t.id, 'name', t.first_name || ' ' || t.last_name, 
          'email', t.email, 'company', t.company_name, 'position', t.position)
        INTO v_relation_data FROM tutor_student_assignments tsa JOIN tutors t ON t.id = tsa.tutor_id
        WHERE tsa.student_id = v_user_id AND tsa.is_active = true LIMIT 1;
      END IF;
    END IF;
  END IF;

  IF v_user_data IS NOT NULL AND v_user_data->>'establishment_id' IS NOT NULL THEN
    SELECT jsonb_build_object('id', e.id, 'name', e.name, 'logo_url', e.logo_url)
    INTO v_establishment_data FROM establishments e WHERE e.id = (v_user_data->>'establishment_id')::UUID;
  END IF;

  RETURN jsonb_build_object(
    'user', COALESCE(v_user_data, 'null'::JSONB),
    'relation', COALESCE(v_relation_data, 'null'::JSONB),
    'establishment', COALESCE(v_establishment_data, 'null'::JSONB),
    'role', v_role
  );
END;
$$;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Appliquer le trigger sur toutes les tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.establishments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tutors FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.formations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.formation_modules FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.schedule_slots FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.attendance_sheets FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.attendance_signatures FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_signatures FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.text_books FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.text_book_entries FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tutor_student_assignments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- POLITIQUES RLS
-- =====================================================

-- ESTABLISHMENTS
CREATE POLICY "View own establishment" ON public.establishments FOR SELECT USING (id = get_current_user_establishment());
CREATE POLICY "Admins update establishment" ON public.establishments FOR UPDATE USING (id = get_current_user_establishment() AND is_current_user_admin());
CREATE POLICY "Allow public insert for signup" ON public.establishments FOR INSERT WITH CHECK (true);

-- USERS
CREATE POLICY "View establishment users" ON public.users FOR SELECT USING (establishment_id = get_current_user_establishment());
CREATE POLICY "Admins manage users" ON public.users FOR ALL USING (establishment_id = get_current_user_establishment() AND is_current_user_admin());

-- TUTORS
CREATE POLICY "Admins manage tutors" ON public.tutors FOR ALL USING (establishment_id = get_current_user_establishment() AND is_current_user_admin());
CREATE POLICY "View own tutor profile" ON public.tutors FOR SELECT USING (id = auth.uid());
CREATE POLICY "Update own tutor profile" ON public.tutors FOR UPDATE USING (id = auth.uid());

-- TUTOR_STUDENT_ASSIGNMENTS
CREATE POLICY "Admins manage assignments" ON public.tutor_student_assignments FOR ALL USING (is_current_user_admin());
CREATE POLICY "View own assignments" ON public.tutor_student_assignments FOR SELECT USING (tutor_id = auth.uid() OR student_id = auth.uid());

-- FORMATIONS
CREATE POLICY "View establishment formations" ON public.formations FOR SELECT USING (establishment_id = get_current_user_establishment());
CREATE POLICY "Admins manage formations" ON public.formations FOR ALL USING (establishment_id = get_current_user_establishment() AND is_current_user_admin());
CREATE POLICY "Tutors view student formations" ON public.formations FOR SELECT 
  USING (id IN (SELECT formation_id FROM user_formation_assignments WHERE user_id IN 
    (SELECT student_id FROM tutor_student_assignments WHERE tutor_id = auth.uid() AND is_active = true)));

-- USER_FORMATION_ASSIGNMENTS
CREATE POLICY "View formation assignments" ON public.user_formation_assignments FOR SELECT USING (
  user_id = auth.uid() OR is_current_user_admin() OR 
  user_id IN (SELECT student_id FROM tutor_student_assignments WHERE tutor_id = auth.uid() AND is_active = true)
);
CREATE POLICY "Admins manage formation assignments" ON public.user_formation_assignments FOR ALL USING (is_current_user_admin());

-- FORMATION_MODULES
CREATE POLICY "View formation modules" ON public.formation_modules FOR SELECT USING (
  formation_id IN (SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()) OR is_current_user_admin()
);
CREATE POLICY "Admins manage modules" ON public.formation_modules FOR ALL USING (is_current_user_admin());

-- SCHEDULES
CREATE POLICY "View schedules" ON public.schedules FOR SELECT USING (
  formation_id IN (SELECT id FROM formations WHERE establishment_id = get_current_user_establishment())
);
CREATE POLICY "Admins manage schedules" ON public.schedules FOR ALL USING (is_current_user_admin());

-- SCHEDULE_SLOTS
CREATE POLICY "View schedule slots" ON public.schedule_slots FOR SELECT USING (
  schedule_id IN (SELECT id FROM schedules WHERE formation_id IN 
    (SELECT id FROM formations WHERE establishment_id = get_current_user_establishment()))
);
CREATE POLICY "Admins manage slots" ON public.schedule_slots FOR ALL USING (is_current_user_admin());
CREATE POLICY "Instructors view assigned slots" ON public.schedule_slots FOR SELECT USING (instructor_id = auth.uid());

-- ATTENDANCE_SHEETS
CREATE POLICY "Admins manage sheets" ON public.attendance_sheets FOR ALL USING (is_current_user_admin());
CREATE POLICY "Instructors manage own sheets" ON public.attendance_sheets FOR ALL USING (instructor_id = auth.uid());
CREATE POLICY "View formation sheets" ON public.attendance_sheets FOR SELECT USING (
  formation_id IN (SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid())
);

-- ATTENDANCE_SIGNATURES
CREATE POLICY "Create own signature" ON public.attendance_signatures FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "View own signatures" ON public.attendance_signatures FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage signatures" ON public.attendance_signatures FOR ALL USING (is_current_user_admin());
CREATE POLICY "Instructors view session signatures" ON public.attendance_signatures FOR SELECT USING (
  attendance_sheet_id IN (SELECT id FROM attendance_sheets WHERE instructor_id = auth.uid())
);

-- INVITATIONS
CREATE POLICY "Admins manage invitations" ON public.invitations FOR ALL USING (
  establishment_id = get_current_user_establishment() AND is_current_user_admin()
);

-- USER_ACTIVATION_TOKENS (access via edge functions only)
CREATE POLICY "No direct access" ON public.user_activation_tokens FOR SELECT USING (false);

-- NOTIFICATIONS
CREATE POLICY "View own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- USER_SIGNATURES
CREATE POLICY "Manage own signature" ON public.user_signatures FOR ALL USING (user_id = auth.uid());

-- TEXT_BOOKS
CREATE POLICY "View text books" ON public.text_books FOR SELECT USING (
  formation_id IN (SELECT id FROM formations WHERE establishment_id = get_current_user_establishment())
);
CREATE POLICY "Manage text books" ON public.text_books FOR ALL USING (
  get_current_user_role() IN ('Admin', 'AdminPrincipal', 'Formateur')
);

-- TEXT_BOOK_ENTRIES
CREATE POLICY "View entries" ON public.text_book_entries FOR SELECT USING (
  text_book_id IN (SELECT id FROM text_books WHERE formation_id IN 
    (SELECT id FROM formations WHERE establishment_id = get_current_user_establishment()))
);
CREATE POLICY "Manage entries" ON public.text_book_entries FOR ALL USING (
  get_current_user_role() IN ('Admin', 'AdminPrincipal', 'Formateur')
);

-- =====================================================
-- PERMISSIONS RPC
-- =====================================================
GRANT EXECUTE ON FUNCTION public.get_current_user_establishment() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_context() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_current_user_establishment() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_context() FROM anon;