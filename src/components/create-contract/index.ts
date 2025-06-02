// File: supabase/functions/create-contract/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ─── 1. authClient: check the incoming Bearer <jwt> and get user ──────────────
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization")!,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      throw new Error("Unauthorized");
    }

    // ─── 2. serviceClient: use service‐role key for all DB/storage operations ──────
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ─── 3. Parse incoming JSON body ──────────────────────────────────────────────
    const { campaignId, influencerId, templateId, fee, deadline } = await req.json();

    console.log("Creating contract with:", { campaignId, influencerId, templateId, fee, deadline });

    // ─── 4. Fetch the contract template from public.contract_templates ────────────
    const { data: template, error: templateError } = await serviceClient
      .from("contract_templates")
      .select("content_md")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      console.error("Template error:", templateError);
      throw new Error("Template not found");
    }

    // ─── 5. Fetch campaign data ───────────────────────────────────────────────────
    const { data: campaign, error: campaignError } = await serviceClient
      .from("campaigns")
      .select("name, brand, deliverables")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error("Campaign error:", campaignError);
      throw new Error("Campaign not found");
    }

    // ─── 6. Fetch influencer data ─────────────────────────────────────────────────
    const { data: influencer, error: influencerError } = await serviceClient
      .from("influencers")
      .select("name, handle")
      .eq("id", influencerId)
      .single();

    if (influencerError || !influencer) {
      console.error("Influencer error:", influencerError);
      throw new Error("Influencer not found");
    }

    // ─── 7. Replace placeholders in the Markdown template ─────────────────────────
    let contractContent = template.content_md;
    contractContent = contractContent
      .replace(/{{campaignName}}/g, campaign.name || "N/A")
      .replace(/{{brandName}}/g, campaign.brand || "N/A")
      .replace(/{{influencerName}}/g, influencer.name || "N/A")
      .replace(/{{influencerHandle}}/g, influencer.handle || "N/A")
      .replace(/{{deliverables}}/g, campaign.deliverables || "See campaign details")
      .replace(/{{fee}}/g, fee?.toString() || "0")
      .replace(/{{deadline}}/g, deadline || "TBD")
      .replace(/{{contentDueDate}}/g, deadline || "TBD");

    // ─── 8. Generate a PDF with pdf-lib ────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const lines = contractContent.split("\n").filter((line) => line.trim());
    let yPosition = 750;
    const margin = 50;
    const lineHeight = 14;

    for (const line of lines) {
      if (yPosition < 50) {
        page = pdfDoc.addPage([612, 792]);
        yPosition = 750;
      }

      let currentFont = font;
      let fontSize = 10;
      let text = line;

      if (line.startsWith("# ")) {
        currentFont = boldFont;
        fontSize = 16;
        text = line.substring(2);
      } else if (line.startsWith("## ")) {
        currentFont = boldFont;
        fontSize = 14;
        text = line.substring(3);
      } else if (line.startsWith("### ")) {
        currentFont = boldFont;
        fontSize = 12;
        text = line.substring(4);
      } else if (line.startsWith("**") && line.endsWith("**")) {
        currentFont = boldFont;
        text = line.substring(2, line.length - 2);
      }

      page.drawText(text, {
        x: margin,
        y: yPosition,
        size: fontSize,
        font: currentFont,
        color: rgb(0, 0, 0),
      });

      yPosition -= lineHeight + (fontSize > 10 ? 5 : 0);
    }

    const pdfBytes = await pdfDoc.save();

    // ─── 9. Upload PDF to the private "contracts" bucket ───────────────────────────
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const storagePath = `${campaignId}/${influencerId}_${timestamp}.pdf`;

    const { error: uploadError } = await serviceClient.storage
      .from("contracts")
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload PDF");
    }

    // ─── 10. Create a 60-second signed URL (download: true) ────────────────────────
    const { data: signedData, error: signedError } = await serviceClient.storage
      .from("contracts")
      .createSignedUrl(storagePath, 60, { download: true });

    if (signedError || !signedData) {
      console.error("Signed URL error:", signedError);
      throw new Error("Failed to create signed URL");
    }

    // ─── 11. Insert a new row into public.contracts (store raw storagePath) ───────
    const contractRow = {
      brand_user_id: user.id,
      campaign_id: campaignId,
      influencer_id: influencerId,
      template_id: templateId,
      pdf_url: storagePath,   // <-- store only the raw path
      status: "drafted",
      contract_data: {
        fee,
        deadline,
        generated_at: new Date().toISOString(),
      },
    };

    const { data: inserted, error: contractError } = await serviceClient
      .from("contracts")
      .insert(contractRow)
      .select("*")
      .single();

    if (contractError || !inserted) {
      console.error("Contract insert error:", contractError);
      throw new Error("Failed to create contract record");
    }

    console.log("Contract created successfully:", inserted.id);

    // ─── 12. Respond with success + the signed download URL ───────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        contract: inserted,
        downloadUrl: signedData.signedUrl,
        message: "Contract PDF generated successfully!",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating contract:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message || "Failed to create contract",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});