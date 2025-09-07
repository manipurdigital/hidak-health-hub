import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, File, X, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SimpleFileUploadProps {
  onFileSelect: (file: File) => Promise<void>;
  accept: string;
  maxSize: number;
  label: string;
  onAuthRequired?: () => void;
}

export const SimpleFileUpload = ({ onFileSelect, accept, maxSize, label, onAuthRequired }: SimpleFileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await onFileSelect(selectedFile);
      setSelectedFile(null);
      // Reset the input
      const input = document.getElementById(`file-${label}`) as HTMLInputElement;
      if (input) input.value = '';
    } catch (error) {
      if (error instanceof Error && error.message === 'Authentication required' && onAuthRequired) {
        onAuthRequired();
      } else {
        console.error('Upload failed:', error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    const input = document.getElementById(`file-${label}`) as HTMLInputElement;
    if (input) input.value = '';
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {!isAuthenticated && (
        <Alert>
          <LogIn className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>Sign in to upload files</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onAuthRequired}
              >
                Sign In
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <Input
        id={`file-${label}`}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={isUploading || !isAuthenticated}
      />
      
      {selectedFile && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <File className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(selectedFile.size / 1024)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
            size="sm"
          >
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {label}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};