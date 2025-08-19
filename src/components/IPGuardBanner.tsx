import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  ExternalLink, 
  Download, 
  Shield, 
  Eye,
  Edit3,
  Globe
} from 'lucide-react';

interface IPGuardBannerProps {
  domain: string;
  isHotlinked: boolean;
  sourceAttribution: string;
  originalImageUrl?: string;
  isAllowlisted: boolean;
  onImageUpdate?: (newImageUrl: string) => void;
  onAttributionUpdate?: (newAttribution: string) => void;
}

// Domain allowlist for copyright compliance
const TRUSTED_DOMAINS = [
  '1mg.com',
  'apollopharmacy.in',
  'netmeds.com',
  'pharmeasy.in'
];

export function IPGuardBanner({ 
  domain, 
  isHotlinked, 
  sourceAttribution, 
  originalImageUrl,
  isAllowlisted,
  onImageUpdate,
  onAttributionUpdate 
}: IPGuardBannerProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [customAttribution, setCustomAttribution] = useState(sourceAttribution);

  const getTrustLevel = () => {
    if (TRUSTED_DOMAINS.some(trusted => domain.includes(trusted))) {
      return { level: 'trusted', color: 'bg-green-50 border-green-200', textColor: 'text-green-800' };
    }
    if (isAllowlisted) {
      return { level: 'allowlisted', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-800' };
    }
    return { level: 'unknown', color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-800' };
  };

  const trustLevel = getTrustLevel();

  const handleImageUpdate = () => {
    if (newImageUrl && onImageUpdate) {
      onImageUpdate(newImageUrl);
      setNewImageUrl('');
      setShowImageDialog(false);
    }
  };

  const handleAttributionUpdate = () => {
    if (onAttributionUpdate) {
      onAttributionUpdate(customAttribution);
    }
  };

  return (
    <>
      <Card className={`${trustLevel.color} border-l-4`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={`w-5 h-5 ${trustLevel.textColor}`} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium ${trustLevel.textColor}`}>
                    Source: {domain}
                  </span>
                  <Badge 
                    variant={trustLevel.level === 'trusted' ? 'default' : 
                             trustLevel.level === 'allowlisted' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {trustLevel.level === 'trusted' ? 'Trusted' : 
                     trustLevel.level === 'allowlisted' ? 'Allowlisted' : 'Review Required'}
                  </Badge>
                  
                  {isHotlinked && (
                    <Badge variant="destructive" className="text-xs">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Hotlinked Image
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {sourceAttribution}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isHotlinked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageDialog(true)}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Fix Image
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                {showDetails ? 'Hide' : 'Details'}
              </Button>
            </div>
          </div>

          {showDetails && (
            <div className="mt-4 pt-4 border-t border-muted space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Copyright Status</Label>
                  <div className="mt-1">
                    {trustLevel.level === 'trusted' ? (
                      <span className="text-green-700">✓ From trusted medical retailer</span>
                    ) : trustLevel.level === 'allowlisted' ? (
                      <span className="text-blue-700">✓ Domain approved for imports</span>
                    ) : (
                      <span className="text-yellow-700">⚠ Manual review required</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="font-medium">Image Hosting</Label>
                  <div className="mt-1">
                    {isHotlinked ? (
                      <span className="text-red-700">✗ External hotlink - requires download</span>
                    ) : (
                      <span className="text-green-700">✓ Stored in our bucket</span>
                    )}
                  </div>
                </div>
              </div>

              {originalImageUrl && isHotlinked && (
                <div>
                  <Label className="font-medium">Original Image URL</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-xs font-mono break-all">
                    {originalImageUrl}
                  </div>
                </div>
              )}

              <div>
                <Label className="font-medium flex items-center gap-2">
                  Attribution
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAttributionUpdate}
                    className="h-6 px-2 text-xs"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </Label>
                <Textarea
                  value={customAttribution}
                  onChange={(e) => setCustomAttribution(e.target.value)}
                  className="mt-1 text-xs"
                  rows={2}
                />
              </div>

              {trustLevel.level === 'unknown' && (
                <div className="bg-yellow-100 border border-yellow-200 rounded p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-xs text-yellow-800">
                      <div className="font-medium mb-1">Manual Review Required</div>
                      <div>This domain is not in our trusted list. Please verify:</div>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        <li>Content is from a legitimate source</li>
                        <li>No copyright restrictions apply</li>
                        <li>Attribution is accurate and complete</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Replacement Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Replace Hotlinked Image
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  The current image is hotlinked from an external source. For copyright compliance,
                  please either download it to our storage or provide your own image URL.
                </div>
              </div>
            </div>

            {originalImageUrl && (
              <div>
                <Label>Current External Image</Label>
                <div className="mt-1 p-2 bg-muted rounded text-xs font-mono break-all">
                  {originalImageUrl}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="new-image-url">New Image URL</Label>
              <Input
                id="new-image-url"
                placeholder="https://your-domain.com/image.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Provide a URL to an image you own or have permission to use
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleImageUpdate} disabled={!newImageUrl}>
                Update Image
              </Button>
              <Button variant="outline" onClick={() => setShowImageDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}