import { supabase } from '@/integrations/supabase/client';

// Helper function to get current user ID
const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.id;
};

export interface ChatGroup {
  id: string;
  establishment_id: string;
  formation_id: string | null;
  name: string;
  description: string | null;
  group_type: 'establishment' | 'formation' | 'private';
  created_by: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: ChatMessage;
  member_count?: number;
}

export interface ChatGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  last_read_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_photo_url: string | null;
    role: string;
  };
}

export interface ChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'file' | 'system';
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  replied_to_message_id?: string | null;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url: string | null;
    role: string;
  };
  attachments?: ChatMessageAttachment[];
  replied_to_message?: {
    id: string;
    content: string;
    sender?: {
      id: string;
      first_name: string;
      last_name: string;
    };
  };
}

export interface ChatMessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  content_type: string | null;
  created_at: string;
}

export const chatService = {
  // Get all groups for current user
  // NOTE: Tables chat_groups and chat_group_members don't exist yet
  // Return empty array until tables are created
  async getUserGroups(): Promise<ChatGroup[]> {
    console.log('⚠️ Chat groups feature not yet implemented - tables do not exist');
    return [];
  },

  // Get group by ID with details
  async getGroupById(groupId: string): Promise<ChatGroup | null> {
    console.log('⚠️ Chat groups feature not yet implemented');
    return null;
  },

  // Get group members
  async getGroupMembers(groupId: string): Promise<ChatGroupMember[]> {
    console.log('⚠️ Chat groups feature not yet implemented');
    return [];
  },

  // Create a new group
  async createGroup(groupData: {
    name: string;
    description?: string;
    formation_id?: string;
    member_ids: string[];
  }): Promise<ChatGroup> {
    throw new Error('Chat groups feature not yet implemented - tables do not exist');
  },

  // Get messages for a group
  async getGroupMessages(groupId: string, limit: number = 50): Promise<ChatMessage[]> {
    console.log('⚠️ Chat messages feature not yet implemented');
    return [];
  },

  // Send a message
  async sendMessage(groupId: string, content: string, repliedToMessageId?: string | null): Promise<ChatMessage> {
    throw new Error('Chat messages feature not yet implemented - tables do not exist');
  },

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    console.log('⚠️ Chat messages feature not yet implemented');
  },

  // Upload attachment
  async uploadAttachment(messageId: string, file: File): Promise<ChatMessageAttachment> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${messageId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('module-files')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('module-files')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('chat_message_attachments')
      .insert({
        message_id: messageId,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as ChatMessageAttachment;
  },

  // Update last read timestamp
  async updateLastRead(groupId: string): Promise<void> {
    console.log('⚠️ Chat groups feature not yet implemented');
  },

  // Subscribe to new messages
  subscribeToMessages(groupId: string, callback: (message: ChatMessage) => void) {
    // Return a dummy channel since tables don't exist
    const channel = supabase.channel(`chat_placeholder_${groupId}`);
    return channel;
  },

  // Leave group
  async leaveGroup(groupId: string): Promise<void> {
    console.log('⚠️ Chat groups feature not yet implemented');
  },
};
