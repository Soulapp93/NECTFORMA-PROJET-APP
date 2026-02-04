-- Créer le premier Super Admin via trigger automatique
-- Cette fonction sera appelée automatiquement quand un utilisateur avec cet email se connecte

CREATE OR REPLACE FUNCTION public.auto_assign_super_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_email TEXT := 'soulsang383@gmail.com';
BEGIN
  -- Si c'est l'email du super admin et qu'il n'a pas encore le rôle
  IF NEW.email = super_admin_email THEN
    INSERT INTO public.platform_user_roles (user_id, role, granted_at)
    VALUES (NEW.id, 'super_admin', now())
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger sur la création d'utilisateur auth
CREATE OR REPLACE TRIGGER assign_super_admin_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_super_admin();