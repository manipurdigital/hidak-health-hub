import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CrawlOptions {
  maxProducts?: number;
  categories?: string[];
  useFirecrawl?: boolean;
  dryRun?: boolean;
}

interface CrawlResult {
  success: boolean;
  totalProductsFound?: number;
  importedCount?: number;
  skippedCount?: number;
  failedCount?: number;
  errors?: string[];
  productUrls?: string[];
  categories?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  console.log('[CRAWL-1MG] Function started');

  try {
    const { 
      maxProducts = 50, 
      categories = ['bestsellers', 'popular'], 
      useFirecrawl = true,
      dryRun = false 
    }: CrawlOptions = await req.json();

    console.log('[CRAWL-1MG] Request parameters:', { maxProducts, categories, useFirecrawl, dryRun });

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (useFirecrawl && !firecrawlApiKey) {
      console.warn('[CRAWL-1MG] Firecrawl API key not found, falling back to direct scraping');
    }

    const result: CrawlResult = {
      success: false,
      totalProductsFound: 0,
      importedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
      productUrls: [],
      categories: []
    };

    // Step 1: Discover product URLs from popular/bestseller pages
    const baseUrls = [
      'https://www.1mg.com/drugs-all-medicines',
      'https://www.1mg.com/categories',
      'https://www.1mg.com/drugs-bestsellers'
    ];

    const allProductUrls = new Set<string>();

    for (const baseUrl of baseUrls) {
      try {
        console.log(`[CRAWL-1MG] Discovering products from: ${baseUrl}`);
        
        let content = '';
        
        if (useFirecrawl && firecrawlApiKey) {
          // Use Firecrawl for robust scraping
          const firecrawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: baseUrl,
              formats: ['markdown'],
              onlyMainContent: true
            })
          });

          if (firecrawlResponse.ok) {
            const firecrawlData = await firecrawlResponse.json();
            content = firecrawlData.data?.markdown || '';
            console.log(`[CRAWL-1MG] Firecrawl scraped ${content.length} characters from ${baseUrl}`);
          } else {
            throw new Error(`Firecrawl failed with status: ${firecrawlResponse.status}`);
          }
        } else {
          // Fallback to direct fetch
          const response = await fetch(baseUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          if (response.ok) {
            content = await response.text();
            console.log(`[CRAWL-1MG] Direct fetch scraped ${content.length} characters from ${baseUrl}`);
          } else {
            throw new Error(`Direct fetch failed with status: ${response.status}`);
          }
        }

        // Extract product URLs using regex patterns
        const productUrlPatterns = [
          /https:\/\/www\.1mg\.com\/drugs\/[a-zA-Z0-9\-]+(?:-\d+)?/g,
          /\/drugs\/[a-zA-Z0-9\-]+(?:-\d+)?/g
        ];

        for (const pattern of productUrlPatterns) {
          const matches = content.match(pattern) || [];
          matches.forEach(url => {
            const fullUrl = url.startsWith('http') ? url : `https://www.1mg.com${url}`;
            if (fullUrl.includes('/drugs/') && !fullUrl.includes('#') && !fullUrl.includes('?')) {
              allProductUrls.add(fullUrl);
            }
          });
        }

        console.log(`[CRAWL-1MG] Found ${allProductUrls.size} unique product URLs so far`);

      } catch (error) {
        console.error(`[CRAWL-1MG] Error discovering from ${baseUrl}:`, error);
        result.errors?.push(`Discovery failed for ${baseUrl}: ${error.message}`);
      }
    }

    const productUrls = Array.from(allProductUrls).slice(0, maxProducts);
    result.totalProductsFound = productUrls.length;
    result.productUrls = productUrls;

    console.log(`[CRAWL-1MG] Total product URLs to process: ${productUrls.length}`);

    if (dryRun) {
      console.log('[CRAWL-1MG] Dry run mode - not importing products');
      result.success = true;
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Import each product using robust import-medicine-from-url function
    let withComposition = 0;
    let withDescription = 0;
    
    for (const productUrl of productUrls) {
      try {
        console.log(`[CRAWL-1MG] Processing product: ${productUrl}`);

        // Use the robust import-medicine-from-url function with retry logic
        let importResponse = null;
        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
          try {
            importResponse = await supabase.functions.invoke('import-medicine-from-url', {
              body: {
                url: productUrl,
                downloadImages: false,
                respectRobots: false,
                storeHtmlAudit: false
              }
            });

            if (importResponse.error) {
              throw new Error(importResponse.error.message || 'Import function error');
            }
            break; // Success, exit retry loop
          } catch (retryError) {
            retryCount++;
            if (retryCount > maxRetries) {
              throw retryError;
            }
            console.warn(`[CRAWL-1MG] Retry ${retryCount}/${maxRetries} for ${productUrl}:`, retryError.message);
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
          }
        }

        if (importResponse && importResponse.data) {
          const importData = importResponse.data;
          
          if (importData.success) {
            // Track composition and description coverage
            if (importData.medicineData?.composition) withComposition++;
            if (importData.medicineData?.description) withDescription++;

            if (importData.duplicate) {
              // Enrich existing record if it's missing composition or description
              if (importData.medicineData) {
                const existingMedicine = await supabase
                  .from('medicines')
                  .select('composition, description')
                  .eq('id', importData.medicineId)
                  .single();

                if (existingMedicine.data) {
                  const updateFields: any = {};
                  
                  // Only update empty fields to avoid overwriting manual edits
                  if (!existingMedicine.data.composition && importData.medicineData.composition) {
                    updateFields.composition = importData.medicineData.composition;
                    updateFields.composition_key = importData.medicineData.composition_key;
                    updateFields.composition_family_key = importData.medicineData.composition_family_key;
                  }
                  
                  if (!existingMedicine.data.description && importData.medicineData.description) {
                    updateFields.description = importData.medicineData.description;
                  }

                  if (Object.keys(updateFields).length > 0) {
                    await supabase
                      .from('medicines')
                      .update(updateFields)
                      .eq('id', importData.medicineId);
                    
                    console.log(`[CRAWL-1MG] Enriched existing: ${importData.medicine?.name} with ${Object.keys(updateFields).join(', ')}`);
                  }
                }
              }
              result.skippedCount!++;
              console.log(`[CRAWL-1MG] Processed duplicate: ${importData.medicine?.name || 'Unknown'}`);
            } else {
              result.importedCount!++;
              console.log(`[CRAWL-1MG] Successfully imported: ${importData.medicineData?.name || 'Unknown'}`);
            }
          } else {
            result.failedCount!++;
            result.errors?.push(`Import failed for ${productUrl}: ${importData.error || 'Unknown error'}`);
          }
        } else {
          result.failedCount!++;
          result.errors?.push(`No response data for ${productUrl}`);
        }

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`[CRAWL-1MG] Error importing ${productUrl}:`, error);
        result.failedCount!++;
        result.errors?.push(`Import error for ${productUrl}: ${error.message}`);
      }
    }

    // Enhanced logging with composition/description coverage
    console.log(`[CRAWL-1MG] Coverage - With composition: ${withComposition}/${productUrls.length}, With description: ${withDescription}/${productUrls.length}`);

    result.success = true;
    console.log(`[CRAWL-1MG] Crawl completed - Imported: ${result.importedCount}, Skipped: ${result.skippedCount}, Failed: ${result.failedCount}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[CRAWL-1MG] Function error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});