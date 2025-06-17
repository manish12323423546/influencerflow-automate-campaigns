// This file uses Deno/Supabase Edge Functions imports and the Deno global, which are only available in the Edge runtime.
// TypeScript errors are suppressed locally for compatibility.
// @ts-ignore: Deno Edge Function import, only available in Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno Edge Function import, only available in Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore: Deno Edge Function import, only available in Deno runtime
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
// @ts-ignore: Deno Edge Function import, only available in Deno runtime
import { DOMParser } from "https://esm.sh/linkedom@0.14.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ─── 1. Parse incoming JSON body ─────────────────────────────────────────────────────────────────────────────
    const requestBody = await req.json();
    let reportRequest;
    
    // ─── 2. Initialize Supabase client with service role key ─────────────────────────────────────────────────────
    // @ts-ignore: Deno global only available in Edge runtime
    const serviceClient = createClient(
      // @ts-ignore: Deno global only available in Edge runtime
      Deno.env.get("SUPABASE_URL")!,
      // @ts-ignore: Deno global only available in Edge runtime
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if this is an anonymous request or a regular request
    if (requestBody.isAnonymous) {
      console.log("Generating anonymous report");
      
      // For anonymous users, use the data directly from the request
      reportRequest = {
        range_start: requestBody.reportData.range_start,
        range_end: requestBody.reportData.range_end,
        filters_json: requestBody.reportData.filters_json || {},
        // Use a placeholder ID for anonymous users
        id: "anonymous-" + new Date().getTime(),
        // Add other required fields with default values
        brand_user_id: "anonymous",
        status: "processing",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log("Anonymous report request:", reportRequest);
    } else {
      // For authenticated users, fetch from the database
      const { reportRequestId } = requestBody;
      console.log("Generating report for request:", reportRequestId);
      
      // ─── 3. Fetch the report request data ─────────────────────────────────────────────────────────────────────
      const { data: dbReportRequest, error: reportRequestError } = await serviceClient
        .from("report_requests")
        .select("*")
        .eq("id", reportRequestId)
        .single();

    if (reportRequestError || !dbReportRequest) {
      console.error("Report request error:", reportRequestError);
      throw new Error("Report request not found");
    }
    
    reportRequest = dbReportRequest;
    console.log("Fetched report request:", reportRequest);
    }

    // ─── 4. Parse the filters JSON to get campaign ID ─────────────────────────────────────────────────────────
    const filters = reportRequest.filters_json || {};
    // Handle new single campaign format and legacy format
    let campaignId = filters.campaign_id;
    let campaignName = filters.campaign_name || 'Campaign';
    
    // Backward compatibility for multiple campaigns
    if (!campaignId) {
      const campaignIds = filters.campaign_ids || filters.campaignIds || filters.campaigns || [];
      if (campaignIds.length > 0) {
        campaignId = campaignIds[0]; // Take the first campaign for backward compatibility
      }
    }
    
    if (!campaignId) {
      throw new Error("No campaign ID specified in the report request");
    }
    
    const startDate = reportRequest.range_start;
    const endDate = reportRequest.range_end;
    
    // ─── 5. Fetch campaign data ─────────────────────────────────────────────────────────────────────────────────
    const { data: campaign, error: campaignError } = await serviceClient
      .from("campaigns")
      .select("id, name, brand, status, budget, spent")
      .eq("id", campaignId)
      .single();

    if (campaignError) {
      console.error("Campaign error:", campaignError);
      throw new Error("Failed to fetch campaign data");
    }

    if (!campaign) {
      throw new Error("Campaign not found with the specified ID");
    }
    console.log("Fetched campaign:", campaign);

    // Update campaign name if not provided in filters
    if (!campaignName || campaignName === 'Campaign') {
      campaignName = campaign.name;
    }

    // ─── 6. Fetch influencers associated with this campaign ─────────────────────────────────────────────────────
    const { data: campaignInfluencers, error: influencersError } = await serviceClient
      .from("campaign_influencers")
      .select(`
        influencer_id,
        influencers (
          id,
          handle,
          name,
          followers_count,
          engagement_rate,
          industry,
          platform
        )
      `)
      .eq("campaign_id", campaignId);

    if (influencersError) {
      console.error("Influencers error:", influencersError);
      throw new Error("Failed to fetch campaign influencers");
    }
    console.log("Fetched campaign influencers:", campaignInfluencers);

    // ─── 7. Fetch outreach data for this campaign ─────────────────────────────────────────────────────────────
    const { data: outreach, error: outreachError } = await serviceClient
      .from("outreach")
      .select("id, campaign_id, influencer_id, outreach_method, status, created_at")
      .eq("campaign_id", campaignId)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (outreachError) {
      console.error("Outreach error:", outreachError);
      throw new Error("Failed to fetch outreach data");
    }
    console.log("Fetched outreach:", outreach);

    // ─── 8. Fetch contract data for this campaign ─────────────────────────────────────────────────────────────
    const { data: contracts, error: contractsError } = await serviceClient
      .from("contracts")
      .select(`
        id, 
        campaign_id, 
        influencer_id, 
        status, 
        contract_data,
        payment_status,
        payment_amount,
        payment_currency,
        created_at,
        updated_at,
        paid_at
      `)
      .eq("campaign_id", campaignId)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (contractsError) {
      console.error("Contracts error:", contractsError);
      throw new Error("Failed to fetch contract data");
    }
    console.log("Fetched contracts:", contracts);

    // ─── 9. Fetch payment data for this campaign ─────────────────────────────────────────────────────────────
    const { data: payments, error: paymentsError } = await serviceClient
      .from("payments")
      .select(`
        id, 
        campaign_id,
        influencer_id,
        contract_id, 
        amount, 
        currency,
        status,
        payment_type,
        milestone_description,
        created_at,
        paid_at
      `)
      .eq("campaign_id", campaignId)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (paymentsError) {
      console.error("Payments error:", paymentsError);
      throw new Error("Failed to fetch payment data");
    }
    console.log("Fetched payments:", payments);

    // ─── 10. Fetch actual performance metrics ─────────────────────────────────────────────────────────────────
    const { data: metrics, error: metricsError } = await serviceClient
      .from("campaign_metrics")
      .select("campaign_id, impressions, clicks, conversions, spend, date")
      .eq("campaign_id", campaignId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (metricsError) {
      console.error("Metrics error:", metricsError);
      // Don't throw here, we'll use placeholders if metrics are missing
    }
    console.log("Fetched metrics:", metrics);

    // ─── 11. Calculate report metrics ─────────────────────────────────────────────────────────────────────────
    // Campaign metrics
    const totalBudget = campaign?.budget || 0;
    const totalSpent = campaign?.spent || 0;
    
    // Influencer metrics
    const totalInfluencers = campaignInfluencers?.length || 0;
    const totalFollowers = campaignInfluencers?.reduce((sum, ci) => {
      return sum + (ci.influencers?.followers_count || 0);
    }, 0) || 0;
    const avgEngagementRate = campaignInfluencers?.length > 0 
      ? campaignInfluencers.reduce((sum, ci) => sum + (ci.influencers?.engagement_rate || 0), 0) / campaignInfluencers.length
      : 0;
    
    // Outreach metrics
    const totalInfluencersContacted = outreach?.length || 0;
    const emailOutreachCount = outreach?.filter(o => o.outreach_method === 'EMAIL').length || 0;
    const callOutreachCount = outreach?.filter(o => o.outreach_method === 'CALL').length || 0;
    const responseCount = outreach?.filter(o => o.status === 'RESPONDED').length || 0;
    const responseRate = totalInfluencersContacted > 0 ? Math.round((responseCount / totalInfluencersContacted) * 100) : 0;
    
    // Contract metrics
    const contractsCreated = contracts?.length || 0;
    const contractsSigned = contracts?.filter(c => c.status === 'signed').length || 0;
    const contractsPending = contracts?.filter(c => c.status === 'drafted').length || 0;
    const contractsCompleted = contracts?.filter(c => c.status === 'completed').length || 0;
    
    // Calculate total contract value from contract_data.fee and payment_amount
    const totalContractValue = contracts?.reduce((sum, contract) => {
      // Try to get fee from contract_data first, then fallback to payment_amount
      const fee = contract.contract_data?.fee || contract.payment_amount || 0;
      return sum + parseFloat(fee.toString());
    }, 0) || 0;
    
    // Payment metrics
    const paymentsCompleted = payments?.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const paymentsPending = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const totalPaymentAmount = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    
    // Performance metrics from actual data or placeholders
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalMetricSpend = 0;
    
    // Add actual metrics where available
    if (metrics && metrics.length > 0) {
      totalImpressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
      totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
      totalConversions = metrics.reduce((sum, m) => sum + (m.conversions || 0), 0);
      totalMetricSpend = metrics.reduce((sum, m) => sum + (m.spend || 0), 0);
    }
    
    // Calculate derived metrics
    const conversionRate = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 100) : 0;
    const costPerClick = totalClicks > 0 ? (totalSpent / totalClicks) : 0;
    const costPerConversion = totalConversions > 0 ? (totalSpent / totalConversions) : 0;
    const roi = totalSpent > 0 ? Math.round((totalImpressions / totalSpent) * 100) / 100 : 0;

    // ─── 12. Generate influencer rows HTML ─────────────────────────────────────────────────────────────────────
    let influencerRowsHtml = '';
    campaignInfluencers?.forEach(ci => {
      const influencer = ci.influencers;
      if (influencer) {
        const contract = contracts?.find(c => c.influencer_id === influencer.id);
        const payment = payments?.find(p => p.influencer_id === influencer.id);
        const outreachStatus = outreach?.find(o => o.influencer_id === influencer.id)?.status || 'Not Contacted';
        
        influencerRowsHtml += `
          <tr>
            <td>${influencer.name || influencer.handle}</td>
            <td>${influencer.followers_count?.toLocaleString() || 'N/A'}</td>
            <td>${influencer.engagement_rate || 0}%</td>
            <td>${contract?.status || 'No Contract'}</td>
            <td>Rs.${payment?.amount || 0}</td>
            <td>${outreachStatus}</td>
          </tr>
        `;
      }
    });

    // ─── 13. Generate contract rows HTML ─────────────────────────────────────────────────────────────────────
    let contractRowsHtml = '';
    contracts?.forEach(contract => {
      const influencer = campaignInfluencers?.find(ci => ci.influencer_id === contract.influencer_id)?.influencers;
      const payment = payments?.find(p => p.contract_id === contract.id);
      
      contractRowsHtml += `
        <tr>
          <td>${influencer?.name || influencer?.handle || 'Unknown'}</td>
          <td>${contract.status}</td>
          <td>Rs.${contract.payment_amount || contract.contract_data?.fee || 0}</td>
          <td>${payment?.status || 'No Payment'}</td>
          <td>${contract.created_at ? new Date(contract.created_at).toLocaleDateString() : 'N/A'}</td>
        </tr>
      `;
    });

    // ─── 14. Prepare report data ─────────────────────────────────────────────────────────────────────────────
    const reportData = {
      generated_date: new Date().toLocaleDateString(),
      report_start_date: new Date(startDate).toLocaleDateString(),
      report_end_date: new Date(endDate).toLocaleDateString(),
      campaign_name: campaignName,
      brand_name: campaign?.brand || 'N/A',
      campaign_status: campaign?.status || 'N/A',
      campaign_budget: totalBudget.toFixed(2),
      campaign_spent: totalSpent.toFixed(2),
      campaign_roi: roi,
      
      // Influencer metrics
      total_influencers: totalInfluencers,
      total_followers: totalFollowers.toLocaleString(),
      avg_engagement_rate: avgEngagementRate.toFixed(1),
      influencer_rows: influencerRowsHtml,
      
      // Outreach metrics
      total_influencers_contacted: totalInfluencersContacted,
      email_outreach_count: emailOutreachCount,
      call_outreach_count: callOutreachCount,
      response_rate: responseRate,
      
      // Contract metrics
      contracts_created: contractsCreated,
      contracts_signed: contractsSigned,
      contracts_pending: contractsPending,
      contracts_completed: contractsCompleted,
      total_contract_value: totalContractValue.toFixed(2),
      contract_rows: contractRowsHtml,
      
      // Payment metrics
      payments_completed: paymentsCompleted.toFixed(2),
      payments_pending: paymentsPending.toFixed(2),
      total_payment_amount: totalPaymentAmount.toFixed(2),
      
      // Performance metrics
      total_impressions: totalImpressions.toLocaleString(),
      total_clicks: totalClicks.toLocaleString(),
      total_conversions: totalConversions.toLocaleString(),
      conversion_rate: conversionRate,
      cost_per_click: costPerClick.toFixed(2),
      cost_per_conversion: costPerConversion.toFixed(2),
      
      // Additional data
      current_year: new Date().getFullYear()
    };
    console.log("Report data prepared:", reportData);

    // ─── 15. Use embedded HTML template ─────────────────────────────────────────────────────────────────────
    let reportTemplateHtml = `<!DOCTYPE html><html><head><title>{{campaign_name}} Report</title><style>body{font-family:Arial,sans-serif;margin:40px;}.header{text-align:center;border-bottom:2px solid #6d0f64;padding-bottom:20px;margin-bottom:40px;}.header h1{color:#6d0f64;margin:0;}.section{margin-bottom:30px;}.section-title{font-size:18px;font-weight:bold;color:#6d0f64;margin-bottom:10px;border-bottom:1px solid #e0e0e0;padding-bottom:5px;}.info-table{width:100%;border-collapse:collapse;margin-top:10px;}.info-table td,.info-table th{padding:8px 10px;border:1px solid #e0e0e0;}.info-table th{background-color:#f8f2f7;font-weight:bold;}.highlight{background-color:#f8f2f7;}</style></head><body><div class="header"><h1>{{campaign_name}} - Performance Report</h1><div>Generated on: {{generated_date}}</div></div><div class="section"><div class="section-title">Report Overview</div><table class="info-table"><tr class="highlight"><td><strong>Report Period</strong></td><td>{{report_start_date}} to {{report_end_date}}</td></tr><tr><td><strong>Campaign Name</strong></td><td>{{campaign_name}}</td></tr><tr class="highlight"><td><strong>Brand Name</strong></td><td>{{brand_name}}</td></tr><tr><td><strong>Campaign Status</strong></td><td>{{campaign_status}}</td></tr><tr class="highlight"><td><strong>Campaign Budget</strong></td><td>Rs.{{campaign_budget}}</td></tr><tr><td><strong>Campaign Spent</strong></td><td>Rs.{{campaign_spent}}</td></tr><tr class="highlight"><td><strong>Campaign ROI</strong></td><td>{{campaign_roi}}x</td></tr></table></div><div class="section"><div class="section-title">Influencer Overview</div><table class="info-table"><tr><td><strong>Total Influencers</strong></td><td>{{total_influencers}}</td></tr><tr class="highlight"><td><strong>Total Followers Reach</strong></td><td>{{total_followers}}</td></tr><tr><td><strong>Average Engagement Rate</strong></td><td>{{avg_engagement_rate}}%</td></tr></table></div><div class="section"><div class="section-title">Influencer Details</div><table class="info-table"><thead><tr><th>Influencer Name</th><th>Followers</th><th>Engagement Rate</th><th>Contract Status</th><th>Payment Amount</th><th>Outreach Status</th></tr></thead><tbody>{{influencer_rows}}</tbody></table></div><div class="section"><div class="section-title">Contract Status</div><table class="info-table"><tr><td><strong>Contracts Created</strong></td><td>{{contracts_created}}</td></tr><tr class="highlight"><td><strong>Contracts Signed</strong></td><td>{{contracts_signed}}</td></tr><tr><td><strong>Contracts Pending</strong></td><td>{{contracts_pending}}</td></tr><tr class="highlight"><td><strong>Contracts Completed</strong></td><td>{{contracts_completed}}</td></tr></table></div><div class="section"><div class="section-title">Payment Summary</div><table class="info-table"><tr><td><strong>Total Contract Value</strong></td><td>Rs.{{total_contract_value}}</td></tr><tr class="highlight"><td><strong>Payments Completed</strong></td><td>Rs.{{payments_completed}}</td></tr><tr><td><strong>Payments Pending</strong></td><td>Rs.{{payments_pending}}</td></tr></table></div><div class="section"><div class="section-title">Performance Metrics</div><table class="info-table"><tr><td><strong>Total Impressions</strong></td><td>{{total_impressions}}</td></tr><tr><td><strong>Total Clicks</strong></td><td>{{total_clicks}}</td></tr><tr><td><strong>Total Conversions</strong></td><td>{{total_conversions}}</td></tr><tr><td><strong>Conversion Rate</strong></td><td>{{conversion_rate}}%</td></tr><tr><td><strong>Cost Per Click</strong></td><td>Rs.{{cost_per_click}}</td></tr><tr><td><strong>Cost Per Conversion</strong></td><td>Rs.{{cost_per_conversion}}</td></tr></table></div><div style="margin-top:60px;font-size:12px;color:#999;text-align:center;"><p>© {{current_year}} InfluencerFlow - All rights reserved</p></div></body></html>`;
    
    // ─── 16. Replace placeholders in the HTML template ─────────────────────────────────────────────────────────
    Object.entries(reportData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      reportTemplateHtml = reportTemplateHtml.replace(regex, String(value));
    });

    // ─── 17. Generate PDF from HTML ─────────────────────────────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    const dom = new DOMParser().parseFromString(reportTemplateHtml, 'text/html');
    const sections = dom.querySelectorAll('.section');
    
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage([612, 792]);
    let yPosition = 750;
    const margin = 50;
    
    // Draw the header
    const title = dom.querySelector('.header h1')?.textContent || 'Campaign Performance Report';
    page.drawText(title, {
      x: 306 - boldFont.widthOfTextAtSize(title, 18) / 2,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0.43, 0.06, 0.39),
    });
    
    yPosition -= 30;
    
    const generatedDate = `Generated on: ${reportData.generated_date}`;
    page.drawText(generatedDate, {
      x: 306 - regularFont.widthOfTextAtSize(generatedDate, 10) / 2,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: rgb(0.47, 0.47, 0.47),
    });
    
    yPosition -= 40;
    
    // Process each section
    for (const section of sections) {
      if (yPosition < 100) {
        page = pdfDoc.addPage([612, 792]);
        yPosition = 750;
      }
      
      const sectionTitle = section.querySelector('.section-title')?.textContent || '';
      page.drawText(sectionTitle, {
        x: margin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0.43, 0.06, 0.39),
      });
      
      yPosition -= 20;
      
      page.drawLine({
        start: { x: margin, y: yPosition + 5 },
        end: { x: 612 - margin, y: yPosition + 5 },
        thickness: 1,
        color: rgb(0.88, 0.88, 0.88),
      });
      
      yPosition -= 15;
      
      const table = section.querySelector('.info-table');
      if (table) {
        const rows = table.querySelectorAll('tr');
        let rowY = yPosition;
        
        for (const row of rows) {
          if (rowY < 100) {
            page = pdfDoc.addPage([612, 792]);
            rowY = 750;
          }
          
          const cells = row.querySelectorAll('td, th');
          let cellX = margin;
          const cellWidth = (612 - margin * 2) / cells.length;
          
          for (const cell of cells) {
            const text = cell.textContent?.trim() || '';
            const isHeader = cell.tagName === 'TH';
            const isStrong = cell.querySelector('strong') !== null;
            
            page.drawText(text, {
              x: cellX + 5,
              y: rowY,
              size: 10,
              font: isHeader || isStrong ? boldFont : regularFont,
              color: rgb(0, 0, 0),
            });
            
            cellX += cellWidth;
          }
          
          rowY -= 20;
        }
        
        yPosition = rowY - 10;
      }
      
      yPosition -= 20;
    }
    
    // Add footer
    const footerText = `© ${reportData.current_year} InfluencerFlow - All rights reserved`;
    page.drawText(footerText, {
      x: 306 - regularFont.widthOfTextAtSize(footerText, 8) / 2,
      y: 50,
      size: 8,
      font: regularFont,
      color: rgb(0.6, 0.6, 0.6),
    });
    
    const pdfBytes = await pdfDoc.save();
    console.log("PDF generated successfully, size:", pdfBytes.byteLength, "bytes");

    // ─── 18. Upload PDF to the reports bucket ─────────────────────────────────────────────────────────────────
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const cleanCampaignName = campaignName.replace(/[^a-zA-Z0-9-_]/g, '-');
    let storagePath = `${cleanCampaignName}_${timestamp}.pdf`;
    console.log("Attempting to upload PDF to path:", storagePath);
    
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('reports')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }
    console.log('PDF uploaded successfully:', uploadData);
    
    // ─── 19. Update or insert report request status ─────────────────────────────────────────────────────────────────────
    if (!requestBody.isAnonymous) {
      // For authenticated users, update existing record
      const { data: updateData, error: updateError } = await serviceClient
        .from('report_requests')
        .update({
          status: 'completed',
          pdf_url: storagePath,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestBody.reportRequestId)
        .select();
      
      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(`Failed to update report request: ${updateError.message}`);
      }
      
      console.log('Successfully updated report request for authenticated user:', updateData);
    } else {
      // For anonymous users, insert a new record so it appears in the dashboard
      const { data: insertData, error: insertError } = await serviceClient
        .from('report_requests')
        .insert({
          id: reportRequest.id,
          brand_user_id: "00000000-0000-0000-0000-000000000000", // Anonymous user ID
          range_start: reportRequest.range_start,
          range_end: reportRequest.range_end,
          filters_json: {
            campaign_id: campaignId,
            campaign_name: campaignName
          },
          status: 'completed',
          pdf_url: storagePath,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (insertError) {
        console.error('Insert error for anonymous user:', insertError);
        throw new Error(`Failed to insert report request: ${insertError.message}`);
      }
      
      console.log('Successfully inserted report request for anonymous user:', insertData);
    }
    
    console.log("Attempting to create signed URL for:", storagePath);
    // ─── 20. Create signed URL for download ─────────────────────────────────────────────────────────────────
    const { data: signedData, error: signedError } = await serviceClient.storage
      .from('reports')
      .createSignedUrl(storagePath, 3600);
    
    if (signedError) {
      console.error('Signed URL error:', signedError);
      throw new Error(`Failed to create download URL: ${signedError.message}`);
    }
    console.log('Signed URL created:', signedData.signedUrl);
    
    // ─── 21. Return success response ─────────────────────────────────────────────────────────────────────────
    return new Response(JSON.stringify({
      success: true,
      message: 'Report generated successfully',
      downloadUrl: signedData.signedUrl,
      fileName: `${cleanCampaignName}_${timestamp}.pdf`,
      reportData: {
        campaignName: campaignName,
        dateRange: `${reportData.report_start_date} - ${reportData.report_end_date}`,
        totalInfluencers: totalInfluencers,
        totalBudget: totalBudget,
        totalSpent: totalSpent
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to generate report',
      details: error.stack || 'No additional details available'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
