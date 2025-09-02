import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Download, Play, Settings, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface CrawlResult {
  success: boolean;
  totalProductsFound?: number;
  importedCount?: number;
  skippedCount?: number;
  failedCount?: number;
  errors?: string[];
  productUrls?: string[];
}

export const ImportManagement = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<CrawlResult | null>(null);
  const [config, setConfig] = useState({
    maxProducts: 50,
    useFirecrawl: true,
    dryRun: false
  });

  const handleStartCrawl = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      console.log('Starting 1mg crawl with config:', config);
      
      const { data, error } = await supabase.functions.invoke('crawl-1mg-popular', {
        body: config
      });

      if (error) {
        throw error;
      }

      setResults(data);
      
      if (data.success) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${data.importedCount} medicines, skipped ${data.skippedCount} duplicates`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Crawl error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to start import",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const progress = results ? 
    ((results.importedCount || 0) + (results.skippedCount || 0) + (results.failedCount || 0)) / (results.totalProductsFound || 1) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Medicine Imports</h2>
        <p className="text-muted-foreground">
          Import popular medicines and categories from Tata 1mg
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Import Configuration
          </CardTitle>
          <CardDescription>
            Configure the import settings before starting the crawl
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxProducts">Maximum Products</Label>
              <Input
                id="maxProducts"
                type="number"
                value={config.maxProducts}
                onChange={(e) => setConfig({...config, maxProducts: parseInt(e.target.value) || 50})}
                min="1"
                max="500"
                disabled={isRunning}
              />
              <p className="text-sm text-muted-foreground">
                Limit the number of products to import (1-500)
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="useFirecrawl">Use Firecrawl API</Label>
                  <p className="text-sm text-muted-foreground">
                    More reliable but uses API credits
                  </p>
                </div>
                <Switch
                  id="useFirecrawl"
                  checked={config.useFirecrawl}
                  onCheckedChange={(checked) => setConfig({...config, useFirecrawl: checked})}
                  disabled={isRunning}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dryRun">Dry Run Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Discover URLs without importing
                  </p>
                </div>
                <Switch
                  id="dryRun"
                  checked={config.dryRun}
                  onCheckedChange={(checked) => setConfig({...config, dryRun: checked})}
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button 
              onClick={handleStartCrawl} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Import
                </>
              )}
            </Button>

            <Button 
              variant="outline" 
              asChild
            >
              <a 
                href="https://supabase.com/dashboard/project/qaqmlmshpifwdnrvfkao/functions/crawl-1mg-popular/logs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Logs
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle>Import in Progress</CardTitle>
            <CardDescription>
              Please wait while we discover and import medicines from 1mg
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.totalProductsFound || 0}</div>
                <div className="text-sm text-muted-foreground">Products Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.importedCount || 0}</div>
                <div className="text-sm text-muted-foreground">Imported</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{results.skippedCount || 0}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.failedCount || 0}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">Import Errors ({results.errors.length}):</div>
                    <div className="text-sm max-h-32 overflow-y-auto">
                      {results.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="truncate">{error}</div>
                      ))}
                      {results.errors.length > 5 && (
                        <div className="text-muted-foreground">... and {results.errors.length - 5} more</div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {config.dryRun && results.productUrls && results.productUrls.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Discovered Product URLs ({results.productUrls.length}):</h4>
                <div className="max-h-48 overflow-y-auto space-y-1 text-sm">
                  {results.productUrls.slice(0, 10).map((url, index) => (
                    <div key={index} className="truncate text-muted-foreground">{url}</div>
                  ))}
                  {results.productUrls.length > 10 && (
                    <div className="text-muted-foreground">... and {results.productUrls.length - 10} more</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge variant={results.success ? "default" : "destructive"}>
                {results.success ? "Completed" : "Failed"}
              </Badge>
              {config.dryRun && <Badge variant="outline">Dry Run</Badge>}
              {config.useFirecrawl && <Badge variant="secondary">Firecrawl</Badge>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};