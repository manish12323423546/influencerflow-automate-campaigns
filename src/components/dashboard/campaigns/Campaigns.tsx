import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, ArrowLeft, Bell, Filter, Calendar, DollarSign, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationCenter from '@/components/NotificationCenter';
import { supabase } from '@/integrations/supabase/client';
import type { Campaign } from '@/types/campaign';
import { logger } from '@/lib/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const Campaigns = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

  // Mock user data
  const mockUser = {
    id: 'mock-user-123',
    email: 'brand@example.com'
  };

  // Fetch campaigns from Supabase
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setCampaigns(data || []);
      } catch (error) {
        logger.error('Error fetching campaigns:', error);
        toast({
          title: "Error loading campaigns",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, [toast]);

  // Filter campaigns based on search and status
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = searchTerm === '' || 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.description && campaign.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'pending':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getCampaignStats = () => {
    const total = campaigns.length;
    const active = campaigns.filter(c => c.status === 'active').length;
    const pending = campaigns.filter(c => c.status === 'pending').length;
    const completed = campaigns.filter(c => c.status === 'completed').length;
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    
    return { total, active, pending, completed, totalBudget };
  };

  const stats = getCampaignStats();

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;

    // Validate confirmation text
    if (deleteConfirmText !== campaignToDelete.name) {
      toast({
        title: "Confirmation required",
        description: "Please type the campaign name exactly to confirm deletion.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      logger.info('Starting campaign deletion process for campaign:', campaignToDelete.id);

      // Delete related data in the correct order to avoid foreign key constraints

      // 1. Delete posts first (no dependencies)
      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .eq('campaign_id', campaignToDelete.id);

      if (postsError) {
        logger.error('Error deleting posts:', postsError);
        // Don't throw here as posts might not exist
      }

      // 2. Delete performance reports
      const { error: performanceReportsError } = await supabase
        .from('performance_reports')
        .delete()
        .eq('campaign_id', campaignToDelete.id);

      if (performanceReportsError) {
        logger.error('Error deleting performance reports:', performanceReportsError);
        // Don't throw here as reports might not exist
      }

      // 3. Delete contracts
      const { error: contractsError } = await supabase
        .from('contracts')
        .delete()
        .eq('campaign_id', campaignToDelete.id);

      if (contractsError) {
        logger.error('Error deleting contracts:', contractsError);
        throw new Error(`Failed to delete contracts: ${contractsError.message}`);
      }

      // 4. Delete campaign automation logs
      const { error: logsError } = await supabase
        .from('campaign_automation_logs')
        .delete()
        .eq('campaign_id', campaignToDelete.id);

      if (logsError) {
        logger.error('Error deleting automation logs:', logsError);
        // Don't throw here as logs might not exist
      }

      // 5. Delete campaign metrics
      const { error: metricsError } = await supabase
        .from('campaign_metrics')
        .delete()
        .eq('campaign_id', campaignToDelete.id);

      if (metricsError) {
        logger.error('Error deleting campaign metrics:', metricsError);
        // Don't throw here as metrics might not exist
      }

      // 6. Delete report metrics that reference this campaign
      const { error: reportMetricsError } = await supabase
        .from('report_metrics')
        .delete()
        .eq('campaign_id', campaignToDelete.id);

      if (reportMetricsError) {
        logger.error('Error deleting report metrics:', reportMetricsError);
        // Don't throw here as report metrics might not exist
      }

      // 7. Update reports to remove this campaign from campaign_ids arrays
      const { data: reportsWithCampaign, error: reportsSelectError } = await supabase
        .from('reports')
        .select('id, campaign_ids')
        .contains('campaign_ids', [campaignToDelete.id]);

      if (!reportsSelectError && reportsWithCampaign) {
        for (const report of reportsWithCampaign) {
          const updatedCampaignIds = report.campaign_ids.filter((id: string) => id !== campaignToDelete.id);

          if (updatedCampaignIds.length === 0) {
            // If no campaigns left, delete the report
            await supabase.from('reports').delete().eq('id', report.id);
          } else {
            // Update the report with remaining campaign IDs
            await supabase
              .from('reports')
              .update({ campaign_ids: updatedCampaignIds })
              .eq('id', report.id);
          }
        }
      }

      // 8. Delete campaign influencers
      const { error: influencersError } = await supabase
        .from('campaign_influencers')
        .delete()
        .eq('campaign_id', campaignToDelete.id);

      if (influencersError) {
        logger.error('Error deleting campaign influencers:', influencersError);
        throw new Error(`Failed to delete campaign influencers: ${influencersError.message}`);
      }

      // 5. Finally delete the campaign itself
      const { error: campaignError } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignToDelete.id);

      if (campaignError) {
        logger.error('Error deleting campaign:', campaignError);
        throw new Error(`Failed to delete campaign: ${campaignError.message}`);
      }

      logger.info('Campaign deletion completed successfully');

      // Update local state to remove the deleted campaign
      setCampaigns(prev => prev.filter(c => c.id !== campaignToDelete.id));

      toast({
        title: "Campaign deleted",
        description: "The campaign and all related data have been successfully deleted.",
      });

      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
      setDeleteConfirmText('');

    } catch (error) {
      logger.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setDeleteConfirmText('');
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center text-gray-600 hover:text-coral transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Dashboard
              </Link>
              <h1 className="text-2xl font-space font-bold text-gray-900">
                Influencer<span className="text-coral">Flow</span> • Campaign Management
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button
                  onClick={() => setShowNotifications(true)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-coral hover:bg-gray-100 relative"
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 bg-coral text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Welcome back!</p>
                  <p className="text-xs text-gray-600">{mockUser.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-coral" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-500">{stats.active}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-orange-500"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.completed}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalBudget.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-coral" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search, Filters and Actions */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search campaigns, brands, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-coral pl-10 w-80 shadow-sm"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-white border-gray-200 text-gray-900 shadow-sm">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => navigate('/campaigns/create')}
            className="bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Campaign
          </Button>
        </div>

        {/* Campaigns Table */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Campaign List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-600">Loading campaigns...</div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <p className="mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? "No campaigns match your current filters."
                    : "No campaigns found. Create your first campaign to get started."
                  }
                </p>
                <Button
                  onClick={() => navigate('/campaigns/create')}
                  className="bg-coral hover:bg-coral/90 text-white"
                >
                  Create Your First Campaign
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Campaign Name</TableHead>
                    <TableHead className="text-gray-600">Brand</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Budget</TableHead>
                    <TableHead className="text-gray-600">Influencers</TableHead>
                    <TableHead className="text-gray-600">Timeline</TableHead>
                    <TableHead className="text-gray-600">Created</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign, index) => (
                    <motion.tr
                      key={campaign.id}
                      className="border-gray-200 hover:bg-gray-50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TableCell className="font-medium text-gray-900">
                        <div className="cursor-pointer" onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                          <p className="font-medium hover:text-coral transition-colors">{campaign.name}</p>
                          {campaign.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{campaign.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">{campaign.brand}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        ${campaign.budget.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <span className="text-coral font-medium">{campaign.influencer_count}</span> selected
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {campaign.timeline || 'Not set'}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => navigate(`/campaigns/${campaign.id}`)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-coral hover:bg-coral/10"
                          >
                            View
                          </Button>
                          <Button
                            onClick={() => navigate(`/campaigns/${campaign.id}`, { state: { isEditing: true } })}
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-blue-500 hover:bg-blue-50"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => openDeleteDialog(campaign)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Delete Campaign Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the campaign and all related data including contracts, metrics, and automation logs.
            </DialogDescription>
          </DialogHeader>
          {campaignToDelete && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="confirm-text" className="text-sm font-medium text-gray-700">
                  Type <span className="font-bold text-red-600">{campaignToDelete.name}</span> to confirm:
                </label>
                <Input
                  id="confirm-text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Enter campaign name"
                  className="bg-white border-gray-200"
                  disabled={isDeleting}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setCampaignToDelete(null);
                setDeleteConfirmText('');
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDeleteCampaign}
              disabled={isDeleting || !campaignToDelete || deleteConfirmText !== campaignToDelete.name}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Campaign'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaigns;
