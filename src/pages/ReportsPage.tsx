import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Download, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface LabReport {
  id: string;
  report_name: string;
  report_url: string;
  uploaded_at: string;
  file_size: number;
  file_type: string;
  booking_id?: string;
}

const ReportsPage = () => {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportName, setReportName] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_reports')
        .select('*')
        .eq('user_id', user?.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (only PDFs)
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid File",
          description: "Please select a PDF file",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      if (!reportName) {
        setReportName(file.name.replace('.pdf', ''));
      }
    }
  };

  const sanitizeFileName = (fileName: string) => {
    // Remove special characters and replace spaces with underscores
    return fileName
      .replace(/[^\w\s.-]/g, '') // Remove special characters except word chars, spaces, dots, and hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .toLowerCase();
  };

  const handleUpload = async () => {
    if (!selectedFile || !reportName || !user) return;

    setUploading(true);

    try {
      // Upload file to Supabase Storage with sanitized filename
      const fileExt = 'pdf';
      const sanitizedName = sanitizeFileName(selectedFile.name);
      const fileName = `${Date.now()}-${sanitizedName}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lab-reports')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('lab-reports')
        .getPublicUrl(filePath);

      // Save report metadata to database
      const { error: dbError } = await supabase
        .from('lab_reports')
        .insert([{
          user_id: user.id,
          report_name: reportName,
          report_url: publicUrl,
          file_size: selectedFile.size,
          file_type: selectedFile.type
        }]);

      if (dbError) throw dbError;

      toast({
        title: "Upload Successful",
        description: "Your lab report has been uploaded successfully",
      });

      // Reset form
      setSelectedFile(null);
      setReportName('');
      
      // Refresh reports list
      fetchReports();

    } catch (error) {
      console.error('Error uploading report:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (report: LabReport) => {
    try {
      // Get a signed URL for secure download
      const urlParts = report.report_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user?.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('lab-reports')
        .createSignedUrl(filePath, 60); // URL valid for 60 seconds

      if (error) {
        console.error('Error creating signed URL:', error);
        // Fallback to direct download
        const link = document.createElement('a');
        link.href = report.report_url;
        link.download = `${report.report_name}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Download using signed URL
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = `${report.report_name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "Your report download has started",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4">Login Required</h2>
            <p className="text-muted-foreground mb-6">Please login to access your lab reports</p>
            <Button onClick={() => navigate('/auth')}>
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-xl font-semibold">Lab Reports</h1>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload New Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reportName">Report Name</Label>
                  <Input
                    id="reportName"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter report name"
                  />
                </div>

                <div>
                  <Label htmlFor="fileUpload">Select PDF File</Label>
                  <Input
                    id="fileUpload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum file size: 10MB. Only PDF files are allowed.
                  </p>
                </div>

                {selectedFile && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                )}

                <Button 
                  className="w-full"
                  onClick={handleUpload}
                  disabled={!selectedFile || !reportName || uploading}
                >
                  {uploading ? "Uploading..." : "Upload Report"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Your Lab Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reports uploaded</h3>
                    <p className="text-muted-foreground">Upload your first lab report to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{report.report_name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(report.uploaded_at), 'PPP')}
                              </span>
                              <span>{formatFileSize(report.file_size)}</span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(report)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;