import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { IPGuardBanner } from '@/components/IPGuardBanner';
import { AttributionDisplay } from '@/components/AttributionDisplay';
import { 
  Loader2, 
  ExternalLink, 
  Download, 
  AlertTriangle, 
  CheckCircle,
  Copy,
  ArrowRight,
  Merge,
  Plus
} from 'lucide-react';

interface URLImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedMedicine {
  name: string;
  generic_name?: string;
  brand: string;
  manufacturer: string;
  price: number;
  original_price: number;
  description: string;
  dosage: string;
  pack_size: string;
  requires_prescription: boolean;
  image_url?: string;
  thumbnail_url?: string;
  composition_text?: string;
  salt_composition?: string;
  composition_key?: string;
  composition_family_key?: string;
  external_source_url: string;
  external_source_domain: string;
  source_attribution: string;
  confidence?: Record<string, number>;
}

interface ImportResult {
  success: boolean;
  medicineId?: string;
  mode: 'created' | 'updated' | 'failed';
  dedupeReason?: string;
  warnings: string[];
  error?: string;
  existingMedicine?: any;
}

type ImportStep = 'input' | 'preview' | 'dedupe' | 'completed';

export function URLImportDialog({ open, onOpenChange, onSuccess }: URLImportDialogProps) {
  const [url, setUrl] = useState('');
  const [downloadImages, setDownloadImages] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<ImportStep>('input');
  const [parsedData, setParsedData] = useState<ParsedMedicine | null>(null);
  const [editableData, setEditableData] = useState<ParsedMedicine | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleFetchAndParse = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-medicine-from-url', {
        body: { 
          url: url.trim(),
          options: { 
            downloadImages,
            respectRobots: true
          }
        }
      });

      if (error) throw error;

      if (!data.success) {
        if (data.error === 'disallowed_by_robots') {
          toast({
            title: "Blocked by robots.txt",
            description: "This site does not allow automated access. Please try a different URL.",
            variant: "destructive"
          });
          return;
        }
        throw new Error(data.error || 'Failed to parse URL');
      }

      // If duplicate found, show dedupe options
      if (data.mode === 'updated' && data.dedupeReason) {
        setImportResult(data);
        setStep('dedupe');
      } else if (data.mode === 'created') {
        // Already inserted by the edge function; mark as completed
        toast({ title: 'Imported', description: 'Medicine saved successfully' });
        setStep('completed');
        onSuccess();
      } else {
        // Show preview for enrichment-only responses
        const parsed = data.medicineData || data.medicine || {};
        const normalized: ParsedMedicine = {
          ...(parsed as any),
          composition_text: parsed.composition_text || parsed.salt_composition || parsed.composition || '',
          image_url: parsed.thumbnail_url || parsed.image_url,
          thumbnail_url: parsed.thumbnail_url || parsed.image_url,
        };
        setParsedData(normalized);
        setEditableData({ ...normalized });
        setStep('preview');
      }

      toast({
        title: 'Success',
        description: data.mode === 'updated' ? 'Found existing medicine' : 'URL parsed successfully'
      });
    } catch (error) {
      console.error('URL parsing error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to parse URL",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editableData) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('medicines')
        .insert({
          name: editableData.name,
          generic_name: editableData.generic_name,
          brand: editableData.brand,
          manufacturer: editableData.manufacturer,
          price: editableData.price,
          original_price: editableData.original_price,
          description: editableData.description,
          dosage: editableData.dosage,
          pack_size: editableData.pack_size,
          requires_prescription: editableData.requires_prescription,
          image_url: editableData.image_url,
          thumbnail_url: editableData.thumbnail_url || editableData.image_url,
          composition: editableData.composition_text,
          salt_composition: editableData.composition_text,
          composition_key: editableData.composition_key,
          composition_family_key: editableData.composition_family_key,
          external_source_url: editableData.external_source_url,
          external_source_domain: editableData.external_source_domain,
          source_attribution: editableData.source_attribution,
          stock_quantity: 10,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medicine imported successfully"
      });

      setStep('completed');
      onSuccess();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save medicine",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMergeExisting = async () => {
    if (!importResult?.existingMedicine || !editableData) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('medicines')
        .update({
          price: editableData.price,
          original_price: editableData.original_price,
          description: editableData.description || importResult.existingMedicine.description,
          image_url: editableData.image_url || importResult.existingMedicine.image_url,
          thumbnail_url: editableData.thumbnail_url || editableData.image_url || importResult.existingMedicine.thumbnail_url,
          composition: editableData.composition_text || importResult.existingMedicine.composition,
          salt_composition: editableData.composition_text || importResult.existingMedicine.salt_composition,
          composition_key: editableData.composition_key || importResult.existingMedicine.composition_key,
          composition_family_key: editableData.composition_family_key || importResult.existingMedicine.composition_family_key,
          external_source_url: editableData.external_source_url,
          source_last_fetched: new Date().toISOString()
        })
        .eq('id', importResult.medicineId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Existing medicine updated successfully"
      });

      setStep('completed');
      onSuccess();
    } catch (error) {
      console.error('Merge error:', error);
      toast({
        title: "Error",
        description: "Failed to update existing medicine",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (!importResult) return;
    
    // Convert import result to parsed data for preview
    const medicineData = {
      ...editableData,
      name: editableData?.name + ' (New)',
    } as ParsedMedicine;
    
    setParsedData(medicineData);
    setEditableData(medicineData);
    setStep('preview');
  };

  const handleClose = () => {
    setUrl('');
    setParsedData(null);
    setEditableData(null);
    setImportResult(null);
    setStep('input');
    setDownloadImages(true);
    onOpenChange(false);
  };

  const getConfidenceColor = (field: string, confidence?: Record<string, number>) => {
    if (!confidence || !confidence[field]) return '';
    const score = confidence[field];
    if (score >= 0.8) return 'border-green-300 bg-green-50';
    if (score >= 0.6) return 'border-yellow-300 bg-yellow-50';
    return 'border-red-300 bg-red-50';
  };

  const getConfidenceBadge = (field: string, confidence?: Record<string, number>) => {
    if (!confidence || !confidence[field]) return null;
    const score = confidence[field];
    const variant = score >= 0.8 ? 'default' : score >= 0.6 ? 'secondary' : 'destructive';
    return (
      <Badge variant={variant} className="ml-2 text-xs">
        {Math.round(score * 100)}% confidence
      </Badge>
    );
  };

  const renderDiffField = (
    label: string,
    field: keyof ParsedMedicine,
    type: 'text' | 'number' | 'textarea' = 'text'
  ) => {
    const parsedValue = parsedData?.[field] || '';
    const editableValue = editableData?.[field] || '';
    const hasChanged = parsedValue !== editableValue;
    const confidence = parsedData?.confidence;

    return (
      <div className="space-y-2">
        <Label className="flex items-center">
          {label}
          {getConfidenceBadge(field as string, confidence)}
          {hasChanged && <Badge variant="outline" className="ml-2">Modified</Badge>}
        </Label>
        <div className="grid grid-cols-2 gap-4">
          {/* Parsed Value */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Parsed from URL</Label>
            <div className={`p-2 rounded border bg-gray-50 text-sm ${getConfidenceColor(field as string, confidence)}`}>
              {String(parsedValue) || <span className="text-muted-foreground italic">Empty</span>}
            </div>
          </div>
          
          {/* Editable Value */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Final Value (Editable)</Label>
            {type === 'textarea' ? (
              <Textarea
                value={String(editableValue)}
                onChange={(e) => setEditableData(prev => prev ? { ...prev, [field]: e.target.value } : null)}
                rows={3}
                className={hasChanged ? 'border-blue-300 bg-blue-50' : ''}
              />
            ) : (
              <Input
                type={type}
                step={type === 'number' ? '0.01' : undefined}
                value={String(editableValue)}
                onChange={(e) => setEditableData(prev => prev ? { 
                  ...prev, 
                  [field]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value 
                } : null)}
                className={hasChanged ? 'border-blue-300 bg-blue-50' : ''}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Import Medicine from URL
            <Badge variant="outline">
              {step === 'input' && 'Step 1: URL Input'}
              {step === 'preview' && 'Step 2: Review & Edit'}
              {step === 'dedupe' && 'Step 2: Duplicate Found'}
              {step === 'completed' && 'Completed'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-url">Product URL</Label>
                <Input
                  id="product-url"
                  placeholder="https://www.1mg.com/drugs/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Supported: Tata 1mg, Apollo Pharmacy, and other medicine retailers
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="download-images"
                  checked={downloadImages}
                  onCheckedChange={setDownloadImages}
                />
                <Label htmlFor="download-images">Download images to Hidak storage</Label>
              </div>

              <Button 
                onClick={handleFetchAndParse}
                disabled={loading || !url.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching & Parsing...
                  </>
                ) : (
                  'Fetch & Parse'
                )}
              </Button>
            </div>
          )}

          {step === 'dedupe' && importResult && (
            <div className="space-y-6">
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="w-5 h-5" />
                    Duplicate Medicine Found
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded border">
                    <p className="text-sm font-medium">Matched existing medicine:</p>
                    <p className="text-lg font-semibold">{importResult.existingMedicine?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Reason:</strong> {importResult.dedupeReason}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button onClick={handleMergeExisting} disabled={loading}>
                      <Merge className="w-4 h-4 mr-2" />
                      Merge with Existing
                    </Button>
                    <Button variant="outline" onClick={handleCreateNew}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Anyway
                    </Button>
                  </div>

                  {importResult.warnings.length > 0 && (
                    <div className="bg-white p-3 rounded border">
                      <Label className="text-sm font-medium">Warnings:</Label>
                      <ul className="text-sm text-amber-700 list-disc list-inside">
                        {importResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'preview' && parsedData && editableData && (
            <div className="space-y-6">
              {/* IP Guard Banner */}
              <IPGuardBanner
                domain={parsedData.external_source_domain}
                isHotlinked={!downloadImages && !!parsedData.image_url}
                sourceAttribution={parsedData.source_attribution}
                originalImageUrl={parsedData.image_url}
                isAllowlisted={false} // Would check against allowlist
                onImageUpdate={(newUrl) => setEditableData(prev => prev ? { ...prev, image_url: newUrl } : null)}
                onAttributionUpdate={(newAttribution) => setEditableData(prev => prev ? { ...prev, source_attribution: newAttribution } : null)}
              />

              {/* Confidence Legend */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-medium">Confidence Level:</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
                      <span>High (80%+)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded"></div>
                      <span>Medium (60-80%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
                      <span>Low (&lt;60%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Diff/Preview Form */}
              <div className="space-y-6">
                {renderDiffField('Medicine Name', 'name')}
                
                <div className="grid grid-cols-2 gap-6">
                  {renderDiffField('Brand', 'brand')}
                  {renderDiffField('Generic Name', 'generic_name')}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {renderDiffField('Manufacturer', 'manufacturer')}
                  {renderDiffField('Dosage', 'dosage')}
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {renderDiffField('Current Price', 'price', 'number')}
                  {renderDiffField('MRP', 'original_price', 'number')}
                  {renderDiffField('Pack Size', 'pack_size')}
                </div>

                {renderDiffField('Salt Composition (Generic)', 'composition_text')}
                {renderDiffField('Description', 'description', 'textarea')}

                <div className="space-y-2">
                  <Label className="flex items-center">
                    Requires Prescription
                    {getConfidenceBadge('requires_prescription', parsedData.confidence)}
                  </Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Parsed:</span>
                      <Badge variant={parsedData.requires_prescription ? 'destructive' : 'secondary'}>
                        {parsedData.requires_prescription ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editableData.requires_prescription}
                        onCheckedChange={(checked) => setEditableData(prev => prev ? { ...prev, requires_prescription: checked } : null)}
                      />
                      <span className="text-sm">Final</span>
                    </div>
                  </div>
                </div>

                {/* Image Preview */}
                {editableData.image_url && (
                  <div>
                    <Label>Product Image</Label>
                    <div className="mt-2">
                      <img 
                        src={editableData.image_url} 
                        alt={editableData.name}
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Medicine
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setParsedData(null);
                    setEditableData(null);
                    setStep('input');
                  }}
                >
                  Parse Another URL
                </Button>
              </div>
            </div>
          )}

          {step === 'completed' && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Medicine Imported Successfully!</h3>
                <p className="text-muted-foreground">The medicine has been added to your database.</p>
              </div>
              <div className="flex space-x-2 justify-center">
                <Button onClick={handleClose}>
                  Close
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setParsedData(null);
                    setEditableData(null);
                    setImportResult(null);
                    setStep('input');
                  }}
                >
                  Import Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}