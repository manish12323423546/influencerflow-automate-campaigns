
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart, MessageCircle, Share } from 'lucide-react';

interface ContentGridProps {
  platform: 'instagram' | 'youtube';
  influencerId: string;
}

const mockContent = {
  instagram: [
    {
      id: '1',
      thumbnail: '/placeholder.svg',
      caption: 'Summer vibes ☀️ #lifestyle #fashion',
      views: 125000,
      likes: 8500,
      comments: 340,
      shares: 89,
      engagement_rate: 7.2,
      posted_at: '2 days ago'
    },
    {
      id: '2',
      thumbnail: '/placeholder.svg',
      caption: 'New skincare routine that changed my life! 🌟',
      views: 98000,
      likes: 6200,
      comments: 280,
      shares: 45,
      engagement_rate: 6.8,
      posted_at: '5 days ago'
    },
    {
      id: '3',
      thumbnail: '/placeholder.svg',
      caption: 'Travel diary: Best cafes in Paris ☕',
      views: 156000,
      likes: 12300,
      comments: 520,
      shares: 156,
      engagement_rate: 8.1,
      posted_at: '1 week ago'
    },
    {
      id: '4',
      thumbnail: '/placeholder.svg',
      caption: 'Outfit of the day 💫 #ootd',
      views: 87000,
      likes: 5400,
      comments: 180,
      shares: 32,
      engagement_rate: 6.4,
      posted_at: '1 week ago'
    },
    {
      id: '5',
      thumbnail: '/placeholder.svg',
      caption: 'Behind the scenes of my latest shoot 📸',
      views: 134000,
      likes: 9800,
      comments: 420,
      shares: 78,
      engagement_rate: 7.7,
      posted_at: '2 weeks ago'
    },
    {
      id: '6',
      thumbnail: '/placeholder.svg',
      caption: 'Healthy breakfast ideas 🥑',
      views: 76000,
      likes: 4900,
      comments: 165,
      shares: 29,
      engagement_rate: 6.7,
      posted_at: '2 weeks ago'
    },
  ],
  youtube: [
    {
      id: '1',
      thumbnail: '/placeholder.svg',
      caption: 'My Morning Routine for Productivity',
      views: 245000,
      likes: 18500,
      comments: 1340,
      shares: 289,
      engagement_rate: 8.2,
      posted_at: '3 days ago'
    },
    {
      id: '2',
      thumbnail: '/placeholder.svg',
      caption: '10 Fashion Trends You Need to Try',
      views: 198000,
      likes: 14200,
      comments: 980,
      shares: 245,
      engagement_rate: 7.8,
      posted_at: '1 week ago'
    },
    {
      id: '3',
      thumbnail: '/placeholder.svg',
      caption: 'Travel Vlog: 48 Hours in Tokyo',
      views: 356000,
      likes: 28300,
      comments: 2520,
      shares: 456,
      engagement_rate: 8.9,
      posted_at: '2 weeks ago'
    },
    {
      id: '4',
      thumbnail: '/placeholder.svg',
      caption: 'Skincare Routine for Sensitive Skin',
      views: 167000,
      likes: 12400,
      comments: 780,
      shares: 189,
      engagement_rate: 8.1,
      posted_at: '3 weeks ago'
    },
    {
      id: '5',
      thumbnail: '/placeholder.svg',
      caption: 'Room Makeover on a Budget',
      views: 234000,
      likes: 19800,
      comments: 1420,
      shares: 378,
      engagement_rate: 9.2,
      posted_at: '1 month ago'
    },
    {
      id: '6',
      thumbnail: '/placeholder.svg',
      caption: 'What I Eat in a Day: Healthy & Easy',
      views: 176000,
      likes: 13900,
      comments: 890,
      shares: 234,
      engagement_rate: 8.5,
      posted_at: '1 month ago'
    },
  ],
};

export const ContentGrid = ({ platform, influencerId }: ContentGridProps) => {
  const content = mockContent[platform];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-snow">Recent Content - {platform}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.map((post, index) => (
              <motion.div
                key={post.id}
                className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 cursor-pointer group"
                whileHover={{ 
                  y: -8,
                  transition: { type: 'spring', stiffness: 300, damping: 20 }
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="relative aspect-square">
                  <img
                    src={post.thumbnail}
                    alt={post.caption}
                    className="w-full h-full object-cover"
                  />
                  <motion.div
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <div className="grid grid-cols-2 gap-4 text-white text-sm">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {formatNumber(post.views)}
                      </div>
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        {formatNumber(post.likes)}
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {formatNumber(post.comments)}
                      </div>
                      <div className="flex items-center">
                        <Share className="h-4 w-4 mr-1" />
                        {formatNumber(post.shares)}
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                <div className="p-4">
                  <p className="text-snow text-sm mb-2 line-clamp-2">
                    {post.caption}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge 
                      className={`${
                        post.engagement_rate >= 8 
                          ? 'bg-green-500/20 text-green-400' 
                          : post.engagement_rate >= 6 
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {post.engagement_rate}% engagement
                    </Badge>
                    <span className="text-xs text-snow/60">{post.posted_at}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
