import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  MessageSquare,
  Search,
  X,
  Send,
  ChevronLeft,
  Clock,
  Check,
  Mail,
  Target,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Conversation {
  id: string;
  influencer: {
    id: string;
    name: string;
    handle: string;
    avatar_url: string;
    platform: string;
  }[];
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_type: 'brand' | 'influencer';
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function Outreach() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [webhookResponses, setWebhookResponses] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [allInfluencers, setAllInfluencers] = useState<any[]>([]);
  const [searchInfluencer, setSearchInfluencer] = useState('');
  const [selectedNewInfluencer, setSelectedNewInfluencer] = useState<any | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id, selectedConversation.influencer[0].id);
    }
  }, [selectedConversation]);

  // Helper to get active campaign influencer IDs
  const getActiveCampaignInfluencerIds = async () => {
    const { data, error } = await supabase
      .from('campaign_influencers')
      .select('influencer_id, status, campaign_id');
    if (error) return [];
    return data
      .filter((ci: any) => ci.status === 'active' || ci.status === 'pending')
      .map((ci: any) => ci.influencer_id);
  };

  // Fetch conversations with only influencers in active/pending campaigns
  const fetchConversations = async () => {
    try {
      const activeInfluencerIds = await getActiveCampaignInfluencerIds();
      if (!activeInfluencerIds.length) {
        setConversations([]);
        return;
      }
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          last_message,
          last_message_time,
          unread_count,
          influencer:influencers (
            id,
            name,
            handle,
            avatar_url,
            platform
          )
        `)
        .in('influencer_id', activeInfluencerIds)
        .order('last_message_time', { ascending: false });
      if (error) throw error;
      // Ensure influencer is always an array
      const mapped = (data || []).map((conv: any) => ({
        ...conv,
        influencer: Array.isArray(conv.influencer) ? conv.influencer : [conv.influencer],
      }));
      setConversations(mapped);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    }
  };

  // Fetch messages using sender/receiver logic
  const fetchMessages = async (conversationId: string, influencerId?: string) => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      if (!userId || !influencerId) {
        setMessages([]);
        return;
      }
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${influencerId}),and(sender_id.eq.${influencerId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      // Add fallback for sender_type and is_read
      const mapped = (data || []).map((msg: any) => ({
        ...msg,
        sender_type: msg.sender_type || (msg.sender_id === userId ? 'brand' : 'influencer'),
        is_read: typeof msg.is_read === 'boolean' ? msg.is_read : true,
      }));
      setMessages(mapped);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  // Send message using sender/receiver logic
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      const influencerId = selectedConversation.influencer[0].id;
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          sender_id: userId,
          receiver_id: influencerId,
        });
      if (error) throw error;
      setNewMessage('');
      fetchMessages(selectedConversation.id, influencerId);
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.influencer[0].name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.influencer[0].handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch all influencers for add dialog
  const fetchAllInfluencers = async () => {
    const { data, error } = await supabase
      .from('influencers')
      .select('id, name, handle, avatar_url, platform');
    if (!error) setAllInfluencers(data || []);
  };

  // Add new conversation
  const handleAddConversation = async () => {
    if (!selectedNewInfluencer) return;
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('influencer_id', selectedNewInfluencer.id)
        .eq('brand_user_id', userId)
        .single();
      if (existing) {
        setShowAddDialog(false);
        setSelectedConversation({
          id: existing.id,
          influencer: [selectedNewInfluencer],
          last_message: '',
          last_message_time: '',
          unread_count: 0,
        });
        return;
      }
      // Create new conversation
      const { data: newConv, error: insertError } = await supabase
        .from('conversations')
        .insert({
          influencer_id: selectedNewInfluencer.id,
          brand_user_id: userId,
          last_message: '',
          last_message_time: new Date().toISOString(),
          unread_count: 0,
        })
        .select('id')
        .single();
      if (insertError) throw insertError;
      setShowAddDialog(false);
      setSelectedConversation({
        id: newConv.id,
        influencer: [selectedNewInfluencer],
        last_message: '',
        last_message_time: '',
        unread_count: 0,
      });
      fetchConversations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex gap-6">
        {/* Conversations List */}
        <Card className="w-1/3 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-snow">Messages</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-snow/50 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-snow"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setShowAddDialog(true); fetchAllInfluencers(); }}>
              <Plus className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id
                        ? 'bg-purple-500/20'
                        : 'hover:bg-zinc-800'
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={conv.influencer[0].avatar_url} />
                        <AvatarFallback>{conv.influencer[0].name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-snow truncate">
                            {conv.influencer[0].name}
                          </p>
                          <span className="text-xs text-snow/50">
                            {format(new Date(conv.last_message_time), 'MMM d')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-snow/70 truncate">
                            {conv.last_message}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-snow bg-purple-500 rounded-full">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="flex-1 bg-zinc-900 border-zinc-800">
          {selectedConversation ? (
            <div className="h-[calc(100vh-8rem)] flex flex-col">
              <CardHeader className="border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Avatar>
                      <AvatarImage src={selectedConversation.influencer[0].avatar_url} />
                      <AvatarFallback>
                        {selectedConversation.influencer[0].name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-snow">
                        {selectedConversation.influencer[0].name}
                      </CardTitle>
                      <p className="text-sm text-snow/60">
                        @{selectedConversation.influencer[0].handle}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_type === 'brand' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender_type === 'brand'
                            ? 'bg-purple-500 text-snow'
                            : 'bg-zinc-800 text-snow'
                        }`}
                      >
                        <p>{message.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs opacity-70">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </span>
                          {message.sender_type === 'brand' && (
                            message.is_read ? (
                              <Check className="h-3 w-3 opacity-70" />
                            ) : (
                              <Clock className="h-3 w-3 opacity-70" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-zinc-800">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[calc(100vh-8rem)] flex items-center justify-center text-snow/50">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Conversation Selected</h3>
                <p className="text-sm">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Conversation</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search influencer..."
            value={searchInfluencer}
            onChange={e => setSearchInfluencer(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto mt-2">
            {allInfluencers
              .filter(i =>
                i.name.toLowerCase().includes(searchInfluencer.toLowerCase()) ||
                i.handle.toLowerCase().includes(searchInfluencer.toLowerCase())
              )
              .map(i => (
                <div
                  key={i.id}
                  className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-100 rounded ${selectedNewInfluencer?.id === i.id ? 'bg-gray-200' : ''}`}
                  onClick={() => setSelectedNewInfluencer(i)}
                >
                  <Avatar>
                    <AvatarImage src={i.avatar_url} />
                    <AvatarFallback>{i.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{i.name}</div>
                    <div className="text-xs text-gray-500">@{i.handle}</div>
                  </div>
                </div>
              ))}
          </div>
          <Button onClick={handleAddConversation} disabled={!selectedNewInfluencer} className="mt-2 w-full">Start Chat</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
