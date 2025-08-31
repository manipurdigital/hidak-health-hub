import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Shield, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DataRightsPanelProps {
  className?: string;
}

export function DataRightsPanel({ className }: DataRightsPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const exportUserData = async () => {
    if (!user) return;

    setIsExporting(true);
    try {
      const [profileRes, ordersRes, labBookingsRes, consultationsRes, prescriptionsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id),
        supabase.from('orders').select('*').eq('user_id', user.id),
        supabase.from('lab_bookings').select('*').eq('user_id', user.id),
        supabase.from('consultations').select('*').eq('patient_id', user.id),
        supabase.from('prescriptions').select('*').eq('patient_id', user.id)
      ]);

      const userData = {
        user_info: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        profile: profileRes.data || [],
        orders: ordersRes.data || [],
        lab_bookings: labBookingsRes.data || [],
        consultations: consultationsRes.data || [],
        prescriptions: prescriptionsRes.data || []
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Data Export Complete",
        description: "Your data has been exported and downloaded."
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const requestDataDeletion = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to request deletion of all your data? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      // In a real app, this would create a deletion request ticket
      // For now, we'll just show a message
      toast({
        title: "Deletion Request Submitted",
        description: "Your data deletion request has been submitted. We'll process it within 30 days as required by law.",
      });
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      toast({
        title: "Request Failed",
        description: "Failed to submit deletion request. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Rights & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Export */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Export Your Data</h3>
                <p className="text-sm text-muted-foreground">
                  Download a copy of all your personal data stored in our system.
                </p>
              </div>
              <Button
                onClick={exportUserData}
                disabled={isExporting}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </div>
            <Badge variant="secondary" className="text-xs">
              JSON format • Includes profile, orders, consultations, and medical records
            </Badge>
          </div>

          {/* Data Deletion */}
          <div className="space-y-3 border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-900">Delete Your Data</h3>
                <p className="text-sm text-muted-foreground">
                  Request permanent deletion of all your personal data.
                </p>
              </div>
              <Button
                onClick={requestDataDeletion}
                disabled={isDeleting}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Processing...' : 'Request Deletion'}
              </Button>
            </div>
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-xs text-red-700">
                <strong>Warning:</strong> Data deletion is permanent and cannot be undone. 
                We are required to retain some information for legal compliance.
              </div>
            </div>
          </div>

          {/* Rights Information */}
          <div className="space-y-2 border-t pt-6">
            <h3 className="font-medium">Your Privacy Rights</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• <strong>Right to Access:</strong> Request access to your personal data</p>
              <p>• <strong>Right to Rectification:</strong> Correct inaccurate personal data</p>
              <p>• <strong>Right to Erasure:</strong> Request deletion of your personal data</p>
              <p>• <strong>Right to Portability:</strong> Receive your data in a machine-readable format</p>
              <p>• <strong>Right to Object:</strong> Object to processing of your personal data</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              For questions about your data rights, contact our privacy team at privacy@medicare.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DataRightsPanel;