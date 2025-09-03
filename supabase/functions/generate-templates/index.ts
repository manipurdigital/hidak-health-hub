import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
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
    // Support both GET and POST requests
    let templateType: string;
    
    if (req.method === "GET") {
      const url = new URL(req.url);
      templateType = url.searchParams.get("type") || "";
    } else if (req.method === "POST") {
      const body = await req.json();
      templateType = body.type || "";
    } else {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!templateType || !["medicines", "lab-tests"].includes(templateType)) {
      return new Response(
        JSON.stringify({ error: "Invalid template type. Use 'medicines' or 'lab-tests'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let templateData: any[] = [];
    let categoriesData: any[] = [];
    let instructionsData: any[] = [];
    let filename = "";

    if (templateType === "medicines") {
      // Fetch categories from database
      const { data: categories, error: categoriesError } = await supabase
        .from('medicine_categories')
        .select('name')
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        categoriesData = [
          { category_name: "Pain Relief" },
          { category_name: "Antibiotics" },
          { category_name: "Cardiovascular" },
          { category_name: "Diabetes" },
          { category_name: "Respiratory" }
        ];
      } else {
        categoriesData = categories.map(cat => ({ category_name: cat.name }));
      }

      // New streamlined template for focused fields
      templateData = [
        {
          "Brand name/trade name": "Calpol 650 Tablet",
          "Salt Composition": "Paracetamol 650mg",
          "Requires prescription": "No",
          "Dosage": "650mg",
          "Size": "10 tablets",
          "Thumbnail URL": "https://example.com/calpol-image.jpg",
          "1mg URL (optional)": "https://www.1mg.com/drugs/calpol-650-tablet-4"
        },
        {
          "Brand name/trade name": "Azithromycin 500mg Tablet",
          "Salt Composition": "Azithromycin 500mg",
          "Requires prescription": "Yes", 
          "Dosage": "500mg",
          "Size": "3 tablets",
          "Thumbnail URL": "https://example.com/azithromycin-image.jpg",
          "1mg URL (optional)": "https://www.1mg.com/drugs/azithromycin-500mg-tablet-12345"
        },
        {
          "Brand name/trade name": "Aspirin 75mg Tablet",
          "Salt Composition": "Acetylsalicylic Acid 75mg",
          "Requires prescription": "No",
          "Dosage": "75mg",
          "Size": "30 tablets", 
          "Thumbnail URL": "https://example.com/aspirin-image.jpg",
          "1mg URL (optional)": ""
        }
      ];

      // Instructions data for the new focused template
      instructionsData = [
        { field: "Brand name/trade name", description: "Required. Full brand/trade name of the medicine", example: "Calpol 650 Tablet" },
        { field: "Salt Composition", description: "Required. Active ingredients with strength", example: "Paracetamol 650mg" },
        { field: "Requires prescription", description: "Required. Yes/No only", example: "No" },
        { field: "Dosage", description: "Required. Strength per unit", example: "650mg" },
        { field: "Size", description: "Required. Pack size/quantity", example: "10 tablets" },
        { field: "Thumbnail URL", description: "Optional. Direct image URL for product thumbnail", example: "https://example.com/image.jpg" },
        { field: "1mg URL (optional)", description: "Optional. Tata 1mg product URL to auto-import details", example: "https://www.1mg.com/drugs/product-name" },
        { note: "IMPORTANT", description: "If '1mg URL' is provided, it will be parsed automatically and override manual entries", example: "" },
        { note: "PRICING", description: "Prices will be auto-detected from 1mg URLs or set to 0 for manual entry", example: "" },
        { note: "IMAGES", description: "Images from 1mg will be downloaded and stored locally for copyright compliance", example: "" }
      ];

      filename = "medicines_bulk_upload_template.xlsx";
      
    } else if (templateType === "lab-tests") {
      templateData = [
        {
          name: "Complete Blood Count",
          description: "Comprehensive blood analysis including RBC, WBC, platelets",
          price: 250.00,
          category: "Hematology",
          sample_type: "Blood",
          reporting_time: "24 hours",
          preparation_required: "No"
        },
        {
          name: "Lipid Profile",
          description: "Cholesterol and triglyceride levels assessment",
          price: 350.00,
          category: "Biochemistry",
          sample_type: "Blood",
          reporting_time: "24 hours",
          preparation_required: "Yes"
        }
      ];
      filename = "lab_tests_bulk_upload_template.xlsx";
    }

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();
    
    // Add template sheet
    const templateSheet = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, templateSheet, "Template");

    if (templateType === "medicines") {
      // Add instructions sheet
      const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
      XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
      
      // Add categories sheet
      const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData);
      XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categories");
    }

    // For POST requests, return base64 encoded data
    if (req.method === "POST") {
      const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(excelBuffer)));
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          filename,
          data: base64Data,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // For GET requests, return file directly
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new Response(excelBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error("Error in generate-templates function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to generate template"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});