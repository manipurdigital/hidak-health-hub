import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportResult {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  duplicates: number;
  items: ImportItem[];
}

interface ImportItem {
  name?: string;
  status: 'success' | 'failed' | 'duplicate';
  error?: string;
  medicine_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}`);

    // Read and parse the file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Parsed ${jsonData.length} rows from file`);

    const result: ImportResult = {
      total: jsonData.length,
      processed: 0,
      successful: 0,
      failed: 0,
      duplicates: 0,
      items: []
    };

    // Process medicines in batches
    const batchSize = 50;
    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);
      await processBatch(batch, supabase, result);
    }

    console.log(`Import completed: ${result.successful} successful, ${result.failed} failed, ${result.duplicates} duplicates`);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Bulk import error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to process file' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function processBatch(batch: any[], supabase: any, result: ImportResult) {
  for (const row of batch) {
    try {
      // Validate required fields
      if (!row.name || !row.price) {
        result.failed++;
        result.items.push({
          name: row.name || 'Unknown',
          status: 'failed',
          error: 'Missing required fields (name, price)'
        });
        continue;
      }

      // Check for duplicates
      const { data: existing } = await supabase
        .from('medicines')
        .select('id')
        .eq('name', row.name)
        .eq('brand', row.brand || '')
        .limit(1);

      if (existing && existing.length > 0) {
        result.duplicates++;
        result.items.push({
          name: row.name,
          status: 'duplicate',
          medicine_id: existing[0].id
        });
        continue;
      }

      // Prepare medicine data
      const medicineData = {
        name: row.name,
        brand: row.brand || '',
        manufacturer: row.manufacturer || '',
        price: parseFloat(row.price) || 0,
        original_price: parseFloat(row.original_price) || parseFloat(row.price) || 0,
        description: row.description || '',
        dosage: row.dosage || '',
        pack_size: row.pack_size || '',
        requires_prescription: row.requires_prescription === 'true' || row.requires_prescription === true,
        image_url: row.image_url || null,
        stock_quantity: parseInt(row.stock_quantity) || 10,
        is_active: row.is_active !== 'false'
      };

      // Insert medicine
      const { data, error } = await supabase
        .from('medicines')
        .insert(medicineData)
        .select('id')
        .single();

      if (error) {
        console.error('Insert error:', error);
        result.failed++;
        result.items.push({
          name: row.name,
          status: 'failed',
          error: error.message
        });
      } else {
        result.successful++;
        result.items.push({
          name: row.name,
          status: 'success',
          medicine_id: data.id
        });
      }

    } catch (error) {
      console.error('Row processing error:', error);
      result.failed++;
      result.items.push({
        name: row.name || 'Unknown',
        status: 'failed',
        error: error.message
      });
    }
    
    result.processed++;
  }
}