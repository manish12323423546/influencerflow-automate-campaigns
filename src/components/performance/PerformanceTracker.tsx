
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BarChart, TrendingUp, Plus, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PerformanceReport {
  id: string;
  report_data: any;
  report_type: string;
  created_at: string;
  influencer: {
    id: string;
    name: string;
    handle: string;
  };
}

interface PerformanceTrackerProps {
  campaignId: string;
  campaignInfluencers: any[];
}

export const PerformanceTracker = ({ campaignId, campaignInfluencers }: PerformanceTrackerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    impressions: '',
    reach: '',
    engagement: '',
    clicks: '',
    conversions: '',
    notes: '',
  });

  // Fetch performance reports for this campaign
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['performance-reports', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_reports')
        .select(`
          id,
          report_data,
          report_type,
          created_at,
          influencer:influencer_id (
            id,
            name,
            handle
          )
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PerformanceReport[];
    },
    enabled: !!campaignId,
  });

  const addReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      const { data, error } = await supabase
        .from('performance_reports')
        .insert({
          campaign_id: campaignId,
          influencer_id: selectedInfluencer,
          report_data: reportData,
          report_type: 'manual',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-reports', campaignId] });
      toast({
        title: "Performance Report Added",
        description: "Performance data has been successfully recorded.",
      });
      setShowAddForm(false);
      setFormData({
        impressions: '',
        reach: '',
        engagement: '',
        clicks: '',
        conversions: '',
        notes: '',
      });
      setSelectedInfluencer('');
    },
    onError: (error) => {
      console.error('Error adding performance report:', error);
      toast({
        title: "Error",
        description: "Failed to add performance report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReport = async () => {
    if (!selectedInfluencer) {
      toast({
        title: "Influencer Required",
        description: "Please select an influencer for this report.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const reportData = {
        impressions: parseInt(formData.impressions) || 0,
        reach: parseInt(formData.reach) || 0,
        engagement: parseFloat(formData.engagement) || 0,
        clicks: parseInt(formData.clicks) || 0,
        conversions: parseInt(formData.conversions) || 0,
        notes: formData.notes,
        recordedAt: new Date().toISOString(),
      };

      await addReportMutation.mutateAsync(reportData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalMetrics = () => {
    return reports.reduce((totals, report) => {
      const data = report.report_data;
      return {
        impressions: totals.impressions + (data.impressions || 0),
        reach: totals.reach + (data.reach || 0),
        clicks: totals.clicks + (data.clicks || 0),
        conversions: totals.conversions + (data.conversions || 0),
      };
    }, { impressions: 0, reach: 0, clicks: 0, conversions: 0 });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const totalMetrics = calculateTotalMetrics();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-snow/60">Total Impressions</p>
                <p className="text-2xl font-bold text-snow">{formatNumber(totalMetrics.impressions)}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-snow/60">Total Reach</p>
                <p className="text-2xl font-bold text-snow">{formatNumber(totalMetrics.reach)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-snow/60">Total Clicks</p>
                <p className="text-2xl font-bold text-snow">{formatNumber(totalMetrics.clicks)}</p>
              </div>
              <BarChart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-snow/60">Conversions</p>
                <p className="text-2xl font-bold text-snow">{formatNumber(totalMetrics.conversions)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Reports */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-snow flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              Performance Reports
            </CardTitle>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Report Form */}
          {showAddForm && (
            <div className="p-4 bg-zinc-800 rounded-lg space-y-4">
              <h4 className="text-lg font-medium text-snow">Add Performance Report</h4>
              
              <div>
                <Label className="text-snow">Select Influencer</Label>
                <select
                  value={selectedInfluencer}
                  onChange={(e) => setSelectedInfluencer(e.target.value)}
                  className="w-full mt-1 p-2 bg-zinc-700 border border-zinc-600 rounded text-snow"
                >
                  <option value="">Choose an influencer...</option>
                  {campaignInfluencers.map((ci) => (
                    <option key={ci.influencer.id} value={ci.influencer.id}>
                      {ci.influencer.name} ({ci.influencer.handle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-snow">Impressions</Label>
                  <Input
                    type="number"
                    value={formData.impressions}
                    onChange={(e) => setFormData(prev => ({ ...prev, impressions: e.target.value }))}
                    className="bg-zinc-700 border-zinc-600 text-snow"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-snow">Reach</Label>
                  <Input
                    type="number"
                    value={formData.reach}
                    onChange={(e) => setFormData(prev => ({ ...prev, reach: e.target.value }))}
                    className="bg-zinc-700 border-zinc-600 text-snow"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-snow">Engagement Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.engagement}
                    onChange={(e) => setFormData(prev => ({ ...prev, engagement: e.target.value }))}
                    className="bg-zinc-700 border-zinc-600 text-snow"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <Label className="text-snow">Clicks</Label>
                  <Input
                    type="number"
                    value={formData.clicks}
                    onChange={(e) => setFormData(prev => ({ ...prev, clicks: e.target.value }))}
                    className="bg-zinc-700 border-zinc-600 text-snow"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-snow">Conversions</Label>
                  <Input
                    type="number"
                    value={formData.conversions}
                    onChange={(e) => setFormData(prev => ({ ...prev, conversions: e.target.value }))}
                    className="bg-zinc-700 border-zinc-600 text-snow"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label className="text-snow">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="bg-zinc-700 border-zinc-600 text-snow"
                  placeholder="Additional notes about this performance report..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleSubmitReport}
                  disabled={isSubmitting}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {isSubmitting ? 'Adding...' : 'Add Report'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="border-zinc-700 text-snow hover:bg-zinc-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Reports List */}
          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 bg-zinc-800 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-snow">{report.influencer.name}</p>
                      <p className="text-sm text-snow/60">{report.influencer.handle}</p>
                    </div>
                    <p className="text-sm text-snow/50">
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-snow/60">Impressions</p>
                      <p className="font-medium text-snow">{formatNumber(report.report_data.impressions || 0)}</p>
                    </div>
                    <div>
                      <p className="text-snow/60">Reach</p>
                      <p className="font-medium text-snow">{formatNumber(report.report_data.reach || 0)}</p>
                    </div>
                    <div>
                      <p className="text-snow/60">Engagement</p>
                      <p className="font-medium text-snow">{report.report_data.engagement || 0}%</p>
                    </div>
                    <div>
                      <p className="text-snow/60">Clicks</p>
                      <p className="font-medium text-snow">{formatNumber(report.report_data.clicks || 0)}</p>
                    </div>
                    <div>
                      <p className="text-snow/60">Conversions</p>
                      <p className="font-medium text-snow">{formatNumber(report.report_data.conversions || 0)}</p>
                    </div>
                  </div>
                  
                  {report.report_data.notes && (
                    <div className="mt-3 pt-3 border-t border-zinc-700">
                      <p className="text-sm text-snow/80">{report.report_data.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-snow/60">
              No performance reports yet. Add your first report to start tracking campaign performance.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
