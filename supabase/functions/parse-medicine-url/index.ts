import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MedicineData {
  name: string;
  brand: string;
  manufacturer: string;
  price: number;
  original_price: number;
  description: string;
  dosage: string;
  pack_size: string;
  requires_prescription: boolean;
  image_url?: string;
  source_url: string;
  source_domain: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, downloadImages = true } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Parsing medicine URL: ${url}`);

    // Extract domain for routing to appropriate parser
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    let medicineData: MedicineData;

    if (domain.includes('1mg.com')) {
      medicineData = await parse1mgProduct(url);
    } else if (domain.includes('apollopharmacy.in')) {
      medicineData = await parseApolloProduct(url);
    } else if (domain.includes('netmeds.com')) {
      medicineData = await parseNetmedsProduct(url);
    } else {
      medicineData = await parseGenericProduct(url);
    }

    // Download image if requested and URL exists
    if (downloadImages && medicineData.image_url) {
      try {
        medicineData.image_url = await downloadImageToStorage(medicineData.image_url, medicineData.name);
      } catch (error) {
        console.error('Failed to download image:', error);
        // Continue without image rather than failing entirely
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        medicine: medicineData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Parse medicine URL error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to parse medicine URL' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function parse1mgProduct(url: string): Promise<MedicineData> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  const html = await response.text();
  
  // Extract data using regex patterns (basic scraping)
  const nameMatch = html.match(/<h1[^>]*class="[^"]*ProductTitle[^"]*"[^>]*>([^<]+)</i);
  const priceMatch = html.match(/₹\s*([0-9,]+(?:\.[0-9]{2})?)/);
  const mrpMatch = html.match(/M\.R\.P\..*?₹\s*([0-9,]+(?:\.[0-9]{2})?)/i);
  const manufacturerMatch = html.match(/Manufacturer[^>]*>.*?<[^>]*>([^<]+)/i);
  const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
  const imageMatch = html.match(/<img[^>]*src="([^"]*product[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"[^>]*>/i);
  
  const name = nameMatch ? nameMatch[1].trim() : extractFromTitle(html);
  const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
  const originalPrice = mrpMatch ? parseFloat(mrpMatch[1].replace(/,/g, '')) : price;
  
  // Extract brand and dosage from name
  const { brand, dosage, packSize } = extractMedicineDetails(name);

  return {
    name,
    brand,
    manufacturer: manufacturerMatch ? manufacturerMatch[1].trim() : '',
    price,
    original_price: originalPrice,
    description: descriptionMatch ? descriptionMatch[1].trim() : '',
    dosage,
    pack_size: packSize,
    requires_prescription: html.toLowerCase().includes('prescription') || html.toLowerCase().includes('rx'),
    image_url: imageMatch ? imageMatch[1] : undefined,
    source_url: url,
    source_domain: '1mg.com'
  };
}

async function parseApolloProduct(url: string): Promise<MedicineData> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  const html = await response.text();
  
  const nameMatch = html.match(/<h1[^>]*>([^<]+)</i) || html.match(/<title>([^<]+)</i);
  const priceMatch = html.match(/₹\s*([0-9,]+(?:\.[0-9]{2})?)/);
  const imageMatch = html.match(/<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"[^>]*>/i);
  
  const name = nameMatch ? nameMatch[1].trim().replace(' - Apollo Pharmacy', '') : '';
  const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
  
  const { brand, dosage, packSize } = extractMedicineDetails(name);

  return {
    name,
    brand,
    manufacturer: '',
    price,
    original_price: price,
    description: '',
    dosage,
    pack_size: packSize,
    requires_prescription: html.toLowerCase().includes('prescription'),
    image_url: imageMatch ? imageMatch[1] : undefined,
    source_url: url,
    source_domain: 'apollopharmacy.in'
  };
}

async function parseNetmedsProduct(url: string): Promise<MedicineData> {
  // Similar implementation for NetMeds
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  const html = await response.text();
  
  const nameMatch = html.match(/<h1[^>]*>([^<]+)</i) || html.match(/<title>([^<]+)</i);
  const priceMatch = html.match(/₹\s*([0-9,]+(?:\.[0-9]{2})?)/);
  
  const name = nameMatch ? nameMatch[1].trim() : '';
  const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
  
  const { brand, dosage, packSize } = extractMedicineDetails(name);

  return {
    name,
    brand,
    manufacturer: '',
    price,
    original_price: price,
    description: '',
    dosage,
    pack_size: packSize,
    requires_prescription: html.toLowerCase().includes('prescription'),
    source_url: url,
    source_domain: 'netmeds.com'
  };
}

async function parseGenericProduct(url: string): Promise<MedicineData> {
  // Generic parser for other sites
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  const html = await response.text();
  const urlObj = new URL(url);
  
  const name = extractFromTitle(html);
  const { brand, dosage, packSize } = extractMedicineDetails(name);

  return {
    name,
    brand,
    manufacturer: '',
    price: 0,
    original_price: 0,
    description: '',
    dosage,
    pack_size: packSize,
    requires_prescription: false,
    source_url: url,
    source_domain: urlObj.hostname
  };
}

function extractFromTitle(html: string): string {
  const titleMatch = html.match(/<title>([^<]+)</i);
  if (titleMatch) {
    return titleMatch[1].trim()
      .replace(/\s*\|\s*.*$/, '') // Remove site name after |
      .replace(/\s*-\s*.*$/, ''); // Remove site name after -
  }
  return '';
}

function extractMedicineDetails(name: string): { brand: string; dosage: string; packSize: string } {
  // Extract dosage (numbers followed by mg/ml/g etc.)
  const dosageMatch = name.match(/(\d+(?:\.\d+)?\s*(?:mg|ml|g|mcg|iu)\b)/i);
  const dosage = dosageMatch ? dosageMatch[1] : '';
  
  // Extract pack size (numbers followed by tablets/capsules/etc.)
  const packMatch = name.match(/(\d+\s*(?:tablets?|capsules?|strips?|ml|pieces?)\b)/i);
  const packSize = packMatch ? packMatch[1] : '';
  
  // Extract brand (usually the first word or before dosage)
  const words = name.split(/\s+/);
  const brand = words.length > 0 ? words[0] : '';
  
  return { brand, dosage, packSize };
}

async function downloadImageToStorage(imageUrl: string, medicineName: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const fileExt = imageUrl.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `medicines/${medicineName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExt}`;

    // Note: In a real implementation, you would upload to Supabase Storage here
    // For now, return the original URL
    return imageUrl;
  } catch (error) {
    console.error('Image download failed:', error);
    throw error;
  }
}