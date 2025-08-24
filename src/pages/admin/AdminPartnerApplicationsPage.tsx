import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Truck
} from 'lucide-react';

interface Application {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
}

interface LabApplication extends Application {
  center_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  license_number: string;
  center_type: string;
  latitude?: number;
  longitude?: number;
}

interface PharmacyApplication extends Application {
  pharmacy_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  license_number: string;
  pharmacy_type: string;
  latitude?: number;
  longitude?: number;
}

interface DeliveryPartnerApplication extends Application {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  current_address: string;
  city: string;
  state: string;
  pincode: string;
  vehicle_type: string;
  vehicle_number: string;
  driving_license_number: string;
  bank_account_number: string;
  ifsc_code: string;
  pan_number: string;
}

const AdminPartnerApplicationsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [labApplications, setLabApplications] = useState<LabApplication[]>([]);
  const [pharmacyApplications, setPharmacyApplications] = useState<PharmacyApplication[]>([]);
  const [deliveryApplications, setDeliveryApplications] = useState<DeliveryPartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchApplications = async () => {
    try {
      const [labRes, pharmacyRes, deliveryRes] = await Promise.all([
        supabase.from('lab_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('pharmacy_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('delivery_partner_applications').select('*').order('created_at', { ascending: false })
      ]);

      if (labRes.error) throw labRes.error;
      if (pharmacyRes.error) throw pharmacyRes.error;
      if (deliveryRes.error) throw deliveryRes.error;

      setLabApplications(labRes.data as LabApplication[] || []);
      setPharmacyApplications(pharmacyRes.data as PharmacyApplication[] || []);
      setDeliveryApplications(deliveryRes.data as DeliveryPartnerApplication[] || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch applications: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleReviewApplication = async () => {
    if (!selectedApplication || !user) return;

    try {
      const updateData = {
        status: reviewAction,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
        rejection_reason: reviewAction === 'reject' ? rejectionReason : null,
      };

      let tableName = '';
      if (selectedApplication.center_name) tableName = 'lab_applications';
      else if (selectedApplication.pharmacy_name) tableName = 'pharmacy_applications';
      else tableName = 'delivery_partner_applications';

      const { error } = await supabase
        .from(tableName as any)
        .update(updateData)
        .eq('id', selectedApplication.id);

      if (error) throw error;

      toast({
        title: "Application Updated",
        description: `Application has been ${reviewAction}d successfully.`,
        variant: "default",
      });

      setReviewDialog(false);
      setSelectedApplication(null);
      setAdminNotes('');
      setRejectionReason('');
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update application: " + error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const ApplicationCard = ({ application, type }: { application: any; type: string }) => (
    <Card key={application.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {type === 'lab' && application.center_name}
            {type === 'pharmacy' && application.pharmacy_name}
            {type === 'delivery' && application.full_name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon(application.status)}
            <Badge className={getStatusColor(application.status)}>
              {application.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{application.owner_name || application.full_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{application.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{application.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{application.city}, {application.state}</span>
          </div>
          {(type === 'lab' || type === 'pharmacy') && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{application.license_number}</span>
            </div>
          )}
          {type === 'delivery' && (
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span>{application.vehicle_type} - {application.vehicle_number}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(application.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {type === 'lab' && `Lab Center: ${application.center_name}`}
                  {type === 'pharmacy' && `Pharmacy: ${application.pharmacy_name}`}
                  {type === 'delivery' && `Delivery Partner: ${application.full_name}`}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm">{application.email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm">{application.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <p className="text-sm">{application.address || application.current_address}</p>
                    <p className="text-sm">{application.city}, {application.state} - {application.pincode}</p>
                  </div>
                  {type === 'delivery' && (
                    <>
                      <div>
                        <Label>Date of Birth</Label>
                        <p className="text-sm">{application.date_of_birth}</p>
                      </div>
                      <div>
                        <Label>Vehicle Details</Label>
                        <p className="text-sm">{application.vehicle_type} - {application.vehicle_number}</p>
                      </div>
                      <div>
                        <Label>Driving License</Label>
                        <p className="text-sm">{application.driving_license_number}</p>
                      </div>
                      <div>
                        <Label>Bank Details</Label>
                        <p className="text-sm">{application.bank_account_number} - {application.ifsc_code}</p>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Document Links Section */}
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-base font-semibold">Uploaded Documents</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {type === 'pharmacy' && (
                      <>
                        {application.license_document_url && (
                          <div>
                            <Label className="text-sm">License Document</Label>
                            <a 
                              href={application.license_document_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block"
                            >
                              View License Document
                            </a>
                          </div>
                        )}
                        {application.gst_document_url && (
                          <div>
                            <Label className="text-sm">GST Document</Label>
                            <a 
                              href={application.gst_document_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block"
                            >
                              View GST Document
                            </a>
                          </div>
                        )}
                      </>
                    )}
                    
                    {type === 'lab' && (
                      <>
                        {application.license_document_url && (
                          <div>
                            <Label className="text-sm">License Document</Label>
                            <a 
                              href={application.license_document_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block"
                            >
                              View License Document
                            </a>
                          </div>
                        )}
                        {application.gst_document_url && (
                          <div>
                            <Label className="text-sm">GST Document</Label>
                            <a 
                              href={application.gst_document_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block"
                            >
                              View GST Document
                            </a>
                          </div>
                        )}
                      </>
                    )}
                    
                    {type === 'delivery' && (
                      <>
                        {application.aadhar_card_url && (
                          <div>
                            <Label className="text-sm">Aadhar Card</Label>
                            <a 
                              href={application.aadhar_card_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block"
                            >
                              View Aadhar Card
                            </a>
                          </div>
                        )}
                        {application.driving_license_url && (
                          <div>
                            <Label className="text-sm">Driving License</Label>
                            <a 
                              href={application.driving_license_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block"
                            >
                              View Driving License
                            </a>
                          </div>
                        )}
                        {application.vehicle_rc_url && (
                          <div>
                            <Label className="text-sm">Vehicle RC</Label>
                            <a 
                              href={application.vehicle_rc_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block"
                            >
                              View Vehicle RC
                            </a>
                          </div>
                        )}
                        {application.insurance_document_url && (
                          <div>
                            <Label className="text-sm">Insurance Document</Label>
                            <a 
                              href={application.insurance_document_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block"
                            >
                              View Insurance Document
                            </a>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Other Documents for all types */}
                    {application.other_documents && Array.isArray(application.other_documents) && application.other_documents.length > 0 && (
                      <div className="md:col-span-2">
                        <Label className="text-sm">Other Documents</Label>
                        <div className="space-y-1">
                          {application.other_documents.map((doc: any, index: number) => (
                            <a 
                              key={index}
                              href={doc.url || doc} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block"
                            >
                              {doc.name || `Document ${index + 1}`}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Show message if no documents */}
                  {!application.license_document_url && 
                   !application.gst_document_url && 
                   !application.aadhar_card_url && 
                   !application.driving_license_url && 
                   !application.vehicle_rc_url && 
                   !application.insurance_document_url && 
                   (!application.other_documents || application.other_documents.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">No documents uploaded</p>
                  )}
                </div>
                
                {application.admin_notes && (
                  <div>
                    <Label>Admin Notes</Label>
                    <p className="text-sm bg-muted p-2 rounded">{application.admin_notes}</p>
                  </div>
                )}
                {application.rejection_reason && (
                  <div>
                    <Label>Rejection Reason</Label>
                    <p className="text-sm bg-red-50 p-2 rounded">{application.rejection_reason}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {application.status === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedApplication(application);
                  setReviewAction('approve');
                  setReviewDialog(true);
                }}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedApplication(application);
                  setReviewAction('reject');
                  setReviewDialog(true);
                }}
                className="flex items-center gap-1"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = {
    lab: labApplications.filter(app => app.status === 'pending').length,
    pharmacy: pharmacyApplications.filter(app => app.status === 'pending').length,
    delivery: deliveryApplications.filter(app => app.status === 'pending').length,
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Partner Applications</h1>
        <p className="text-muted-foreground">
          Review and manage applications from labs, pharmacies, and delivery partners
        </p>
      </div>

      <Tabs defaultValue="lab" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lab" className="relative">
            Lab Centers
            {pendingCount.lab > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">
                {pendingCount.lab}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pharmacy" className="relative">
            Pharmacies
            {pendingCount.pharmacy > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">
                {pendingCount.pharmacy}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="delivery" className="relative">
            Delivery Partners
            {pendingCount.delivery > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">
                {pendingCount.delivery}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lab" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Lab Center Applications</h2>
            <Badge variant="outline">
              {labApplications.length} total applications
            </Badge>
          </div>
          {labApplications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No lab applications found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {labApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} type="lab" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pharmacy" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pharmacy Applications</h2>
            <Badge variant="outline">
              {pharmacyApplications.length} total applications
            </Badge>
          </div>
          {pharmacyApplications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pharmacy applications found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pharmacyApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} type="pharmacy" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Delivery Partner Applications</h2>
            <Badge variant="outline">
              {deliveryApplications.length} total applications
            </Badge>
          </div>
          {deliveryApplications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No delivery partner applications found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {deliveryApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} type="delivery" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Application
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this review..."
                className="mt-1"
              />
            </div>
            {reviewAction === 'reject' && (
              <div>
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  required
                  className="mt-1"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReviewDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReviewApplication}
                disabled={reviewAction === 'reject' && !rejectionReason.trim()}
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              >
                {reviewAction === 'approve' ? 'Approve' : 'Reject'} Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPartnerApplicationsPage;