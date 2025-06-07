import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Send, Search, Plus, MessageCircle, Clock,
  CheckCircle2, Circle, Wifi, WifiOff
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { ChatMessage, ChatConversation } from '@/lib/services/chatService';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import NewChatDialog from './NewChatDialog';

interface ChatInterfaceProps {
  userId?: string;
  onCreateConversation?: (influencerId: string) => void;
  className?: string;
}

const ChatInterface = ({ userId, onCreateConversation, className }: ChatInterfaceProps) => {
  const {
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
  } = useChat({ userId, autoConnect: false });

  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when conversation is selected
  useEffect(() => {
    if (activeConversation) {
      markAsRead();
    }
  }, [activeConversation, markAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    await sendMessage(newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateConversation = async (influencerId: string) => {
    try {
      const conversationId = await createConversation(influencerId);

      // Find the newly created conversation and select it
      setTimeout(() => {
        const newConversation = conversations.find(conv =>
          conv.participants?.some(p => p.influencer_id === influencerId)
        );
        if (newConversation) {
          selectConversation(newConversation);
        }
      }, 500); // Small delay to allow conversation list to update

      // Call the optional callback
      onCreateConversation?.(influencerId);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd');
    }
  };

  const getConversationPartner = (conversation: ChatConversation) => {
    return conversation.participants?.find(p => p.influencer_id)?.influencer;
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const partner = getConversationPartner(conv);
    return partner?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           partner?.handle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getUnreadCount = (conversation: ChatConversation) => {
    // This would need to be calculated based on unread messages
    // For now, return 0 as placeholder
    return 0;
  };

  return (
    <div className={cn("flex h-[600px] bg-white border border-gray-200 rounded-lg shadow-sm", className)}>
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
            </CardTitle>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNewChatDialog(true)}
                className="h-8 w-8 p-0 hover:bg-coral/10 hover:text-coral"
                title="Start new conversation"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-200"
            />
          </div>
        </CardHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-1 p-3 pt-0">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-coral"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
                <p className="text-gray-600 text-sm mb-4">Start a conversation with an influencer from your active campaigns</p>
                <Button
                  onClick={() => setShowNewChatDialog(true)}
                  className="bg-coral hover:bg-coral/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const partner = getConversationPartner(conversation);
                const unreadCount = getUnreadCount(conversation);
                const isActive = activeConversation?.id === conversation.id;

                return (
                  <div
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      isActive 
                        ? "bg-coral/10 border border-coral/20" 
                        : "hover:bg-gray-50"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={partner?.avatar_url || ''} />
                      <AvatarFallback className="bg-coral text-white">
                        {partner?.name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 truncate">
                          {partner?.name || 'Unknown'}
                        </h4>
                        {conversation.last_message_at && (
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(conversation.last_message_at)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                        {unreadCount > 0 && (
                          <Badge className="bg-coral text-white text-xs">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500">@{partner?.handle}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <CardHeader className="pb-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getConversationPartner(activeConversation)?.avatar_url || ''} />
                  <AvatarFallback className="bg-coral text-white">
                    {getConversationPartner(activeConversation)?.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {getConversationPartner(activeConversation)?.name || 'Unknown'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    @{getConversationPartner(activeConversation)?.handle} • {getConversationPartner(activeConversation)?.platform}
                  </p>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-coral"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                    <p className="text-gray-600">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.sender_type === 'user';
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isOwn && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getConversationPartner(activeConversation)?.avatar_url || ''} />
                            <AvatarFallback className="bg-coral text-white text-xs">
                              {getConversationPartner(activeConversation)?.name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-3 py-2",
                            isOwn
                              ? "bg-coral text-white"
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1",
                            isOwn ? "justify-end" : "justify-start"
                          )}>
                            <span className={cn(
                              "text-xs",
                              isOwn ? "text-white/70" : "text-gray-500"
                            )}>
                              {formatMessageTime(message.created_at)}
                            </span>
                            {isOwn && (
                              message.is_read ? (
                                <CheckCircle2 className="h-3 w-3 text-white/70" />
                              ) : (
                                <Circle className="h-3 w-3 text-white/70" />
                              )
                            )}
                          </div>
                        </div>
                        
                        {isOwn && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gray-600 text-white text-xs">
                              You
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 border-gray-200"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-coral hover:bg-coral/90 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <NewChatDialog
        open={showNewChatDialog}
        onOpenChange={setShowNewChatDialog}
        onInfluencerSelect={handleCreateConversation}
      />
    </div>
  );
};

export default ChatInterface;
