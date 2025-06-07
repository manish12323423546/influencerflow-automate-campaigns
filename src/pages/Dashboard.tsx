import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, TrendingUp, DollarSign, Target, Bell, Activity, Settings, Plus,
  BarChart3, FileText, CreditCard, Search, Headphones, Database, MessageSquare, MessageCircle, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CampaignsManager from '@/components/dashboard/CampaignsManager';
import DiscoverCreators from '@/components/dashboard/DiscoverCreators';
import ContractsManager from '@/components/dashboard/ContractsManager';
import PaymentsManager from '@/components/dashboard/PaymentsManager';
import ConversationsManager from '@/components/dashboard/ConversationsManager';
import OutreachManager from '@/components/dashboard/OutreachManager';
import KnowledgeBaseManager from '@/components/dashboard/KnowledgeBaseManager';
import EmailConversionManager from '@/components/dashboard/EmailConversionManager';
import ReportsManager from '@/components/dashboard/ReportsManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Campaign } from '@/types/campaign';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'discover' | 'contracts' | 'payments' | 'outreach' | 'knowledge' | 'conversations' | 'email-conversion' | 'reports'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalInfluencers, setTotalInfluencers] = useState(0);
  const [totalContracts, setTotalContracts] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const widgetRef = useRef<HTMLElement>(null);

  // Handle URL parameters for tab and campaign selection
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['campaigns', 'discover', 'contracts', 'payments', 'reports', 'outreach', 'email-conversion', 'conversations', 'knowledge'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // Fetch all data from Supabase
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('🔄 Starting dashboard data fetch...');

        // Fetch campaigns
        console.log('📊 Fetching campaigns...');
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (campaignsError) {
          console.error('❌ Campaigns fetch error:', campaignsError);
          throw campaignsError;
        }
        console.log('✅ Campaigns fetched:', campaignsData?.length || 0);
        setCampaigns(campaignsData || []);

        // Fetch influencers count
        console.log('👥 Fetching influencers count...');
        const { count: influencersCount, error: influencersError } = await supabase
          .from('influencers')
          .select('*', { count: 'exact', head: true });

        if (influencersError) {
          console.error('❌ Influencers count error:', influencersError);
          // Don't throw here, just log and continue
        }
        console.log('✅ Influencers count:', influencersCount || 0);
        setTotalInfluencers(influencersCount || 0);

        // Fetch contracts count
        console.log('📄 Fetching contracts count...');
        const { count: contractsCount, error: contractsError } = await supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true });

        if (contractsError) {
          console.error('❌ Contracts count error:', contractsError);
          // Don't throw here, just log and continue
        }
        console.log('✅ Contracts count:', contractsCount || 0);
        setTotalContracts(contractsCount || 0);

        // Fetch payments total
        console.log('💰 Fetching payments total...');
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'completed');

        if (paymentsError) {
          console.error('❌ Payments fetch error:', paymentsError);
          // Don't throw here, just log and continue
        }
        const totalPaid = (paymentsData || []).reduce((sum, payment) => sum + Number(payment.amount), 0);
        console.log('✅ Payments total:', totalPaid);
        setTotalPayments(totalPaid);

        console.log('🎉 Dashboard data fetch completed successfully!');

      } catch (error) {
        console.error('❌ Critical error fetching dashboard data:', error);
        toast({
          title: "Error loading dashboard data",
          description: "Some data may not be available. Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  useEffect(() => {
    const widget = document.querySelector('elevenlabs-convai');
    
    if (widget) {
      // Listen for widget initialization
      widget.addEventListener('elevenlabs-convai:ready', () => {
        console.log('Widget is ready');
      });

      // Listen for conversation start
      widget.addEventListener('elevenlabs-convai:call', (event: any) => {
        console.log('Starting conversation');
        
        // Configure client tools and initial conversation
        event.detail.config.clientTools = {
          testConversation: ({ message }) => {
            console.log('Test conversation message:', message);
            return { success: true };
          }
        };

        // Send initial greeting after widget loads
        setTimeout(() => {
          const message = "Hi! I'm your campaign assistant. I can help you manage campaigns, find creators, and more. Would you like to try a test conversation?";
          widget.dispatchEvent(new CustomEvent('elevenlabs-convai:message', { 
            detail: { message } 
          }));
        }, 1000);
      });

      // Listen for conversation end
      widget.addEventListener('elevenlabs-convai:end', () => {
        console.log('Conversation ended');
      });
    }

    return () => {
      if (widget) {
        widget.removeEventListener('elevenlabs-convai:ready', () => {});
        widget.removeEventListener('elevenlabs-convai:call', () => {});
        widget.removeEventListener('elevenlabs-convai:end', () => {});
      }
    };
  }, []);

  // Calculate KPI data from real campaigns
  const kpiData = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    avgCPE: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + (c.spent / (c.reach || 1) * 1000), 0) / campaigns.length : 0,
    avgCPEChange: 2.3,
    topPostCTR: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.engagement_rate, 0) / campaigns.length : 0,
    topPostCTRChange: -0.5,
    totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
    totalReach: campaigns.reduce((sum, c) => sum + c.reach, 0) / 1000000, // Convert to millions
  };

  const handleCreateCampaign = () => {
    navigate('/campaigns/create');
  };

  const formatDelta = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  const navigationItems = [
    { id: 'campaigns', label: 'Campaigns', icon: Target, description: 'Manage your campaigns' },
    { id: 'discover', label: 'Discover Creators', icon: Users, description: 'Find perfect influencers' },
    { id: 'contracts', label: 'Contracts', icon: FileText, description: 'Manage contracts' },
    { id: 'payments', label: 'Payments', icon: CreditCard, description: 'Handle payments' },
    { id: 'reports', label: 'Reports', icon: BarChart3, description: 'Generate and view reports' },
    { id: 'outreach', label: 'Outreach', icon: MessageSquare, description: 'Manage influencer outreach' },
    { id: 'email-conversion', label: 'Email Conversion', icon: Mail, description: 'Track email automation & contracts' },
    { id: 'conversations', label: 'Conversations', icon: MessageCircle, description: 'AI conversation history' },
    { id: 'knowledge', label: 'Knowledge Base', icon: Database, description: 'Manage AI knowledge' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-space font-bold text-gray-900 hover:text-coral transition-colors">
                Influencer<span className="text-coral">Flow</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Bell className="h-6 w-6 text-gray-600 hover:text-coral cursor-pointer transition-colors" />
              <Link to="/settings">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-coral hover:bg-gray-100">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/creator-dashboard">
                <Button className="bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Users className="mr-2 h-4 w-4" />
                  Switch to Creator
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,98,67,0.05),transparent_50%)] pointer-events-none"></div>
        {/* KPI Cards at the top */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Campaigns</CardTitle>
              <Target className="h-4 w-4 text-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{kpiData.totalCampaigns}</div>
              <p className="text-xs text-gray-500">Active: {kpiData.activeCampaigns}</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg CPE</CardTitle>
              <DollarSign className="h-4 w-4 text-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${kpiData.avgCPE.toFixed(2)}</div>
              <p className="text-xs text-gray-500">{formatDelta(kpiData.avgCPEChange)} vs prev month</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{kpiData.topPostCTR.toFixed(1)}%</div>
              <p className="text-xs text-gray-500">{formatDelta(kpiData.topPostCTRChange)} vs prev month</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${kpiData.totalBudget.toLocaleString()}</div>
              <p className="text-xs text-gray-500">Across all campaigns</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
              <Activity className="h-4 w-4 text-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${kpiData.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-gray-500">Campaign expenses</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Reach</CardTitle>
              <TrendingUp className="h-4 w-4 text-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{kpiData.totalReach.toFixed(1)}M</div>
              <p className="text-xs text-gray-500">People reached</p>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Back Text */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-space font-bold text-gray-900">
            Welcome Back
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Manage your campaigns and discover new creators.
          </p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center p-4 rounded-lg border transition-all duration-200 shadow-sm hover:shadow-md ${
                activeTab === item.id
                  ? 'bg-coral/10 border-coral text-coral shadow-md'
                  : 'bg-white border-gray-200 text-gray-900 hover:border-coral/50 hover:bg-coral/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                activeTab === item.id ? 'bg-coral/20' : 'bg-gray-100'
              }`}>
                <item.icon className={`h-5 w-5 ${
                  activeTab === item.id ? 'text-coral' : 'text-gray-600'
                }`} />
              </div>
              <div className="text-left">
                <h3 className="font-medium">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
        {/* Active Tab Content */}
        <div className="space-y-6">
          {activeTab === 'campaigns' && <CampaignsManager campaigns={campaigns} />}
          {activeTab === 'discover' && <DiscoverCreators />}
          {activeTab === 'contracts' && <ContractsManager />}
          {activeTab === 'payments' && <PaymentsManager />}
          {activeTab === 'reports' && <ReportsManager preSelectedCampaign={searchParams.get('campaign')} />}
          {activeTab === 'outreach' && <OutreachManager />}
          {activeTab === 'email-conversion' && <EmailConversionManager />}
          {activeTab === 'conversations' && <ConversationsManager />}
          {activeTab === 'knowledge' && <KnowledgeBaseManager />}
        </div>
      </div>

      {/* ElevenLabs AI Assistant Widget */}
      <elevenlabs-convai
        ref={widgetRef}
        agent-id="agent_01jwkpad6te50bmvfd8ax6xvqk"
        variant="expanded"
        action-text="Need help with campaigns?"
        className="fixed bottom-4 left-4 z-50"
      />
    </div>
  );
};

export default Dashboard;
