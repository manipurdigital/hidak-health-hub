import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Check, AlertCircle, Loader2 } from 'lucide-react';

interface ThumbnailUrlProcessorProps {
  onProcessed: (url: string) => void;
  disabled?: boolean;
}

export const ThumbnailUrlProcessor: React.FC<ThumbnailUrlProcessorProps> = ({
  onProcessed,
  disabled = false
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const validateImageUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i) !== null;
    } catch {
      return false;
    }
  };

  const processImageUrl = async () => {
    if (!imageUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter an image URL",
        variant: "destructive"
      });
      return;
    }

    if (!validateImageUrl(imageUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL (jpg, png, webp, gif)",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setStatus('processing');

    try {
      const { data, error } = await supabase.functions.invoke('fetch-and-store-image', {
        body: {
          imageUrl: imageUrl.trim(),
          maxSizeBytes: 2097152 // 2MB
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to process image');
      }

      // Validate image dimensions
      const img = new Image();
      img.onload = () => {
        if (img.width < 200 || img.height < 200) {
          toast({
            title: "Image too small",
            description: "Image must be at least 200×200 pixels",
            variant: "destructive"
          });
          setStatus('error');
          setProcessing(false);
          return;
        }

        onProcessed(data.publicUrl);
        setStatus('success');
        setProcessing(false);
        toast({
          title: "Success",
          description: "Image processed and uploaded successfully"
        });

        // Reset after success
        setTimeout(() => {
          setImageUrl('');
          setStatus('idle');
        }, 2000);
      };

      img.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to load processed image",
          variant: "destructive"
        });
        setStatus('error');
        setProcessing(false);
      };

      img.src = data.publicUrl;

    } catch (error: any) {
      console.error('Image processing error:', error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process and store image",
        variant: "destructive"
      });
      setStatus('error');
      setProcessing(false);
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'processing':
        return 'Processing...';
      case 'success':
        return 'Processed';
      case 'error':
        return 'Try Again';
      default:
        return 'Process Image';
    }
  };

  const getButtonIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success':
        return <Check className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Paste image URL to process..."
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        disabled={processing || disabled}
        className="flex-1"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={processImageUrl}
        disabled={processing || disabled || !imageUrl.trim()}
        className={`${
          status === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : status === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : ''
        }`}
      >
        {getButtonIcon()}
        <span className="ml-2">{getButtonText()}</span>
      </Button>
    </div>
  );
};