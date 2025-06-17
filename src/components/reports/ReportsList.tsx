import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Calendar, FileText, Clock, TrendingUp, MousePointerClick, Target, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/types/supabase';

type ReportRequest = Database['public']['Tables']['report_requests']['Row'];

const ReportsList = () => {
  const [reports, setReports] = useState<ReportRequest[]>([]);
  const { toast } = useToast();

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['report-requests'],
    queryFn: async () => {
      // First get all completed reports with PDF URLs
      const { data, error } = await supabase
        .from('report_requests')
        .select('*')
        .eq('status', 'completed')
        .not('pdf_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // For each report, try to get the campaign name if we have a campaign ID
      const reportsWithCampaignNames = await Promise.all(
        (data || []).map(async (report) => {
          try {
            if (report.filters_json && typeof report.filters_json === 'object') {
              const filters = report.filters_json as any;
              
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

  useEffect(() => {
    if (reportsData) {
      setReports(reportsData);
    }
  }, [reportsData]);

  // Real-time subscription for report updates
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
          console.log('Report update received:', payload);
          
          const newReport = payload.new as ReportRequest;
          
          if (payload.eventType === 'INSERT') {
            // Only add new reports that are completed and have a PDF URL
            if (newReport.status === 'completed' && newReport.pdf_url) {
              setReports(prev => [newReport, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // If the report is now completed and has a PDF URL, add or update it
            if (newReport.status === 'completed' && newReport.pdf_url) {
              setReports(prev => {
                // Check if the report already exists in our list
                const exists = prev.some(report => report.id === newReport.id);
                
                if (exists) {
                  // Update existing report
                  return prev.map(report => 
                    report.id === newReport.id ? newReport : report
                  );
                } else {
                  // Add as a new report
                  return [newReport, ...prev];
                }
              });
            } else {
              // If the report no longer meets our criteria, remove it
              setReports(prev => prev.filter(report => report.id !== newReport.id));
            }
          } else if (payload.eventType === 'DELETE') {
            setReports(prev => prev.filter(report => report.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDownload = async (report: ReportRequest) => {
    if (!report.pdf_url) {
      toast({
        title: "Download Error",
        description: "Report file is not available for download yet. Please wait for processing to complete.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get a fresh signed URL for download
      const { data, error } = await supabase.storage
        .from("reports")
        .createSignedUrl(report.pdf_url, 60, { download: true });
      
      if (error) {
        console.error("Error creating signed URL:", error);
        throw new Error("Failed to generate download link");
      }
      
      if (!data || !data.signedUrl) {
        throw new Error("Failed to generate download link");
      }
      
      // Open the signed URL in a new tab
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: ReportRequest['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
            <span>Ready</span>
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
            <span>Processing</span>
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-red-300"></span>
            <span>Failed</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-gray-400"></span>
            <span>{status}</span>
          </Badge>
        );
    }
  };

  const getCampaignName = (report: ReportRequest) => {
    // For debugging - log the report filters_json to console
    console.log('Report filters_json:', report.id, report.filters_json);
    
    try {
      // Handle new single campaign format
      if (report.filters_json && typeof report.filters_json === 'object') {
        // Type assertion to handle the dynamic nature of filters_json
        const filters = report.filters_json as any;
        
        // First priority: Use campaign_name if available
        if (filters.campaign_name && typeof filters.campaign_name === 'string') {
          return filters.campaign_name;
        }
        
        // Check for campaign_id with campaign_name format (some implementations store it this way)
        if (filters.campaign_id && typeof filters.campaign_id === 'string' && 
            filters.campaign_id.includes(':') && filters.campaign_id.split(':').length > 1) {
          return filters.campaign_id.split(':')[1].trim();
        }
        
        // Second priority: Handle campaign_names array if available
        if (filters.campaign_names && Array.isArray(filters.campaign_names) && filters.campaign_names.length > 0) {
          return filters.campaign_names.length > 2 
            ? `${filters.campaign_names.slice(0, 2).join(', ')} +${filters.campaign_names.length - 2} more`
            : filters.campaign_names.join(', ');
        }
        
        // Third priority: Handle legacy format for backward compatibility
        const campaignIds = filters.campaign_ids || filters.campaigns;
        
        if (campaignIds && Array.isArray(campaignIds)) {
          if (campaignIds.length === 1) {
            // If it's a single campaign ID, try to extract a name if it's in format "id:name"
            const campaignId = campaignIds[0];
            if (typeof campaignId === 'string' && campaignId.includes(':')) {
              return campaignId.split(':')[1].trim();
            }
            return `Campaign ${campaignId}`;
          } else {
            return campaignIds.length > 2 
              ? `${campaignIds.slice(0, 2).join(', ')} +${campaignIds.length - 2} more`
              : campaignIds.join(', ');
          }
        }
        
        // Check for single campaign_id
        if (filters.campaign_id) {
          return `Campaign ${filters.campaign_id}`;
        }
      }
      
      // If we get here, we couldn't find a campaign name
      return 'Campaign Report';
    } catch (error) {
      console.error('Error parsing campaign name:', error, report);
      return 'Campaign Report';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="h-4 w-4 animate-spin text-coral" />
            <span className="text-snow/60">Loading reports...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-snow/30 mb-4" />
            <h3 className="text-lg font-medium text-snow mb-2">No reports yet</h3>
            <p className="text-snow/60 mb-4">Generate your first performance report to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-snow flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Report History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-snow/70">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-coral" />
                  <span>Date Range</span>
                </div>
              </TableHead>
              <TableHead className="text-snow/70">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-coral" />
                  <span>Campaign</span>
                </div>
              </TableHead>
              <TableHead className="text-snow/70">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-coral" />
                  <span>Status</span>
                </div>
              </TableHead>
              <TableHead className="text-snow/70">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-coral" />
                  <span>Generated</span>
                </div>
              </TableHead>
              <TableHead className="text-snow/70">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-coral" />
                  <span>Actions</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id} className="border-zinc-800">
                <TableCell className="text-snow">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-coral" />
                    <span>
                      {format(new Date(report.range_start), 'MMM dd')} - {format(new Date(report.range_end), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-snow">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-coral" />
                    <div className="flex flex-col">
                      <span className="font-medium text-snow">{getCampaignName(report)}</span>
                      {report.filters_json && typeof report.filters_json === 'object' && (report.filters_json as any).campaign_id && (
                        <span className="text-xs text-snow/60">ID: {(report.filters_json as any).campaign_id}</span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(report.status)}
                </TableCell>
                <TableCell className="text-snow/60">
                  {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleDownload(report)}
                    disabled={report.status !== 'completed' || !report.pdf_url}
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
      </CardContent>
    </Card>
  );
};

export default ReportsList;