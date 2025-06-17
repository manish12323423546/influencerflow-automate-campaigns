import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, Send, Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Contract, ContractData } from '@/lib/agents/types';
import html2pdf from 'html2pdf.js';

interface Campaign {
  id: string;
  name: string;
  brand: string;
  deliverables: string;
}

interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: string;
  avatar_url: string;
}

interface ContractWithDetails extends Contract {
  campaigns?: Campaign;
  influencers?: Influencer;
}

interface ContractManagerProps {
  campaignId?: string;
  influencerId?: string;
}

export const ContractManager: React.FC<ContractManagerProps> = ({ campaignId, influencerId }) => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractWithDetails | null>(null);
  const [fee, setFee] = useState('');
  const [deadline, setDeadline] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [campaignRequirements, setCampaignRequirements] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [brandRepresentative, setBrandRepresentative] = useState('');

  useEffect(() => {
    fetchContracts();
  }, [user, campaignId, influencerId]);

  const fetchContracts = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('contracts')
        .select(`
        *,
        campaigns!inner(id, name, brand, deliverables),
        influencers!inner(id, name, handle, platform, avatar_url)
      `)
        .eq('brand_user_id', user.id)
        .order('created_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      if (influencerId) {
        query = query.eq('influencer_id', influencerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformedContracts = data?.map(contract => {
        let contractData: ContractData;
        try {
          if (typeof contract.contract_data === 'string') {
            contractData = JSON.parse(contract.contract_data);
          } else if (
            contract.contract_data &&
            typeof contract.contract_data === 'object' &&
            !Array.isArray(contract.contract_data)
          ) {
            contractData = contract.contract_data as unknown as ContractData;
          } else {
            contractData = {
              fee: 0,
              deadline: '',
              generated_at: new Date().toISOString()
            };
          }
        } catch {
          contractData = {
            fee: 0,
            deadline: '',
            generated_at: new Date().toISOString()
          };
        }

        return {
          ...contract,
          contract_data: contractData,
          status: contract.status as Contract['status'],
          campaigns: Array.isArray(contract.campaigns) ? contract.campaigns[0] : contract.campaigns,
          influencers: Array.isArray(contract.influencers) ? contract.influencers[0] : contract.influencers
        };
      }) || [];

      setContracts(transformedContracts as ContractWithDetails[]);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to fetch contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form fields when closing the dialog
    setFee('');
    setDeadline('');
    setCampaignTitle('');
    setCampaignGoal('');
    setDeliverables('');
    setCampaignRequirements('');
    setSpecialInstructions('');
    setPaymentMethod('');
    setPaymentTerms('');
    setBrandRepresentative('');
  };

  const handleEditOpen = (contract: ContractWithDetails) => {
    setSelectedContract(contract);
    setFee(contract.contract_data.fee?.toString() || '');
    setDeadline(contract.contract_data.deadline || '');
    setCampaignTitle(contract.contract_data.campaign_title || contract.campaigns?.name || '');
    setCampaignGoal(contract.contract_data.campaign_goal || '');
    setDeliverables(contract.contract_data.deliverables || contract.campaigns?.deliverables || '');
    setCampaignRequirements(contract.contract_data.campaign_requirements || '');
    setSpecialInstructions(contract.contract_data.special_instructions || '');
    setPaymentMethod(contract.contract_data.payment_method || '');
    setPaymentTerms(contract.contract_data.payment_terms || '');
    setBrandRepresentative(contract.contract_data.brand_representative || '');
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setSelectedContract(null);
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFee(e.target.value);
  };

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeadline(e.target.value);
  };

  const handleCampaignTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCampaignTitle(e.target.value);
  };

  const handleCampaignGoalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCampaignGoal(e.target.value);
  };

  const handleDeliverablesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDeliverables(e.target.value);
  };

  const handleCampaignRequirementsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCampaignRequirements(e.target.value);
  };

  const handleSpecialInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSpecialInstructions(e.target.value);
  };

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(e.target.value);
  };

  const handlePaymentTermsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPaymentTerms(e.target.value);
  };

  const handleBrandRepresentativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrandRepresentative(e.target.value);
  };

  const handleSubmit = async () => {
    if (!selectedContract) return;

    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          contract_data: {
            fee: parseFloat(fee),
            deadline: deadline,
            campaign_title: campaignTitle,
            campaign_goal: campaignGoal,
            deliverables: deliverables,
            campaign_requirements: campaignRequirements,
            special_instructions: specialInstructions,
            payment_method: paymentMethod,
            payment_terms: paymentTerms,
            brand_representative: brandRepresentative,
            generated_at: new Date().toISOString()
          }
        })
        .eq('id', selectedContract.id);

      if (error) throw error;

      toast.success('Contract updated successfully');
      fetchContracts();
    } catch (error) {
      console.error('Error updating contract:', error);
      toast.error('Failed to update contract');
    } finally {
      handleEditClose();
    }
  };

  const handleDelete = async (contractId: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId);

      if (error) throw error;

      toast.success('Contract deleted successfully');
      fetchContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error('Failed to delete contract');
    }
  };

  const downloadContract = async (contract: ContractWithDetails) => {
    if (contract.pdf_url) {
      try {
        // Get a signed URL for the PDF that allows downloading
        const { data, error } = await supabase.storage
          .from('contracts')
          .createSignedUrl(contract.pdf_url, 60, { download: true });
        
        if (error) throw error;
        
        if (data && data.signedUrl) {
          window.open(data.signedUrl, '_blank');
        } else {
          throw new Error('Failed to generate download URL');
        }
      } catch (error) {
        console.error('Error downloading contract:', error);
        toast.error(`Failed to download contract: ${(error as Error).message}`);
      }
    } else {
      toast.error('PDF not available for this contract');
    }
  };

  const handleCreateContract = async () => {
    if (!fee || !deadline || !campaignTitle || !campaignGoal || !deliverables || !campaignRequirements || !specialInstructions || !paymentMethod || !paymentTerms || !brandRepresentative) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    if (!campaignId || !influencerId) {
      toast.error('Campaign and Influencer must be selected.');
      return;
    }

    try {
      // 1. Fetch the HTML template content
      const response = await fetch('/contract_template.html');
      if (!response.ok) {
        throw new Error(`Failed to fetch contract template: ${response.statusText}`);
      }
      let htmlContent = await response.text();

      // 2. Populate the HTML template with data
      const contractData = {
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        influencer_name: contracts[0]?.influencers?.name || 'N/A', // Assuming first contract's influencer for now, will refine
        brand_name: contracts[0]?.campaigns?.brand || 'N/A', // Assuming first contract's campaign for now, will refine
        campaign_title: campaignTitle,
        campaign_goal: campaignGoal,
        deliverables: deliverables,
        campaign_requirements: campaignRequirements,
        special_instructions: specialInstructions,
        deal_amount: fee,
        payment_method: paymentMethod,
        payment_terms: paymentTerms,
        brand_representative: brandRepresentative,
      };

      // Replace placeholders in HTML content
      for (const key in contractData) {
        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), contractData[key as keyof typeof contractData]);
      }

      // Create a temporary element to render HTML for html2pdf
      const tempElement = document.createElement('div');
      tempElement.innerHTML = htmlContent;
      tempElement.style.width = '794px'; // A4 width in pixels at 96 DPI (approx)
      tempElement.style.padding = '40px'; // Match body padding from CSS
      document.body.appendChild(tempElement); // Append to body to ensure styles are applied

      // 3. Generate PDF using html2pdf.js
      const pdfBlob = await html2pdf().from(tempElement).outputPdf('blob');

      // Remove the temporary element
      document.body.removeChild(tempElement);

      // 4. Upload PDF to Supabase Storage
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const storagePath = `${campaignId}/${influencerId}_${timestamp}.pdf`;
      
      // Convert the PDF blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64Data = reader.result.split(',')[1];
            resolve(base64Data);
          } else {
            reject(new Error('Failed to convert PDF to base64'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(pdfBlob);
      });
      
      const base64Data = await base64Promise;
      
      // Call the Edge Function to upload the PDF
      console.log(`Calling upload-contract-pdf Edge Function with file: ${influencerId}_${timestamp}.pdf`);
      console.log(`Campaign ID: ${campaignId}`);
      console.log(`Base64 data length: ${base64Data.length} characters`);
      
      // Ensure we have a valid access token
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        throw new Error("No valid authentication token available. Please log in again.");
      }
      
      const uploadResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-contract-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({
          fileName: `${influencerId}_${timestamp}.pdf`,
          fileContent: base64Data,
          campaignId: campaignId
        })
      });
      
      // Handle response from Edge Function
      let uploadResult;
      try {
        const responseText = await uploadResponse.text();
        console.log("Raw response from Edge Function:", responseText);
        
        try {
          uploadResult = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse response as JSON:", parseError);
          throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
        }
        
        if (!uploadResponse.ok) {
          console.error("Upload error details:", uploadResult);
          throw new Error(`Failed to upload PDF: ${uploadResult.error || uploadResponse.statusText}`);
        }
        
        console.log("Upload successful:", uploadResult);
      } catch (responseError) {
        console.error("Error processing response:", responseError);
        throw new Error(`Error processing upload response: ${(responseError as Error).message}`);
      }
      
      // Use the path returned from the Edge Function
      const pdfUrl = uploadResult.path;

      // 5. Insert a new row into public.contracts
      const { data: inserted, error: contractError } = await supabase
        .from('contracts')
        .insert({
          brand_user_id: user.id,
          campaign_id: campaignId,
          influencer_id: influencerId,
          pdf_url: pdfUrl,
          contract_data: {
            ...contractData, // Store all collected data
            fee: parseFloat(fee), // Ensure fee is stored as number
            deadline: deadline,
            generated_at: new Date().toISOString()
          },
          status: 'draft',
        })
        .select('*')
        .single();

      if (contractError) throw contractError;

      // Show success toast with download option
      toast.success('Contract created successfully', {
        action: {
          label: 'Download',
          onClick: () => {
            if (uploadResult.downloadUrl) {
              window.open(uploadResult.downloadUrl, '_blank');
            }
          },
        },
      });
      
      setOpen(false);
      fetchContracts();
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error(`Failed to create contract: ${(error as Error).message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contracts</h2>
          <p className="text-muted-foreground">Manage your contracts with influencers</p>
        </div>
        <Button onClick={handleOpen} className="bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300">
          <Plus className="w-4 h-4 mr-2" />
          Create Contract
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contracts.map((contract) => (
          <Card key={contract.id}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Contract #{contract.id.substring(0, 8)}</span>
              </CardTitle>
              <CardDescription>
                {contract.campaigns?.name} - {contract.campaigns?.brand}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Influencer:</span>
                <span className="text-sm">{contract.influencers?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fee:</span>
                <span className="text-sm font-bold">${contract.contract_data.fee}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="outline" className="bg-coral/10 text-coral border-coral/20">{contract.status}</Badge>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => downloadContract(contract)} className="border-coral text-coral hover:bg-coral hover:text-white transition-all duration-300">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="border-coral text-coral hover:bg-coral hover:text-white transition-all duration-300">
                  <Send className="w-4 h-4 mr-1" />
                  Send
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleEditOpen(contract)} className="text-gray-600 hover:text-coral hover:bg-coral/10 transition-all duration-300">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(contract.id)} className="bg-red-500 hover:bg-red-600 text-white transition-all duration-300">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Add Contract</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Contract</DialogTitle>
            <DialogDescription>
              Create a new contract for an influencer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fee" className="text-right">
                Fee
              </Label>
              <Input id="fee" value={fee} onChange={handleFeeChange} className="col-span-3" type="number" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deadline" className="text-right">
                Deadline
              </Label>
              <Input id="deadline" value={deadline} onChange={handleDeadlineChange} className="col-span-3" type="date" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="campaignTitle" className="text-right">
                Campaign Title
              </Label>
              <Input id="campaignTitle" value={campaignTitle} onChange={handleCampaignTitleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="campaignGoal" className="text-right">
                Campaign Goal
              </Label>
              <Textarea id="campaignGoal" value={campaignGoal} onChange={handleCampaignGoalChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deliverables" className="text-right">
                Deliverables
              </Label>
              <Textarea id="deliverables" value={deliverables} onChange={handleDeliverablesChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="campaignRequirements" className="text-right">
                Content Requirements
              </Label>
              <Textarea id="campaignRequirements" value={campaignRequirements} onChange={handleCampaignRequirementsChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="specialInstructions" className="text-right">
                Special Instructions
              </Label>
              <Textarea id="specialInstructions" value={specialInstructions} onChange={handleSpecialInstructionsChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentMethod" className="text-right">
                Payment Method
              </Label>
              <Input id="paymentMethod" value={paymentMethod} onChange={handlePaymentMethodChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentTerms" className="text-right">
                Payment Terms
              </Label>
              <Textarea id="paymentTerms" value={paymentTerms} onChange={handlePaymentTermsChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="brandRepresentative" className="text-right">
                Brand Representative
              </Label>
              <Input id="brandRepresentative" value={brandRepresentative} onChange={handleBrandRepresentativeChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateContract}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Make changes to the contract details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fee" className="text-right">
                Fee
              </Label>
              <Input id="fee" value={fee} onChange={handleFeeChange} className="col-span-3" type="number" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deadline" className="text-right">
                Deadline
              </Label>
              <Input id="deadline" value={deadline} onChange={handleDeadlineChange} className="col-span-3" type="date" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="campaignTitle" className="text-right">
                Campaign Title
              </Label>
              <Input id="campaignTitle" value={campaignTitle} onChange={handleCampaignTitleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="campaignGoal" className="text-right">
                Campaign Goal
              </Label>
              <Textarea id="campaignGoal" value={campaignGoal} onChange={handleCampaignGoalChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deliverables" className="text-right">
                Deliverables
              </Label>
              <Textarea id="deliverables" value={deliverables} onChange={handleDeliverablesChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="campaignRequirements" className="text-right">
                Content Requirements
              </Label>
              <Textarea id="campaignRequirements" value={campaignRequirements} onChange={handleCampaignRequirementsChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="specialInstructions" className="text-right">
                Special Instructions
              </Label>
              <Textarea id="specialInstructions" value={specialInstructions} onChange={handleSpecialInstructionsChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentMethod" className="text-right">
                Payment Method
              </Label>
              <Input id="paymentMethod" value={paymentMethod} onChange={handlePaymentMethodChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentTerms" className="text-right">
                Payment Terms
              </Label>
              <Textarea id="paymentTerms" value={paymentTerms} onChange={handlePaymentTermsChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="brandRepresentative" className="text-right">
                Brand Representative
              </Label>
              <Input id="brandRepresentative" value={brandRepresentative} onChange={handleBrandRepresentativeChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSubmit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
