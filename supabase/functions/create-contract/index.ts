// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore - Deno imports
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

// Declare Deno namespace
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ─── 1. Parse incoming JSON body ──────────────────────────────────────────────
    const { campaignId, influencerId, templateId, fee, deadline } = await req.json();

    console.log("Creating contract with:", { campaignId, influencerId, templateId, fee, deadline });

    // ─── 2. Create Supabase client ────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ─── 3. Fetch the contract template ────────────────────────────────────────────
    const { data: template, error: templateError } = await supabase
      .from("contract_templates")
      .select("content_md, name")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      console.error("Template error:", templateError);
      throw new Error("Template not found");
    }

    console.log("Found template:", template.name);

    // ─── 4. Fetch campaign data ───────────────────────────────────────────────────
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("name, brand, deliverables")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error("Campaign error:", campaignError);
      throw new Error("Campaign not found");
    }

    console.log("Found campaign:", campaign.name);

    // ─── 5. Fetch influencer data ─────────────────────────────────────────────────
    const { data: influencer, error: influencerError } = await supabase
      .from("influencers")
      .select("name, handle, platform")
      .eq("id", influencerId)
      .single();

    if (influencerError || !influencer) {
      console.error("Influencer error:", influencerError);
      throw new Error("Influencer not found");
    }

    console.log("Found influencer:", influencer.name);

    // ─── 6. Replace placeholders in the template ─────────────────────────────────
    let contractContent = template.content_md;
    const replacements = {
      "{{brandName}}": campaign.brand || "N/A",
      "{{influencerName}}": influencer.name || "N/A",
      "{{influencerHandle}}": influencer.handle || "N/A",
      "{{campaignName}}": campaign.name || "N/A",
      "{{deliverables}}": campaign.deliverables || "See campaign details",
      "{{fee}}": fee?.toString() || "0",
      "{{deadline}}": deadline || "TBD",
      "{{platform}}": influencer.platform || "N/A",
      "{{contentType}}": campaign.deliverables?.split(',')[0] || "Content",
      "{{contentDueDate}}": deadline || "TBD",
      "{{current_date}}": new Date().toLocaleDateString()
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      contractContent = contractContent.replace(new RegExp(placeholder, 'g'), value);
    }

    console.log("Replaced placeholders in template");

    // ─── 7. Generate PDF ────────────────────────────────────────────────────────
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
    console.log("Generated PDF document");

    // ─── 8. Create contract record ────────────────────────────────────────────────
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        campaign_id: campaignId,
        influencer_id: influencerId,
        contract_data: {
          fee,
          deadline,
          template_id: templateId,
          generated_at: new Date().toISOString(),
        },
        status: "DRAFT",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (contractError) {
      console.error("Contract creation error:", contractError);
      throw new Error("Failed to create contract record");
    }

    // ─── 9. Return PDF and contract data ──────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        contract,
        pdfBase64: btoa(String.fromCharCode(...pdfBytes)),
        fileName: `contract_${campaign.name}_${influencer.name}.pdf`.replace(/[^a-z0-9_.]/gi, '_'),
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
        error: error instanceof Error ? error.message : "Failed to create contract",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}); 