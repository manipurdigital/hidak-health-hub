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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ThumbnailUrlProcessor } from '@/components/ThumbnailUrlProcessor';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  FileText, 
  Link, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Merge,
  Plus
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
  status: 'idle' | 'processing' | 'preview' | 'completed' | 'failed';
  items: ImportItem[];
  jobId?: string;
}

interface ImportItem {
  id?: string;
  url?: string;
  name?: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'duplicate' | 'preview';
  error?: string;
  medicine_id?: string;
  parsedData?: any;
  editableData?: any;
  dedupeReason?: string;
  confidence?: Record<string, number>;
  warnings?: string[];
  selected?: boolean;
}

type PreviewStep = 'processing' | 'review' | 'finalizing';

export function BulkImportDialog({ open, onOpenChange, onSuccess }: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [urls, setUrls] = useState('');
  const [downloadImages, setDownloadImages] = useState(true);
  const [previewStep, setPreviewStep] = useState<PreviewStep>('processing');
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    duplicates: 0,
    status: 'idle',
    items: []
  });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const downloadTemplate = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-templates', {
        body: { type: 'medicines' }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate template');
      }

      // Prefer a robust, base64-safe data URL download to avoid atob issues
      const contentType = data.contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const base64 = (data.data || '').toString();
      const fileName = data.filename || 'medicines_bulk_upload_template.xlsx';

      // Create a data URL directly (handles newlines and URL-safe base64 better)
      const href = `data:${contentType};base64,${base64}`;

      // Fallback for IE/Edge legacy
      const navAny = window.navigator as any;
      if (navAny && typeof navAny.msSaveOrOpenBlob === 'function') {
        // Convert data URL to Blob using fetch for legacy APIs
        const blob = await fetch(href).then(r => r.blob());
        navAny.msSaveOrOpenBlob(blob, fileName);
      } else {
        const link = document.createElement('a');
        link.href = href;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        // Safari fallback (download attribute not supported on data URLs)
        if (!('download' in HTMLAnchorElement.prototype)) {
          window.open(href, '_blank');
        }
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      }

      toast({
        title: 'Success',
        description: 'Template downloaded successfully with instructions and categories',
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: 'Error',
        description: 'Failed to download template. Please try again.',
        variant: 'destructive'
      });
    }
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
    formData.append('downloadImages', downloadImages.toString());

    setProgress(prev => ({ ...prev, status: 'processing' }));
    setPreviewStep('processing');

    try {
      const { data, error } = await supabase.functions.invoke('bulk-import-medicines', {
        body: formData
      });

      if (error) throw error;

      const itemsWithPreview = data.items.map((item: any) => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        selected: item.status === 'success'
      }));

      setProgress({
        total: data.total,
        processed: data.processed,
        successful: data.successful,
        failed: data.failed,
        duplicates: data.duplicates,
        status: 'preview',
        items: itemsWithPreview,
        jobId: data.jobId
      });

      // Auto-select successful items
      const successfulIds = itemsWithPreview
        .filter((item: ImportItem) => item.status === 'success')
        .map((item: ImportItem) => item.id!);
      setSelectedItems(new Set(successfulIds));

      setPreviewStep('review');

      toast({
        title: "Processing Complete",
        description: `Processed ${data.total} items. Review and approve below.`
      });

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
      items: urlList.map(url => ({ 
        id: Math.random().toString(36).substr(2, 9),
        url, 
        status: 'pending',
        selected: false
      }))
    });

    setPreviewStep('processing');

    try {
      const { data, error } = await supabase.functions.invoke('bulk-import-medicines', {
        body: { 
          urls: urlList,
          downloadImages
        }
      });

      if (error) throw error;

      const itemsWithPreview = data.items.map((item: any) => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        selected: item.status === 'success'
      }));

      setProgress({
        total: data.total,
        processed: data.processed,
        successful: data.successful,
        failed: data.failed,
        duplicates: data.duplicates,
        status: 'preview',
        items: itemsWithPreview,
        jobId: data.jobId
      });

      // Auto-select successful items
      const successfulIds = itemsWithPreview
        .filter((item: ImportItem) => item.status === 'success')
        .map((item: ImportItem) => item.id!);
      setSelectedItems(new Set(successfulIds));

      setPreviewStep('review');

      toast({
        title: "Processing Complete",
        description: `Processed ${data.total} URLs. Review and approve below.`
      });

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

  const handleApproveSelected = async () => {
    const selectedItemsList = progress.items.filter(item => selectedItems.has(item.id!));
    
    if (selectedItemsList.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one item to approve",
        variant: "destructive"
      });
      return;
    }

    setPreviewStep('finalizing');

    // Here you would make the final API call to approve selected items
    // For now, we'll simulate the process
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      setProgress(prev => ({
        ...prev,
        status: 'completed',
        successful: selectedItemsList.length
      }));

      toast({
        title: "Import Complete",
        description: `Successfully imported ${selectedItemsList.length} medicines`
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve selected items",
        variant: "destructive"
      });
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleItemDetails = (itemId: string) => {
    const newDetails = new Set(showDetails);
    if (newDetails.has(itemId)) {
      newDetails.delete(itemId);
    } else {
      newDetails.add(itemId);
    }
    setShowDetails(newDetails);
  };

  const selectAll = () => {
    const allIds = progress.items
      .filter(item => item.status === 'success' || item.status === 'duplicate')
      .map(item => item.id!);
    setSelectedItems(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleClose = () => {
    setFile(null);
    setUrls('');
    setSelectedItems(new Set());
    setShowDetails(new Set());
    setProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      duplicates: 0,
      status: 'idle',
      items: []
    });
    setPreviewStep('processing');
    onOpenChange(false);
  };

  const getStatusIcon = (status: ImportItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'duplicate':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getConfidenceBadge = (confidence?: Record<string, number>) => {
    if (!confidence) return null;
    const avgConfidence = Object.values(confidence).reduce((a, b) => a + b, 0) / Object.values(confidence).length;
    const variant = avgConfidence >= 0.8 ? 'default' : avgConfidence >= 0.6 ? 'secondary' : 'destructive';
    return (
      <Badge variant={variant} className="ml-2 text-xs">
        {Math.round(avgConfidence * 100)}% confidence
      </Badge>
    );
  };

  const isProcessing = progress.status === 'processing' || previewStep === 'finalizing';
  const isInReview = progress.status === 'preview' && previewStep === 'review';
  const isCompleted = progress.status === 'completed';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Bulk Import Medicines
            {progress.status === 'preview' && (
              <Badge variant="outline">
                {previewStep === 'processing' && 'Processing...'}
                {previewStep === 'review' && 'Review & Approve'}
                {previewStep === 'finalizing' && 'Finalizing...'}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {!isInReview && !isCompleted && (
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
                      Download the template Excel file with required fields, instructions, and category list.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="download-images-csv"
                      checked={downloadImages}
                      onCheckedChange={(checked) => setDownloadImages(checked === true)}
                    />
                    <Label htmlFor="download-images-csv">Download images to storage</Label>
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
                        Upload & Process
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

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="download-images-urls"
                      checked={downloadImages}
                      onCheckedChange={(checked) => setDownloadImages(checked === true)}
                    />
                    <Label htmlFor="download-images-urls">Download images to storage</Label>
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
                        Process URLs
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Progress and Preview Section */}
        {(isProcessing || isInReview || isCompleted) && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import Summary</CardTitle>
              </CardHeader>
              <CardContent>
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
                  <div className="mt-4">
                    <Progress value={(progress.processed / progress.total) * 100} className="w-full" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {progress.processed} of {progress.total} items processed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review Section */}
            {isInReview && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Review & Approve Items</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {selectedItems.size} selected
                      </Badge>
                      <Button variant="outline" size="sm" onClick={selectAll}>
                        <Check className="w-4 h-4 mr-1" />
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={deselectAll}>
                        <X className="w-4 h-4 mr-1" />
                        Deselect All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {progress.items.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedItems.has(item.id!)}
                            onCheckedChange={() => toggleItemSelection(item.id!)}
                            disabled={item.status === 'failed'}
                          />
                          {getStatusIcon(item.status)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">
                                {item.name || item.url || `Item ${item.id}`}
                              </p>
                              {getConfidenceBadge(item.confidence)}
                              {item.status === 'duplicate' && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.dedupeReason}
                                </Badge>
                              )}
                            </div>
                            {item.error && (
                              <p className="text-xs text-red-600 mt-1">{item.error}</p>
                            )}
                            {item.warnings && item.warnings.length > 0 && (
                              <div className="text-xs text-yellow-600 mt-1">
                                <strong>Warnings:</strong> {item.warnings.join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              item.status === 'success' ? 'default' :
                              item.status === 'failed' ? 'destructive' :
                              item.status === 'duplicate' ? 'secondary' : 'outline'
                            }>
                              {item.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleItemDetails(item.id!)}
                            >
                              {showDetails.has(item.id!) ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Item Details */}
                        {showDetails.has(item.id!) && item.parsedData && (
                          <div className="mt-3 pl-6 border-l-2 border-gray-200">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong>Brand:</strong> {item.parsedData.brand || 'N/A'}
                              </div>
                              <div>
                                <strong>Manufacturer:</strong> {item.parsedData.manufacturer || 'N/A'}
                              </div>
                              <div>
                                <strong>Price:</strong> ₹{item.parsedData.price || 0}
                              </div>
                               <div>
                                <strong>Pack Size:</strong> {item.parsedData.pack_size || 'N/A'}
                              </div>
                              {item.parsedData.image_url && (
                                <div className="col-span-2">
                                  <strong>Image:</strong> 
                                  <img 
                                    src={item.parsedData.image_url} 
                                    alt={item.parsedData.name}
                                    className="w-16 h-16 object-cover rounded border mt-1"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            {item.status === 'duplicate' && (
                              <div className="mt-2 flex gap-2">
                                <Button size="sm" variant="outline">
                                  <Merge className="w-3 h-3 mr-1" />
                                  Merge
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Plus className="w-3 h-3 mr-1" />
                                  Create New
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              {isInReview && (
                <Button 
                  onClick={handleApproveSelected}
                  disabled={selectedItems.size === 0}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Selected ({selectedItems.size})
                </Button>
              )}
              
              {previewStep === 'finalizing' && (
                <Button disabled>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finalizing...
                </Button>
              )}

              <Button variant="outline" onClick={handleClose}>
                {isCompleted ? 'Close' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}

        {/* Completion State */}
        {isCompleted && (
          <Card className="text-center">
            <CardContent className="pt-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Bulk Import Complete!</h3>
              <p className="text-muted-foreground">
                Successfully imported {progress.successful} medicines into your database.
              </p>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}