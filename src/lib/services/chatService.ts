import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'influencer';
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface ChatConversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_at: string | null;
  participants: ChatParticipant[];
  unread_count?: number;
}

export interface ChatParticipant {
  id: string;
  conversation_id: string;
  user_id: string | null;
  influencer_id: string | null;
  created_at: string;
  user?: {
    id: string;
    email: string;
  };
  influencer?: {
    id: string;
    name: string;
    handle: string;
    avatar_url: string | null;
    platform: string;
  };
}

class ChatService {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Get or create a conversation between a user and an influencer
   */
  async getOrCreateConversation(userId: string, influencerId: string): Promise<string> {
    try {
      // First, check if a conversation already exists by finding conversations where both participants exist
      const { data: userParticipant, error: userError } = await supabase
        .from('chat_participants')
        .select('conversation_id')
        .eq('user_id', userId)
        .is('influencer_id', null);

      if (userError) throw userError;

      if (userParticipant && userParticipant.length > 0) {
        const userConversationIds = userParticipant.map(p => p.conversation_id);

        // Check if any of these conversations also have the influencer
        const { data: influencerParticipant, error: influencerError } = await supabase
          .from('chat_participants')
          .select('conversation_id')
          .eq('influencer_id', influencerId)
          .is('user_id', null)
          .in('conversation_id', userConversationIds);

        if (influencerError) throw influencerError;

        if (influencerParticipant && influencerParticipant.length > 0) {
          return influencerParticipant[0].conversation_id;
        }
      }

      // Create new conversation
      const { data: newConversation, error: conversationError } = await supabase
        .from('chat_conversations')
        .insert({})
        .select('id')
        .single();

      if (conversationError) throw conversationError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          {
            conversation_id: newConversation.id,
            user_id: userId,
            influencer_id: null
          },
          {
            conversation_id: newConversation.id,
            user_id: null,
            influencer_id: influencerId
          }
        ]);

      if (participantsError) throw participantsError;

      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<ChatConversation[]> {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          conversation_id,
          chat_conversations!inner(
            id,
            created_at,
            updated_at,
            last_message,
            last_message_at
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      // Get conversation details with participants
      const conversationIds = data.map(item => item.conversation_id);
      
      const { data: conversations, error: convError } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          chat_participants(
            id,
            user_id,
            influencer_id,
            created_at,
            influencers(
              id,
              name,
              handle,
              avatar_url,
              platform
            )
          )
        `)
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      return conversations || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderType: 'user' | 'influencer',
    content: string
  ): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          sender_type: senderType,
          content: content,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('chat_conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time messages for a conversation
   */
  subscribeToConversation(
    conversationId: string,
    onMessage: (message: ChatMessage) => void,
    onError?: (error: any) => void
  ): () => void {
    const channelName = `conversation:${conversationId}`;
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
      this.channels.delete(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          onMessage(payload.new as ChatMessage);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to conversation: ${conversationId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error subscribing to conversation: ${conversationId}`);
          onError?.(status);
        }
      });

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to real-time conversation updates for a user
   */
  subscribeToUserConversations(
    userId: string,
    onConversationUpdate: (conversation: ChatConversation) => void,
    onError?: (error: any) => void
  ): () => void {
    const channelName = `user_conversations:${userId}`;
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
      this.channels.delete(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations'
        },
        async (payload) => {
          // Fetch updated conversation with participants
          const { data, error } = await supabase
            .from('chat_conversations')
            .select(`
              *,
              chat_participants(
                id,
                user_id,
                influencer_id,
                created_at,
                influencers(
                  id,
                  name,
                  handle,
                  avatar_url,
                  platform
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            onConversationUpdate(data);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to user conversations: ${userId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error subscribing to user conversations: ${userId}`);
          onError?.(status);
        }
      });

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }
}

export const chatService = new ChatService();
