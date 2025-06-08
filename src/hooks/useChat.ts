import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService, ChatMessage, ChatConversation } from '@/lib/services/chatService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UseChatOptions {
  userId?: string;
  autoConnect?: boolean;
}

export interface UseChatReturn {
  // Conversations
  conversations: ChatConversation[];
  loadingConversations: boolean;
  
  // Active conversation
  activeConversation: ChatConversation | null;
  messages: ChatMessage[];
  loadingMessages: boolean;
  
  // Actions
  selectConversation: (conversation: ChatConversation) => void;
  sendMessage: (content: string) => Promise<void>;
  createConversation: (influencerId: string) => Promise<string>;
  markAsRead: () => Promise<void>;
  
  // Real-time status
  isConnected: boolean;
  
  // Cleanup
  cleanup: () => void;
}

export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
  const { userId, autoConnect = true } = options;
  const { toast } = useToast();
  
  // State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs for cleanup
  const unsubscribeConversationRef = useRef<(() => void) | null>(null);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  // Get current user ID if not provided
  useEffect(() => {
    if (!userId && autoConnect) {
      // For demo purposes, use a default user ID or skip authentication
      const demoUserId = 'demo-user-id';
      currentUserIdRef.current = demoUserId;
      loadConversations(demoUserId);
    } else if (userId) {
      currentUserIdRef.current = userId;
      if (autoConnect) {
        loadConversations(userId);
      }
    }
  }, [userId, autoConnect]);

  // Load conversations
  const loadConversations = useCallback(async (userIdToUse: string) => {
    setLoadingConversations(true);
    try {
      const convs = await chatService.getUserConversations(userIdToUse);
      setConversations(convs);
      
      // Subscribe to conversation updates
      if (unsubscribeConversationRef.current) {
        unsubscribeConversationRef.current();
      }
      
      unsubscribeConversationRef.current = chatService.subscribeToUserConversations(
        userIdToUse,
        (updatedConversation) => {
          setConversations(prev => {
            const index = prev.findIndex(c => c.id === updatedConversation.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = updatedConversation;
              return updated.sort((a, b) => 
                new Date(b.last_message_at || b.created_at).getTime() - 
                new Date(a.last_message_at || a.created_at).getTime()
              );
            } else {
              return [updatedConversation, ...prev];
            }
          });
        },
        (error) => {
          console.error('Conversation subscription error:', error);
          setIsConnected(false);
        }
      );
      
      setIsConnected(true);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setLoadingConversations(false);
    }
  }, [toast]);

  // Select conversation and load messages
  const selectConversation = useCallback(async (conversation: ChatConversation) => {
    setActiveConversation(conversation);
    setLoadingMessages(true);
    
    try {
      const msgs = await chatService.getConversationMessages(conversation.id);
      setMessages(msgs);
      
      // Subscribe to new messages
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
      }
      
      unsubscribeMessagesRef.current = chatService.subscribeToConversation(
        conversation.id,
        (newMessage) => {
          setMessages(prev => [...prev, newMessage]);
        },
        (error) => {
          console.error('Message subscription error:', error);
        }
      );
      
      // Mark messages as read
      if (currentUserIdRef.current) {
        await chatService.markMessagesAsRead(conversation.id, currentUserIdRef.current);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoadingMessages(false);
    }
  }, [toast]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!activeConversation || !currentUserIdRef.current || !content.trim()) {
      return;
    }

    try {
      const message = await chatService.sendMessage(
        activeConversation.id,
        currentUserIdRef.current,
        'user',
        content.trim()
      );
      
      // Message will be added via real-time subscription
      // But add it immediately for better UX
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  }, [activeConversation, toast]);

  // Create new conversation
  const createConversation = useCallback(async (influencerId: string): Promise<string> => {
    if (!currentUserIdRef.current) {
      throw new Error('User not authenticated');
    }

    try {
      const conversationId = await chatService.getOrCreateConversation(
        currentUserIdRef.current,
        influencerId
      );
      
      // Reload conversations to include the new one
      await loadConversations(currentUserIdRef.current);
      
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive',
      });
      throw error;
    }
  }, [loadConversations, toast]);

  // Mark active conversation as read
  const markAsRead = useCallback(async () => {
    if (!activeConversation || !currentUserIdRef.current) {
      return;
    }

    try {
      await chatService.markMessagesAsRead(activeConversation.id, currentUserIdRef.current);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [activeConversation]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (unsubscribeConversationRef.current) {
      unsubscribeConversationRef.current();
      unsubscribeConversationRef.current = null;
    }
    if (unsubscribeMessagesRef.current) {
      unsubscribeMessagesRef.current();
      unsubscribeMessagesRef.current = null;
    }
    chatService.cleanup();
    setIsConnected(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    conversations,
    loadingConversations,
    activeConversation,
    messages,
    loadingMessages,
    selectConversation,
    sendMessage,
    createConversation,
    markAsRead,
    isConnected,
    cleanup,
  };
};
