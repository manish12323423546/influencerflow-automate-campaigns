
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, Users } from 'lucide-react';

interface InfluencerData {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  platform: string;
  industry: string;
  language: string;
  followers_count: number;
  engagement_rate: number;
  audience_fit_score: number;
  avg_cpe: number;
  roi_index: number;
  fake_follower_score: number;
  safety_scan_score: number;
  risk_flags: string[] | null;
}

interface SummaryBioProps {
  influencer: InfluencerData;
}

export const SummaryBio = ({ influencer }: SummaryBioProps) => {
  const mockBio = "Content creator passionate about lifestyle, fashion, and travel. Sharing authentic moments and inspiring stories with my amazing community! 🌟 Collaborations: hello@email.com";
  const mockLocation = "Los Angeles, CA";
  const mockCategories = ["Lifestyle", "Fashion", "Travel", "Beauty"];

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-zinc-900 rounded-lg p-6 border border-zinc-800"
    >
      <div className="flex items-start space-x-4 mb-4">
        <img
          src={influencer.avatar_url || '/placeholder.svg'}
          alt={influencer.name}
          className="h-16 w-16 rounded-full"
        />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-snow">{influencer.name}</h2>
          <p className="text-snow/70">{influencer.handle}</p>
          <div className="flex items-center mt-2 text-sm text-snow/60">
            <Users className="h-4 w-4 mr-1" />
            {formatFollowers(influencer.followers_count)} followers
          </div>
        </div>
      </div>

      <p className="text-snow/80 text-sm mb-4 leading-relaxed">
        {mockBio}
      </p>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-snow/70">
          <MapPin className="h-4 w-4 mr-2" />
          {mockLocation}
        </div>
        
        <div className="flex items-center text-sm text-snow/70">
          <Globe className="h-4 w-4 mr-2" />
          {influencer.language}
        </div>
        
        <div>
          <p className="text-sm text-snow/70 mb-2">Categories:</p>
          <div className="flex flex-wrap gap-2">
            {mockCategories.map((category) => (
              <Badge
                key={category}
                variant="outline"
                className="border-purple-500/30 text-purple-400 text-xs"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-snow/70 mb-2">Industry:</p>
          <Badge className="bg-zinc-800 text-snow">
            {influencer.industry}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};
