import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
type ReportRequest = Database['public']['Tables']['report_requests']['Insert'];

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
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
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
      if (campaignExists && selectedCampaign !== preSelectedCampaign) {
        setSelectedCampaign(preSelectedCampaign);
      }
    }
  }, [preSelectedCampaign, campaigns, selectedCampaign]);

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaign(campaignId);
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

    if (!selectedCampaign) {
      toast({
        title: "Missing Information",
        description: "Please select a campaign",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get current user if available
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get selected campaign details for PDF naming
      const selectedCampaignData = campaigns?.find(c => c.id === selectedCampaign);
      const campaignName = selectedCampaignData?.name || 'Campaign';
      
      // Convert campaign ID and dates to strings
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // For anonymous users, we'll use the edge function directly instead of inserting into the database
      if (!user) {
        // Call the generate-report edge function directly with the necessary data
        const { data: reportData, error: reportError } = await supabase.functions
          .invoke('generate-report', {
            body: { 
              isAnonymous: true,
              reportData: {
                range_start: startDateStr,
                range_end: endDateStr,
                campaign_name: campaignName,
                filters_json: {
                  campaign_id: selectedCampaign
                }
              }
            }
          });

        if (reportError) {
          console.error('Error from generate-report function:', reportError);
          throw new Error('Failed to generate report: ' + reportError.message);
        }

        // Handle successful report generation for anonymous users
        toast({
          title: "Report Generated",
          description: "Your report has been generated. Downloading will start shortly.",
        });

        // For anonymous users, we'll store the report in localStorage instead of opening it
        if (reportData && reportData.downloadUrl) {
          // Store the report data in localStorage for later download
          try {
            const anonymousReports = JSON.parse(localStorage.getItem('anonymousReports') || '[]');
            anonymousReports.push({
              id: `anonymous-${Date.now()}`,
              url: reportData.downloadUrl,
              name: campaignName,
              date: new Date().toISOString(),
              fileName: `${campaignName}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
            });
            localStorage.setItem('anonymousReports', JSON.stringify(anonymousReports));
            
            console.log('Anonymous report saved for later download');
          } catch (e) {
            console.error('Error saving anonymous report to localStorage:', e);
          }
        }

        onReportGenerated();
        onOpenChange(false);
        
        // Reset form
        setStartDate(undefined);
        setEndDate(undefined);
        setSelectedCampaign('');
        
        return;
      }
      
      // For authenticated users, continue with the normal flow
      const userId = user.id;

      // Create a report request
      const reportRequest: ReportRequest = {
        brand_user_id: userId,
        range_start: startDateStr,
        range_end: endDateStr,
        filters_json: {
          campaign_id: selectedCampaign,
          campaign_name: campaignName
        },
        status: 'processing'
      };

      // Insert the report request
      const { data: createdRequest, error: createError } = await supabase
        .from('report_requests')
        .insert(reportRequest)
        .select()
        .single();

      if (createError) throw createError;
      if (!createdRequest) throw new Error('Failed to create report request');

      // Call the generate-report edge function
      const { data: reportData, error: reportError } = await supabase.functions
        .invoke('generate-report', {
          body: { reportRequestId: createdRequest.id }
        });

      if (reportError) {
        console.error('Error from generate-report function:', reportError);
        // Update the report request status to failed
        await supabase
          .from('report_requests')
          .update({ status: 'failed' })
          .eq('id', createdRequest.id);

        throw new Error('Failed to generate report: ' + reportError.message);
      }

      // Check if the report was successfully created
      if (reportData && reportData.success) {
        toast({
          title: "Report Generation Started",
          description: "Your report is being processed and will be available shortly.",
        });
        
        console.log("Report generation successful:", reportData);
      } else {
        toast({
          title: "Report Generation Issue",
          description: "Your report has been queued but there might be an issue. Please check the reports tab in a few moments.",
          variant: "destructive",
        });
        
        console.warn("Report generation had issues:", reportData);
      }

      // Trigger the callback to refresh the reports list
      onReportGenerated();
      onOpenChange(false);
      
      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedCampaign('');
      
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
            <Label className="text-gray-900">Select Campaign</Label>
            {campaignsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-coral" />
                <span className="ml-2 text-gray-600">Loading campaigns...</span>
              </div>
            ) : (
              <Card className="bg-white border-gray-200 max-h-60 overflow-y-auto">
                <CardContent className="p-4">
                  {campaigns && campaigns.length > 0 ? (
                    <RadioGroup value={selectedCampaign} onValueChange={handleCampaignSelect}>
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className="flex items-center space-x-3">
                          <RadioGroupItem value={campaign.id} id={campaign.id} />
                          <div className="flex-1">
                            <Label htmlFor={campaign.id} className="text-gray-900 cursor-pointer">
                              {campaign.name}
                            </Label>
                            <p className="text-sm text-gray-600">{campaign.brand} • {campaign.status}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
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