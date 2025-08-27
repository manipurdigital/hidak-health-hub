import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const url = new URL(req.url);
    const templateType = url.searchParams.get("type");

    if (!templateType || !["medicines", "lab-tests"].includes(templateType)) {
      return new Response(
        JSON.stringify({ error: "Invalid template type. Use 'medicines' or 'lab-tests'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let templateData: any[] = [];
    let filename = "";

    if (templateType === "medicines") {
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
          description: "Pain and fever relief tablet"
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
          description: "Antibiotic for bacterial infections"
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
          description: "Blood thinner and pain relief"
        }
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

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // Generate Excel file buffer
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