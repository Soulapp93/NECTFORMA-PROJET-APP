import { supabase } from '@/integrations/supabase/client';

// Type helper for database operations on non-typed tables
const db = supabase as any;

export interface ModuleContent {
  id: string;
  module_id: string;
  content_type: string;
  title: string;
  description?: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateModuleContentData {
  module_id: string;
  content_type: string;
  title: string;
  description?: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  order_index?: number;
}

export const moduleContentService = {
  async getModuleContents(moduleId: string): Promise<ModuleContent[]> {
    const { data, error } = await db
      .from('module_contents')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at');
    
    if (error) throw error;
    return (data || []) as ModuleContent[];
  },

  async createContent(content: CreateModuleContentData): Promise<ModuleContent> {
    const { data, error } = await db
      .from('module_contents')
      .insert(content)
      .select()
      .single();

    if (error) throw error;
    return data as ModuleContent;
  },

  async updateContent(id: string, updates: Partial<CreateModuleContentData>): Promise<ModuleContent> {
    const { data, error } = await db
      .from('module_contents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ModuleContent;
  },

  async deleteContent(id: string): Promise<void> {
    const { error } = await db
      .from('module_contents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
