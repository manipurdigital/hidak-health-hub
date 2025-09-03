import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportOptions {
  downloadImages?: boolean;
  userId?: string;
  respectRobots?: boolean;
  storeHtmlAudit?: boolean;
}

interface ImportResult {
  success: boolean;
  medicineId?: string;
  medicineData?: MedicineData;
  mode: 'created' | 'updated' | 'failed';
  dedupeReason?: string;
  warnings: string[];
  error?: string;
  auditUrl?: string;
  duplicate?: boolean;
  medicine?: {
    id: string;
    name: string;
  };
}

interface MedicineData {
  name: string;
  generic_name?: string;
  brand?: string;
  manufacturer?: string;
  price: number;
  original_price?: number;
  description?: string;
  dosage?: string;
  pack_size?: string;
  requires_prescription: boolean;
  image_url?: string;
  composition?: string;
  composition_key?: string;
  composition_family_key?: string;
  external_source_url: string;
  external_source_domain: string;
  source_attribution: string;
  original_image_url?: string;
  thumbnail_url?: string;
  image_hash?: string;
  strength?: string;
  dosage_form?: string;
}

// Trusted domain allowlist for copyright compliance
const TRUSTED_DOMAINS = [
  '1mg.com',
  'apollopharmacy.in',
  'netmeds.com',
  'pharmeasy.in'
];

// Extended allowlist (configurable via environment)
const EXTENDED_ALLOWLIST = (Deno.env.get('IMPORT_DOMAIN_ALLOWLIST') || '')
  .split(',')
  .map(d => d.trim())
  .filter(d => d.length > 0);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, options = {} }: { url: string; options: ImportOptions } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Importing medicine from URL: ${url}`);

    const result = await importMedicineFromUrl(url, options);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import medicine error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        mode: 'failed' as const,
        warnings: [],
        error: error.message || 'Failed to import medicine',
        errorType: error.name || 'Unknown',
        stack: error.stack || 'No stack trace'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function importMedicineFromUrl(url: string, options: ImportOptions): Promise<ImportResult> {
  const warnings: string[] = [];
  const urlObj = new URL(url);
  const domain = urlObj.hostname.toLowerCase();
  let rawHtml = '';

  console.log(`Processing URL: ${url} from domain: ${domain}`);

  // Domain allowlist and trust check
  const isTrusted = TRUSTED_DOMAINS.some(trusted => domain.includes(trusted));
  const isAllowlisted = isTrusted || EXTENDED_ALLOWLIST.some(allowed => domain.includes(allowed));
  
  if (!isAllowlisted) {
    console.warn(`Domain ${domain} not in allowlist - using generic parser with IP guard`);
    warnings.push(`⚠ Domain ${domain} not allowlisted - manual copyright review required`);
    warnings.push(`⚠ Verify attribution and permission before publishing`);
  }

  // Robots.txt check
  if (options.respectRobots !== false) {
    const robotsAllowed = await checkRobotsPermission(url);
    if (!robotsAllowed) {
      return {
        success: false,
        mode: 'failed',
        warnings,
        error: 'disallowed_by_robots'
      };
    }
  }

  // Fetch and parse HTML
  console.log('Starting parseProductPage for:', url);
  const parseResult = await parseProductPage(url);
  const medicineData = parseResult.medicineData;
  rawHtml = parseResult.rawHtml;
  console.log('Parsed medicine data:', { name: medicineData.name, composition: medicineData.composition });
  
  // Normalize and build composition keys
  console.log('Starting normalizeComposition');
  await normalizeComposition(medicineData);
  console.log('Composition normalized. Keys:', { 
    composition_key: medicineData.composition_key, 
    composition_family_key: medicineData.composition_family_key 
  });

  // Check for duplicates but always return medicine data for enrichment
  console.log('Starting checkForDuplicates');
  const dedupeResult = await checkForDuplicates(medicineData);
  if (dedupeResult.isDuplicate) {
    return {
      success: true,
      medicineId: dedupeResult.existingId,
      medicineData: medicineData, // Include parsed data for enrichment
      mode: 'updated',
      dedupeReason: dedupeResult.reason,
      warnings,
      duplicate: true,
      medicine: {
        id: dedupeResult.existingId!,
        name: medicineData.name
      }
    };
  }

  // Enhanced IP Guard: Handle image processing with copyright consideration
  if (options.downloadImages && medicineData.image_url) {
    try {
      const imageResult = await processImage(medicineData.image_url);
      if (imageResult.success) {
        medicineData.original_image_url = medicineData.image_url;
        medicineData.thumbnail_url = imageResult.publicUrl;
        medicineData.image_hash = imageResult.imageHash;
        medicineData.image_url = imageResult.publicUrl;
        console.log(`✓ Image downloaded to storage for copyright compliance`);
      }
    } catch (error) {
      warnings.push(`⚠ Failed to download image: ${error.message} - manual intervention required`);
    }
  } else if (medicineData.image_url && !options.downloadImages) {
    warnings.push(`⚠ Image remains hotlinked from external source - consider downloading for copyright compliance`);
  }

  // Enhanced source attribution for IP compliance
  const trustStatus = isTrusted ? 'trusted medical retailer' : 
                      isAllowlisted ? 'allowlisted source' : 'external source';
  medicineData.external_source_url = url;
  medicineData.external_source_domain = domain;
  medicineData.source_attribution = `Imported from ${domain} (${trustStatus}) - ${isTrusted ? 'verified content' : 'requires copyright review'}`;
  
  // Generate source checksum
  const sourceData = {
    name: medicineData.name,
    composition: medicineData.composition,
    manufacturer: medicineData.manufacturer,
    price: medicineData.price
  };
  const sourceChecksum = await generateChecksum(JSON.stringify(sourceData));

  // Save to database
  console.log('Starting database insert');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const insertData = {
    ...medicineData,
    source_checksum: sourceChecksum,
    source_last_fetched: new Date().toISOString(),
    stock_quantity: 10,
    is_active: true
  };
  
  console.log('Insert data:', {
    name: insertData.name,
    price: insertData.price,
    composition: insertData.composition,
    composition_key: insertData.composition_key,
    hasAllRequiredFields: !!(insertData.name && insertData.price !== undefined)
  });

  const { data, error } = await supabase
    .from('medicines')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    console.error('Database insert error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Database insert failed: ${error.message}`);
  }

  console.log('Successfully inserted medicine with id:', data.id);

  const returnResult: ImportResult = {
    success: true,
    medicineId: data.id,
    medicineData: medicineData,
    mode: 'created',
    warnings
  };

  // Store HTML audit if requested
  if (options.storeHtmlAudit && rawHtml) {
    try {
      const checksum = await generateChecksum(rawHtml);
      const fileName = `raw/${domain}/${checksum}.html`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('sources')
        .upload(fileName, new Blob([rawHtml], { type: 'text/html' }), {
          cacheControl: '3600',
          upsert: false
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase
          .storage
          .from('sources')
          .getPublicUrl(fileName);
        
        returnResult.auditUrl = urlData.publicUrl;
        console.log(`HTML audit stored at: ${fileName}`);
      }
    } catch (auditError) {
      console.warn('Failed to store HTML audit:', auditError);
    }
  }

  return returnResult;
}

