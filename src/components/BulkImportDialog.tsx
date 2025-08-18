import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  FileText, 
  Link, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download
} from 'lucide-react';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  duplicates: number;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  items: ImportItem[];
}

interface ImportItem {
  url?: string;
  name?: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'duplicate';
  error?: string;
  medicine_id?: string;
}

export function BulkImportDialog({ open, onOpenChange, onSuccess }: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [urls, setUrls] = useState('');
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    duplicates: 0,
    status: 'idle',
    items: []
  });
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = `name,brand,manufacturer,price,original_price,description,dosage,pack_size,requires_prescription,image_url
Paracetamol 500mg,Dolo,Micro Labs,5.50,8.00,"Pain and fever relief",500mg,10 tablets,false,
Amoxicillin 250mg,Amoxil,GSK,45.00,60.00,"Antibiotic for bacterial infections",250mg,10 capsules,true,
Aspirin 75mg,Disprin,Reckitt,12.00,15.00,"Blood thinner and pain relief",75mg,10 tablets,false,`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medicine_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setProgress(prev => ({ ...prev, status: 'processing' }));

    try {
      const { data, error } = await supabase.functions.invoke('bulk-import-medicines', {
        body: formData
      });

      if (error) throw error;

      setProgress({
        total: data.total,
        processed: data.processed,
        successful: data.successful,
        failed: data.failed,
        duplicates: data.duplicates,
        status: 'completed',
        items: data.items || []
      });

      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.successful} medicines`
      });

      if (data.successful > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('File upload error:', error);
      setProgress(prev => ({ ...prev, status: 'failed' }));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import file",
        variant: "destructive"
      });
    }
  };

  const handleUrlImport = async () => {
    const urlList = urls.split('\n').filter(url => url.trim()).map(url => url.trim());
    
    if (urlList.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one URL",
        variant: "destructive"
      });
      return;
    }

    setProgress({
      total: urlList.length,
      processed: 0,
      successful: 0,
      failed: 0,
      duplicates: 0,
      status: 'processing',
      items: urlList.map(url => ({ url, status: 'pending' }))
    });

    try {
      const { data, error } = await supabase.functions.invoke('bulk-import-urls', {
        body: { urls: urlList }
      });

      if (error) throw error;

      setProgress({
        total: data.total,
        processed: data.processed,
        successful: data.successful,
        failed: data.failed,
        duplicates: data.duplicates,
        status: 'completed',
        items: data.items || []
      });

      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.successful} medicines from URLs`
      });

      if (data.successful > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('URL import error:', error);
      setProgress(prev => ({ ...prev, status: 'failed' }));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import URLs",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setFile(null);
    setUrls('');
    setProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      duplicates: 0,
      status: 'idle',
      items: []
    });
    onOpenChange(false);
  };

  const getStatusIcon = (status: ImportItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'duplicate':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const isProcessing = progress.status === 'processing';
  const isCompleted = progress.status === 'completed';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Medicines</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="csv" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              CSV/Excel Upload
            </TabsTrigger>
            <TabsTrigger value="urls" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Paste URLs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Upload CSV/Excel File</CardTitle>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Supported formats: CSV, Excel (.xlsx, .xls)
                  </p>
                </div>

                <Button 
                  onClick={handleFileUpload}
                  disabled={!file || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Import
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="urls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import from URLs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="urls-input">Product URLs (one per line)</Label>
                  <Textarea
                    id="urls-input"
                    placeholder="https://www.1mg.com/drugs/...&#10;https://www.apollopharmacy.in/medicine/...&#10;https://www.netmeds.com/medicines/..."
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    rows={6}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Supported: Tata 1mg, Apollo Pharmacy, NetMeds, and other retailers
                  </p>
                </div>

                <Button 
                  onClick={handleUrlImport}
                  disabled={!urls.trim() || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing URLs...
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      Import from URLs
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Progress Section */}
        {(isProcessing || isCompleted) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{progress.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{progress.successful}</div>
                  <div className="text-sm text-muted-foreground">Success</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{progress.duplicates}</div>
                  <div className="text-sm text-muted-foreground">Duplicates</div>
                </div>
              </div>

              {isProcessing && (
                <div>
                  <Progress value={(progress.processed / progress.total) * 100} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {progress.processed} of {progress.total} items processed
                  </p>
                </div>
              )}

              {/* Item Details */}
              {progress.items.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {progress.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 border rounded">
                      {getStatusIcon(item.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.name || item.url || `Item ${index + 1}`}
                        </p>
                        {item.error && (
                          <p className="text-xs text-red-600">{item.error}</p>
                        )}
                      </div>
                      <Badge variant={
                        item.status === 'success' ? 'default' :
                        item.status === 'failed' ? 'destructive' :
                        item.status === 'duplicate' ? 'secondary' : 'outline'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClose}>
            {isCompleted ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}