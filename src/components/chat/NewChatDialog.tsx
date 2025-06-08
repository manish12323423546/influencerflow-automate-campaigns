import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, Users, Loader2 } from 'lucide-react';
import { influencerService, InfluencerWithConversation } from '@/lib/services/influencerService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInfluencerSelect: (influencerId: string) => Promise<void>;
}

const NewChatDialog = ({ open, onOpenChange, onInfluencerSelect }: NewChatDialogProps) => {
  const [influencers, setInfluencers] = useState<InfluencerWithConversation[]>([]);
  const [filteredInfluencers, setFilteredInfluencers] = useState<InfluencerWithConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const { toast } = useToast();

  // Load available influencers when dialog opens
  useEffect(() => {
    if (open) {
      loadAvailableInfluencers();
      setSearchQuery('');
    }
  }, [open]);

  // Filter influencers based on search query
  useEffect(() => {
    const filtered = influencerService.searchInfluencers(influencers, searchQuery);
    setFilteredInfluencers(filtered);
  }, [influencers, searchQuery]);

  const loadAvailableInfluencers = async () => {
    setLoading(true);
    try {
      const availableInfluencers = await influencerService.getInfluencersWithConversationStatus();
      setInfluencers(availableInfluencers);
    } catch (error) {
      console.error('Error loading influencers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available influencers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInfluencerSelect = async (influencer: InfluencerWithConversation) => {
    if (creating) return;

    setCreating(influencer.id);
    try {
      await onInfluencerSelect(influencer.id);
      onOpenChange(false);
      toast({
        title: 'Chat Started',
        description: `Started conversation with ${influencer.name}`,
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
    } finally {
      setCreating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const availableInfluencers = filteredInfluencers.filter(inf => !inf.hasConversation);
  const existingInfluencers = filteredInfluencers.filter(inf => inf.hasConversation);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Start New Conversation
          </DialogTitle>
          <DialogDescription>
            Choose an influencer from your active campaigns to start chatting with.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search influencers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-coral" />
              <span className="ml-2 text-gray-600">Loading influencers...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Available for New Chats */}
              {availableInfluencers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Available for New Chats ({availableInfluencers.length})
                  </h3>
                  <div className="space-y-2">
                    {availableInfluencers.map((influencer) => (
                      <div
                        key={influencer.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-coral/30 hover:bg-coral/5 transition-colors cursor-pointer"
                        onClick={() => handleInfluencerSelect(influencer)}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={influencer.avatar_url} />
                          <AvatarFallback className="bg-coral text-white">
                            {influencer.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {influencer.name}
                            </h4>
                            <Badge className={getStatusColor(influencer.campaign_status)}>
                              {influencer.campaign_status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            @{influencer.handle} • {influencer.platform}
                          </p>
                          <p className="text-xs text-gray-500">
                            {influencer.campaign.name} • {new Intl.NumberFormat().format(influencer.followers_count)} followers
                          </p>
                        </div>

                        <div className="flex items-center">
                          {creating === influencer.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-coral" />
                          ) : (
                            <Button
                              size="sm"
                              className="bg-coral hover:bg-coral/90 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInfluencerSelect(influencer);
                              }}
                            >
                              Start Chat
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Conversations */}
              {existingInfluencers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Already Chatting ({existingInfluencers.length})
                  </h3>
                  <div className="space-y-2">
                    {existingInfluencers.map((influencer) => (
                      <div
                        key={influencer.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 opacity-60"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={influencer.avatar_url} />
                          <AvatarFallback className="bg-gray-400 text-white">
                            {influencer.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-700 truncate">
                              {influencer.name}
                            </h4>
                            <Badge variant="secondary">
                              Conversation exists
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            @{influencer.handle} • {influencer.platform}
                          </p>
                          <p className="text-xs text-gray-400">
                            {influencer.campaign.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {!loading && filteredInfluencers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? 'No matching influencers' : 'No active campaign influencers'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {searchQuery 
                      ? 'Try adjusting your search terms'
                      : 'Add influencers to your active campaigns to start conversations'
                    }
                  </p>
                </div>
              )}

              {/* No Available for New Chats */}
              {!loading && availableInfluencers.length === 0 && existingInfluencers.length > 0 && (
                <div className="text-center py-6 border-t border-gray-200">
                  <MessageCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 text-sm">
                    You're already chatting with all available influencers
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatDialog;
