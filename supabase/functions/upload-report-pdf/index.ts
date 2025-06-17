// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Import shared utilities
// @ts-ignore
import { uploadFileToStorage, validateFileSize } from "../utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ─── 1. Parse the request body ──────────────────────────────────────────────
    const { fileName, fileContent, reportRequestId } = await req.json();

    if (!fileName || !fileContent) {
      throw new Error("Missing fileName or fileContent in request body.");
    }

    // ─── 2. Decode base64 file content ───────────────────────────────────────────
    const base64Str = fileContent.replace(/^data:application\/pdf;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Str), (c, i) => c.charCodeAt(0));
    
    // ─── 3. Validate file size ──────────────────────────────────────────────────
    const sizeValidation = validateFileSize(binaryData.length, MAX_FILE_SIZE);
    if (!sizeValidation.valid) {
      throw new Error(sizeValidation.error);
    }

    // ─── 4. Initialize Supabase client with service role key ─────────────────────
    // @ts-ignore
    const serviceClient = createClient(
      // @ts-ignore
      Deno.env.get("SUPABASE_URL")!,
      // @ts-ignore
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ─── 5. Determine the storage path ─────────────────────────────────────────
    // If reportRequestId is provided, use it in the folder structure
    const storagePath = reportRequestId 
      ? `${reportRequestId}/${fileName}` 
      : `reports/${fileName}`;

    // ─── 6. Upload the file using the shared utility ─────────────────────────────
    console.log(`Attempting to upload report PDF to path: ${storagePath}`);
    console.log(`File size: ${binaryData.length} bytes`);
    
    try {
      const uploadResult = await uploadFileToStorage(
        serviceClient,
        "reports",
        storagePath,
        binaryData,
        "application/pdf",
        true
      );
      
      console.log("Upload successful:", uploadResult);
      
      // ─── 7. Update the report_requests table with the PDF URL if reportRequestId is provided ─────
      if (reportRequestId && !reportRequestId.startsWith('anonymous-')) {
        const { error: updateError } = await serviceClient
          .from('report_requests')
          .update({ 
            pdf_url: storagePath,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', reportRequestId);
        
        if (updateError) {
          console.error("Error updating report request:", updateError);
          throw new Error(`Failed to update report request: ${updateError.message}`);
        }
      }
      
      // ─── 8. Return success response with URLs ─────────────────────────────────────
      return new Response(
        JSON.stringify({
          success: true,
          message: "Report PDF uploaded successfully!",
          path: uploadResult.path,
          publicUrl: uploadResult.publicUrl,
          downloadUrl: uploadResult.signedUrl,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (uploadException) {
      console.error("Exception during upload:", uploadException);
      throw new Error(`Upload exception: ${(uploadException as Error).message}`);
    }
  } catch (error) {
    console.error("Error in upload-report-pdf function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message || "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});