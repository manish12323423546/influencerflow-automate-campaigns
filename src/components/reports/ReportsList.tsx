
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Calendar, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ReportRequest {
  id: string;
  range_start: string;
  range_end: string;
  filters_json: any;
  status: string;
  pdf_url: string | null;
  created_at: string;
}

const ReportsList = () => {
  const [reports, setReports] = useState<ReportRequest[]>([]);

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReportRequest[];
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
      .channel('reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_requests'
        },
        (payload) => {
          console.log('Report update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setReports(prev => [payload.new as ReportRequest, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setReports(prev => 
              prev.map(report => 
                report.id === payload.new.id ? payload.new as ReportRequest : report
              )
            );
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
    if (!report.pdf_url) return;
    
    try {
      // For demo purposes, we'll just open the URL
      // In a real app, you'd generate a signed URL from Supabase Storage
      window.open(report.pdf_url, '_blank');
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-500 hover:bg-green-600">Ready</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Generating</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCampaignNames = (filters: any) => {
    if (filters?.campaignIds && Array.isArray(filters.campaignIds)) {
      return filters.campaignIds.length > 2 
        ? `${filters.campaignIds.slice(0, 2).join(', ')} +${filters.campaignIds.length - 2} more`
        : filters.campaignIds.join(', ');
    }
    return 'All Campaigns';
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
              <TableHead className="text-snow/70">Date Range</TableHead>
              <TableHead className="text-snow/70">Campaigns</TableHead>
              <TableHead className="text-snow/70">Status</TableHead>
              <TableHead className="text-snow/70">Generated</TableHead>
              <TableHead className="text-snow/70">Actions</TableHead>
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
                <TableCell className="text-snow/80">
                  {getCampaignNames(report.filters_json)}
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
      </CardContent>
    </Card>
  );
};

export default ReportsList;
