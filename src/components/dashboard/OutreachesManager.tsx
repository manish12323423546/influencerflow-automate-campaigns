import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NewOutreachModal } from '@/components/NewOutreachModal';

interface Chat {
  id: string;
  creatorName: string;
  creatorHandle: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  status: 'active' | 'pending' | 'new';
}

interface Message {
  id: string;
  sender: 'brand' | 'creator';
  content: string;
  timestamp: string;
}

const mockChats: Chat[] = [
  {
    id: '1',
    creatorName: 'Sarah Johnson',
    creatorHandle: '@sarahj_tech',
    avatar: '/placeholder.svg',
    lastMessage: 'Thanks for reaching out! I\'d love to collaborate.',
    timestamp: '2 hours ago',
    unread: 2,
    status: 'active'
  },
  {
    id: '2',
    creatorName: 'Mike Chen',
    creatorHandle: '@mikefitness',
    avatar: '/placeholder.svg',
    lastMessage: 'Let me review the campaign details.',
    timestamp: '1 day ago',
    unread: 0,
    status: 'pending'
  },
  {
    id: 'new',
    creatorName: 'Emma Style',
    creatorHandle: '@emmastyle',
    avatar: '/placeholder.svg',
    lastMessage: '',
    timestamp: '',
    unread: 0,
    status: 'new'
  }
];

const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '1',
      sender: 'brand',
      content: 'Hi Sarah! I came across your tech content and would love to discuss a collaboration opportunity with our new product launch.',
      timestamp: '10:30 AM'
    },
    {
      id: '2',
      sender: 'creator',
      content: 'Hi there! Thank you for reaching out. I\'d be interested to learn more about your product and the collaboration details.',
      timestamp: '2:15 PM'
    },
    {
      id: '3',
      sender: 'creator',
      content: 'Thanks for reaching out! I\'d love to collaborate.',
      timestamp: '2:16 PM'
    }
  ],
  '2': [
    {
      id: '1',
      sender: 'brand',
      content: 'Hello Mike! We have a fitness campaign that would be perfect for your audience. Are you available for a collaboration?',
      timestamp: 'Yesterday 9:00 AM'
    },
    {
      id: '2',
      sender: 'creator',
      content: 'Let me review the campaign details.',
      timestamp: 'Yesterday 6:30 PM'
    }
  ]
};

const OutreachesManager = () => {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<string>('1');
  const [newMessage, setNewMessage] = useState('');
  const [chats] = useState<Chat[]>(mockChats);
  const [newOutreachModalOpen, setNewOutreachModalOpen] = useState(false);

  const currentMessages = mockMessages[selectedChat] || [];
  const currentChat = chats.find(chat => chat.id === selectedChat);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Here you would typically send the message to your backend
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  const handleInitiateChat = () => {
    if (selectedChat === 'new') {
      navigate('/campaigns/create');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'new':
        return 'bg-coral';
      default:
        return 'bg-gray-500';
    }
  };

  const handleCreateOutreach = (creatorId: string) => {
    // Add logic to create new outreach with the selected creator
    console.log('Creating outreach with creator:', creatorId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-snow">Outreach Management</h2>
        <Button
          onClick={() => setNewOutreachModalOpen(true)}
          className="bg-coral hover:bg-coral/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Outreach
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <Card className="bg-zinc-800/50 border-zinc-700 h-full">
            <CardHeader>
              <CardTitle className="text-snow">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`p-4 cursor-pointer border-b border-zinc-700 hover:bg-zinc-700/50 transition-colors ${
                      selectedChat === chat.id ? 'bg-zinc-700/30' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={chat.avatar} alt={chat.creatorName} />
                          <AvatarFallback className="bg-zinc-700 text-snow">
                            {chat.creatorName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(chat.status)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-snow truncate">
                            {chat.creatorName}
                          </p>
                          {chat.unread > 0 && (
                            <span className="bg-coral text-white text-xs rounded-full px-2 py-1">
                              {chat.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-snow/60 truncate">{chat.creatorHandle}</p>
                        {chat.lastMessage && (
                          <p className="text-xs text-snow/40 truncate mt-1">
                            {chat.lastMessage}
                          </p>
                        )}
                        {chat.timestamp && (
                          <p className="text-xs text-snow/30 mt-1">{chat.timestamp}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          <Card className="bg-zinc-800/50 border-zinc-700 h-full flex flex-col">
            {currentChat ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={currentChat.avatar} alt={currentChat.creatorName} />
                        <AvatarFallback className="bg-zinc-700 text-snow">
                          {currentChat.creatorName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg text-snow">{currentChat.creatorName}</CardTitle>
                        <p className="text-sm text-snow/60">{currentChat.creatorHandle}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentChat.status)} text-white`}>
                      {currentChat.status}
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4">
                  {currentChat.status === 'new' ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <p className="text-snow/60 text-center">
                        Start a conversation with {currentChat.creatorName}
                      </p>
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleInitiateChat}
                          className="bg-coral hover:bg-coral/90 text-white"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create New Campaign
                        </Button>
                        <Button 
                          onClick={handleInitiateChat}
                          variant="outline"
                          className="border-coral text-coral hover:bg-coral hover:text-white"
                        >
                          Add to Existing Campaign
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="h-[350px] pr-4">
                      <div className="space-y-4">
                        {currentMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender === 'brand' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender === 'brand'
                                  ? 'bg-coral text-white'
                                  : 'bg-zinc-700 text-snow'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.sender === 'brand' ? 'text-white/70' : 'text-snow/50'
                              }`}>
                                {message.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>

                {/* Message Input */}
                {currentChat.status !== 'new' && (
                  <div className="border-t border-zinc-700 p-4">
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="bg-zinc-700 border-zinc-600 text-snow"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-snow/60">Select a conversation to start chatting</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <NewOutreachModal
        open={newOutreachModalOpen}
        onOpenChange={setNewOutreachModalOpen}
        onCreateOutreach={handleCreateOutreach}
      />
    </div>
  );
};

export default OutreachesManager;
