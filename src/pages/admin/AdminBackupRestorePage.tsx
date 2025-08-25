
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Download, Upload, Database, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminBackupRestorePage = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMode, setRestoreMode] = useState<"append" | "replace">("append");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      console.log('Starting database backup...');

      // Call the backup edge function
      const response = await fetch(`https://qaqmlmshpifwdnrvfkao.supabase.co/functions/v1/db-backup`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Check if response is NDJSON content
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/x-ndjson')) {
        const blob = await response.blob();
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `database-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.ndjson`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success("Database backup downloaded successfully!");
      } else {
        throw new Error("Invalid response format");
      }

    } catch (error) {
      console.error('Backup failed:', error);
      toast.error(`Failed to backup database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.ndjson')) {
        toast.error("Please select an NDJSON file");
        return;
      }
      setSelectedFile(file);
      console.log('Selected restore file:', file.name, 'Size:', file.size, 'bytes');
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      toast.error("Please select a backup file first");
      return;
    }

    try {
      setIsRestoring(true);
      
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      console.log(`Starting database restore in ${restoreMode} mode...`);

      // Prepare form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('mode', restoreMode);

      // Call the restore edge function
      const response = await fetch(`https://qaqmlmshpifwdnrvfkao.supabase.co/functions/v1/db-restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('Restore completed:', result);
        toast.success(`Database restored successfully! Processed ${result.totalRows} rows across ${Object.keys(result.tableCounts).length} tables.`);
        setSelectedFile(null);
        
        // Reset file input
        const fileInput = document.getElementById('restore-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error("Restore operation failed");
      }

    } catch (error) {
      console.error('Restore failed:', error);
      toast.error(`Failed to restore database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Database Backup & Restore</h1>
          <p className="text-muted-foreground">
            Manage complete database backups and restoration
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Backup Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Database Backup
            </CardTitle>
            <CardDescription>
              Download a complete backup of all database tables in NDJSON format.
              This includes all user data, configurations, and application state.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Backup Contents:</h3>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div>• All public schema tables</div>
                <div>• User profiles and authentication data</div>
                <div>• Orders, medicines, and lab bookings</div>
                <div>• System configurations and settings</div>
                <div>• Excludes geometry columns and system tables</div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Note:</strong> Large databases may take several minutes to backup. 
                The download will begin automatically when ready.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleBackup}
              disabled={isBackingUp}
              size="lg"
              className="w-full"
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Database Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Restore Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Database Restore
            </CardTitle>
            <CardDescription>
              Restore database from a previously created NDJSON backup file.
              Choose between append or replace modes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="restore-mode">Restore Mode</Label>
              <Select value={restoreMode} onValueChange={(value: "append" | "replace") => setRestoreMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="append">
                    <div className="space-y-1">
                      <div className="font-medium">Append Mode</div>
                      <div className="text-xs text-muted-foreground">Add data to existing tables</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="replace">
                    <div className="space-y-1">
                      <div className="font-medium">Replace Mode</div>
                      <div className="text-xs text-muted-foreground">Clear tables first, then restore</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="restore-file">Backup File (.ndjson)</Label>
              <Input
                id="restore-file"
                type="file"
                accept=".ndjson"
                onChange={handleFileSelect}
                className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium"
              />
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            {restoreMode === "replace" && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Warning:</strong> Replace mode will permanently delete all existing data 
                  in the tables before restoring. This action cannot be undone.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleRestore}
              disabled={isRestoring || !selectedFile}
              size="lg"
              className="w-full"
              variant={restoreMode === "replace" ? "destructive" : "default"}
            >
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restoring Database...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {restoreMode === "replace" ? "Replace Database" : "Restore Database"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Backup Process:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
              <li>Click "Download Database Backup" to start the process</li>
              <li>Wait for the backup file to be generated (may take a few minutes)</li>
              <li>The .ndjson file will download automatically to your computer</li>
              <li>Store the backup file securely for future restoration</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium mb-2">Restore Process:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
              <li>Choose your restore mode (Append or Replace)</li>
              <li>Select the .ndjson backup file from your computer</li>
              <li>Click the restore button to begin the process</li>
              <li>Wait for the restoration to complete</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium mb-2">Important Notes:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Always test restores in a development environment first</li>
              <li>Replace mode will permanently delete existing data</li>
              <li>Large backups may take significant time to restore</li>
              <li>Ensure you have adequate storage space for backup files</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBackupRestorePage;
