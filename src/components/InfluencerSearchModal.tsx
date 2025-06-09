import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import type { Influencer } from '@/types/influencer';

export interface InfluencerSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (influencers: Influencer[]) => void;
}

export function InfluencerSearchModal({ open, onClose, onSelect }: InfluencerSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Load influencers when modal opens
  useEffect(() => {
    if (open) {
      handleSearch();
    }
  }, [open]);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('influencers')
        .select('*')
        .order('followers_count', { ascending: false });

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,handle.ilike.%${searchQuery}%,industry.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match the Influencer type
      const transformedData: Influencer[] = (data || []).map(influencer => ({
        ...influencer,
        platform: influencer.platform as 'instagram' | 'tiktok' | 'youtube' | 'twitter'
      }));
      
      setInfluencers(transformedData);
    } catch (error) {
      console.error('Error searching influencers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = () => {
    const selectedInfluencers = influencers.filter(inf => selectedIds.has(inf.id));
    onSelect(selectedInfluencers);
    onClose();
  };

  const toggleInfluencer = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const isSelected = (influencerId: string) => {
    return selectedIds.has(influencerId);
  };

  const isAlreadySelected = (influencerId: string) => {
    return selectedIds.has(influencerId);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Search Influencers</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, platform, or niche..."
              className="bg-white border-gray-200 text-gray-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-coral hover:bg-coral/90 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Searching influencers...
              </div>
            ) : influencers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No influencers found. Try a different search term.
              </div>
            ) : (
              influencers.map((influencer) => (
                <div
                  key={influencer.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedIds.has(influencer.id)
                      ? 'bg-coral/10 border-coral/50'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                  } border`}
                  onClick={() => toggleInfluencer(influencer.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedIds.has(influencer.id)}
                      onChange={() => toggleInfluencer(influencer.id)}
                      className="data-[state=checked]:bg-coral data-[state=checked]:border-coral"
                    />
                    <Avatar>
                      <AvatarImage src={influencer.avatar_url} />
                      <AvatarFallback>{influencer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">{influencer.name}</h3>
                      <p className="text-sm text-gray-600">
                        {influencer.platform} • {influencer.followers_count.toLocaleString()} followers
                      </p>
                      <p className="text-xs text-gray-500">
                        {influencer.industry}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {influencer.engagement_rate}% engagement
                  </Badge>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {selectedIds.size} influencer{selectedIds.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose} className="border-gray-200 text-gray-900 hover:bg-gray-50">
                Cancel
              </Button>
              <Button
                onClick={handleSelect}
                disabled={selectedIds.size === 0}
                className="bg-coral hover:bg-coral/90 text-white"
              >
                Add Selected ({selectedIds.size})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
