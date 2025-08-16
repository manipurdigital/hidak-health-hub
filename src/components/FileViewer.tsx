import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, File, Image, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSignedUrl, useFileDownload } from '@/hooks/storage-hooks';
import { useToast } from '@/hooks/use-toast';

interface FileInfo {
  name: string;
  path: string;
  bucket: 'prescriptions' | 'lab-reports' | 'thumbnails';
  size?: number;
  type?: string;
  uploadedAt?: string;
}

interface FileViewerProps {
  file: FileInfo;
  showPreview?: boolean;
  className?: string;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  file,
  showPreview = true,
  className = ''
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { getSignedUrl, loading: urlLoading } = useSignedUrl();
  const { downloadFile, downloading } = useFileDownload();
  const { toast } = useToast();

  const isImage = file.type?.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePreview = async () => {
    if (!showPreview) return;

    try {
      let url: string;
      
      if (file.bucket === 'thumbnails') {
        // Public bucket
        const { data } = await import('@/integrations/supabase/client').then(m => 
          m.supabase.storage.from(file.bucket).getPublicUrl(file.path)
        );
        url = data.publicUrl;
      } else {
        // Private bucket - get signed URL
        const signedUrl = await getSignedUrl({
          bucket: file.bucket,
          path: file.path,
          expiresIn: 3600
        });
        
        if (!signedUrl) {
          throw new Error('Failed to get preview URL');
        }
        url = signedUrl;
      }

      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Preview failed",
        description: error instanceof Error ? error.message : "Failed to load preview",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    downloadFile({
      bucket: file.bucket,
      path: file.path,
      fileName: file.name
    });
  };

  const getFileIcon = () => {
    if (isImage) return <Image className="h-5 w-5 text-blue-500" />;
    if (isPdf) return <File className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const getFileTypeLabel = () => {
    if (isImage) return 'Image';
    if (isPdf) return 'PDF';
    return 'Document';
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon()}
              <div>
                <CardTitle className="text-sm font-medium truncate max-w-48">
                  {file.name}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {getFileTypeLabel()}
                  </Badge>
                  {file.size && (
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {file.uploadedAt && (
            <p className="text-xs text-muted-foreground mb-3">
              Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
            </p>
          )}
          
          <div className="flex space-x-2">
            {showPreview && (isImage || isPdf) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={urlLoading}
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate">{file.name}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="mt-4">
            {previewUrl && (
              <>
                {isImage ? (
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="max-w-full max-h-[70vh] object-contain mx-auto rounded border"
                  />
                ) : isPdf ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[70vh] border rounded"
                    title={file.name}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Preview not available for this file type</p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};