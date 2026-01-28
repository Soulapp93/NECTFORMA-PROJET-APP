-- Mise à jour de la fonction pour permettre l'accès à tous les utilisateurs de l'établissement
-- (Étudiants, Formateurs, Admins, Tuteurs liés)

CREATE OR REPLACE FUNCTION public.get_formation_students(formation_id_param uuid)
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  profile_photo_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auth obligatoire
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Autorisation: TOUS les utilisateurs authentifiés de l'établissement peuvent voir les participants
  -- Vérifie que l'utilisateur appartient au même établissement que la formation
  IF NOT EXISTS (
    SELECT 1 FROM public.formations f
    WHERE f.id = formation_id_param
      AND f.establishment_id = public.get_current_user_establishment()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_photo_url
  FROM public.user_formation_assignments ufa
  JOIN public.users u ON u.id = ufa.user_id
  WHERE ufa.formation_id = formation_id_param
    AND u.role = 'Étudiant'::public.user_role
  ORDER BY u.last_name, u.first_name;
END;
$$;