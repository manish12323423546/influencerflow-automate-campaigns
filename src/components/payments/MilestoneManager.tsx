
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Clock, DollarSign, Plus, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Milestone {
  id: string;
  milestone_name: string;
  milestone_description: string | null;
  amount: number;
  due_date: string | null;
  status: string;
  campaign: {
    name: string;
  } | null;
  influencer: {
    name: string;
  } | null;
}

const MilestoneManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedInfluencer, setSelectedInfluencer] = useState('');
  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    description: '',
    amount: '',
    dueDate: ''
  });

  const { data: milestones, isLoading } = useQuery({
    queryKey: ['milestones', user?.id],
    queryFn: async (): Promise<Milestone[]> => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('payment_milestones')
        .select(`
          id,
          milestone_name,
          milestone_description,
          amount,
          due_date,
          status,
          campaigns:campaign_id (name),
          influencers:influencer_id (name)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;

      return data.map(item => ({
        ...item,
        campaign: item.campaigns ? { name: item.campaigns.name } : null,
        influencer: item.influencers ? { name: item.influencers.name } : null
      }));
    },
    enabled: !!user
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: influencers } = useQuery({
    queryKey: ['influencers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('influencers')
        .select('id, name');

      if (error) throw error;
      return data;
    }
  });

  const createMilestone = useMutation({
    mutationFn: async (milestoneData: any) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('payment_milestones')
        .insert({
          campaign_id: selectedCampaign,
          influencer_id: selectedInfluencer,
          milestone_name: milestoneData.name,
          milestone_description: milestoneData.description,
          amount: parseFloat(milestoneData.amount),
          due_date: milestoneData.dueDate || null
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      toast({
        title: "Milestone Created",
        description: "Payment milestone has been created successfully.",
      });
      setMilestoneForm({ name: '', description: '', amount: '', dueDate: '' });
      setSelectedCampaign('');
      setSelectedInfluencer('');
    }
  });

  const approveMilestone = useMutation({
    mutationFn: async (milestoneId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('payment_milestones')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', milestoneId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      toast({
        title: "Milestone Approved",
        description: "Payment milestone has been approved for payment.",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
      paid: { label: 'Paid', variant: 'success' as const, icon: DollarSign },
      overdue: { label: 'Overdue', variant: 'destructive' as const, icon: Calendar }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Milestones</CardTitle>
          <CardDescription>Manage payment milestones for campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment Milestones</CardTitle>
            <CardDescription>Manage and approve payment milestones for campaigns</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Payment Milestone</DialogTitle>
                <DialogDescription>
                  Set up a new payment milestone for a campaign.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="campaign">Campaign</Label>
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns?.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="influencer">Influencer</Label>
                  <Select value={selectedInfluencer} onValueChange={setSelectedInfluencer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select influencer" />
                    </SelectTrigger>
                    <SelectContent>
                      {influencers?.map((influencer) => (
                        <SelectItem key={influencer.id} value={influencer.id}>
                          {influencer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Milestone Name</Label>
                  <Input
                    id="name"
                    value={milestoneForm.name}
                    onChange={(e) => setMilestoneForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Content Creation Complete"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={milestoneForm.description}
                    onChange={(e) => setMilestoneForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what needs to be completed for this milestone"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={milestoneForm.amount}
                    onChange={(e) => setMilestoneForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={milestoneForm.dueDate}
                    onChange={(e) => setMilestoneForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => createMilestone.mutate(milestoneForm)}
                  disabled={!selectedCampaign || !selectedInfluencer || !milestoneForm.name || !milestoneForm.amount}
                >
                  Create Milestone
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Milestone</TableHead>
              <TableHead>Campaign/Influencer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {milestones?.map((milestone) => (
              <TableRow key={milestone.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{milestone.milestone_name}</div>
                    <div className="text-sm text-muted-foreground">{milestone.milestone_description}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{milestone.campaign?.name || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">{milestone.influencer?.name || 'N/A'}</div>
                  </div>
                </TableCell>
                <TableCell>₹{Number(milestone.amount).toLocaleString()}</TableCell>
                <TableCell>
                  {milestone.due_date ? new Date(milestone.due_date).toLocaleDateString() : 'No due date'}
                </TableCell>
                <TableCell>{getStatusBadge(milestone.status)}</TableCell>
                <TableCell>
                  {milestone.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => approveMilestone.mutate(milestone.id)}
                      disabled={approveMilestone.isPending}
                    >
                      Approve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {milestones?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No milestones found. Create your first milestone to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MilestoneManager;
