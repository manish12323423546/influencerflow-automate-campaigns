import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Loader2, Plus, Eye, ChevronDown, Trash2, RefreshCw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CampaignInfluencerSelector } from './CampaignInfluencerSelector';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import pdfGenerator from '@/lib/services/pdfGenerator';

interface Contract {
  id: string;
  campaign_id: string;
  influencer_id: string;
  contract_data: {
    fee: number;
    deadline: string;
    template_id: string;
    generated_at: string;
    contractId?: string;
    startDate?: string;
    endDate?: string;
    paymentTerms?: string;
    specialInstructions?: string;
  };
  status: string;
  created_at: string;
  pdf_url?: string;
  campaigns?: {
    name: string;
    brand: string;
  };
  influencers?: {
    name: string;
    handle: string;
    platform: string;
  };
}

interface StoredContract {
  pdfBase64: string;
  fileName: string;
  contract: Contract;
  timestamp: string;
  campaignName?: string;
  influencerName?: string;
}

interface Campaign {
  id: string;
  name: string;
  brand: string;
  description: string | null;
  status: string;
  budget: number;
  goals: string | null;
  deliverables: string | null;
  timeline: string | null;
}

interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: string;
  avatar_url: string;
  followers_count: number;
  engagement_rate: number;
  fee?: number;
  status?: string;
}

