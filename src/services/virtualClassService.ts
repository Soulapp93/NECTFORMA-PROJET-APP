import { supabase } from '@/integrations/supabase/client';

// Type helper for database operations on non-typed tables
const db = supabase as any;

export interface VirtualClass {
  id: string;
  title: string;
  description?: string;
  formation_id: string;
  instructor_id: string;
  module_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  room_url?: string;
  max_participants?: number;
  current_participants?: number;
  recording_enabled?: boolean;
  recording_url?: string;
  created_at: string;
  updated_at: string;
  instructor?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  formation?: {
    id: string;
    title: string;
    color: string;
  };
  participants_count?: number;
  materials?: VirtualClassMaterial[];
}

export interface VirtualClassParticipant {
  id: string;
  virtual_class_id: string;
  user_id: string;
  status: string;
  joined_at?: string;
  left_at?: string;
  created_at: string;
}

export interface VirtualClassMaterial {
  id: string;
  virtual_class_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  created_at: string;
}

export interface CreateVirtualClassData {
  title: string;
  description?: string;
  formation_id: string;
  instructor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status?: string;
  room_url?: string;
  max_participants?: number;
}

export const virtualClassService = {
  async getVirtualClasses(): Promise<VirtualClass[]> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    let user: { role?: string | null; establishment_id?: string | null } | null = null;
    if (userId) {
      const { data } = await supabase
        .from('users')
        .select('role, establishment_id')
        .eq('id', userId)
        .maybeSingle();
      user = data ?? null;
    }

    const { data, error } = await db
      .from('virtual_classes')
      .select(`
        *,
        instructor:users!instructor_id(id, first_name, last_name, email),
        formation:formations!formation_id(id, title, color)
      `)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return (data || []) as VirtualClass[];
  },

  async getVirtualClassById(id: string): Promise<VirtualClass | null> {
    const { data, error } = await db
      .from('virtual_classes')
      .select(`
        *,
        instructor:users!instructor_id(id, first_name, last_name, email),
        formation:formations!formation_id(id, title, color)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as VirtualClass;
  },

  async createVirtualClass(classData: CreateVirtualClassData): Promise<VirtualClass> {
    const { data, error } = await db
      .from('virtual_classes')
      .insert(classData)
      .select()
      .single();

    if (error) throw error;
    return data as VirtualClass;
  },

  async updateVirtualClass(id: string, updates: Partial<CreateVirtualClassData>): Promise<VirtualClass> {
    const { data, error } = await db
      .from('virtual_classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as VirtualClass;
  },

  async deleteVirtualClass(id: string): Promise<void> {
    const { error } = await db
      .from('virtual_classes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async joinClass(classId: string, userId: string): Promise<VirtualClassParticipant> {
    const { data, error } = await db
      .from('virtual_class_participants')
      .insert({
        virtual_class_id: classId,
        user_id: userId,
        status: 'Inscrit'
      })
      .select()
      .single();

    if (error) throw error;

    await this.updateParticipantCount(classId);
    return data as VirtualClassParticipant;
  },

  async leaveClass(classId: string, userId: string): Promise<void> {
    const { error } = await db
      .from('virtual_class_participants')
      .delete()
      .eq('virtual_class_id', classId)
      .eq('user_id', userId);

    if (error) throw error;

    await this.updateParticipantCount(classId);
  },

  async updateParticipantStatus(classId: string, userId: string, status: 'Présent' | 'Absent'): Promise<VirtualClassParticipant> {
    const { data, error } = await db
      .from('virtual_class_participants')
      .update({ 
        status,
        joined_at: status === 'Présent' ? new Date().toISOString() : null,
        left_at: status === 'Absent' ? new Date().toISOString() : null
      })
      .eq('virtual_class_id', classId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as VirtualClassParticipant;
  },

  async updateParticipantCount(classId: string): Promise<void> {
    const { count } = await db
      .from('virtual_class_participants')
      .select('*', { count: 'exact', head: true })
      .eq('virtual_class_id', classId)
      .eq('status', 'Inscrit');

    await db
      .from('virtual_classes')
      .update({ current_participants: count || 0 })
      .eq('id', classId);
  },

  async addMaterial(material: Omit<VirtualClassMaterial, 'id' | 'created_at'>): Promise<VirtualClassMaterial> {
    const { data, error } = await db
      .from('virtual_class_materials')
      .insert(material)
      .select()
      .single();

    if (error) throw error;
    return data as VirtualClassMaterial;
  },

  async getInstructors() {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('role', 'Formateur')
      .order('first_name');

    if (error) throw error;
    return data;
  },

  async getFormations() {
    const { data, error } = await supabase
      .from('formations')
      .select('id, title, color')
      .eq('status', 'Actif')
      .order('title');

    if (error) throw error;
    return data;
  }
};
