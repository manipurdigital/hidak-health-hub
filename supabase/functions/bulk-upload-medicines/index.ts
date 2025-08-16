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
    
    console.log("Parsed medicines data:", jsonData);

    // Validate and transform data
    const medicines = jsonData.map((row: any, index: number) => {
      // Validate required fields
      if (!row.name || !row.price) {
        throw new Error(`Row ${index + 2}: Name and Price are required`);
      }

      return {
        name: String(row.name).trim(),
        brand: row.brand ? String(row.brand).trim() : null,
        price: parseFloat(row.price),
        original_price: row.original_price ? parseFloat(row.original_price) : null,
        stock_quantity: row.stock_quantity ? parseInt(row.stock_quantity) : 0,
        requires_prescription: row.requires_prescription === 'Yes' || row.requires_prescription === 'TRUE' || row.requires_prescription === true,
        description: row.description ? String(row.description).trim() : null,
        manufacturer: row.manufacturer ? String(row.manufacturer).trim() : null,
        dosage: row.dosage ? String(row.dosage).trim() : null,
        pack_size: row.pack_size ? String(row.pack_size).trim() : null,
        is_active: true
      };
    });

    console.log("Processed medicines:", medicines);

    // Insert medicines in batches
    const batchSize = 100;
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < medicines.length; i += batchSize) {
      const batch = medicines.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabaseClient
          .from('medicines')
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
        message: `Bulk upload completed. ${successCount} medicines added successfully, ${errorCount} failed.`,
        totalProcessed: medicines.length,
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
    console.error("Error in bulk-upload-medicines function:", error);
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