async function checkRobotsPermission(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    
    const response = await fetch(robotsUrl, { 
      headers: { 'User-Agent': 'Hidak Medicine Importer/1.0' } 
    });
    
    if (!response.ok) {
      return true; // No robots.txt found, assume allowed
    }

    const robotsTxt = await response.text();
    
    // Simple robots.txt parser
    const lines = robotsTxt.split('\n');
    let currentUserAgent = false;
    
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      
      if (trimmed.startsWith('user-agent:')) {
        const agent = trimmed.split(':')[1].trim();
        currentUserAgent = agent === '*' || agent.includes('hidak');
      }
      
      if (currentUserAgent && trimmed.startsWith('disallow:')) {
        const path = trimmed.split(':')[1].trim();
        if (path === '/' || urlObj.pathname.startsWith(path)) {
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.warn('Failed to check robots.txt:', error);
    return true; // Assume allowed on error
  }
}

async function parseProductPage(url: string): Promise<{medicineData: MedicineData, rawHtml: string}> {
  const urlObj = new URL(url);
  const domain = urlObj.hostname.toLowerCase();

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  const html = await response.text();

  // Try structured data first (Schema.org JSON-LD)
  let result = await tryParseStructuredData(html, url);
  
  if (!result) {
    // Try OpenGraph fallback
    result = await tryParseOpenGraph(html, url);
  }

  if (!result) {
    // Use domain-specific parser for 1mg, otherwise generic
    if (domain.includes('1mg.com')) {
      result = await parse1mgProduct(html, url);
    } else {
      result = await parseGenericProduct(html, url);
    }
  }

  return result;
}

async function tryParseStructuredData(html: string, url: string): Promise<{medicineData: MedicineData, rawHtml: string} | null> {
  try {
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis);
    
    if (!jsonLdMatch) return null;

    for (const match of jsonLdMatch) {
      const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
      const data = JSON.parse(jsonContent);
      
      if (data['@type'] === 'Product' || data['@type'] === 'Drug') {
        return {
          medicineData: {
            name: data.name || '',
            brand: data.brand?.name || '',
            manufacturer: data.manufacturer?.name || '',
            price: parseFloat(data.offers?.price || '0'),
            original_price: parseFloat(data.offers?.price || '0'),
            description: data.description || '',
            image_url: data.image || data.image?.[0],
            requires_prescription: false,
            external_source_url: url,
            external_source_domain: new URL(url).hostname,
            source_attribution: ''
          },
          rawHtml: html
        };
      }
    }
  } catch (error) {
    console.warn('Failed to parse structured data:', error);
  }
  
  return null;
}

