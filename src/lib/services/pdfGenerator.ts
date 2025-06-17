import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { supabase } from '@/integrations/supabase/client';

export interface ContractData {
  campaignName: string;
  brandName: string;
  influencerName: string;
  influencerHandle: string;
  contractId: string;
  fee: number;
  deadline: string;
  startDate: string;
  endDate: string;
  paymentTerms: string;
  specialInstructions?: string;
  createdDate: string;
}

export interface PDFGenerationResult {
  success: boolean;
  contractId?: string;
  storagePath?: string;
  downloadUrl?: string;
  error?: string;
}

class PDFGeneratorService {
  private generateContractContent(data: ContractData): string {
    return `# INFLUENCER MARKETING AGREEMENT

## Contract ID: ${data.contractId}
## Date: ${data.createdDate}

**PARTIES:**
Brand: ${data.brandName}
Influencer: ${data.influencerName} (${data.influencerHandle})

**CAMPAIGN DETAILS:**
Campaign Name: ${data.campaignName}
Start Date: ${data.startDate}
End Date: ${data.endDate}
Deadline: ${data.deadline}

**COMPENSATION:**
Deal Amount: $${data.fee}

**PAYMENT TERMS:**
${data.paymentTerms}

**SPECIAL INSTRUCTIONS:**
${data.specialInstructions || 'None specified'}

**TERMS AND CONDITIONS:**

1. **Scope of Work**
   The Influencer agrees to create and publish content promoting the Brand's products/services as outlined in the campaign brief.

2. **Content Requirements**
   - All content must be original and created specifically for this campaign
   - Content must comply with platform guidelines and FTC disclosure requirements
   - Brand approval required before publication

3. **Deliverables**
   The Influencer will deliver the agreed-upon content by the specified deadline.

4. **Payment**
   Payment will be processed according to the payment terms specified above.

5. **Rights and Usage**
   The Brand retains rights to use the content for promotional purposes.

6. **Compliance**
   Both parties agree to comply with all applicable laws and regulations.

**SIGNATURES:**
This agreement becomes effective upon acceptance by both parties.

Brand Representative: ___________________ Date: ___________

Influencer: ___________________ Date: ___________`;
  }

  private async createPDFFromContent(content: string): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([612, 792]); // Standard letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const lines = content.split('\n').filter(line => line.trim());
    let yPosition = 750;
    const margin = 50;
    const lineHeight = 14;
    const pageWidth = 612 - (margin * 2);

    for (const line of lines) {
      if (yPosition < 50) {
        page = pdfDoc.addPage([612, 792]);
        yPosition = 750;
      }

      let currentFont = font;
      let fontSize = 10;
      let text = line;

      // Handle different text styles
      if (line.startsWith('# ')) {
        currentFont = boldFont;
        fontSize = 16;
        text = line.substring(2);
      } else if (line.startsWith('## ')) {
        currentFont = boldFont;
        fontSize = 14;
        text = line.substring(3);
      } else if (line.startsWith('### ')) {
        currentFont = boldFont;
        fontSize = 12;
        text = line.substring(4);
      } else if (line.startsWith('**') && line.endsWith('**')) {
        currentFont = boldFont;
        text = line.substring(2, line.length - 2);
      }

      // Handle long lines by wrapping text
      const words = text.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const textWidth = currentFont.widthOfTextAtSize(testLine, fontSize);
        
        if (textWidth > pageWidth && currentLine) {
          // Draw current line and start new line
          page.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font: currentFont,
            color: rgb(0, 0, 0),
          });
          
          yPosition -= lineHeight + (fontSize > 10 ? 5 : 0);
          currentLine = word;
          
