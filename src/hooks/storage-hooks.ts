import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseSignedUrlProps {
  bucket: string;
  path: string;
  expiresIn?: number;
}

export const useSignedUrl = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getSignedUrl = useCallback(async ({ bucket, path, expiresIn = 3600 }: UseSignedUrlProps): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-signed-url', {
        body: { bucket, path, expiresIn }
      });

      if (error) {
        throw error;
      }

      return data.signedUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get signed URL';
      setError(errorMessage);
      toast({
        title: "Access Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { getSignedUrl, loading, error };
};

interface UseFileDownloadProps {
  bucket: string;
  path: string;
  fileName?: string;
}

export const useFileDownload = () => {
  const [downloading, setDownloading] = useState(false);
  const { getSignedUrl } = useSignedUrl();
  const { toast } = useToast();

  const downloadFile = useCallback(async ({ bucket, path, fileName }: UseFileDownloadProps) => {
    setDownloading(true);
    
    try {
      // Get signed URL for private buckets
      let downloadUrl: string;
      
      if (bucket === 'thumbnails') {
        // Public bucket - use public URL
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        downloadUrl = data.publicUrl;
      } else {
        // Private bucket - use signed URL
        const signedUrl = await getSignedUrl({ bucket, path });
        if (!signedUrl) {
          throw new Error('Failed to get download URL');
        }
        downloadUrl = signedUrl;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || path.split('/').pop() || 'download';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download started",
        description: "File download has begun"
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  }, [getSignedUrl, toast]);

  return { downloadFile, downloading };
};

export const useFileList = (bucket: string) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listFiles = useCallback(async (folder?: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder);

      if (error) {
        throw error;
      }

      setFiles(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list files';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [bucket]);

  const deleteFile = useCallback(async (path: string) => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw error;
      }

      // Remove from local state
      setFiles(prev => prev.filter(file => file.name !== path.split('/').pop()));
      
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }, [bucket]);

  return { files, loading, error, listFiles, deleteFile };
};