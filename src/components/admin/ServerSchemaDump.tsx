
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Download, Database, Loader2 } from "lucide-react";

const ServerSchemaDump = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleServerSchemaDump = async () => {
    try {
      setIsExporting(true);
      
      const { data, error } = await supabase.functions.invoke('schema-dump');
      
      if (error) {
        console.error('Schema dump error:', error);
        toast.error(`Failed to export schema: ${error.message}`);
        return;
      }

      // The response should be a blob containing the SQL file
      if (data instanceof Blob) {
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `schema_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success("Schema exported successfully!");
      } else {
        throw new Error("Invalid response format");
      }

    } catch (error) {
      console.error('Export failed:', error);
      toast.error("Failed to export schema. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Server-side SQL Schema Dump
        </CardTitle>
        <CardDescription>
          Generate a complete plain SQL dump of your database schema on the server. 
          This produces a psql-compatible file with all tables, functions, policies, and triggers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Export Contents:</h3>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div>• All tables with full column definitions</div>
            <div>• Primary keys, foreign keys, and constraints</div>
            <div>• Indexes and sequences</div>
            <div>• Views and materialized views</div>
            <div>• Functions and stored procedures</div>
            <div>• Triggers and Row Level Security policies</div>
            <div>• PostgreSQL extensions (PostGIS, pg_trgm)</div>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Usage Instructions:</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>1. Download the generated .sql file</div>
            <div>2. Run: <code className="bg-background px-1 rounded">psql -d your_database -f schema_YYYY-MM-DD.sql</code></div>
            <div>3. Or import into any PostgreSQL-compatible database</div>
          </div>
        </div>

        <Button 
          onClick={handleServerSchemaDump}
          disabled={isExporting}
          size="lg"
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating SQL Dump...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download SQL Schema Dump
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ServerSchemaDump;
