
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { PlatformToggle } from '@/components/influencer-profile/PlatformToggle';
import { SummaryBio } from '@/components/influencer-profile/SummaryBio';
import { KpiCard } from '@/components/influencer-profile/KpiCard';
import { GrowthChart } from '@/components/influencer-profile/GrowthChart';
import { DualAxisChart } from '@/components/influencer-profile/DualAxisChart';
import { ContentGrid } from '@/components/influencer-profile/ContentGrid';
import { HistoryDrawer } from '@/components/influencer-profile/HistoryDrawer';
import { ShortlistModal } from '@/components/ShortlistModal';
import { useQuery } from '@tanstack/react-query';

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

// Mock influencer data
const mockInfluencer: InfluencerData = {
  id: '1',
  handle: '@techinfluencer',
  name: 'Tech Influencer',
  avatar_url: '/placeholder.svg',
  platform: 'instagram',
  industry: 'Technology',
  language: 'English',
  followers_count: 125000,
  engagement_rate: 4.8,
  audience_fit_score: 92,
  avg_cpe: 2.5,
  roi_index: 3.2,
  fake_follower_score: 95,
  safety_scan_score: 98,
  risk_flags: null
};

const InfluencerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'youtube'>('instagram');
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [shortlistModalOpen, setShortlistModalOpen] = useState(false);

  // Mock query for influencer data
  const { data: influencer, isLoading } = useQuery({
    queryKey: ['influencer', id],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockInfluencer;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-snow">Loading...</div>
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-snow">Influencer not found</div>
      </div>
    );
  }

  const handleShortlistCreator = () => {
    setShortlistModalOpen(true);
  };

  const handleInitiateOutreach = () => {
    // TODO: Open outreach modal or redirect to outreach page
    console.log('Initiate outreach');
  };

  const handlePreviousCollaborations = () => {
    setHistoryDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-carbon">
      {/* TopBar */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/influencers')}
                className="text-snow/70 hover:text-coral"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <img
                  src={influencer.avatar_url || '/placeholder.svg'}
                  alt={influencer.name}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <h1 className="text-lg font-semibold text-snow">{influencer.name}</h1>
                  <p className="text-sm text-snow/60">{influencer.handle}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <PlatformToggle
                selectedPlatform={selectedPlatform}
                onPlatformChange={setSelectedPlatform}
              />
              <Button variant="ghost" size="sm" className="text-snow/70">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            <SummaryBio influencer={influencer} />
          </div>
          
          <div className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-4">
              <KpiCard
                title="Followers"
                value={influencer.followers_count}
                format="number"
                change={12.5}
                period="vs last month"
              />
              <KpiCard
                title="Engagement"
                value={influencer.engagement_rate}
                format="percentage"
                change={-2.1}
                period="vs last month"
              />
              <KpiCard
                title="Avg CPE"
                value={influencer.avg_cpe}
                format="currency"
                change={5.3}
                period="vs last month"
              />
              <KpiCard
                title="ROI Index"
                value={influencer.roi_index}
                format="decimal"
                change={8.7}
                period="vs last month"
              />
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-snow mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  onClick={handleShortlistCreator}
                  className="w-full bg-coral hover:bg-coral/90 text-white"
                >
                  Shortlist Creator
                </Button>
                <Button 
                  onClick={handleInitiateOutreach}
                  variant="outline"
                  className="w-full border-zinc-700 text-snow hover:bg-zinc-800"
                >
                  Initiate Outreach
                </Button>
                <Button 
                  onClick={handlePreviousCollaborations}
                  variant="outline"
                  className="w-full border-zinc-700 text-snow hover:bg-zinc-800"
                >
                  Previous Collaborations
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <GrowthChart platform={selectedPlatform} />
          <DualAxisChart platform={selectedPlatform} />
        </div>

        {/* Content Grid */}
        <ContentGrid platform={selectedPlatform} influencerId={influencer.id} />
      </div>

      {/* History Drawer */}
      <HistoryDrawer
        open={historyDrawerOpen}
        onOpenChange={setHistoryDrawerOpen}
        influencerId={influencer.id}
      />

      {/* Shortlist Modal */}
      <ShortlistModal
        open={shortlistModalOpen}
        onOpenChange={setShortlistModalOpen}
        influencerId={influencer.id}
        influencerName={influencer.name}
      />
    </div>
  );
};

export default InfluencerProfile;
