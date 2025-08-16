import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Upload, File, X, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FileUploadProps {
  bucket: 'prescriptions' | 'lab-reports' | 'thumbnails';
  allowedTypes?: string[];
  maxSizeKB?: number;
  onUploadComplete?: (url: string, path: string) => void;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  bucket,
  allowedTypes = ['image/*', 'application/pdf'],
  maxSizeKB = 10240, // 10MB default
  onUploadComplete,
  className = ''
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const validateFile = (selectedFile: File): boolean => {
    // Check file type
    const isValidType = allowedTypes.some(type => {
      if (type.includes('*')) {
        return selectedFile.type.startsWith(type.replace('*', ''));
      }
      return selectedFile.type === type;
    });

    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: `Please select a file of type: ${allowedTypes.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }

    // Check file size
    if (selectedFile.size > maxSizeKB * 1024) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSizeKB}KB`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!validateFile(selectedFile)) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setFile(selectedFile);

    // Create preview for images and PDFs
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else if (selectedFile.type === 'application/pdf') {
      setPreviewUrl('pdf');
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setProgress(0);

    try {
      // Create file path with user ID for security
      const timestamp = Date.now();
      const fileName = `${user.id}/${timestamp}-${file.name}`;

      // Upload file (progress simulation for better UX)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        throw error;
      }

      // Get public URL for thumbnails, signed URL for others
      let fileUrl: string;
      if (bucket === 'thumbnails') {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);
        fileUrl = publicUrl;
      } else {
        // For private buckets, return the path - components can get signed URLs as needed
        fileUrl = data.path;
      }

      toast({
        title: "Upload successful",
        description: "File uploaded successfully"
      });

      onUploadComplete?.(fileUrl, data.path);
      
      // Reset form
      setFile(null);
      setPreviewUrl(null);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (previewUrl && previewUrl !== 'pdf') {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload" className="text-sm font-medium">
              Upload File
            </Label>
            <Input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept={allowedTypes.join(',')}
              onChange={handleFileSelect}
              disabled={uploading}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Supported formats: {allowedTypes.join(', ')} • Max size: {maxSizeKB}KB
            </p>
          </div>

          {file && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {previewUrl && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Preview</span>
                  </div>
                  {previewUrl === 'pdf' ? (
                    <div className="flex items-center justify-center h-32 bg-muted rounded border-2 border-dashed">
                      <div className="text-center">
                        <File className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">PDF Preview</p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-32 object-contain rounded border"
                    />
                  )}
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};