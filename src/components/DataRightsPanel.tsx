import React, { useState } from 'react';
import { Download, Trash2, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function DataRightsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);

  const handleDownloadData = async () => {
    if (!user) return;

    setIsDownloading(true);
    try {
      // Fetch all user data from various tables
      const [
        profileData,
        ordersData,
        bookingsData,
        consultationsData,
        prescriptionsData,
        addressesData,
        consentsData
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id),
        supabase.from('orders').select('*').eq('user_id', user.id),
        supabase.from('lab_bookings').select('*').eq('user_id', user.id),
        supabase.from('consultations').select('*').eq('patient_id', user.id),
        supabase.from('prescriptions').select('*').eq('patient_id', user.id),
        supabase.from('addresses').select('*').eq('user_id', user.id),
        supabase.from('user_consents').select('*').eq('user_id', user.id)
      ]);

      const userData = {
        user_info: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at
        },
        profile: profileData.data || [],
        orders: ordersData.data || [],
        lab_bookings: bookingsData.data || [],
        consultations: consultationsData.data || [],
        prescriptions: prescriptionsData.data || [],
        addresses: addressesData.data || [],
        consents: consentsData.data || [],
        export_info: {
          exported_at: new Date().toISOString(),
          export_version: '1.0',
          data_protection_act: 'DPDP Act 2023',
          retention_policy: 'Data retained as per healthcare regulations'
        }
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `healthplus-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Export Complete",
        description: "Your personal data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletionReason.trim()) return;

    setIsSubmittingDeletion(true);
    try {
      const { error } = await supabase
        .from('data_deletion_requests')
        .insert({
          user_id: user.id,
          notes: deletionReason,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Deletion Request Submitted",
        description: "Your account deletion request has been submitted. We'll process it within 30 days and contact you via email.",
      });

      setShowDeleteDialog(false);
      setDeletionReason('');
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Failed to submit deletion request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDeletion(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Data Rights (DPDP Act 2023)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Under India's Digital Personal Data Protection Act 2023, you have rights over your personal data. 
            Use these tools to exercise your rights.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* Download Data */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Download className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold">Download My Data</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get a complete copy of all your personal data in JSON format. 
                This includes your profile, orders, consultations, and consent records.
              </p>
              <Button 
                onClick={handleDownloadData}
                disabled={isDownloading}
                size="sm"
              >
                {isDownloading ? 'Preparing Download...' : 'Download Data'}
              </Button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg border-red-200">
            <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Delete My Account</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Request permanent deletion of your account and personal data. 
                This action cannot be undone. Medical records may be retained as required by law.
              </p>
              
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Request Account Deletion
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Account Deletion</DialogTitle>
                    <DialogDescription>
                      This will permanently delete your account and personal data. 
                      Medical records may be retained as required by healthcare regulations.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">
                        Reason for deletion (required)
                      </label>
                      <Textarea
                        placeholder="Please tell us why you want to delete your account..."
                        value={deletionReason}
                        onChange={(e) => setDeletionReason(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Warning:</strong> This action is irreversible. All your data, 
                        including orders, consultations, and preferences will be permanently deleted.
                        We'll process your request within 30 days.
                      </AlertDescription>
                    </Alert>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={!deletionReason.trim() || isSubmittingDeletion}
                    >
                      {isSubmittingDeletion ? 'Submitting...' : 'Submit Deletion Request'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Data Retention:</strong> Medical records are retained as per Indian healthcare regulations.</p>
          <p><strong>Processing Time:</strong> Data requests are processed within 30 days.</p>
          <p><strong>Contact:</strong> For data rights queries, email privacy@healthplus.com</p>
        </div>
      </CardContent>
    </Card>
  );
}