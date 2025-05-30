
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Bell, Settings, LogOut, DollarSign, TrendingUp, Users, Mail, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface CampaignInvitation {
  id: string;
  campaign: {
    name: string;
    brand: string;
    description: string;
    budget: number;
  };
  fee: number;
  status: string;
  created_at: string;
}

const CreatorDashboard = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (userRole === 'brand') {
      navigate('/dashboard');
    }
  }, [user, userRole, navigate]);

  // Fetch creator's profile from influencers table
  const { data: creatorProfile } = useQuery({
    queryKey: ['creator-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .eq('creator_profile_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
  });

  // Fetch campaign invitations
  const { data: campaignInvitations = [] } = useQuery({
    queryKey: ['campaign-invitations', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile) return [];
      
      const { data, error } = await supabase
        .from('campaign_influencers')
        .select(`
          *,
          campaign:campaigns(name, brand, description, budget)
        `)
        .eq('influencer_id', creatorProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CampaignInvitation[];
    },
    enabled: !!creatorProfile,
  });

  // Calculate earnings
  const totalEarnings = campaignInvitations
    .filter(inv => inv.status === 'completed')
    .reduce((sum, inv) => sum + Number(inv.fee), 0);

  const pendingEarnings = campaignInvitations
    .filter(inv => inv.status === 'active')
    .reduce((sum, inv) => sum + Number(inv.fee), 0);

  const activeCampaigns = campaignInvitations.filter(inv => inv.status === 'active').length;
  const completedCampaigns = campaignInvitations.filter(inv => inv.status === 'completed').length;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_influencers')
        .update({ status: 'active' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Invitation accepted!",
        description: "You've successfully joined the campaign.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_influencers')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Invitation declined",
        description: "You've declined the campaign invitation.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-500/10';
      case 'completed':
        return 'text-blue-500 bg-blue-500/10';
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'declined':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'declined':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (!user || userRole !== 'creator') return null;

  return (
    <div className="min-h-screen bg-carbon">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-space font-bold text-snow">
                Creator<span className="text-purple-500">Hub</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Bell className="h-6 w-6 text-snow/70 hover:text-purple-500 cursor-pointer" />
              <Settings className="h-6 w-6 text-snow/70 hover:text-purple-500 cursor-pointer" onClick={() => navigate('/settings')} />
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-snow">Welcome back, Creator!</p>
                  <p className="text-xs text-snow/60">{user.email}</p>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-snow/70 hover:text-purple-500 hover:border-purple-500"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">${totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-green-500">Completed campaigns</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Pending Earnings</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">${pendingEarnings.toLocaleString()}</div>
              <p className="text-xs text-yellow-500">Active campaigns</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Active Campaigns</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">{activeCampaigns}</div>
              <p className="text-xs text-neutral-400">Currently running</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Completed</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">{completedCampaigns}</div>
              <p className="text-xs text-blue-500">Successful collaborations</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Invitations */}
        <Card className="bg-zinc-900 border-zinc-800 mb-8">
          <CardHeader>
            <CardTitle className="text-snow flex items-center">
              <Mail className="h-5 w-5 mr-2 text-purple-500" />
              Campaign Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaignInvitations.length === 0 ? (
              <div className="text-center py-8 text-snow/60">
                No campaign invitations yet. Keep creating great content!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-snow/80">Campaign</TableHead>
                    <TableHead className="text-snow/80">Brand</TableHead>
                    <TableHead className="text-snow/80">Fee</TableHead>
                    <TableHead className="text-snow/80">Status</TableHead>
                    <TableHead className="text-snow/80">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignInvitations.map((invitation) => (
                    <TableRow key={invitation.id} className="border-zinc-800">
                      <TableCell className="font-medium text-snow">
                        {invitation.campaign.name}
                      </TableCell>
                      <TableCell className="text-snow/80">{invitation.campaign.brand}</TableCell>
                      <TableCell className="text-snow/80">${invitation.fee.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(invitation.status)}`}>
                          {getStatusIcon(invitation.status)}
                          {invitation.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {invitation.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptInvitation(invitation.id)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeclineInvitation(invitation.id)}
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Creator Profile Summary */}
        {creatorProfile && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-snow">Your Creator Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-snow/70 mb-1">Platform</p>
                  <p className="text-snow font-medium">{creatorProfile.platform}</p>
                </div>
                <div>
                  <p className="text-sm text-snow/70 mb-1">Followers</p>
                  <p className="text-snow font-medium">{creatorProfile.followers_count.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-snow/70 mb-1">Engagement Rate</p>
                  <p className="text-snow font-medium">{creatorProfile.engagement_rate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreatorDashboard;