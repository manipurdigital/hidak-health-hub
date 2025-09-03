import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefetchOptions {
  overwriteManualChanges?: boolean;
  storeHtmlAudit?: boolean;
}

interface RefetchResult {
  success: boolean;
  message: string;
  updatedFields?: string[];
  auditUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { medicineId, options = {} }: { medicineId: string; options?: RefetchOptions } = await req.json();

    if (!medicineId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Medicine ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current medicine data
    const { data: medicine, error: fetchError } = await supabase
      .from('medicines')
      .select('*')
      .eq('id', medicineId)
      .single();

    if (fetchError || !medicine) {
      return new Response(
        JSON.stringify({ success: false, message: 'Medicine not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!medicine.external_source_url) {
      return new Response(
        JSON.stringify({ success: false, message: 'No source URL available for re-fetching' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Re-fetching medicine ${medicineId} from ${medicine.external_source_url}`);

    // Call the existing import function to re-parse the URL
    const { data: importResult, error: importError } = await supabase.functions.invoke(
      'import-medicine-from-url',
      {
        body: {
          url: medicine.external_source_url,
          downloadImages: true,
          storeHtmlAudit: options.storeHtmlAudit
        }
      }
    );

    if (importError) {
      console.error('Import function error:', importError);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to re-fetch medicine data' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const newMedicineData = importResult.medicineData;
    if (!newMedicineData) {
      return new Response(
        JSON.stringify({ success: false, message: 'No data extracted from source' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Determine which fields to update
    const fieldsToUpdate: any = {};
    const updatedFields: string[] = [];

    // Always update these source-derived fields
    const sourceFields = [
      'price', 'original_price', 'description', 'image_url', 
      'composition', 'composition_key', 'composition_family_key',
      'source_checksum', 'source_last_fetched'
    ];

    for (const field of sourceFields) {
      if (newMedicineData[field] !== undefined) {
        fieldsToUpdate[field] = newMedicineData[field];
        if (medicine[field] !== newMedicineData[field]) {
          updatedFields.push(field);
        }
      }
    }

    // Conditionally update fields that might have manual overrides
    if (options.overwriteManualChanges) {
      const manualFields = [
        'name', 'brand', 'manufacturer', 'dosage', 'pack_size',
        'requires_prescription', 'stock_quantity'
      ];

      for (const field of manualFields) {
        if (newMedicineData[field] !== undefined) {
          fieldsToUpdate[field] = newMedicineData[field];
          if (medicine[field] !== newMedicineData[field]) {
            updatedFields.push(field);
          }
        }
      }
    }

    // Always update timestamp
    fieldsToUpdate.source_last_fetched = new Date().toISOString();

    // Update the medicine
    const { error: updateError } = await supabase
      .from('medicines')
      .update(fieldsToUpdate)
      .eq('id', medicineId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to update medicine' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const result: RefetchResult = {
      success: true,
      message: updatedFields.length > 0 
        ? `Updated ${updatedFields.length} fields successfully`
        : 'No changes detected - medicine is up to date',
      updatedFields
    };

    if (importResult.auditUrl) {
      result.auditUrl = importResult.auditUrl;
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Refetch function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});