const ContractsList = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [contracts, setContracts] = useState<StoredContract[]>([]);
  const [supabaseContracts, setSupabaseContracts] = useState<Contract[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | StoredContract | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Refresh state
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Form state
  const [fee, setFee] = useState('');
  const [deadline, setDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Template ID no longer needed - using frontend PDF generation

  // Campaign and Influencer selection
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);

  // Load contracts from localStorage and Supabase
  useEffect(() => {
    const loadContracts = () => {
      const storedContracts: StoredContract[] = [];

      // Iterate through localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('contract_')) {
          try {
            const contractData = JSON.parse(localStorage.getItem(key) || '');
            storedContracts.push(contractData);
          } catch (error) {
            console.error('Error parsing contract:', error);
          }
        }
      }

      // Sort by timestamp, newest first
      storedContracts.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setContracts(storedContracts);
    };

    loadContracts();

    // Add event listener for storage changes
    window.addEventListener('storage', loadContracts);
    return () => window.removeEventListener('storage', loadContracts);
  }, []);

  // Load contracts from Supabase
  useEffect(() => {
    const fetchSupabaseContracts = async () => {
      try {
        let query = supabase
          .from('contracts')
          .select(`
            *,
            campaigns (name, brand),
            influencers (name, handle, platform)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setSupabaseContracts(data || []);
      } catch (error) {
        console.error('Error fetching Supabase contracts:', error);
      }
    };

    fetchSupabaseContracts();
  }, [user]);

  // Auto-refresh contracts every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        let query = supabase
          .from('contracts')
          .select(`
            *,
            campaigns (name, brand),
            influencers (name, handle, platform)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        const { data, error } = await query;
        if (!error && data) {
          setSupabaseContracts(data);
        }
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleDownload = (contract: StoredContract) => {
    try {
      // Create text content from base64
      const content = decodeURIComponent(escape(atob(contract.pdfBase64)));
      
      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = contract.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Your contract is being downloaded.",
      });
    } catch (error) {
      console.error('Error downloading contract:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the contract",
        variant: "destructive",
      });
    }
  };

  const handleView = (contract: StoredContract) => {
    try {
      // Create text content from base64
      const content = decodeURIComponent(escape(atob(contract.pdfBase64)));
      
      // Create blob and open in new tab
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error viewing contract:', error);
      toast({
        title: "Error",
        description: "Failed to open the contract",
        variant: "destructive",
      });
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    // Reset form
    setFee('');
    setDeadline('');
    setStartDate('');
    setEndDate('');
    setPaymentTerms('');
    setSpecialInstructions('');
    setSelectedCampaign(null);
    setSelectedInfluencer(null);
  };

  const handleCreateContract = async () => {
    console.log('Starting contract creation process...');
    
    if (!selectedCampaign || !selectedInfluencer || !fee || !deadline) {
      console.log('Validation failed:', { 
        hasCampaign: !!selectedCampaign, 
        hasInfluencer: !!selectedInfluencer, 
        hasFee: !!fee, 
        hasDeadline: !!deadline 
      });
      
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields and select a campaign and influencer.',
        variant: 'destructive',
      });
      return;
    }

    // Allow contract creation even without user authentication for now
    const userId = user?.id || 'anonymous-user';
    console.log('Using user ID:', userId);
    console.log('Selected campaign:', selectedCampaign);
    console.log('Selected influencer:', selectedInfluencer);

    setLoading(true);
    try {
      // Prepare contract data for PDF generation
      const contractData = {
        campaignName: selectedCampaign.name,
        brandName: selectedCampaign.brand,
        influencerName: selectedInfluencer.name,
        influencerHandle: selectedInfluencer.handle,
        fee: parseFloat(fee),
        deadline,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || deadline,
        paymentTerms: paymentTerms || 'Payment due within 30 days of deliverable completion',
        specialInstructions,
      };
      
      console.log('Prepared contract data:', contractData);

      // Generate PDF using the new service
      console.log('Calling pdfGenerator.generateContract...');
      const pdfResult = await pdfGenerator.generateContract(
        selectedCampaign.id,
        selectedInfluencer.id,
        contractData
      );
      
      console.log('PDF generation result:', pdfResult);

      if (!pdfResult.success) {
        console.error('PDF generation failed:', pdfResult.error);
        throw new Error(pdfResult.error || 'Failed to generate PDF');
      }

      // Create contract record in database
      console.log('Calling pdfGenerator.createContractRecord...');
      try {
        const contractRecord = await pdfGenerator.createContractRecord(
          userId,
          selectedCampaign.id,
          selectedInfluencer.id,
          contractData,
          pdfResult.storagePath!,
          pdfResult.contractId!
        );
        
        console.log('Contract record created:', contractRecord);
      } catch (contractRecordError) {
        console.error('Contract record creation failed:', contractRecordError);
        throw contractRecordError;
      }

      toast({
        title: 'Contract Created Successfully',
        description: 'Your contract has been generated and saved using the new PDF generator.',
      });

      // Refresh contracts list
      console.log('Refreshing contracts list...');
      let query = supabase
        .from('contracts')
        .select(`
          *,
          campaigns (name, brand),
          influencers (name, handle, platform)
        `)
        .order('created_at', { ascending: false });

      // For now, show all contracts in anonymous mode for testing
      if (user) {
        query = query.limit(50); // Show more contracts for testing
      } else {
        query = query.limit(50); // Show recent contracts for anonymous users
      }

      const { data: updatedContracts, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching updated contracts:', fetchError);
      } else {
        console.log('Updated contracts fetched successfully:', updatedContracts?.length || 0, 'contracts');
        setSupabaseContracts(updatedContracts || []);
      }

      handleClose();
    } catch (error) {
      console.error('Error creating contract:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      
      toast({
        title: 'Contract Creation Failed',
        description: error instanceof Error ? error.message : 'Failed to create contract',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewSupabaseContract = async (contract: Contract) => {
    if (!contract.pdf_url) {
      toast({
        title: 'PDF Not Available',
        description: 'No PDF file is associated with this contract.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create signed URL for viewing
      const { data, error } = await supabase.storage
        .from('contracts')
        .createSignedUrl(contract.pdf_url, 3600); // 1 hour expiration

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        throw new Error('Failed to generate signed URL');
      }
    } catch (error) {
      console.error('Error viewing contract:', error);
      toast({
        title: 'Error',
        description: 'Failed to open the contract PDF.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadSupabaseContract = async (contract: Contract) => {
    if (!contract.pdf_url) {
      toast({
        title: 'PDF Not Available',
        description: 'No PDF file is associated with this contract.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create signed URL for download
      const { data, error } = await supabase.storage
        .from('contracts')
        .createSignedUrl(contract.pdf_url, 3600, { download: true });

      if (error) throw error;

      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = `contract_${contract.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: 'Download Started',
          description: 'Your contract is being downloaded.',
        });
      } else {
        throw new Error('Failed to generate signed URL');
      }
    } catch (error) {
      console.error('Error downloading contract:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download the contract PDF.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (contract: Contract, newStatus: string) => {
    try {
      // Store the old status before updating
      const oldStatus = contract.status;
      
      // Update contract status
      const { error } = await supabase
        .from('contracts')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', contract.id);

      if (error) throw error;

      // Update contract_status in payments table
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update({
          contract_status: newStatus
        })
        .eq('contract_id', contract.id);

      if (paymentUpdateError) {
        console.error('Error updating contract_status in payments:', paymentUpdateError);
      }

      // If contract is being accepted, create a payment record
      if (newStatus === 'ACCEPTED') {
        await createPaymentFromContract(contract);
      }

      // If contract status is changed from ACCEPTED to something else, handle payment cleanup
      if (oldStatus === 'ACCEPTED' && newStatus !== 'ACCEPTED') {
        await handlePaymentCleanup(contract);
      }

      // Update local state
      setSupabaseContracts(prev =>
        prev.map(c =>
          c.id === contract.id
            ? { ...c, status: newStatus, updated_at: new Date().toISOString() }
            : c
        )
      );

      // Trigger payment refresh event
      window.dispatchEvent(new CustomEvent('paymentsRefresh'));

      toast({
        title: 'Status Updated',
        description: `Contract status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating contract status:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update contract status.',
        variant: 'destructive',
      });
    }
  };

  const updateContractPaymentFields = async (contract: Contract) => {
    try {
      console.log('Updating payment fields for contract:', contract.id);
      
      // Get fee from contract data
      let fee = 0;
      try {
        if (typeof contract.contract_data === 'string') {
          const parsedData = JSON.parse(contract.contract_data);
          fee = parsedData.fee || 0;
        } else if (contract.contract_data && typeof contract.contract_data === 'object') {
          fee = contract.contract_data.fee || 0;
        }
      } catch (e) {
        console.error('Error parsing contract data:', e);
      }
      
      // Update contract with payment fields
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          payment_status: 'pending',
          payment_amount: fee,
          payment_currency: 'INR',
          payment_type: 'full'
        })
        .eq('id', contract.id);

      if (updateError) {
        console.error('Error updating contract payment fields:', updateError);
        throw updateError;
      }

      console.log('Payment fields updated successfully for contract');

      // Trigger payment refresh event
      window.dispatchEvent(new CustomEvent('paymentsRefresh'));

      // Show success message
      toast({
        title: 'Payment Record Created',
        description: `Payment record created for ₹${fee.toLocaleString() || 0}`,
      });
    } catch (error) {
      console.error('Error updating contract payment fields:', error);
      // Don't throw error here to avoid breaking the contract status update
      toast({
        title: 'Payment Creation Warning',
        description: 'Contract accepted but payment record creation failed.',
        variant: 'destructive',
      });
    }
  };
  
  const resetContractPaymentFields = async (contract: Contract) => {
    try {
      console.log('Resetting payment fields for contract:', contract.id);
      
      // Reset payment fields in contract
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          payment_status: null,
          payment_amount: null,
          razorpay_payment_id: null,
          razorpay_order_id: null,
          invoice_url: null,
          paid_at: null
        })
        .eq('id', contract.id);

      if (updateError) {
        console.error('Error resetting contract payment fields:', updateError);
        throw updateError;
      }

      console.log('Payment fields reset successfully for contract');

      // Trigger payment refresh event
      window.dispatchEvent(new CustomEvent('paymentsRefresh'));

      // Show success message
      toast({
        title: 'Payment Record Removed',
        description: 'Payment record has been removed from this contract.',
      });
    } catch (error) {
      console.error('Error resetting contract payment fields:', error);
      toast({
        title: 'Payment Cleanup Warning',
        description: 'Contract status updated but payment cleanup failed.',
        variant: 'destructive',
      });
    }
  };
  
  const createPaymentFromContract = async (contract: Contract) => {
    try {
      console.log('Creating payment for contract:', contract.id);
      
      // First, get the contract with brand_user_id from the database
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('brand_user_id, contract_data')
        .eq('id', contract.id)
        .single();

      if (contractError) {
        console.error('Error fetching contract brand_user_id:', contractError);
        throw contractError;
      }

      const brandUserId = contractData.brand_user_id;
      console.log('Brand user ID:', brandUserId);
      
      // Parse contract data to get fee
      let fee = 0;
      try {
        if (typeof contractData.contract_data === 'string') {
          const parsedData = JSON.parse(contractData.contract_data);
          fee = parsedData.fee || 0;
        } else if (contractData.contract_data && typeof contractData.contract_data === 'object') {
          fee = contractData.contract_data.fee || 0;
        }
      } catch (e) {
        console.error('Error parsing contract data:', e);
      }

      // Check if payment already exists for this contract
      const { data: existingPayment, error: checkError } = await supabase
        .from('payments')
        .select('id, status')
        .eq('contract_id', contract.id);

      if (checkError) {
        throw checkError;
      }

      // If payment already exists and is pending, don't create another one
      if (existingPayment && existingPayment.length > 0) {
        const pendingPayment = existingPayment.find(p => p.status === 'pending');
        if (pendingPayment) {
          console.log('Pending payment already exists for this contract');
          
          // Update contract_status in the payment
          const { error: updateError } = await supabase
            .from('payments')
            .update({
              contract_status: 'ACCEPTED'
            })
            .eq('id', pendingPayment.id);
            
          if (updateError) {
            console.error('Error updating contract_status in payment:', updateError);
          }
          
          return;
        }
      }

      // Create payment record from contract with contract_id field
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          campaign_id: contract.campaign_id,
          influencer_id: contract.influencer_id,
          brand_user_id: brandUserId,
          contract_id: contract.id,
          contract_status: 'ACCEPTED', // Set contract_status to ACCEPTED
          amount: fee,
          currency: 'INR',
          payment_type: 'full',
          milestone_description: `Payment for accepted contract - ${contract.campaigns?.name || 'Campaign'}`,
          status: 'pending'
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        throw paymentError;
      }

      console.log('Payment record created successfully for accepted contract');

      // Trigger payment refresh event
      window.dispatchEvent(new CustomEvent('paymentsRefresh'));

      // Show success message
      toast({
        title: 'Payment Record Created',
        description: `Payment record created for ₹${fee.toLocaleString() || 0}`,
      });
    } catch (error) {
      console.error('Error creating payment from contract:', error);
      // Don't throw error here to avoid breaking the contract status update
      toast({
        title: 'Payment Creation Warning',
        description: 'Contract accepted but payment record creation failed. You can create it manually.',
        variant: 'destructive',
      });
    }
  };

  // Handle payment cleanup when contract status changes from ACCEPTED
  const handlePaymentCleanup = async (contract: Contract) => {
    try {
      console.log('Cleaning up payments for contract:', contract.id);
      
      // First, try to find payments by contract_id (most accurate way to link payments to contracts)
      const { data: existingPayments, error: checkError } = await supabase
        .from('payments')
        .select('id, status')
        .eq('contract_id', contract.id)
        .eq('status', 'pending'); // Only update pending payments

      if (checkError) {
        console.error('Error checking existing payments by contract_id:', checkError);
        return;
      }

      console.log('Found payments to update:', existingPayments?.length || 0);

      // If no payments found by contract_id, try to find by campaign_id and influencer_id
      if (!existingPayments || existingPayments.length === 0) {
        const { data: fallbackPayments, error: fallbackError } = await supabase
          .from('payments')
          .select('id, status')
          .eq('campaign_id', contract.campaign_id)
          .eq('influencer_id', contract.influencer_id)
          .eq('status', 'pending');
          
        if (fallbackError) {
          console.error('Error in fallback payment check:', fallbackError);
        } else if (fallbackPayments && fallbackPayments.length > 0) {
          console.log('Found payments to update using fallback method:', fallbackPayments.length);
          
          // Update contract_status in payments by campaign_id and influencer_id
          const fallbackUpdateResult = await supabase
            .from('payments')
            .update({
              contract_status: 'DRAFT' // Update to match the new contract status
            })
            .eq('campaign_id', contract.campaign_id)
            .eq('influencer_id', contract.influencer_id)
            .eq('status', 'pending');
            
          if (fallbackUpdateResult.error) {
            console.error('Error updating payments using fallback method:', fallbackUpdateResult.error);
          } else {
            console.log('Pending payments updated successfully using fallback method');
            // Trigger payment refresh event
            window.dispatchEvent(new CustomEvent('paymentsRefresh'));
            toast({
              title: 'Payment Status Updated',
              description: 'Payment records have been updated to reflect contract status.',
            });
            return; // Exit early since we've handled the update
          }
        }
      }

      // Update contract_status in payments by contract_id
      if (existingPayments && existingPayments.length > 0) {
        const updateResult = await supabase
          .from('payments')
          .update({
            contract_status: 'DRAFT' // Update to match the new contract status
          })
          .eq('contract_id', contract.id)
          .eq('status', 'pending');

        if (updateResult.error) {
          console.error('Error updating payments:', updateResult.error);
          toast({
            title: 'Payment Update Warning',
            description: 'Contract status updated but payment record update failed.',
            variant: 'destructive',
          });
        } else {
          console.log('Pending payments updated successfully');
          // Trigger payment refresh event
          window.dispatchEvent(new CustomEvent('paymentsRefresh'));
          toast({
            title: 'Payment Status Updated',
            description: 'Payment records have been updated to reflect contract status.',
          });
        }
      } else {
        console.log('No pending payments found for this contract');
        // Still trigger the refresh event to ensure UI is updated
        window.dispatchEvent(new CustomEvent('paymentsRefresh'));
      }
    } catch (error) {
      console.error('Error in payment update:', error);
    }
  };

  // Delete functions
  const handleDeleteClick = (contract: Contract | StoredContract) => {
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setContractToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!contractToDelete) return;

    setDeleteLoading(true);
    try {
      // Check if it's a Supabase contract or local contract
      if ('id' in contractToDelete && typeof contractToDelete.id === 'string' && !('contract' in contractToDelete)) {
        // It's a Supabase contract
        await handleDeleteSupabaseContract(contractToDelete as Contract);
      } else {
        // It's a local contract
        await handleDeleteLocalContract(contractToDelete as StoredContract);
      }
    } finally {
      setDeleteLoading(false);
      handleDeleteCancel();
    }
  };

  const handleDeleteSupabaseContract = async (contract: Contract) => {
    try {
      // Delete the PDF file from storage if it exists
      if (contract.pdf_url) {
        const { error: storageError } = await supabase.storage
          .from('contracts')
          .remove([contract.pdf_url]);

        if (storageError) {
          console.warn('Warning: Failed to delete PDF file from storage:', storageError);
          // Continue with contract deletion even if file deletion fails
        }
      }

      // Delete the contract record from database
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contract.id);

      if (error) throw error;

      // Update local state
      setSupabaseContracts(prev => prev.filter(c => c.id !== contract.id));

      toast({
        title: 'Contract Deleted',
        description: 'The contract has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the contract. Please try again.',
        variant: 'destructive',
      });
      throw error; // Re-throw to handle in calling function
    }
  };

  const handleDeleteLocalContract = async (contract: StoredContract) => {
    try {
      // Remove from localStorage
      const contractKey = `contract_${contract.contract.id}`;
      localStorage.removeItem(contractKey);

      // Update local state
      setContracts(prev => prev.filter(c => c.contract.id !== contract.contract.id));

      // Trigger storage event for other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: contractKey,
        oldValue: JSON.stringify(contract),
        newValue: null,
        storageArea: localStorage
      }));

      toast({
        title: 'Contract Deleted',
        description: 'The local contract has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting local contract:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the local contract. Please try again.',
        variant: 'destructive',
      });
      throw error; // Re-throw to handle in calling function
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshLoading(true);
    try {
      // Refresh Supabase contracts
      let query = supabase
        .from('contracts')
        .select(`
          *,
          campaigns (name, brand),
          influencers (name, handle, platform)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setSupabaseContracts(data || []);

      // Refresh local contracts
      const keys = Object.keys(localStorage);
      const contractKeys = keys.filter(key => key.startsWith('contract_'));
      const localContracts: StoredContract[] = [];

      contractKeys.forEach(key => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const contract = JSON.parse(stored);
            localContracts.push(contract);
          }
        } catch (error) {
          console.error('Error parsing stored contract:', error);
        }
      });

      setContracts(localContracts);

      toast({
        title: 'Contracts Refreshed',
        description: 'Contract list has been updated successfully.',
      });
    } catch (error) {
      console.error('Error refreshing contracts:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh contracts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRefreshLoading(false);
    }
  };



  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-gray-900 flex items-center">
            <FileText className="mr-2 h-5 w-5 text-coral" />
            Contracts ({contracts.length + supabaseContracts.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              size="sm"
              variant="outline"
              disabled={refreshLoading}
              className="text-gray-600 hover:text-coral hover:border-coral"
            >
              <RefreshCw className={`w-4 h-4 ${refreshLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpen} size="sm" className="bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Plus className="w-4 h-4 mr-1" />
                  Create Contract
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Contract with PDF Generator</DialogTitle>
                  <DialogDescription>
                    Select a campaign and influencer, then provide contract details to generate a professional PDF contract using our built-in PDF generator.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">


                {/* Campaign and Influencer Selection */}
                <CampaignInfluencerSelector
                  selectedCampaignId={selectedCampaign?.id}
                  selectedInfluencerId={selectedInfluencer?.id}
                  onCampaignChange={setSelectedCampaign}
                  onInfluencerChange={setSelectedInfluencer}
                />

                {/* Contract Details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Contract Details</h4>

                  <div className="space-y-2">
                    <Label htmlFor="fee" className="text-gray-700 font-medium">Deal Amount (₹) *</Label>
                    <Input
                      id="fee"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      type="number"
                      placeholder="Enter deal amount"
                      className="border-gray-300 focus:border-coral focus:ring-coral"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-gray-700 font-medium">Start Date</Label>
                      <Input
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        type="date"
                        className="border-gray-300 focus:border-coral focus:ring-coral"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline" className="text-gray-700 font-medium">Deadline *</Label>
                      <Input
                        id="deadline"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        type="date"
                        className="border-gray-300 focus:border-coral focus:ring-coral"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-gray-700 font-medium">End Date</Label>
                    <Input
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      type="date"
                      className="border-gray-300 focus:border-coral focus:ring-coral"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms" className="text-gray-700 font-medium">Payment Terms</Label>
                    <Input
                      id="paymentTerms"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="e.g., Payment due within 30 days"
                      className="border-gray-300 focus:border-coral focus:ring-coral"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialInstructions" className="text-gray-700 font-medium">Special Instructions</Label>
                    <Textarea
                      id="specialInstructions"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Any special instructions or notes for the contract"
                      rows={3}
                      className="border-gray-300 focus:border-coral focus:ring-coral"
                    />
                  </div>
                </div>

              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateContract}
                  disabled={loading || !selectedCampaign || !selectedInfluencer || !fee || !deadline}
                  className="bg-coral hover:bg-coral/90 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Contract (PDF Generator)'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="text-gray-600">Contract</TableHead>
              <TableHead className="text-gray-600">Campaign</TableHead>
              <TableHead className="text-gray-600">Influencer</TableHead>
              <TableHead className="text-gray-600">Created</TableHead>
              <TableHead className="text-gray-600">Status</TableHead>
              <TableHead className="text-gray-600 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 && supabaseContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No contracts found. Create your first contract to get started.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {/* Supabase Contracts */}
                {supabaseContracts.map((contract) => (
                  <TableRow key={`supabase-${contract.id}`} className="border-gray-200 hover:bg-gray-50">
                    <TableCell className="text-gray-900 font-medium">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-coral" />
                        <span>Contract #{contract.id.substring(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      <div>
                        <div className="font-medium">{contract.campaigns?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{contract.campaigns?.brand || 'N/A'}</div>
                        <div className="text-xs text-coral font-medium">₹{contract.contract_data?.fee?.toLocaleString() || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      <div>
                        <div className="font-medium">{contract.influencers?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">@{contract.influencers?.handle || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(contract.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-auto p-0">
                            <Badge variant="outline" className="bg-coral/10 text-coral border-coral/20 cursor-pointer hover:bg-coral/20">
                              {contract.status}
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </Badge>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'COMPLETED'].map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => handleStatusChange(contract, status)}
                              className={contract.status === status ? 'bg-coral/10 text-coral' : ''}
                            >
                              {status}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewSupabaseContract(contract)}
                        className="text-gray-600 hover:text-coral hover:bg-coral/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadSupabaseContract(contract)}
                        className="text-gray-600 hover:text-coral hover:bg-coral/10"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(contract)}
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Local Contracts */}
                {contracts.map((contract) => (
                  <TableRow key={`local-${contract.contract.id}`} className="border-gray-200 hover:bg-gray-50">
                    <TableCell className="text-gray-900 font-medium">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span>{contract.fileName}</span>
                        <Badge variant="outline" className="text-xs">Local</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {contract.campaignName || 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {contract.influencerName || 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(contract.timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                        {contract.contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(contract)}
                        className="text-gray-600 hover:text-coral hover:bg-coral/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(contract)}
                        className="text-gray-600 hover:text-coral hover:bg-coral/10"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(contract)}
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Contract</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contract? This action cannot be undone.
              {contractToDelete && 'pdf_url' in contractToDelete && contractToDelete.pdf_url && (
                <span className="block mt-2 text-sm text-amber-600">
                  Note: The associated PDF file will also be permanently deleted.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            {contractToDelete && (
              <div className="text-sm text-gray-600">
                <div className="font-medium">Contract Details:</div>
                {'contract' in contractToDelete ? (
                  // Local contract
                  <div>
                    <div>File: {contractToDelete.fileName}</div>
                    <div>Campaign: {contractToDelete.campaignName || 'N/A'}</div>
                    <div>Influencer: {contractToDelete.influencerName || 'N/A'}</div>
                  </div>
                ) : (
                  // Supabase contract
                  <div>
                    <div>ID: #{contractToDelete.id.substring(0, 8)}</div>
                    <div>Campaign: {contractToDelete.campaigns?.name || 'N/A'}</div>
                    <div>Influencer: {contractToDelete.influencers?.name || 'N/A'}</div>
                    <div>Status: {contractToDelete.status}</div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Contract
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ContractsList; 