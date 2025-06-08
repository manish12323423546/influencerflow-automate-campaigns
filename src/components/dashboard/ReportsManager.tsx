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
      const { data, error } = await supabase
        .from('report_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReportRequest[];
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
    if (!report.pdf_url) {
      toast({
        title: "Download Error",
        description: "Report file is not available for download.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(report.pdf_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report-${format(new Date(report.created_at), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Ready</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Unknown</Badge>;
    }
  };

  const getCampaignNames = (filtersJson: any) => {
    if (!filtersJson || !filtersJson.campaigns) return 'All Campaigns';
    return filtersJson.campaigns.length > 2 
      ? `${filtersJson.campaigns.slice(0, 2).join(', ')} +${filtersJson.campaigns.length - 2} more`
      : filtersJson.campaigns.join(', ');
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
          <CardTitle className="text-gray-900 flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Report History
          </CardTitle>
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
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Date Range</TableHead>
                  <TableHead className="text-gray-600">Campaigns</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600">Generated</TableHead>
                  <TableHead className="text-gray-600">Actions</TableHead>
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
                    <TableCell className="text-gray-700">
                      {getCampaignNames(report.filters_json)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(report.status)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleDownload(report)}
                        disabled={report.status !== 'ready' || !report.pdf_url}
                        size="sm"
                        variant="outline"
                        className="border-coral text-coral hover:bg-coral hover:text-white disabled:opacity-50"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
