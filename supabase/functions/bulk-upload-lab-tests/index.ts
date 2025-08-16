import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as XLSX from "https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the uploaded file
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file uploaded" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log("Parsed lab tests data:", jsonData);

    // Validate and transform data
    const labTests = jsonData.map((row: any, index: number) => {
      // Validate required fields
      if (!row.name || !row.price) {
        throw new Error(`Row ${index + 2}: Name and Price are required`);
      }

      return {
        name: String(row.name).trim(),
        description: row.description ? String(row.description).trim() : null,
        price: parseFloat(row.price),
        category: row.category ? String(row.category).trim() : null,
        sample_type: row.sample_type ? String(row.sample_type).trim() : null,
        reporting_time: row.reporting_time ? String(row.reporting_time).trim() : null,
        preparation_required: row.preparation_required === 'Yes' || row.preparation_required === 'TRUE' || row.preparation_required === true,
        is_active: true
      };
    });

    console.log("Processed lab tests:", labTests);

    // Insert lab tests in batches
    const batchSize = 100;
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < labTests.length; i += batchSize) {
      const batch = labTests.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabaseClient
          .from('lab_tests')
          .insert(batch)
          .select();

        if (error) {
          console.error("Batch insert error:", error);
          errorCount += batch.length;
          results.push({
            batch: Math.floor(i / batchSize) + 1,
            success: false,
            error: error.message,
            count: batch.length
          });
        } else {
          successCount += batch.length;
          results.push({
            batch: Math.floor(i / batchSize) + 1,
            success: true,
            count: batch.length,
            data: data
          });
        }
      } catch (batchError) {
        console.error("Batch processing error:", batchError);
        errorCount += batch.length;
        results.push({
          batch: Math.floor(i / batchSize) + 1,
          success: false,
          error: batchError.message,
          count: batch.length
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Bulk upload completed. ${successCount} lab tests added successfully, ${errorCount} failed.`,
        totalProcessed: labTests.length,
        successCount,
        errorCount,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in bulk-upload-lab-tests function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to process bulk upload"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});