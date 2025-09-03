// @ts-nocheck
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { QuickLocationInput } from '@/components/QuickLocationInput';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  TestTube, 
  MessageSquare, 
  FileText, 
  MapPin, 
  Crown,
  Download,
  Calendar,
  Phone,
  DollarSign,
  User,
  Mail,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 10;

interface OrderItem {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  payment_status: string;
}

interface LabBooking {
  id: string;
  booking_date: string;
  status: string;
  total_amount: number;
  patient_name: string;
  test_id: string;
}

interface Consultation {
  id: string;
  consultation_date: string;
  status: string;
  total_amount: number;
  doctors: { full_name: string; specialization: string };
}

interface Prescription {
  id: string;
  prescription_number: string;
  created_at: string;
  status: string;
  doctor_id: string;
}

interface Address {
  id: string;
  name: string;
  address_line_1: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  is_default: boolean;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function AccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('orders');
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Orders query
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['user-orders', user?.id, currentPage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at, payment_status')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);
      
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!user?.id && activeTab === 'orders'
  });

  // Lab bookings query
  const { data: labBookings, isLoading: labBookingsLoading } = useQuery({
    queryKey: ['user-lab-bookings', user?.id, currentPage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_bookings')
        .select('id, booking_date, status, total_amount, patient_name, test_id')
        .eq('user_id', user?.id)
        .order('booking_date', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);
      
      if (error) throw error;
      return data as LabBooking[];
    },
    enabled: !!user?.id && activeTab === 'lab-tests'
  });

  // Consultations query
  const { data: consultations, isLoading: consultationsLoading } = useQuery({
    queryKey: ['user-consultations', user?.id, currentPage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          id, consultation_date, status, total_amount,
          doctors (full_name, specialization)
        `)
        .eq('patient_id', user?.id)
        .order('consultation_date', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);
      
      if (error) throw error;
      return data as Consultation[];
    },
    enabled: !!user?.id && activeTab === 'consultations'
  });

  // Prescriptions query
  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ['user-prescriptions', user?.id, currentPage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('id, prescription_number, created_at, status, doctor_id')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);
      
      if (error) throw error;
      return data as Prescription[];
    },
    enabled: !!user?.id && activeTab === 'prescriptions'
  });

  // Addresses query
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['user-addresses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data as Address[];
    },
    enabled: !!user?.id && activeTab === 'addresses'
  });

  // Profile query
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id && activeTab === 'profile'
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<Profile>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user?.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Update Failed",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleDownloadPrescription = async (prescriptionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-signed-url', {
        body: {
          bucket: 'prescriptions',
          path: `${prescriptionId}.pdf`
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        toast({
          title: "File not found",
          description: "The prescription file is not available for download.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Unable to download the prescription file.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'pending': 'outline',
      'confirmed': 'default',
      'completed': 'default',
      'cancelled': 'destructive',
      'paid': 'default',
      'unpaid': 'outline'
    };
    
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const resetPagination = () => setCurrentPage(1);

  const handleEditProfile = () => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || ''
      });
    }
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileForm({
      full_name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: ''
    });
  };

  const handleChangePassword = () => {
    setIsChangingPassword(true);
  };

  const handleSavePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Account</h1>
            <p className="text-muted-foreground">Manage your orders, appointments, and account settings</p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); resetPagination(); }}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="lab-tests" className="flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                Lab Tests
              </TabsTrigger>
              <TabsTrigger value="consultations" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Consultations
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Prescriptions
              </TabsTrigger>
              <TabsTrigger value="addresses" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Addresses
              </TabsTrigger>
              <TabsTrigger value="care-plus" className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Care+
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Profile Information
                    </div>
                    {!isEditingProfile && (
                      <Button variant="outline" onClick={handleEditProfile}>
                        Edit Profile
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profileLoading ? (
                    <div className="text-center py-8">Loading profile...</div>
                  ) : (
                    <div className="space-y-6">
                      {/* Email - Read Only */}
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {profile?.email || user?.email || 'Not provided'}
                          </span>
                          <Badge variant="secondary" className="text-xs">Read Only</Badge>
                        </div>
                      </div>

                      {/* Editable Fields */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          {isEditingProfile ? (
                            <Input
                              id="full_name"
                              value={profileForm.full_name}
                              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                              placeholder="Enter your full name"
                            />
                          ) : (
                            <div className="h-10 flex items-center px-3 border rounded-md bg-muted text-sm">
                              {profile?.full_name || 'Not provided'}
                            </div>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          {isEditingProfile ? (
                            <Input
                              id="phone"
                              value={profileForm.phone}
                              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                              placeholder="Enter your phone number"
                            />
                          ) : (
                            <div className="h-10 flex items-center px-3 border rounded-md bg-muted text-sm">
                              {profile?.phone || 'Not provided'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        {isEditingProfile ? (
                          <Input
                            id="address"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            placeholder="Enter your address"
                          />
                        ) : (
                          <div className="h-10 flex items-center px-3 border rounded-md bg-muted text-sm">
                            {profile?.address || 'Not provided'}
                          </div>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="grid gap-2">
                          <Label htmlFor="city">City</Label>
                          {isEditingProfile ? (
                            <Input
                              id="city"
                              value={profileForm.city}
                              onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                              placeholder="Enter city"
                            />
                          ) : (
                            <div className="h-10 flex items-center px-3 border rounded-md bg-muted text-sm">
                              {profile?.city || 'Not provided'}
                            </div>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="state">State</Label>
                          {isEditingProfile ? (
                            <Input
                              id="state"
                              value={profileForm.state}
                              onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                              placeholder="Enter state"
                            />
                          ) : (
                            <div className="h-10 flex items-center px-3 border rounded-md bg-muted text-sm">
                              {profile?.state || 'Not provided'}
                            </div>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="pincode">PIN Code</Label>
                          {isEditingProfile ? (
                            <Input
                              id="pincode"
                              value={profileForm.pincode}
                              onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                              placeholder="Enter PIN code"
                            />
                          ) : (
                            <div className="h-10 flex items-center px-3 border rounded-md bg-muted text-sm">
                              {profile?.pincode || 'Not provided'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons for Edit Mode */}
                      {isEditingProfile && (
                        <div className="flex gap-2 pt-4">
                          <Button 
                            onClick={handleSaveProfile}
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button variant="outline" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Password Change Section */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Change Password
                    </div>
                    {!isChangingPassword && (
                      <Button variant="outline" onClick={handleChangePassword}>
                        Change Password
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isChangingPassword ? (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          placeholder="Enter your current password"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="Enter your new password"
                        />
                        <p className="text-xs text-muted-foreground">
                          Password must be at least 6 characters long
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="Confirm your new password"
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={handleSavePassword}
                          disabled={updatePasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                        >
                          {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                        </Button>
                        <Button variant="outline" onClick={handleCancelPasswordChange}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        Keep your account secure by regularly updating your password
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Click "Change Password" to update your account password
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    My Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-8">Loading orders...</div>
                  ) : orders && orders.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order Number</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.order_number}</TableCell>
                            <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>{getStatusBadge(order.payment_status)}</TableCell>
                            <TableCell className="text-right">₹{order.total_amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No orders found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lab-tests">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5" />
                    Lab Test Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {labBookingsLoading ? (
                    <div className="text-center py-8">Loading lab bookings...</div>
                  ) : labBookings && labBookings.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Test Name</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {labBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">Lab Test</TableCell>
                            <TableCell>{format(new Date(booking.booking_date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{booking.patient_name}</TableCell>
                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                            <TableCell className="text-right">₹{booking.total_amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No lab test bookings found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consultations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    My Consultations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {consultationsLoading ? (
                    <div className="text-center py-8">Loading consultations...</div>
                  ) : consultations && consultations.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Specialization</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consultations.map((consultation) => (
                          <TableRow key={consultation.id}>
                            <TableCell className="font-medium">{consultation.doctors?.full_name}</TableCell>
                            <TableCell>{consultation.doctors?.specialization}</TableCell>
                            <TableCell>{format(new Date(consultation.consultation_date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{getStatusBadge(consultation.status)}</TableCell>
                            <TableCell className="text-right">₹{consultation.total_amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No consultations found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prescriptions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    My Prescriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {prescriptionsLoading ? (
                    <div className="text-center py-8">Loading prescriptions...</div>
                  ) : prescriptions && prescriptions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Prescription #</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prescriptions.map((prescription) => (
                          <TableRow key={prescription.id}>
                            <TableCell className="font-medium">{prescription.prescription_number}</TableCell>
                            <TableCell>Doctor</TableCell>
                            <TableCell>{format(new Date(prescription.created_at), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{getStatusBadge(prescription.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadPrescription(prescription.id)}
                                className="flex items-center gap-1"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No prescriptions found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <div className="grid gap-6">
                <QuickLocationInput
                  onLocationSelect={(location) => {
                    toast({
                      title: "Location Detected",
                      description: location.address || `Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
                    });
                    // Here you could auto-fill a new address form or show nearby services
                  }}
                  title="Quick Address from Location"
                  description="Get address details using your current location for faster checkout"
                />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Saved Addresses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {addressesLoading ? (
                      <div className="text-center py-8">Loading addresses...</div>
                    ) : addresses && addresses.length > 0 ? (
                      <div className="grid gap-4">
                        {addresses.map((address) => (
                          <Card key={address.id} className={address.is_default ? 'border-primary' : ''}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-medium">{address.name}</h3>
                                    {address.is_default && (
                                      <Badge variant="default" className="text-xs">Default</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {address.address_line_1}
                                  </p>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {address.city}, {address.state} {address.postal_code}
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="w-4 h-4" />
                                    {address.phone}
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No saved addresses found
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="care-plus">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    Care+ Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Crown className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
                    <p className="text-muted-foreground mb-4">
                      Subscribe to Care+ for unlimited consultations and exclusive benefits
                    </p>
                    <Button className="bg-gradient-to-r from-primary to-primary-glow">
                      Explore Care+ Plans
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          {(activeTab === 'orders' || activeTab === 'lab-tests' || activeTab === 'consultations' || activeTab === 'prescriptions') && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(currentPage + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}