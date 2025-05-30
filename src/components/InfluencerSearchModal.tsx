
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';

interface Influencer {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  platform: string;
  industry: string;
  followers_count: number;
  engagement_rate: number;
}

interface InfluencerSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectInfluencers: (influencerIds: string[]) => void;
  selectedInfluencers: string[];
}

export const InfluencerSearchModal = ({
  open,
  onOpenChange,
  onSelectInfluencers,
  selectedInfluencers,
}: InfluencerSearchModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelected, setLocalSelected] = useState<string[]>([]);

  // Fetch influencers data
  const { data: influencers = [], isLoading } = useQuery({
    queryKey: ['influencers-search', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('influencers')
        .select('id, handle, name, avatar_url, platform, industry, followers_count, engagement_rate')
        .order('roi_index', { ascending: false })
        .limit(50);

      if (searchTerm) {
        query = query.or(`handle.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Influencer[];
    },
    enabled: open,
  });

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const handleToggleInfluencer = (influencerId: string) => {
    setLocalSelected(prev => {
      if (prev.includes(influencerId)) {
        return prev.filter(id => id !== influencerId);
      } else {
        return [...prev, influencerId];
      }
    });
  };

  const handleConfirmSelection = () => {
    onSelectInfluencers(localSelected);
    setLocalSelected([]);
    onOpenChange(false);
  };

  const isSelected = (influencerId: string) => {
    return selectedInfluencers.includes(influencerId) || localSelected.includes(influencerId);
  };

  const isAlreadySelected = (influencerId: string) => {
    return selectedInfluencers.includes(influencerId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-snow">Search and Select Influencers</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-snow/50" />
            <Input
              placeholder="Search influencers by name or handle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-purple-500 pl-10"
            />
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {isLoading ? (
              <div className="text-center py-8 text-snow/60">Loading influencers...</div>
            ) : influencers.length === 0 ? (
              <div className="text-center py-8 text-snow/60">No influencers found</div>
            ) : (
              influencers.map((influencer) => (
                <div
                  key={influencer.id}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    isSelected(influencer.id)
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                  }`}
                  onClick={() => !isAlreadySelected(influencer.id) && handleToggleInfluencer(influencer.id)}
                >
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={isSelected(influencer.id)}
                      disabled={isAlreadySelected(influencer.id)}
                      onChange={() => !isAlreadySelected(influencer.id) && handleToggleInfluencer(influencer.id)}
                    />
                    
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={influencer.avatar_url || ''} alt={influencer.name} />
                      <AvatarFallback className="bg-purple-500 text-white">
                        {influencer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-snow">{influencer.name}</p>
                          <p className="text-sm text-snow/60">{influencer.handle}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="border-blue-500/30 text-blue-500">
                            {influencer.industry}
                          </Badge>
                          <Badge variant="outline" className="border-purple-500/30 text-purple-500">
                            {influencer.platform}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm text-snow/70">
                        <span>{formatFollowers(influencer.followers_count)} followers</span>
                        <span>{influencer.engagement_rate.toFixed(1)}% engagement</span>
                      </div>
                      
                      {isAlreadySelected(influencer.id) && (
                        <Badge className="mt-2 bg-green-500/10 text-green-500">
                          Already Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
            <p className="text-sm text-snow/60">
              {localSelected.length} new influencer(s) selected
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
                onClick={handleConfirmSelection}
                disabled={localSelected.length === 0}
                className="bg-purple-500 hover:bg-purple-600"
              >
                Add Selected ({localSelected.length})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
