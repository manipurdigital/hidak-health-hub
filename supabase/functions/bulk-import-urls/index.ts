import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  url?: string;
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

    const { urls } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No URLs provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing ${urls.length} URLs`);

    const result: ImportResult = {
      total: urls.length,
      processed: 0,
      successful: 0,
      failed: 0,
      duplicates: 0,
      items: []
    };

    // Process URLs sequentially to avoid overwhelming the target sites
    for (const url of urls) {
      try {
        console.log(`Processing URL: ${url}`);

        // Parse the URL using our parse-medicine-url function
        const parseResponse = await supabase.functions.invoke('parse-medicine-url', {
          body: { url, downloadImages: true }
        });

        if (parseResponse.error) {
          result.failed++;
          result.items.push({
            url,
            status: 'failed',
            error: `Parse error: ${parseResponse.error.message}`
          });
          continue;
        }

        const { medicine } = parseResponse.data;

        if (!medicine || !medicine.name) {
          result.failed++;
          result.items.push({
            url,
            status: 'failed',
            error: 'Could not extract medicine data from URL'
          });
          continue;
        }

        // Check for duplicates
        const { data: existing } = await supabase
          .from('medicines')
          .select('id')
          .eq('name', medicine.name)
          .eq('brand', medicine.brand || '')
          .limit(1);

        if (existing && existing.length > 0) {
          result.duplicates++;
          result.items.push({
            url,
            name: medicine.name,
            status: 'duplicate',
            medicine_id: existing[0].id
          });
          continue;
        }

        // Insert medicine
        const { data, error } = await supabase
          .from('medicines')
          .insert({
            name: medicine.name,
            brand: medicine.brand,
            manufacturer: medicine.manufacturer,
            price: medicine.price,
            original_price: medicine.original_price,
            description: medicine.description,
            dosage: medicine.dosage,
            pack_size: medicine.pack_size,
            requires_prescription: medicine.requires_prescription,
            image_url: medicine.image_url,
            source_url: medicine.source_url,
            stock_quantity: 10, // Default stock
            is_active: true
          })
          .select('id')
          .single();

        if (error) {
          console.error('Insert error:', error);
          result.failed++;
          result.items.push({
            url,
            name: medicine.name,
            status: 'failed',
            error: error.message
          });
        } else {
          result.successful++;
          result.items.push({
            url,
            name: medicine.name,
            status: 'success',
            medicine_id: data.id
          });
        }

      } catch (error) {
        console.error('URL processing error:', error);
        result.failed++;
        result.items.push({
          url,
          status: 'failed',
          error: error.message
        });
      }

      result.processed++;

      // Add a small delay to be respectful to target sites
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`URL import completed: ${result.successful} successful, ${result.failed} failed, ${result.duplicates} duplicates`);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Bulk URL import error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to process URLs' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});