import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/types/supabase';

type Report = Database['public']['Tables']['reports']['Row'];
type ReportInsert = Database['public']['Tables']['reports']['Insert'];
type CampaignMetric = Database['public']['Tables']['campaign_metrics']['Row'];
type ReportMetricInsert = Database['public']['Tables']['report_metrics']['Insert'];

interface Campaign {
  id: string;
  name: string;
  brand: string;
  status: string;
}

interface GenerateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportGenerated: () => void;
  preSelectedCampaign?: string | null;
}

const GenerateReportModal = ({ open, onOpenChange, onReportGenerated, preSelectedCampaign }: GenerateReportModalProps) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns-for-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, brand, status')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
    enabled: open,
  });

  // Auto-select pre-selected campaign when campaigns load
  useEffect(() => {
    if (preSelectedCampaign && campaigns && campaigns.length > 0) {
      const campaignExists = campaigns.some(c => c.id === preSelectedCampaign);
      if (campaignExists && !selectedCampaigns.includes(preSelectedCampaign)) {
        setSelectedCampaigns([preSelectedCampaign]);
      }
    }
  }, [preSelectedCampaign, campaigns, selectedCampaigns]);

  const handleCampaignToggle = (campaignId: string) => {
    setSelectedCampaigns(prev =>
      prev.includes(campaignId)
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (selectedCampaigns.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one campaign",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Convert campaign IDs to UUIDs and dates to strings
      const campaignUUIDs = selectedCampaigns.map(id => id as string);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Create report first with initial values
      const { data: initialReport, error: createError } = await supabase
        .from('reports')
        .insert({
          campaign_ids: campaignUUIDs,
          range_start: startDateStr,
          range_end: endDateStr,
          total_impressions: 0,
          total_clicks: 0,
          total_conversions: 0,
          total_spend: 0
        })
        .select()
        .single();

      if (createError) throw createError;
      if (!initialReport) throw new Error('Failed to create report');

      // Get metrics for each campaign
      const { data: metrics, error: metricsError } = await supabase
        .from('campaign_metrics')
        .select('*')
        .in('campaign_id', campaignUUIDs)
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (metricsError) throw metricsError;

      // Calculate totals from available metrics
      const totals = {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0
      };

      if (metrics && metrics.length > 0) {
        // Store individual metrics
        const reportMetrics = metrics.map(metric => ({
          report_id: initialReport.id,
          campaign_id: metric.campaign_id,
          date: metric.date,
          impressions: metric.impressions || 0,
          clicks: metric.clicks || 0,
          conversions: metric.conversions || 0,
          spend: metric.spend || 0
        }));

        // Insert report metrics
        const { error: metricsInsertError } = await supabase
          .from('report_metrics')
          .insert(reportMetrics);

        if (metricsInsertError) throw metricsInsertError;

        // Calculate totals
        metrics.forEach(metric => {
          totals.impressions += metric.impressions || 0;
          totals.clicks += metric.clicks || 0;
          totals.conversions += metric.conversions || 0;
          totals.spend += metric.spend || 0;
        });

        // Update report with totals
        const { error: updateError } = await supabase
          .from('reports')
          .update({
            total_impressions: totals.impressions,
            total_clicks: totals.clicks,
            total_conversions: totals.conversions,
            total_spend: totals.spend
          })
          .eq('id', initialReport.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Report Generated",
        description: metrics && metrics.length > 0 
          ? "Your report has been generated successfully."
          : "Report created, but no metrics were found for the selected date range.",
      });

      onReportGenerated();
      onOpenChange(false);
      
      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedCampaigns([]);
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Generate Performance Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Selection */}
          <div className="space-y-4">
            <Label className="text-gray-900">Date Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-600">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white border-gray-200",
                        !startDate && "text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border-gray-200" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="bg-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white border-gray-200",
                        !endDate && "text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border-gray-200" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="bg-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Campaign Selection */}
          <div className="space-y-4">
            <Label className="text-gray-900">Select Campaigns</Label>
            {campaignsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-coral" />
                <span className="ml-2 text-gray-600">Loading campaigns...</span>
              </div>
            ) : (
              <Card className="bg-white border-gray-200 max-h-60 overflow-y-auto">
                <CardContent className="p-4 space-y-3">
                  {campaigns && campaigns.length > 0 ? (
                    campaigns.map((campaign) => (
                      <div key={campaign.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={campaign.id}
                          checked={selectedCampaigns.includes(campaign.id)}
                          onCheckedChange={() => handleCampaignToggle(campaign.id)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={campaign.id} className="text-gray-900 cursor-pointer">
                            {campaign.name}
                          </Label>
                          <p className="text-sm text-gray-600">{campaign.brand} • {campaign.status}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-4">No campaigns found</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-200 text-gray-900 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="bg-coral hover:bg-coral/90 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateReportModal;