          // Check if we need a new page
          if (yPosition < 50) {
            page = pdfDoc.addPage([612, 792]);
            yPosition = 750;
          }
        } else {
          currentLine = testLine;
        }
      }
      
      // Draw the remaining text
      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font: currentFont,
          color: rgb(0, 0, 0),
        });
        
        yPosition -= lineHeight + (fontSize > 10 ? 5 : 0);
      }
    }

    return await pdfDoc.save();
  }

  async generateContract(
    campaignId: string,
    influencerId: string,
    contractData: Partial<ContractData>
  ): Promise<PDFGenerationResult> {
    console.log('Starting contract generation for:', {
      campaignId,
      influencerId,
      contractData
    });
    
    try {
      // Generate contract ID
      const contractId = `CONTRACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('Generated contract ID:', contractId);
      
      // Prepare contract data with defaults
      const fullContractData: ContractData = {
        campaignName: contractData.campaignName || 'Untitled Campaign',
        brandName: contractData.brandName || 'Brand',
        influencerName: contractData.influencerName || 'Influencer',
        influencerHandle: contractData.influencerHandle || '@influencer',
        contractId,
        fee: contractData.fee || 0,
        deadline: contractData.deadline || 'TBD',
        startDate: contractData.startDate || new Date().toISOString().split('T')[0],
        endDate: contractData.endDate || contractData.deadline || 'TBD',
        paymentTerms: contractData.paymentTerms || 'Payment due within 30 days of deliverable completion',
        specialInstructions: contractData.specialInstructions || '',
        createdDate: new Date().toLocaleDateString(),
      };
      console.log('Prepared full contract data:', fullContractData);

      // Generate contract content
      console.log('Generating contract content...');
      const contractContent = this.generateContractContent(fullContractData);
      console.log('Contract content generated successfully');
      
      // Create PDF
      console.log('Creating PDF from content...');
      const pdfBytes = await this.createPDFFromContent(contractContent);
      console.log('PDF created successfully, size:', pdfBytes.length, 'bytes');

      // Generate storage path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const storagePath = `contracts/${campaignId}/${influencerId}_${contractId}_${timestamp}.pdf`;
      console.log('Storage path:', storagePath);

      // Check if 'contracts' bucket exists
      console.log('Checking if contracts bucket exists...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
      } else {
        console.log('Available buckets:', buckets.map(b => b.name));
        const contractsBucketExists = buckets.some(b => b.name === 'contracts');
        console.log('Contracts bucket exists:', contractsBucketExists);
        
        if (!contractsBucketExists) {
          console.warn('Contracts bucket does not exist, attempting to create it...');
          try {
            const { data, error } = await supabase.storage.createBucket('contracts', {
              public: false,
              fileSizeLimit: 5242880, // 5MB
            });
            
            if (error) {
              console.error('Error creating contracts bucket:', error);
            } else {
              console.log('Contracts bucket created successfully:', data);
            }
          } catch (bucketCreateError) {
            console.error('Exception creating bucket:', bucketCreateError);
          }
        }
      }

      // Upload to Supabase storage
      console.log('Uploading PDF to Supabase storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(storagePath, pdfBytes, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
        throw new Error(`Failed to upload PDF to storage: ${uploadError.message}`);
      }

      console.log('PDF uploaded successfully:', uploadData);

      // Create signed URL for download
      console.log('Creating signed URL for download...');
      const { data: signedData, error: signedError } = await supabase.storage
        .from('contracts')
        .createSignedUrl(storagePath, 3600, { download: true });

      if (signedError) {
        console.error('Signed URL error:', signedError);
        console.error('Signed URL error details:', JSON.stringify(signedError, null, 2));
        throw new Error(`Failed to create signed URL: ${signedError.message}`);
      }

      if (!signedData) {
        console.error('No signed URL data returned');
        throw new Error('Failed to create signed URL: No data returned');
      }

      console.log('Signed URL created successfully:', signedData.signedUrl);

      return {
        success: true,
        contractId,
        storagePath,
        downloadUrl: signedData.signedUrl,
      };
    } catch (error) {
      console.error('PDF generation error:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async createContractRecord(
    userId: string,
    campaignId: string,
    influencerId: string,
    contractData: Partial<ContractData>,
    storagePath: string,
    contractId: string
  ) {
    console.log('Creating contract record with params:', {
      userId,
      campaignId,
      influencerId,
      contractData,
      storagePath,
      contractId
    });

    // Check if userId is a valid UUID, if not, use a default UUID for anonymous users
    // This handles the case when userId is "anonymous-user"
    let validUserId = userId;
    if (userId === 'anonymous-user' || !this.isValidUUID(userId)) {
      console.log('Using default UUID for anonymous user');
      // Use a fixed UUID for anonymous users
      validUserId = '00000000-0000-0000-0000-000000000000';
    }

    const contractRow = {
      brand_user_id: validUserId,
      campaign_id: campaignId,
      influencer_id: influencerId,
      template_id: 'frontend-generated',
      pdf_url: storagePath,
      status: 'DRAFT',
      contract_data: {
        fee: contractData.fee || 0,
        deadline: contractData.deadline || 'TBD',
        startDate: contractData.startDate || new Date().toISOString().split('T')[0],
        endDate: contractData.endDate || contractData.deadline || 'TBD',
        paymentTerms: contractData.paymentTerms || 'Payment due within 30 days',
        specialInstructions: contractData.specialInstructions || '',
        contractId,
        generated_at: new Date().toISOString(),
        creation_method: 'frontend-pdf-lib',
      },
    };

    console.log('Contract row to be inserted:', JSON.stringify(contractRow, null, 2));

    try {
      const { data: inserted, error: contractError } = await supabase
        .from('contracts')
        .insert(contractRow)
        .select('*')
        .single();

      if (contractError) {
        console.error('Contract insert error:', contractError);
        console.error('Error details:', JSON.stringify(contractError, null, 2));
        throw new Error(`Failed to create contract record: ${contractError.message}`);
      }

      if (!inserted) {
        console.error('No data returned after insert');
        throw new Error('Failed to create contract record: No data returned');
      }

      console.log('Contract record created successfully:', inserted);
      return inserted;
    } catch (error) {
      console.error('Exception during contract creation:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  // Helper method to validate UUID format
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

export default new PDFGeneratorService();