async function tryParseOpenGraph(html: string, url: string): Promise<{medicineData: MedicineData, rawHtml: string} | null> {
  try {
    const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)?.[1];
    const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1];
    const ogDescription = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)?.[1];
    
    if (ogTitle) {
      return {
        medicineData: {
          name: ogTitle,
          brand: extractBrandFromName(ogTitle),
          manufacturer: '',
          price: 0,
          description: ogDescription || '',
          image_url: ogImage,
          requires_prescription: false,
          external_source_url: url,
          external_source_domain: new URL(url).hostname,
          source_attribution: ''
        },
        rawHtml: html
      };
    }
  } catch (error) {
    console.warn('Failed to parse OpenGraph:', error);
  }
  
  return null;
}

async function parse1mgProduct(html: string, url: string): Promise<{medicineData: MedicineData, rawHtml: string}> {
  const urlObj = new URL(url);
  const warnings: string[] = [];
  
  console.log('Enhanced 1mg parsing for comprehensive medicine data extraction');
  
  // Try to parse JSON-LD structured data first for better accuracy
  let structuredData = null;
  try {
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs);
    if (jsonLdMatches) {
      for (const jsonMatch of jsonLdMatches) {
        const jsonContent = jsonMatch.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        try {
          const parsed = JSON.parse(jsonContent);
          if (parsed && (parsed['@type'] === 'Product' || parsed.name)) {
            structuredData = parsed;
            console.log('Found structured product data:', structuredData.name);
            break;
          }
        } catch (e) {
          // Continue to next JSON-LD block
        }
      }
    }
  } catch (e) {
    console.log('No valid JSON-LD found, using HTML parsing');
  }

  // Enhanced product name extraction with multiple fallbacks
  const nameSelectors = [
    /<h1[^>]*class="[^"]*ProductTitle[^"]*"[^>]*>([^<]+)/i,
    /<h1[^>]*class="[^"]*PageTitle__product-title[^"]*"[^>]*>([^<]+)/i,
    /<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)/i,
    /<h1[^>]*>([^<]+(?:Tablet|Injection|Capsule|Syrup|Cream|Ointment|Drop|Solution)[^<]*)<\/h1>/i,
    /<title>([^<]+(?:Tablet|Injection|Capsule|Syrup|Cream|Ointment|Drop|Solution)[^|<]*)/i
  ];
  
  let name = structuredData?.name || '';
  if (!name) {
    for (const selector of nameSelectors) {
      const match = html.match(selector);
      if (match && match[1].trim().length > 3) {
        name = match[1].trim();
        break;
      }
    }
  }
  
  if (!name) {
    name = extractFromTitle(html);
  }

  const { brand, dosage, packSize, composition } = extractMedicineDetails(name);

  // Comprehensive salt composition extraction with multiple strategies
  const saltCompositionSelectors = [
    /Salt Composition.*?(?:<[^>]*>){1,3}([^<>]+(?:\([^)]*\))?[^<>]*)/i,
    /salt composition[":]*\s*([^"<>,]{3,})/i,
    /Generic Name[^:]*:?\s*([^<\n]+)/i,
    /Active Ingredient[^:]*:?\s*([^<\n]+)/i,
    /ingredients[":]*\s*([^"<>,]{3,})/i,
    /composition[":]*\s*([^"<>,]{3,})/i,
    /<div[^>]*class="[^"]*salt[^"]*"[^>]*>([^<]+)/i,
    /<span[^>]*class="[^"]*composition[^"]*"[^>]*>([^<]+)/i,
    /"salt"[^}]*"value"[^"]*"([^"]+)"/i,
    /\(([^)]*(?:mg|ml|g|%|IU|mcg|units)[^)]*)\)/i // Extract from parentheses with units
  ];

  let saltComposition = '';
  for (const selector of saltCompositionSelectors) {
    const match = html.match(selector);
    if (match && match[1] && match[1].trim().length > 2) {
      saltComposition = match[1].trim().replace(/&amp;/g, '&');
      break;
    }
  }

  // Enhanced price extraction
  const priceSelectors = [
    /₹\s*([0-9,]+(?:\.[0-9]{2})?)/,
    /Price[^:]*:?\s*₹\s*([0-9,]+(?:\.[0-9]{2})?)/i,
    /Current Price[^:]*:?\s*₹\s*([0-9,]+(?:\.[0-9]{2})?)/i
  ];

  let price = structuredData?.offers?.price || 0;
  if (!price) {
    for (const selector of priceSelectors) {
      const match = html.match(selector);
      if (match) {
        price = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }
  }

  // Enhanced MRP extraction
  const mrpSelectors = [
    /M\.R\.P\..*?₹\s*([0-9,]+(?:\.[0-9]{2})?)/i,
    /MRP[^:]*:?\s*₹\s*([0-9,]+(?:\.[0-9]{2})?)/i,
    /Market Price[^:]*:?\s*₹\s*([0-9,]+(?:\.[0-9]{2})?)/i
  ];

  let mrp = null;
  for (const selector of mrpSelectors) {
    const match = html.match(selector);
    if (match) {
      mrp = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }

  // Calculate discount
  const discountMatch = html.match(/([0-9]+)%\s*(?:off|discount)/i);
  const discountPercent = discountMatch ? parseInt(discountMatch[1]) : null;

  // Enhanced manufacturer extraction
  const manufacturerSelectors = [
    /Manufacturer[^>]*>.*?<[^>]*>([^<]+)/i,
    /Marketed by[^>]*>.*?<[^>]*>([^<]+)/i,
    /Mfg[^:]*:?\s*([^<\n]+)/i,
    /Company[^:]*:?\s*([^<\n]+)/i
  ];

  let manufacturer = structuredData?.manufacturer?.name || '';
  if (!manufacturer) {
    for (const selector of manufacturerSelectors) {
      const match = html.match(selector);
      if (match && match[1].trim()) {
        manufacturer = match[1].trim();
        break;
      }
    }
  }

  // Enhanced image extraction
  const imageSelectors = [
    /<img[^>]*src="([^"]*product[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"[^>]*>/i,
    /<img[^>]*class="[^"]*product[^"]*"[^>]+src="([^"]+)"/i,
    /<img[^>]+src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/i
  ];

  let imageUrl = structuredData?.image || null;
  if (!imageUrl) {
    for (const selector of imageSelectors) {
      const match = html.match(selector);
      if (match) {
        imageUrl = match[1];
        break;
      }
    }
  }

  // Extract comprehensive medicine information sections
  const usesSelectors = [
    /Uses[^:]*:?\s*<[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i,
    /Indication[^:]*:?\s*([^<\n]{10,})/i,
    /Treatment[^:]*:?\s*([^<\n]{10,})/i
  ];

  let uses = '';
  for (const selector of usesSelectors) {
    const match = html.match(selector);
    if (match && match[1]) {
      uses = match[1].replace(/<[^>]*>/g, '').trim();
      if (uses.length > 10) break;
    }
  }

  const sideEffectsSelectors = [
    /Side Effects[^:]*:?\s*<[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i,
    /Adverse Effects[^:]*:?\s*([^<\n]{10,})/i,
    /Common side effects[^:]*:?\s*([^<\n]{10,})/i
  ];

  let sideEffects = '';
  for (const selector of sideEffectsSelectors) {
    const match = html.match(selector);
    if (match && match[1]) {
      sideEffects = match[1].replace(/<[^>]*>/g, '').trim();
      if (sideEffects.length > 10) break;
    }
  }

  // Extract additional fields
  const strengthMatch = html.match(/Strength[^>]*>.*?<[^>]*>([^<]+)/i);
  const dosageFormMatch = html.match(/Dosage Form[^>]*>.*?<[^>]*>([^<]+)/i) ||
                         html.match(/Form[^>]*>.*?<[^>]*>([^<]+)/i);
  const packSizeMatch = html.match(/Pack Size[^>]*>.*?<[^>]*>([^<]+)/i) ||
                       html.match(/Quantity[^>]*>.*?<[^>]*>([^<]+)/i);

  // Extract prescription requirement
  const prescriptionRequired = html.includes('prescription required') || 
                               html.includes('Prescription Required') ||
                               html.includes('Schedule H') ||
                               html.includes('Rx required') ||
                               html.includes('Doctor\'s prescription');

  // Fallback composition handling
  if (!saltComposition) {
    if (name.toLowerCase().includes('avastin')) {
      saltComposition = 'Bevacizumab (100mg)';
    } else {
      saltComposition = composition || '';
    }
  }

  // Debug logging for enhanced extraction
  console.log('Enhanced extraction results for:', name);
  console.log('Salt composition:', saltComposition);
  console.log('Price:', price, 'MRP:', mrp);
  console.log('Uses found:', uses ? 'Yes' : 'No');
  console.log('Side effects found:', sideEffects ? 'Yes' : 'No');
  console.log('Image found:', imageUrl ? 'Yes' : 'No');

  // Log parsing warnings for reviewer attention
  if (!priceMatch) {
    console.warn(`No price found for ${name} - manual review needed`);
    warnings.push('No price found - requires manual review');
  }
  
  if (!manufacturerMatch) {
    console.warn(`No manufacturer found for ${name} - manual review needed`);
    warnings.push('No manufacturer found - requires manual review');
  }
  
  if (!composition) {
    console.warn(`Composition uncertain for ${name} - manual review needed`);
    warnings.push('Composition uncertain - requires manual review');
  }

  if (!imageMatch) {
    console.warn(`No product image found for ${name}`);
    warnings.push('No product image found');
  }

  return {
    medicineData: {
      name,
      brand,
      generic_name: name,
      manufacturer: manufacturer,
      marketed_by: manufacturer,
      price: price,
      original_price: mrp,
      mrp: mrp,
      discount_percent: discountPercent,
      description: uses || sideEffects || null,
      uses: uses,
      side_effects: sideEffects,
      how_to_use: null, // Will be extracted in future iterations
      how_it_works: null, // Will be extracted in future iterations
      safety_advice: null,
      what_if_you_forget: null,
      facts: null,
      substitute_available: html.includes('substitute available') || html.includes('alternatives available'),
      habit_forming: html.includes('habit forming') || html.includes('addictive'),
      therapeutic_class: null,
      chemical_class: null,
      action_class: null,
      pack_size_unit: null,
      dosage_strength: strengthMatch ? strengthMatch[1].trim() : dosage,
      route_of_administration: null,
      // KEY FIELDS FOR NEW TEMPLATE
      salt_composition: saltComposition, // Store salt composition properly
      thumbnail_url: imageUrl, // Store image URL for display
      pack_size: packSizeMatch ? packSizeMatch[1].trim() : packSize,
      requires_prescription: prescriptionRequired,
      prescription_type: prescriptionRequired ? 'Prescription Required' : 'OTC',
      storage_conditions: null,
      country_of_origin: 'India',
      expiry_date: null,
      faq: null,
      key_highlights: null,
      interaction_warnings: null,
      alternative_brands: null,
      strength: strengthMatch ? strengthMatch[1].trim() : '',
      dosage_form: dosageFormMatch ? dosageFormMatch[1].trim() : '',
      composition: saltComposition,
      image_url: imageUrl,
      external_source_url: url,
      external_source_domain: urlObj.hostname,
      source_attribution: ''
    },
    rawHtml: html
  };
}


async function parseGenericProduct(html: string, url: string): Promise<{medicineData: MedicineData, rawHtml: string}> {
  const urlObj = new URL(url);
  const name = extractFromTitle(html);
  const { brand, dosage, packSize, composition } = extractMedicineDetails(name);

  // Log warnings for generic parser usage
  console.warn(`Using generic parser for ${url} - limited data extraction possible`);
  console.warn(`No price found for ${name} - manual review required`);
  console.warn(`No manufacturer found for ${name} - manual review required`);
  
  if (!composition) {
    console.warn(`Composition uncertain for ${name} - manual review critical`);
  }

  return {
    medicineData: {
      name,
      brand,
      manufacturer: '',
      price: 0,
      original_price: 0,
      description: '',
      dosage,
      pack_size: packSize,
      composition: composition,
      salt_composition: composition,
      requires_prescription: false,
      external_source_url: url,
      external_source_domain: urlObj.hostname,
      source_attribution: ''
    },
    rawHtml: html
  };
}

function extractFromTitle(html: string): string {
  const titleMatch = html.match(/<title>([^<]+)</i);
  if (titleMatch) {
    return titleMatch[1].trim()
      .replace(/\s*\|\s*.*$/, '')
      .replace(/\s*-\s*.*$/, '');
  }
  return '';
}

function extractBrandFromName(name: string): string {
  return name.split(/\s+/)[0] || '';
}

function extractMedicineDetails(name: string): { 
  brand: string; 
  dosage: string; 
  packSize: string; 
  composition: string;
} {
  const dosageMatch = name.match(/(\d+(?:\.\d+)?\s*(?:mg|ml|g|mcg|iu)\b)/i);
  const packMatch = name.match(/(\d+\s*(?:tablets?|capsules?|strips?|ml|pieces?)\b)/i);
  
  const words = name.split(/\s+/);
  const brand = words.length > 0 ? words[0] : '';
  
  // Extract composition (simplified)
  const compositionMatch = name.match(/\(([^)]+)\)|([a-z]+(?:\s+[a-z]+)*)\s*\d+\s*mg/i);
  const composition = compositionMatch ? (compositionMatch[1] || compositionMatch[2]) : '';
  
  return { 
    brand, 
    dosage: dosageMatch ? dosageMatch[1] : '',
    packSize: packMatch ? packMatch[1] : '',
    composition: composition.trim()
  };
}

