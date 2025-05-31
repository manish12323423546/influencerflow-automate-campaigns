
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search, Users, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
  platform: string;
  followers_count: number;
  engagement_rate: number;
  niche: string;
  isShortlisted?: boolean;
}

const mockCreators: Creator[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    handle: '@sarahj_tech',
    avatar_url: '/placeholder.svg',
    platform: 'Instagram',
    followers_count: 125000,
    engagement_rate: 4.8,
    niche: 'Technology',
    isShortlisted: true
  },
  {
    id: '2',
    name: 'Mike Chen',
    handle: '@mikefitness',
    avatar_url: '/placeholder.svg',
    platform: 'YouTube',
    followers_count: 89000,
    engagement_rate: 6.2,
    niche: 'Fitness',
    isShortlisted: true
  },
  {
    id: '3',
    name: 'Emma Style',
    handle: '@emmastyle',
    avatar_url: '/placeholder.svg',
    platform: 'Instagram',
    followers_count: 95000,
    engagement_rate: 5.5,
    niche: 'Fashion',
    isShortlisted: false
  },
  {
    id: '4',
    name: 'Alex Travel',
    handle: '@alextravel',
    avatar_url: '/placeholder.svg',
    platform: 'TikTok',
    followers_count: 156000,
    engagement_rate: 7.2,
    niche: 'Travel',
    isShortlisted: false
  }
];

interface NewOutreachModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateOutreach: (creatorId: string) => void;
}

export const NewOutreachModal = ({ open, onOpenChange, onCreateOutreach }: NewOutreachModalProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showShortlistedOnly, setShowShortlistedOnly] = useState(false);

  const filteredCreators = mockCreators.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.niche.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = showShortlistedOnly ? creator.isShortlisted : true;
    
    return matchesSearch && matchesFilter;
  });

  const handleCreateOutreach = (creator: Creator) => {
    onCreateOutreach(creator.id);
    toast({
      title: "Outreach Created",
      description: `New outreach started with ${creator.name}`,
    });
    onOpenChange(false);
    setSearchTerm('');
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-snow">Create New Outreach</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-snow/50" />
              <Input
                placeholder="Search creators by name, handle, or niche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-coral pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setShowShortlistedOnly(false)}
                variant={!showShortlistedOnly ? 'default' : 'outline'}
                size="sm"
                className={!showShortlistedOnly 
                  ? 'bg-coral hover:bg-coral/90 text-white' 
                  : 'border-zinc-700 text-snow hover:bg-zinc-800'
                }
              >
                <Users className="mr-2 h-4 w-4" />
                All Creators
              </Button>
              <Button
                onClick={() => setShowShortlistedOnly(true)}
                variant={showShortlistedOnly ? 'default' : 'outline'}
                size="sm"
                className={showShortlistedOnly 
                  ? 'bg-coral hover:bg-coral/90 text-white' 
                  : 'border-zinc-700 text-snow hover:bg-zinc-800'
                }
              >
                <Star className="mr-2 h-4 w-4" />
                Shortlisted
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredCreators.length === 0 ? (
              <div className="text-center py-8 text-snow/60">
                No creators found matching your criteria
              </div>
            ) : (
              filteredCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="p-4 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-coral/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={creator.avatar_url} alt={creator.name} />
                        <AvatarFallback className="bg-coral text-white">
                          {creator.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-snow">{creator.name}</p>
                          {creator.isShortlisted && (
                            <Star className="h-4 w-4 text-coral fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-snow/60">{creator.handle}</p>
                        
                        <div className="flex items-center space-x-4 mt-1 text-sm text-snow/70">
                          <span>{formatFollowers(creator.followers_count)} followers</span>
                          <span>{creator.engagement_rate}% engagement</span>
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="border-blue-500/30 text-blue-500 text-xs">
                            {creator.platform}
                          </Badge>
                          <Badge variant="outline" className="border-purple-500/30 text-purple-500 text-xs">
                            {creator.niche}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleCreateOutreach(creator)}
                      className="bg-coral hover:bg-coral/90 text-white"
                    >
                      Start Outreach
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
