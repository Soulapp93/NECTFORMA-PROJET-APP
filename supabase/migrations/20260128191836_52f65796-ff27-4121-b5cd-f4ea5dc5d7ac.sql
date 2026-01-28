-- Fonction sécurisée pour récupérer les étudiants inscrits à une formation
-- (permet aux Admins et aux Formateurs assignés à la formation de voir la liste)

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

  -- Autorisation: Admin OU Formateur assigné à cette formation
  IF NOT (
    public.is_current_user_admin()
    OR (
      public.get_current_user_role() = 'Formateur'
      AND EXISTS (
        SELECT 1
        FROM public.user_formation_assignments ufa
        WHERE ufa.formation_id = formation_id_param
          AND ufa.user_id = auth.uid()
      )
    )
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

-- Autoriser l'exécution côté client (utilisateurs connectés)
GRANT EXECUTE ON FUNCTION public.get_formation_students(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_formation_students(uuid) FROM anon;