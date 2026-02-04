import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformRole {
  role: 'super_admin' | 'blog_editor' | 'seo_manager' | 'analytics_viewer';
}

export function useSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [canManageBlog, setCanManageBlog] = useState(false);
  const [canViewAnalytics, setCanViewAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [platformRoles, setPlatformRoles] = useState<PlatformRole[]>([]);

  useEffect(() => {
    checkPlatformRoles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkPlatformRoles();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkPlatformRoles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsSuperAdmin(false);
        setCanManageBlog(false);
        setCanViewAnalytics(false);
        setPlatformRoles([]);
        setLoading(false);
        return;
      }

      const { data: roles, error } = await supabase
        .from('platform_user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error checking platform roles:', error);
        setLoading(false);
        return;
      }

      const userRoles = (roles || []) as PlatformRole[];
      setPlatformRoles(userRoles);

      const isSA = userRoles.some(r => r.role === 'super_admin');
      const isBlogEditor = userRoles.some(r => r.role === 'blog_editor');
      const isSeoManager = userRoles.some(r => r.role === 'seo_manager');
      const isAnalyticsViewer = userRoles.some(r => r.role === 'analytics_viewer');

      setIsSuperAdmin(isSA);
      setCanManageBlog(isSA || isBlogEditor || isSeoManager);
      setCanViewAnalytics(isSA || isAnalyticsViewer);
    } catch (error) {
      console.error('Error in checkPlatformRoles:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isSuperAdmin,
    canManageBlog,
    canViewAnalytics,
    platformRoles,
    loading,
    refresh: checkPlatformRoles
  };
}
