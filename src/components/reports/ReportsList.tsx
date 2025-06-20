import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Calendar, FileText, Clock, TrendingUp, MousePointerClick, Target, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/types/supabase';

type Report = Database['public']['Tables']['reports']['Row'];

const ReportsList = () => {
  const [reports, setReports] = useState<Report[]>([]);

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Report[];
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
          table: 'reports'
        },
        (payload) => {
          console.log('Report update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setReports(prev => [payload.new as Report, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setReports(prev => 
              prev.map(report => 
                report.id === payload.new.id ? payload.new as Report : report
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

  const handleDownload = async (report: Report) => {
    try {
      // Create CSV content
      const csvContent = [
        'Campaign Performance Report',
        `Date Range: ${format(new Date(report.range_start), 'MMM dd, yyyy')} - ${format(new Date(report.range_end), 'MMM dd, yyyy')}`,
        '',
        'Overall Performance',
        'Metric,Value',
        `Impressions,${report.total_impressions.toLocaleString()}`,
        `Clicks,${report.total_clicks.toLocaleString()}`,
        `Conversions,${report.total_conversions.toLocaleString()}`,
        `Spend,₹${report.total_spend.toLocaleString()}`,
        `CTR,${((report.total_clicks / report.total_impressions) * 100).toFixed(2)}%`,
        `CVR,${((report.total_conversions / report.total_clicks) * 100).toFixed(2)}%`,
        `CPA,₹${(report.total_spend / report.total_conversions).toFixed(2)}`
      ].join('\n');
      
      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report-${format(new Date(report.created_at), 'yyyy-MM-dd')}.csv`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-500 hover:bg-green-600">Ready</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCampaignIds = (report: Report) => {
    if (report.campaign_ids && Array.isArray(report.campaign_ids)) {
      return report.campaign_ids.length > 2 
        ? `${report.campaign_ids.slice(0, 2).join(', ')} +${report.campaign_ids.length - 2} more`
        : report.campaign_ids.join(', ');
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
              <TableHead className="text-snow/70">Metrics</TableHead>
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
                  {getCampaignIds(report)}
                </TableCell>
                <TableCell className="text-snow/80">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center" title="Impressions">
                      <TrendingUp className="h-4 w-4 text-coral mr-1" />
                      {report.total_impressions.toLocaleString()}
                    </div>
                    <div className="flex items-center" title="Clicks">
                      <MousePointerClick className="h-4 w-4 text-coral mr-1" />
                      {report.total_clicks.toLocaleString()}
                    </div>
                    <div className="flex items-center" title="Conversions">
                      <Target className="h-4 w-4 text-coral mr-1" />
                      {report.total_conversions.toLocaleString()}
                    </div>
                    <div className="flex items-center" title="Spend">
                      <DollarSign className="h-4 w-4 text-coral mr-1" />
                      {report.total_spend.toLocaleString()}
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
                    size="sm"
                    variant="outline"
                    className="border-coral text-coral hover:bg-coral hover:text-white"
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
