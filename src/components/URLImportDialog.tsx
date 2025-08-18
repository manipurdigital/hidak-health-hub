import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, Download } from 'lucide-react';

interface URLImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedMedicine {
  name: string;
  brand: string;
  manufacturer: string;
  price: number;
  original_price: number;
  description: string;
  dosage: string;
  pack_size: string;
  requires_prescription: boolean;
  image_url?: string;
  source_url: string;
  source_domain: string;
}

export function URLImportDialog({ open, onOpenChange, onSuccess }: URLImportDialogProps) {
  const [url, setUrl] = useState('');
  const [downloadImages, setDownloadImages] = useState(true);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedMedicine | null>(null);
  const [editableData, setEditableData] = useState<ParsedMedicine | null>(null);
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
      const { data, error } = await supabase.functions.invoke('parse-medicine-url', {
        body: { 
          url: url.trim(),
          downloadImages 
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to parse URL');
      }

      const parsed = data.medicine as ParsedMedicine;
      setParsedData(parsed);
      setEditableData({ ...parsed });
      
      toast({
        title: "Success",
        description: "URL parsed successfully"
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
          brand: editableData.brand,
          manufacturer: editableData.manufacturer,
          price: editableData.price,
          original_price: editableData.original_price,
          description: editableData.description,
          dosage: editableData.dosage,
          pack_size: editableData.pack_size,
          requires_prescription: editableData.requires_prescription,
          image_url: editableData.image_url,
          source_url: editableData.source_url,
          stock_quantity: 10, // Default stock
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medicine imported successfully"
      });

      onSuccess();
      handleClose();
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

  const handleClose = () => {
    setUrl('');
    setParsedData(null);
    setEditableData(null);
    setDownloadImages(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Medicine from URL</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!parsedData ? (
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
          ) : (
            <div className="space-y-6">
              {/* Source Banner */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Imported from {parsedData.source_domain}
                    </span>
                    {downloadImages && parsedData.image_url && (
                      <Badge variant="secondary" className="ml-auto">
                        <Download className="w-3 h-3 mr-1" />
                        Image Downloaded
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Editable Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Medicine Name</Label>
                  <Input
                    id="edit-name"
                    value={editableData?.name || ''}
                    onChange={(e) => setEditableData(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-brand">Brand</Label>
                  <Input
                    id="edit-brand"
                    value={editableData?.brand || ''}
                    onChange={(e) => setEditableData(prev => prev ? { ...prev, brand: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-manufacturer">Manufacturer</Label>
                  <Input
                    id="edit-manufacturer"
                    value={editableData?.manufacturer || ''}
                    onChange={(e) => setEditableData(prev => prev ? { ...prev, manufacturer: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-dosage">Dosage</Label>
                  <Input
                    id="edit-dosage"
                    value={editableData?.dosage || ''}
                    onChange={(e) => setEditableData(prev => prev ? { ...prev, dosage: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-price">Current Price</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editableData?.price || 0}
                    onChange={(e) => setEditableData(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-original-price">MRP</Label>
                  <Input
                    id="edit-original-price"
                    type="number"
                    step="0.01"
                    value={editableData?.original_price || 0}
                    onChange={(e) => setEditableData(prev => prev ? { ...prev, original_price: parseFloat(e.target.value) || 0 } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-pack-size">Pack Size</Label>
                  <Input
                    id="edit-pack-size"
                    value={editableData?.pack_size || ''}
                    onChange={(e) => setEditableData(prev => prev ? { ...prev, pack_size: e.target.value } : null)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  rows={3}
                  value={editableData?.description || ''}
                  onChange={(e) => setEditableData(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-rx"
                  checked={editableData?.requires_prescription || false}
                  onCheckedChange={(checked) => setEditableData(prev => prev ? { ...prev, requires_prescription: checked } : null)}
                />
                <Label htmlFor="edit-rx">Requires Prescription</Label>
              </div>

              {/* Image Preview */}
              {editableData?.image_url && (
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

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Medicine'
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
                  }}
                >
                  Parse Another URL
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}