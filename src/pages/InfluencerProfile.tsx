
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
import { supabase } from '@/integrations/supabase/client';
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

const InfluencerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'youtube'>('instagram');
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  // Fetch influencer data
  const { data: influencer, isLoading } = useQuery({
    queryKey: ['influencer', id],
    queryFn: async () => {
      if (!id) throw new Error('No influencer ID provided');
      
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as InfluencerData;
    },
    enabled: !!id,
  });

  if (!user) {
    navigate('/login');
    return null;
  }

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

  const handleInviteToCampaign = () => {
    // TODO: Open SelectCampaignModal
    console.log('Invite to campaign');
  };

  const handlePayInvoice = () => {
    // TODO: Launch RazorpayCheckout
    console.log('Pay invoice');
  };

  const handleOpenNegotiation = () => {
    navigate(`/negotiations?creator=${influencer.id}`);
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
                className="text-snow/70 hover:text-purple-500"
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
                  onClick={handleInviteToCampaign}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                >
                  Invite to Campaign
                </Button>
                <Button 
                  onClick={handlePayInvoice}
                  variant="outline"
                  className="w-full border-zinc-700 text-snow hover:bg-zinc-800"
                >
                  Pay Outstanding Invoice
                </Button>
                <Button 
                  onClick={handleOpenNegotiation}
                  variant="outline"
                  className="w-full border-zinc-700 text-snow hover:bg-zinc-800"
                >
                  Open Negotiation Chat
                </Button>
                <Button 
                  onClick={() => setHistoryDrawerOpen(true)}
                  variant="outline"
                  className="w-full border-zinc-700 text-snow hover:bg-zinc-800"
                >
                  View History
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
    </div>
  );
};

export default InfluencerProfile;
