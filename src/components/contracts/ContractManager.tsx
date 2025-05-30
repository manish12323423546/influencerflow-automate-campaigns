import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Send, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Contract {
  id: string;
  status: string;
  contract_data: any;
  pdf_url: string | null;
  signed_at: string | null;
  created_at: string;
  influencer: {
    id: string;
    name: string;
    handle: string;
  };
}

interface ContractManagerProps {
  campaignId: string;
  campaignInfluencers: any[];
}

export const ContractManager = ({ campaignId, campaignInfluencers }: ContractManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch contracts for this campaign
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id,
          status,
          contract_data,
          pdf_url,
          signed_at,
          created_at,
          influencer:influencer_id (
            id,
            name,
            handle
          )
        `)
        .eq('campaign_id', campaignId);
      
      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!campaignId,
  });

  const generateContractMutation = useMutation({
    mutationFn: async (influencerId: string) => {
      const influencer = campaignInfluencers.find(ci => ci.influencer.id === influencerId);
      if (!influencer) throw new Error('Influencer not found');

      const contractData = {
        campaignId,
        influencerId,
        influencerName: influencer.influencer.name,
        influencerHandle: influencer.influencer.handle,
        fee: influencer.fee,
        deliverables: 'Social media posts as agreed',
        timeline: '30 days from signing',
        generatedAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('contracts')
        .insert({
          campaign_id: campaignId,
          influencer_id: influencerId,
          brand_user_id: user!.id,
          contract_data: contractData,
          status: 'drafted',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', campaignId] });
      toast({
        title: "Contract Generated",
        description: "Contract has been successfully generated and is ready to send.",
      });
    },
    onError: (error) => {
      console.error('Error generating contract:', error);
      toast({
        title: "Error",
        description: "Failed to generate contract. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateContractStatusMutation = useMutation({
    mutationFn: async ({ contractId, status }: { contractId: string; status: string }) => {
      const updateData: any = { status };
      if (status === 'signed') {
        updateData.signed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', campaignId] });
      toast({
        title: "Contract Updated",
        description: "Contract status has been updated successfully.",
      });
    },
  });

  const handleGenerateContract = async (influencerId: string) => {
    setIsGenerating(true);
    try {
      await generateContractMutation.mutateAsync(influencerId);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'drafted':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'sent':
        return 'bg-blue-500/10 text-blue-500';
      case 'signed':
        return 'bg-green-500/10 text-green-500';
      case 'rejected':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const influencersWithoutContracts = campaignInfluencers.filter(ci => 
    !contracts.some(contract => contract.influencer.id === ci.influencer.id)
  );

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-snow flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Contract Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generate contracts for influencers without contracts */}
        {influencersWithoutContracts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-snow">Generate Contracts</h4>
            {influencersWithoutContracts.map((campaignInfluencer) => (
              <div
                key={campaignInfluencer.id}
                className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
              >
                <div>
                  <p className="font-medium text-snow">{campaignInfluencer.influencer.name}</p>
                  <p className="text-sm text-snow/60">{campaignInfluencer.influencer.handle}</p>
                </div>
                <Button
                  onClick={() => handleGenerateContract(campaignInfluencer.influencer.id)}
                  disabled={isGenerating}
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {isGenerating ? 'Generating...' : 'Generate Contract'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Existing contracts */}
        {contracts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-snow">Existing Contracts</h4>
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-snow">{contract.influencer.name}</p>
                  <p className="text-sm text-snow/60">{contract.influencer.handle}</p>
                  <p className="text-xs text-snow/50">
                    Created: {new Date(contract.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusBadgeColor(contract.status)}>
                    {contract.status}
                  </Badge>
                  
                  {contract.status === 'drafted' && (
                    <Button
                      onClick={() => updateContractStatusMutation.mutate({
                        contractId: contract.id,
                        status: 'sent'
                      })}
                      size="sm"
                      variant="outline"
                      className="border-zinc-700 text-snow hover:bg-zinc-700"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Send
                    </Button>
                  )}
                  
                  {contract.status === 'sent' && (
                    <Button
                      onClick={() => updateContractStatusMutation.mutate({
                        contractId: contract.id,
                        status: 'signed'
                      })}
                      size="sm"
                      variant="outline"
                      className="border-zinc-700 text-snow hover:bg-zinc-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark Signed
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-snow/70 hover:text-purple-500"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {contracts.length === 0 && influencersWithoutContracts.length === 0 && (
          <div className="text-center py-8 text-snow/60">
            No influencers in this campaign to generate contracts for.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
