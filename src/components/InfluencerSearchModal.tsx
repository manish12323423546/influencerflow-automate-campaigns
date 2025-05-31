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
import type { Influencer } from '@/types/influencer';
import { fetchInfluencers } from '@/lib/supabase';

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
      setInfluencers(data || []);
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
      <DialogContent className="bg-zinc-900 border-zinc-800 text-snow">
        <DialogHeader>
          <DialogTitle>Search Influencers</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, platform, or niche..."
              className="bg-zinc-800 border-zinc-700 text-snow"
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-snow/70">
                Searching influencers...
              </div>
            ) : influencers.length === 0 ? (
              <div className="text-center py-8 text-snow/70">
                No influencers found. Try a different search term.
              </div>
            ) : (
              influencers.map((influencer) => (
                <div
                  key={influencer.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedIds.has(influencer.id)
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-zinc-800 hover:bg-zinc-700 border-transparent'
                  } border`}
                  onClick={() => toggleInfluencer(influencer.id)}
                >
                  <div className="flex items-center space-x-3">
                    {influencer.avatar_url && (
                      <img
                        src={influencer.avatar_url}
                        alt={influencer.name}
                        className="h-10 w-10 rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="font-medium">{influencer.name}</h3>
                      <p className="text-sm text-snow/70">
                        {influencer.platform} • {influencer.followers_count.toLocaleString()} followers
                      </p>
                      <p className="text-xs text-snow/50">
                        {influencer.industry}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSelect}
              disabled={selectedIds.size === 0}
              className="bg-purple-500 hover:bg-purple-600"
            >
              Add Selected ({selectedIds.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
