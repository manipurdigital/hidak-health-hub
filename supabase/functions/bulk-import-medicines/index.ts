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
  jobId?: string;
}

interface ImportItem {
  name?: string;
  url?: string;
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

    const contentType = req.headers.get('content-type') || '';
    let inputData: any = {};
    let file: File | null = null;
    let urls: string[] = [];
    let downloadImages = false;
    let userId: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      file = formData.get('file') as File;
      downloadImages = formData.get('downloadImages') === 'true';
      userId = formData.get('userId') as string;
    } else {
      inputData = await req.json();
      urls = inputData.urls || [];
      downloadImages = inputData.downloadImages || false;
      userId = inputData.userId;
    }

    if (!file && (!urls || urls.length === 0)) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file or URLs provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create import job
    const jobKind = file ? 'medicine_csv' : 'medicine_url';
    const { data: jobData, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        kind: jobKind,
        status: 'pending',
        created_by: userId,
        summary: {
          total_items: file ? 0 : urls.length,
          download_images: downloadImages
        }
      })
      .select('id')
      .single();

    if (jobError) {
      throw new Error(`Failed to create import job: ${jobError.message}`);
    }

    const jobId = jobData.id;

    const result: ImportResult = {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      duplicates: 0,
      items: [],
      jobId
    };

    if (file) {
      console.log(`Processing file: ${file.name}, size: ${file.size}`);

      // Read and parse the file
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log(`Parsed ${jsonData.length} rows from file`);
      result.total = jsonData.length;

      // Update job with total count
      await supabase
        .from('import_jobs')
        .update({ 
          summary: { 
            ...jobData.summary, 
            total_items: jsonData.length 
          } 
        })
        .eq('id', jobId);

      // Process CSV rows
      for (const row of jsonData) {
        await processRow(row, supabase, result, jobId, downloadImages);
      }
    } else if (urls.length > 0) {
      console.log(`Processing ${urls.length} URLs`);
      result.total = urls.length;

      // Process URLs
      for (const url of urls) {
        await processUrl(url, supabase, result, jobId, downloadImages);
      }
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

async function processRow(row: any, supabase: any, result: ImportResult, jobId: string, downloadImages: boolean) {
  const itemPayload = { ...row };
  let jobItemId: string;

  try {
    // Create job item
    const { data: itemData, error: itemError } = await supabase
      .from('import_job_items')
      .insert({
        job_id: jobId,
        source_url: row.source_url,
        payload: itemPayload,
        status: 'pending'
      })
      .select('id')
      .single();

    if (itemError) throw itemError;
    jobItemId = itemData.id;

    if (row.source_url) {
      // Use URL importer for rows with source URLs
      const importResult = await supabase.functions.invoke('import-medicine-from-url', {
        body: { 
          url: row.source_url, 
          options: { downloadImages } 
        }
      });

      if (importResult.error) {
        throw new Error(`URL import failed: ${importResult.error.message}`);
      }

      const { success, medicineId, mode, error } = importResult.data;
      
      if (success) {
        await supabase
          .from('import_job_items')
          .update({
            status: 'success',
            created_medicine_id: medicineId
          })
          .eq('id', jobItemId);

        if (mode === 'created') {
          result.successful++;
        } else {
          result.duplicates++;
        }

        result.items.push({
          name: row.name,
          url: row.source_url,
          status: mode === 'created' ? 'success' : 'duplicate',
          medicine_id: medicineId
        });
      } else {
        throw new Error(error || 'URL import failed');
      }
    } else {
      // Direct CSV mapping
      await processDirectRow(row, supabase, result, jobItemId, downloadImages);
    }

  } catch (error) {
    console.error('Row processing error:', error);
    result.failed++;
    
    if (jobItemId!) {
      await supabase
        .from('import_job_items')
        .update({
          status: 'failed',
          error: error.message
        })
        .eq('id', jobItemId);
    }

    result.items.push({
      name: row.name || 'Unknown',
      url: row.source_url,
      status: 'failed',
      error: error.message
    });
  }
  
  result.processed++;
}

async function processDirectRow(row: any, supabase: any, result: ImportResult, jobItemId: string, downloadImages: boolean) {
  // Handle column aliases for composition
  const compositionText = row.composition_text || row['Salt Composition'] || row['Salt Composition (Generic)'] || row['salt_composition'];
  
  // Validate required fields
  if (!row.name || !row.price || !compositionText || !row.stock_quantity) {
    throw new Error('Missing required fields (name, price, composition_text/Salt Composition, stock_quantity)');
  }

  // Parse requires_prescription field robustly
  let requiresPrescription = false;
  if (row.requires_prescription !== undefined && row.requires_prescription !== null && row.requires_prescription !== '') {
    const prescValue = String(row.requires_prescription).toLowerCase().trim();
    requiresPrescription = ['yes', 'true', '1', 'y', 't'].includes(prescValue);
  }

  // Map category name to category_id
  let categoryId = null;
  if (row.category) {
    const { data: categoryData } = await supabase
      .from('medicine_categories')
      .select('id')
      .eq('name', row.category)
      .limit(1);
    
    if (categoryData && categoryData.length > 0) {
      categoryId = categoryData[0].id;
    }
  }

  // Check for duplicates
  const { data: existing } = await supabase
    .from('medicines')
    .select('id')
    .eq('name', row.name)
    .eq('composition_text', compositionText)
    .limit(1);

  if (existing && existing.length > 0) {
    await supabase
      .from('import_job_items')
      .update({
        status: 'duplicate',
        created_medicine_id: existing[0].id
      })
      .eq('id', jobItemId);

    result.duplicates++;
    result.items.push({
      name: row.name,
      status: 'duplicate',
      medicine_id: existing[0].id
    });
    return;
  }

  // Process thumbnail if image_url is present
  let processedImageUrl = row.image_url || null;
  if (row.image_url && downloadImages) {
    try {
      const { data: imageData, error: imageError } = await supabase.functions.invoke('fetch-and-store-image', {
        body: {
          imageUrl: row.image_url,
          destKey: `${row.name?.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
          maxSizeBytes: 2097152 // 2MB limit
        }
      });

      if (!imageError && imageData?.success) {
        processedImageUrl = imageData.publicUrl;
      }
    } catch (imageError) {
      console.warn('Image processing failed:', imageError);
    }
  }

  // Generate composition keys using the resolved composition text
  const normalized = normalizeComposition(compositionText);
  
  // Prepare medicine data to match the form exactly
  const medicineData = {
    name: row.name,
    composition_text: compositionText,
    category_id: categoryId,
    price: parseFloat(row.price) || 0,
    original_price: parseFloat(row.original_price) || parseFloat(row.price) || 0,
    stock_quantity: parseInt(row.stock_quantity) || 0,
    requires_prescription: requiresPrescription,
    manufacturer: row.manufacturer || '',
    dosage: row.dosage || '',
    pack_size: row.pack_size || '',
    image_url: processedImageUrl,
    description: row.description || '',
    is_active: row.is_active !== 'false',
    // Generate composition keys
    composition_key: generateCompositionKey(normalized),
    composition_family_key: generateCompositionFamilyKey(normalized)
  };

  // Insert medicine
  const { data, error } = await supabase
    .from('medicines')
    .insert(medicineData)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Database insert failed: ${error.message}`);
  }

  await supabase
    .from('import_job_items')
    .update({
      status: 'success',
      created_medicine_id: data.id
    })
    .eq('id', jobItemId);

  result.successful++;
  result.items.push({
    name: row.name,
    status: 'success',
    medicine_id: data.id
  });
}

async function processUrl(url: string, supabase: any, result: ImportResult, jobId: string, downloadImages: boolean) {
  let jobItemId: string;

  try {
    // Create job item
    const { data: itemData, error: itemError } = await supabase
      .from('import_job_items')
      .insert({
        job_id: jobId,
        source_url: url,
        payload: { url },
        status: 'pending'
      })
      .select('id')
      .single();

    if (itemError) throw itemError;
    jobItemId = itemData.id;

    // Use URL importer
    const importResult = await supabase.functions.invoke('import-medicine-from-url', {
      body: { 
        url, 
        options: { downloadImages } 
      }
    });

    if (importResult.error) {
      throw new Error(`URL import failed: ${importResult.error.message}`);
    }

    const { success, medicineId, mode, error } = importResult.data;
    
    if (success) {
      await supabase
        .from('import_job_items')
        .update({
          status: 'success',
          created_medicine_id: medicineId
        })
        .eq('id', jobItemId);

      if (mode === 'created') {
        result.successful++;
      } else {
        result.duplicates++;
      }

      result.items.push({
        url,
        status: mode === 'created' ? 'success' : 'duplicate',
        medicine_id: medicineId
      });
    } else {
      throw new Error(error || 'URL import failed');
    }

  } catch (error) {
    console.error('URL processing error:', error);
    result.failed++;
    
    if (jobItemId!) {
      await supabase
        .from('import_job_items')
        .update({
          status: 'failed',
          error: error.message
        })
        .eq('id', jobItemId);
    }

    result.items.push({
      url,
      status: 'failed',
      error: error.message
    });
  }
  
  result.processed++;
}

// Composition key generation functions (copied from import-medicine-from-url)
function normalizeComposition(composition: string): string {
  let normalized = composition
    .toLowerCase()
    .replace(/\s*\(\s*[^)]*\)\s*/g, '') // Remove parenthetical content
    .replace(/[^\w\s+&,.-]/g, '') // Keep only word chars, spaces, and separators
    .replace(/\s+/g, ' ')
    .trim();

  // Standardize units
  normalized = normalized
    .replace(/mcg/g, 'μg')
    .replace(/\bmg\b/g, 'mg')
    .replace(/\bml\b/g, 'ml');
  
  return normalized;
}

function generateCompositionKey(composition: string): string {
  // Sort ingredients alphabetically for consistent key
  const ingredients = composition
    .split(/[+&,]/)
    .map(ing => ing.trim())
    .filter(ing => ing.length > 0)
    .sort();
  
  return ingredients.join('+');
}

function generateCompositionFamilyKey(composition: string): string {
  // Remove dosage/strength info to group by active ingredients only
  const withoutDosage = composition
    .replace(/\d+(?:\.\d+)?\s*(?:mg|μg|ml|g|iu)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return generateCompositionKey(withoutDosage);
}

function extractMedicineDetails(name: string): { 
  brand: string; 
  dosage: string; 
  packSize: string; 
  composition: string; 
} {
  let brand = '';
  let dosage = '';
  let packSize = '';
  let composition = '';
  
  // Extract dosage patterns like "500mg", "10ml", "250mcg"
  const dosageMatch = name.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|ml|g|iu)\b/i);
  if (dosageMatch) {
    dosage = dosageMatch[0];
  }
  
  // Extract pack size patterns like "10 tablets", "30 capsules", "100ml bottle"
  const packMatch = name.match(/(\d+)\s*(tablets?|capsules?|ml|strips?|bottles?)/i);
  if (packMatch) {
    packSize = packMatch[0];
  }
  
  // Try to extract active ingredient from common patterns
  const activeMatch = name.match(/^([A-Za-z][A-Za-z\s]+?)(?:\s+\d+|\s+\(|$)/);
  if (activeMatch) {
    const potential = activeMatch[1].trim();
    // Only use if it's likely an active ingredient (not a brand)
    if (potential.length > 3 && !potential.match(/^(tab|cap|syr|inj|dr\.?)/i)) {
      composition = potential;
      if (dosage) {
        composition += ' ' + dosage;
      }
    }
  }
  
  return { brand, dosage, packSize, composition };
}