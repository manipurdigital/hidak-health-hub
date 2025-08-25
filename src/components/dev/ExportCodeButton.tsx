import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

export function ExportCodeButton() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const zip = new JSZip();
      
      // Get all text files (TypeScript, JavaScript, CSS, HTML, etc.)
      const textFiles = import.meta.glob([
        "/src/**/*",
        "/public/**/*",
        "/supabase/**/*",
        "/*.{ts,js,json,md,txt,css,html,tsx,jsx}",
        "!/node_modules/**",
        "!/dist/**",
        "!/build/**",
        "!/.git/**"
      ], { 
        as: "raw",
        eager: false 
      });

      // Get binary assets
      const assetFiles = import.meta.glob([
        "/src/assets/**/*.{png,jpg,jpeg,gif,svg,ico,webp}",
        "/public/**/*.{png,jpg,jpeg,gif,svg,ico,webp,pdf}"
      ], { 
        as: "url",
        eager: false 
      });

      // Add text files
      for (const [path, loader] of Object.entries(textFiles)) {
        try {
          const content = await loader();
          const relativePath = path.startsWith("/") ? path.slice(1) : path;
          zip.file(relativePath, content);
        } catch (error) {
          console.warn(`Failed to load ${path}:`, error);
        }
      }

      // Add binary assets
      for (const [path, loader] of Object.entries(assetFiles)) {
        try {
          const url = await loader();
          const response = await fetch(url);
          const blob = await response.blob();
          const relativePath = path.startsWith("/") ? path.slice(1) : path;
          zip.file(relativePath, blob);
        } catch (error) {
          console.warn(`Failed to load asset ${path}:`, error);
        }
      }

      // Generate and download the zip
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `codebase-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Codebase has been downloaded as a zip file."
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export codebase. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      disabled={isExporting}
      className="gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isExporting ? "Exporting..." : "Download Codebase (.zip)"}
    </Button>
  );
}