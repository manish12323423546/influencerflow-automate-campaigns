import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart3, FileText, Download, Calendar, Plus, Clock, 
  CheckCircle, AlertCircle, TrendingUp, Users, DollarSign 
} from 'lucide-react';
import { format } from 'date-fns';
import GenerateReportModal from '@/components/reports/GenerateReportModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReportRequest {
  id: string;
  range_start: string;
  range_end: string;
  filters_json: any;
  status: string;
  pdf_url: string | null;
  created_at: string;
}

interface ReportsManagerProps {
  preSelectedCampaign?: string | null;
}

const ReportsManager = ({ preSelectedCampaign }: ReportsManagerProps) => {
  const { toast } = useToast();
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  // Fetch reports
  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['report-requests'],
    queryFn: async () => {
      // Get all reports, including processing ones
      const { data, error } = await supabase
        .from('report_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log("Fetched all reports:", data);
      
      // For each report, try to get the campaign name if we have a campaign ID
      const reportsWithCampaignNames = await Promise.all(
        (data || []).map(async (report) => {
          try {
            if (report.filters_json && typeof report.filters_json === 'object') {
              const filters = report.filters_json;
              
              // If we already have a campaign name, use it
              if (filters.campaign_name) {
                return report;
              }
              
              // If we have a campaign ID, try to get the campaign name
              const campaignId = filters.campaign_id || 
                (filters.campaign_ids && Array.isArray(filters.campaign_ids) && filters.campaign_ids.length === 1 
                  ? filters.campaign_ids[0] : null);
              
              if (campaignId) {
                const { data: campaignData } = await supabase
                  .from('campaigns')
                  .select('name')
                  .eq('id', campaignId)
                  .single();
                
                if (campaignData && campaignData.name) {
                  // Update the filters_json with the campaign name
                  return {
                    ...report,
                    filters_json: {
                      ...filters,
                      campaign_name: campaignData.name
                    }
                  };
                }
              }
            }
            return report;
          } catch (e) {
            console.error('Error fetching campaign name:', e);
            return report;
          }
        })
      );
      
      return reportsWithCampaignNames as ReportRequest[];
    },
  });

  // Fetch campaigns for stats
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, status, budget, spent');

      if (error) throw error;
      return data;
    },
  });

  // Set up real-time subscription for report updates
  useEffect(() => {
    const channel = supabase
      .channel('report-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_requests'
        },
        (payload) => {
          console.log('Report request update received:', payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);
  
  // Set up auto-refresh for processing reports
  useEffect(() => {
    // If there are any processing reports, set up an interval to refresh
    if (reports.some(r => r.status === 'processing')) {
      console.log('Setting up auto-refresh for processing reports');
      const intervalId = setInterval(() => {
        console.log('Auto-refreshing reports...');
        refetch();
      }, 5000); // Refresh every 5 seconds
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [reports, refetch]);

  // Auto-open modal if campaign is pre-selected
  useEffect(() => {
    if (preSelectedCampaign) {
      setGenerateModalOpen(true);
    }
  }, [preSelectedCampaign]);

  const handleReportGenerated = () => {
    refetch();
    toast({
      title: "Report Generation Started",
      description: "Your report is being generated and will be available shortly.",
    });
  };

  const handleDownload = async (report: ReportRequest) => {
    if (!report.pdf_url || report.status !== 'completed') {
      toast({
        title: "Download Error",
        description: "Report file is not available for download yet. Please wait for processing to complete.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Attempting to download report with pdf_url:", report.pdf_url);
      
      // Get the campaign name for the filename
      const campaignName = getCampaignName(report.filters_json).replace(/[^a-zA-Z0-9-_]/g, '_');
      const fileName = `${campaignName}-report-${format(new Date(report.created_at), 'yyyy-MM-dd')}.pdf`;
      
      // Create a signed URL from Supabase storage
      const { data, error } = await supabase.storage
        .from("reports")
        .createSignedUrl(report.pdf_url, 60, { 
          download: fileName, // This will force download with the specified filename
        });
      
      if (error) {
        console.error("Error creating signed URL:", error);
        throw new Error("Failed to generate download link");
      }
      
      if (!data || !data.signedUrl) {
        throw new Error("Failed to generate download link");
      }
      
      console.log("Successfully created signed URL:", data.signedUrl);
      
      // Create a temporary link and trigger download instead of opening in a new tab
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = data.signedUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
      
      toast({
        title: "Download Started",
        description: "Your report is being downloaded.",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Ready</span>
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
            <span>Processing</span>
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20 flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span>Failed</span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-gray-500"></span>
            <span>{status}</span>
          </Badge>
        );
    }
  };

  const getCampaignName = (filtersJson: any) => {
    // For debugging
    console.log('Report filters_json:', filtersJson);
    
    try {
      if (!filtersJson) return 'Campaign Report';
      
      // First priority: Use campaign_name if available
      if (filtersJson.campaign_name && typeof filtersJson.campaign_name === 'string') {
        return filtersJson.campaign_name;
      }
      
      // Check for campaign_id with campaign_name format
      if (filtersJson.campaign_id && typeof filtersJson.campaign_id === 'string' && 
          filtersJson.campaign_id.includes(':') && filtersJson.campaign_id.split(':').length > 1) {
        return filtersJson.campaign_id.split(':')[1].trim();
      }
      
      // Check for campaign_names array
      if (filtersJson.campaign_names && Array.isArray(filtersJson.campaign_names) && filtersJson.campaign_names.length > 0) {
        return filtersJson.campaign_names.length > 2 
          ? `${filtersJson.campaign_names.slice(0, 2).join(', ')} +${filtersJson.campaign_names.length - 2} more`
          : filtersJson.campaign_names.join(', ');
      }
      
      // Check for campaigns array
      if (filtersJson.campaigns && Array.isArray(filtersJson.campaigns) && filtersJson.campaigns.length > 0) {
        return filtersJson.campaigns.length > 2 
          ? `${filtersJson.campaigns.slice(0, 2).join(', ')} +${filtersJson.campaigns.length - 2} more`
          : filtersJson.campaigns.join(', ');
      }
      
      // Check for campaign_ids array
      if (filtersJson.campaign_ids && Array.isArray(filtersJson.campaign_ids) && filtersJson.campaign_ids.length > 0) {
        if (filtersJson.campaign_ids.length === 1) {
          return `Campaign ${filtersJson.campaign_ids[0]}`;
        } else {
          return filtersJson.campaign_ids.length > 2 
            ? `${filtersJson.campaign_ids.slice(0, 2).join(', ')} +${filtersJson.campaign_ids.length - 2} more`
            : filtersJson.campaign_ids.join(', ');
        }
      }
      
      // Check for single campaign_id
      if (filtersJson.campaign_id) {
        return `Campaign ${filtersJson.campaign_id}`;
      }
      
      return 'Campaign Report';
    } catch (error) {
      console.error('Error parsing campaign name:', error, filtersJson);
      return 'Campaign Report';
    }
  };

  // Calculate stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Generate and manage campaign performance reports</p>
        </div>
        <Button
          onClick={() => setGenerateModalOpen(true)}
          className="bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
              </div>
              <FileText className="h-8 w-8 text-coral" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{activeCampaigns}</p>
                <p className="text-xs text-gray-500">of {totalCampaigns} total</p>
              </div>
              <TrendingUp className="h-8 w-8 text-coral" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalBudget.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-coral" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalSpent.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of budget</p>
              </div>
              <BarChart3 className="h-8 w-8 text-coral" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Report History
            </CardTitle>
            <Button 
              onClick={() => refetch()} 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-coral hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
              </svg>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="h-6 w-6 animate-spin text-coral mr-2" />
              <span className="text-gray-600">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
              <p className="text-gray-600 mb-4">Generate your first campaign performance report to get started.</p>
              <Button
                onClick={() => setGenerateModalOpen(true)}
                className="bg-coral hover:bg-coral/90 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          ) : (
            <>
              {reports.some(r => r.status === 'processing') && (
                <div className="bg-yellow-50 p-4 mb-4 rounded-md border border-yellow-200">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-500 mr-2 animate-spin" />
                    <p className="text-yellow-700 font-medium">Reports are being processed</p>
                  </div>
                  <p className="text-yellow-600 text-sm mt-1 mb-2">Some reports are still being generated. This may take a few moments.</p>
                  <Button
                    onClick={() => refetch()}
                    size="sm"
                    variant="outline"
                    className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M21 2v6h-6"></path>
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                      <path d="M3 22v-6h6"></path>
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                    </svg>
                    Refresh Reports
                  </Button>
                </div>
              )}
              <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-coral" />
                      <span>Date Range</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-600">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-coral" />
                      <span>Campaign</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-600">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-coral" />
                      <span>Status</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-coral" />
                      <span>Generated</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Download className="h-4 w-4 text-coral" />
                      <span>Actions</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} className="border-gray-200">
                    <TableCell className="text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-coral" />
                        <span>
                          {format(new Date(report.range_start), 'MMM dd')} - {format(new Date(report.range_end), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-coral" />
                        <div className="flex flex-col">
                          <span className="font-medium">{getCampaignName(report.filters_json)}</span>
                          {report.filters_json && report.filters_json.campaign_id && (
                            <span className="text-xs text-gray-500">ID: {report.filters_json.campaign_id}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(report.status)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {report.status === 'completed' && report.pdf_url ? (
                        <Button
                          onClick={() => handleDownload(report)}
                          size="sm"
                          variant="outline"
                          className="border-coral text-coral hover:bg-coral hover:text-white"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      ) : (
                        <Button
                          disabled
                          size="sm"
                          variant="outline"
                          className="border-gray-300 text-gray-400"
                        >
                          <Clock className="h-4 w-4 mr-1 animate-spin" />
                          Processing
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Generate Report Modal */}
      <GenerateReportModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        onReportGenerated={handleReportGenerated}
        preSelectedCampaign={preSelectedCampaign}
      />
      

    </div>
  );
};

export default ReportsManager;