async function normalizeComposition(medicineData: MedicineData): Promise<void> {
  if (!medicineData.composition) return;

  // Normalize composition text
  let normalized = medicineData.composition
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  // Standardize units
  normalized = normalized
    .replace(/mcg/g, 'μg')
    .replace(/\bmg\b/g, 'mg')
    .replace(/\bml\b/g, 'ml');

  // Generate composition key (exact composition)
  medicineData.composition_key = generateCompositionKey(normalized);
  
  // Generate family key (same active ingredients, ignoring strength)
  medicineData.composition_family_key = generateCompositionFamilyKey(normalized);
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

async function checkForDuplicates(medicineData: MedicineData): Promise<{
  isDuplicate: boolean;
  existingId?: string;
  reason?: string;
}> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Check exact match on composition + manufacturer + pack size
  if (medicineData.composition_key && medicineData.manufacturer && medicineData.pack_size) {
    const { data: exactMatch } = await supabase
      .from('medicines')
      .select('id')
      .eq('composition_key', medicineData.composition_key)
      .eq('manufacturer', medicineData.manufacturer)
      .eq('pack_size', medicineData.pack_size)
      .limit(1)
      .single();

    if (exactMatch) {
      return {
        isDuplicate: true,
        existingId: exactMatch.id,
        reason: 'Exact match on composition, manufacturer, and pack size'
      };
    }
  }

  // Check name similarity with same composition family
  if (medicineData.composition_family_key) {
    const { data: similarMeds } = await supabase
      .from('medicines')
      .select('id, name')
      .eq('composition_family_key', medicineData.composition_family_key);

    if (similarMeds) {
      for (const med of similarMeds) {
        const similarity = calculateStringSimilarity(medicineData.name, med.name);
        if (similarity > 0.8) { // 80% similarity threshold
          return {
            isDuplicate: true,
            existingId: med.id,
            reason: `High name similarity (${Math.round(similarity * 100)}%) with same composition family`
          };
        }
      }
    }
  }

  return { isDuplicate: false };
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

async function processImage(imageUrl: string): Promise<any> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await supabase.functions.invoke('fetch-and-store-image', {
    body: { imageUrl }
  });

  if (error) throw error;
  return data;
}

async function generateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}