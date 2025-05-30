
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, CheckCircle, Clock, Plus, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import RazorpayPayment from './RazorpayPayment';

interface Milestone {
  id: string;
  campaign_id: string;
  influencer_id: string;
  milestone_name: string;
  milestone_description: string;
  amount: number;
  due_date: string;
  status: string; // Changed to string to match database
  approved_at: string | null;
  campaigns?: { name: string };
  influencers?: { name: string };
}

const MilestoneManager = () => {
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch milestones
  const { data: milestones, isLoading } = useQuery({
    queryKey: ['payment-milestones'],
    queryFn: async (): Promise<Milestone[]> => {
      const { data, error } = await supabase
        .from('payment_milestones')
        .select(`
          *,
          campaigns(name),
          influencers(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch campaigns for dropdown
  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch influencers for dropdown
  const { data: influencers } = useQuery({
    queryKey: ['influencers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('influencers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Create milestone mutation
  const createMilestone = useMutation({
    mutationFn: async (milestone: Omit<Milestone, 'id' | 'status' | 'approved_at' | 'campaigns' | 'influencers'>) => {
      const { data, error } = await supabase
        .from('payment_milestones')
        .insert([milestone])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-milestones'] });
      toast({
        title: "Milestone created",
        description: "Payment milestone has been created successfully.",
      });
      setIsAddingMilestone(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create milestone. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Approve milestone mutation
  const approveMilestone = useMutation({
    mutationFn: async (milestoneId: string) => {
      const { data, error } = await supabase
        .from('payment_milestones')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', milestoneId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-milestones'] });
      toast({
        title: "Milestone approved",
        description: "Payment milestone has been approved for payment.",
      });
    }
  });

  const handleCreateMilestone = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMilestone.mutate({
      campaign_id: formData.get('campaign_id') as string,
      influencer_id: formData.get('influencer_id') as string,
      milestone_name: formData.get('milestone_name') as string,
      milestone_description: formData.get('milestone_description') as string,
      amount: Number(formData.get('amount')),
      due_date: formData.get('due_date') as string,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'paid':
        return 'default';
      case 'overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'paid':
        return 'text-green-600';
      case 'overdue':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-snow">Payment Milestones</h2>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                  <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-snow">Payment Milestones</h2>
          <p className="text-snow/60">Manage campaign payment milestones and approvals</p>
        </div>
        
        <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-700">
            <DialogHeader>
              <DialogTitle className="text-snow">Create Payment Milestone</DialogTitle>
              <DialogDescription className="text-snow/60">
                Set up a new payment milestone for campaign deliverables.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaign_id" className="text-snow">Campaign</Label>
                  <select
                    name="campaign_id"
                    required
                    className="w-full mt-1 bg-zinc-800 border-zinc-700 text-snow rounded-md px-3 py-2"
                  >
                    <option value="">Select Campaign</option>
                    {campaigns?.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="influencer_id" className="text-snow">Influencer</Label>
                  <select
                    name="influencer_id"
                    required
                    className="w-full mt-1 bg-zinc-800 border-zinc-700 text-snow rounded-md px-3 py-2"
                  >
                    <option value="">Select Influencer</option>
                    {influencers?.map((influencer) => (
                      <option key={influencer.id} value={influencer.id}>
                        {influencer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="milestone_name" className="text-snow">Milestone Name</Label>
                <Input
                  name="milestone_name"
                  placeholder="e.g., Content Creation Complete"
                  required
                  className="bg-zinc-800 border-zinc-700 text-snow"
                />
              </div>

              <div>
                <Label htmlFor="milestone_description" className="text-snow">Description</Label>
                <Textarea
                  name="milestone_description"
                  placeholder="Describe what needs to be completed for this milestone"
                  className="bg-zinc-800 border-zinc-700 text-snow"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount" className="text-snow">Amount (₹)</Label>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>
                
                <div>
                  <Label htmlFor="due_date" className="text-snow">Due Date</Label>
                  <Input
                    name="due_date"
                    type="date"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingMilestone(false)}
                  className="border-zinc-700 text-snow hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMilestone.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {createMilestone.isPending ? 'Creating...' : 'Create Milestone'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {milestones?.map((milestone) => (
          <Card key={milestone.id} className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-snow">
                      {milestone.milestone_name}
                    </h3>
                    <Badge variant={getStatusBadgeVariant(milestone.status)} className={getStatusColor(milestone.status)}>
                      {milestone.status}
                    </Badge>
                  </div>
                  
                  <p className="text-snow/70">{milestone.milestone_description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-snow/60">
                    <span>Campaign: {milestone.campaigns?.name || 'Unknown'}</span>
                    <span>Influencer: {milestone.influencers?.name || 'Unknown'}</span>
                    {milestone.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {new Date(milestone.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="text-2xl font-bold text-snow">
                    ₹{milestone.amount.toLocaleString()}
                  </div>
                  
                  <div className="space-x-2">
                    {milestone.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => approveMilestone.mutate(milestone.id)}
                        disabled={approveMilestone.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    
                    {milestone.status === 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedMilestone(milestone);
                          setPaymentDialogOpen(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {milestones?.length === 0 && (
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-12 text-center">
              <Clock className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-snow mb-2">No milestones yet</h3>
              <p className="text-snow/60 mb-4">Create your first payment milestone to get started.</p>
              <Button onClick={() => setIsAddingMilestone(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedMilestone && (
        <RazorpayPayment
          isOpen={paymentDialogOpen}
          onClose={() => {
            setPaymentDialogOpen(false);
            setSelectedMilestone(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['payment-milestones'] });
            toast({
              title: "Payment successful",
              description: "Milestone payment has been processed successfully.",
            });
            setPaymentDialogOpen(false);
            setSelectedMilestone(null);
          }}
          amount={selectedMilestone.amount}
          description={`Payment for ${selectedMilestone.milestone_name}`}
          campaignId={selectedMilestone.campaign_id}
          influencerId={selectedMilestone.influencer_id}
          milestoneId={selectedMilestone.id}
        />
      )}
    </div>
  );
};

export default MilestoneManager;
