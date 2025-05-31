
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Chat {
  id: string;
  creatorName: string;
  creatorHandle: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  status: 'active' | 'pending' | 'new';
}

const mockChats: Chat[] = [
  {
    id: '1',
    creatorName: 'Sarah Johnson',
    creatorHandle: '@sarahj_tech',
    avatar: '/placeholder.svg',
    lastMessage: 'Thanks for reaching out! I\'d love to collaborate.',
    timestamp: '2 hours ago',
    status: 'active'
  },
  {
    id: '2',
    creatorName: 'Mike Chen',
    creatorHandle: '@mikefitness',
    avatar: '/placeholder.svg',
    lastMessage: 'Let me review the campaign details.',
    timestamp: '1 day ago',
    status: 'pending'
  },
  {
    id: '3',
    creatorName: 'Emma Style',
    creatorHandle: '@emmastyle',
    avatar: '/placeholder.svg',
    lastMessage: 'I\'m interested in this collaboration opportunity.',
    timestamp: '3 days ago',
    status: 'active'
  }
];

interface NewContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateContract: (chatId: string, contractData: any) => void;
}

export const NewContractModal = ({ open, onOpenChange, onCreateContract }: NewContractModalProps) => {
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState<string>('');
  const [budget, setBudget] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [campaignName, setCampaignName] = useState('');

  const handleCreateContract = () => {
    if (!selectedChat || !budget || !deliverables || !campaignName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const contractData = {
      chatId: selectedChat,
      budget: parseFloat(budget),
      deliverables: deliverables.split('\n').filter(d => d.trim()),
      campaignName
    };

    onCreateContract(selectedChat, contractData);
    
    const selectedChatData = mockChats.find(chat => chat.id === selectedChat);
    toast({
      title: "Contract Created",
      description: `Contract created for ${selectedChatData?.creatorName}`,
    });
    
    // Reset form
    setSelectedChat('');
    setBudget('');
    setDeliverables('');
    setCampaignName('');
    onOpenChange(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-snow">Create New Contract</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 flex-1 overflow-y-auto">
          {/* Chat Selection */}
          <div className="space-y-3">
            <Label className="text-snow font-medium">Select Conversation</Label>
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {mockChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedChat === chat.id
                      ? 'bg-coral/10 border-coral'
                      : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
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
                        <Badge variant="outline" className="border-zinc-600 text-snow/70 text-xs">
                          {chat.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-snow/60 truncate">{chat.creatorHandle}</p>
                      <p className="text-xs text-snow/40 truncate mt-1">
                        {chat.lastMessage}
                      </p>
                      <p className="text-xs text-snow/30 mt-1">{chat.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contract Details */}
          {selectedChat && (
            <div className="space-y-4 border-t border-zinc-800 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignName" className="text-snow font-medium">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Enter campaign name"
                    className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-coral"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-snow font-medium">Budget ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-snow/50" />
                    <Input
                      id="budget"
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="0.00"
                      className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-coral pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deliverables" className="text-snow font-medium">Deliverables (one per line)</Label>
                <Textarea
                  id="deliverables"
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  placeholder="3 Instagram Posts&#10;1 Reel&#10;5 Stories"
                  className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-coral min-h-[100px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
          <p className="text-sm text-snow/60">
            {selectedChat ? `Creating contract for ${mockChats.find(c => c.id === selectedChat)?.creatorName}` : 'Select a conversation to continue'}
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 text-snow hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateContract}
              disabled={!selectedChat || !budget || !deliverables || !campaignName}
              className="bg-coral hover:bg-coral/90 text-white"
            >
              Create Contract
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
