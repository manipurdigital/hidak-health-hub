import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageResult {
  success: boolean;
  publicUrl?: string;
  storagePath?: string;
  imageHash?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, destKey, maxSizeBytes = 2097152 } = await req.json(); // 2MB default

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching image: ${imageUrl}`);

    // Validate URL scheme and domain
    let urlObj: URL;
    try {
      urlObj = new URL(imageUrl);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid image URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only HTTP/HTTPS URLs are allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch image with validation
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Hidak Medicine Importer/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Validate content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    // Validate content length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      throw new Error(`Image too large: ${contentLength} bytes (max: ${maxSizeBytes})`);
    }

    // Read image data
    const imageBuffer = await response.arrayBuffer();
    
    if (imageBuffer.byteLength > maxSizeBytes) {
      throw new Error(`Image too large: ${imageBuffer.byteLength} bytes (max: ${maxSizeBytes})`);
    }

    // Generate image hash (SHA-1)
    const hashBuffer = await crypto.subtle.digest('SHA-1', imageBuffer);
    const imageHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Generate storage path
    const fileExt = getFileExtension(contentType, imageUrl);
    const fileName = destKey || `${imageHash}.${fileExt}`;
    const storagePath = `product-images/medicines/${fileName}`;

    // Upload to Supabase Storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(storagePath, imageBuffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(storagePath);

    const result: ImageResult = {
      success: true,
      publicUrl: urlData.publicUrl,
      storagePath,
      imageHash
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Image fetch/store error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to fetch and store image' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getFileExtension(contentType: string, url: string): string {
  // Try content type first
  const typeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };

  if (typeMap[contentType]) {
    return typeMap[contentType];
  }

  // Fallback to URL extension
  const urlExt = url.split('.').pop()?.toLowerCase();
  if (urlExt && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(urlExt)) {
    return urlExt === 'jpeg' ? 'jpg' : urlExt;
  }

  return 'jpg'; // Default
}