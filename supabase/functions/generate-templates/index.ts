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
        .eq('is_active', true)
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

      // Sample medicine data
      templateData = [
        {
          name: "Calpol 650",
          composition_text: "Paracetamol 650 mg",
          category: "Pain Relief",
          price: 25.50,
          original_price: 30.00,
          stock_quantity: 100,
          requires_prescription: "No",
          manufacturer: "GSK",
          dosage: "650mg",
          pack_size: "10 tablets",
          image_url: "",
          description: "Pain and fever relief tablet",
          source_url: ""
        },
        {
          name: "Amoxicillin 250mg",
          composition_text: "Amoxicillin 250 mg",
          category: "Antibiotics", 
          price: 45.00,
          original_price: 60.00,
          stock_quantity: 50,
          requires_prescription: "Yes",
          manufacturer: "Cipla",
          dosage: "250mg",
          pack_size: "10 capsules",
          image_url: "",
          description: "Antibiotic for bacterial infections",
          source_url: ""
        },
        {
          name: "Aspirin 75mg",
          composition_text: "Acetylsalicylic Acid 75 mg",
          category: "Cardiovascular",
          price: 12.00,
          original_price: 15.00,
          stock_quantity: 75,
          requires_prescription: "No",
          manufacturer: "Bayer",
          dosage: "75mg", 
          pack_size: "30 tablets",
          image_url: "",
          description: "Blood thinner and pain relief",
          source_url: ""
        }
      ];

      // Instructions data
      instructionsData = [
        { field: "name", description: "Required. Medicine name/brand name", example: "Calpol 650" },
        { field: "composition_text", description: "Required. Active ingredients and strength", example: "Paracetamol 650 mg" },
        { field: "category", description: "Required. Must match exactly from Categories sheet", example: "Pain Relief" },
        { field: "price", description: "Required. Selling price in rupees", example: "25.50" },
        { field: "original_price", description: "Optional. MRP/original price", example: "30.00" },
        { field: "stock_quantity", description: "Required. Available quantity", example: "100" },
        { field: "requires_prescription", description: "Required. Yes/No, true/false, 1/0", example: "No" },
        { field: "manufacturer", description: "Optional. Company name", example: "GSK" },
        { field: "dosage", description: "Optional. Strength/dosage", example: "650mg" },
        { field: "pack_size", description: "Optional. Package details", example: "10 tablets" },
        { field: "image_url", description: "Optional. Direct image URL", example: "https://example.com/image.jpg" },
        { field: "description", description: "Optional. Medicine description", example: "Pain and fever relief tablet" },
        { field: "source_url", description: "Optional. For URL-based imports", example: "https://1mg.com/drugs/calpol-650-tablet-4" }
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