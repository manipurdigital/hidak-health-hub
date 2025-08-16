import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from '@/components/AdminSidebar';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  LogOut,
  Plus,
  Search,
  Edit,
  Trash2,
  Stethoscope,
  Star
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface Doctor {
  id: string;
  user_id: string;
  full_name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  rating: number;
  review_count: number;
  is_available: boolean;
  is_verified: boolean;
  hospital_affiliation: string;
  license_number: string;
  bio: string;
}

const AdminDoctorsPage = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  // Check if user is admin
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch doctors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddDoctor = async (formData: FormData) => {
    try {
      // First create a dummy user entry or get the current admin's user_id
      // For this demo, we'll use a placeholder - in real implementation you'd create a proper user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const doctorData = {
        user_id: currentUser?.id || '',
        full_name: formData.get('full_name') as string,
        specialization: formData.get('specialization') as string,
        qualification: formData.get('qualification') as string,
        experience_years: parseInt(formData.get('experience_years') as string),
        consultation_fee: parseFloat(formData.get('consultation_fee') as string),
        hospital_affiliation: formData.get('hospital_affiliation') as string,
        license_number: formData.get('license_number') as string,
        bio: formData.get('bio') as string,
        is_available: true,
        is_verified: false,
        rating: 0,
        review_count: 0
      };

      const { error } = await supabase
        .from('doctors')
        .insert(doctorData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Doctor added successfully"
      });

      setIsAddDialogOpen(false);
      fetchDoctors();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add doctor",
        variant: "destructive"
      });
    }
  };

  const handleEditDoctor = async (formData: FormData) => {
    if (!editingDoctor) return;

    try {
      const doctorData = {
        full_name: formData.get('full_name') as string,
        specialization: formData.get('specialization') as string,
        qualification: formData.get('qualification') as string,
        experience_years: parseInt(formData.get('experience_years') as string),
        consultation_fee: parseFloat(formData.get('consultation_fee') as string),
        hospital_affiliation: formData.get('hospital_affiliation') as string,
        license_number: formData.get('license_number') as string,
        bio: formData.get('bio') as string,
        is_available: formData.get('is_available') === 'true',
        is_verified: formData.get('is_verified') === 'true'
      };

      const { error } = await supabase
        .from('doctors')
        .update(doctorData)
        .eq('id', editingDoctor.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Doctor updated successfully"
      });

      setIsEditDialogOpen(false);
      setEditingDoctor(null);
      fetchDoctors();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update doctor",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', doctorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Doctor deleted successfully"
      });

      fetchDoctors();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete doctor",
        variant: "destructive"
      });
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-primary text-primary-foreground border-b flex items-center px-4">
          <SidebarTrigger className="mr-4" />
          
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Doctors Management</h1>
                <p className="text-primary-foreground/80 text-sm">{user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="capitalize bg-yellow-100 text-yellow-800">
                {userRole}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <AdminSidebar />

        <main className="flex-1 pt-16 p-6 bg-background">
          <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Stethoscope className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold">Doctors</h2>
                  <p className="text-muted-foreground">Manage medical professionals</p>
                </div>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Doctor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Doctor</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleAddDoctor(formData);
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input id="full_name" name="full_name" required />
                      </div>
                      <div>
                        <Label htmlFor="specialization">Specialization</Label>
                        <Input id="specialization" name="specialization" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="qualification">Qualification</Label>
                        <Input id="qualification" name="qualification" required />
                      </div>
                      <div>
                        <Label htmlFor="experience_years">Experience (Years)</Label>
                        <Input id="experience_years" name="experience_years" type="number" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="consultation_fee">Consultation Fee</Label>
                        <Input id="consultation_fee" name="consultation_fee" type="number" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="license_number">License Number</Label>
                        <Input id="license_number" name="license_number" required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="hospital_affiliation">Hospital Affiliation</Label>
                      <Input id="hospital_affiliation" name="hospital_affiliation" />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" name="bio" rows={3} />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit">Add Doctor</Button>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search doctors by name or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Doctors Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Doctors ({filteredDoctors.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Doctor</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Specialization</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Experience</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Fee</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Rating</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDoctors.map((doctor) => (
                          <tr key={doctor.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-4">
                              <div>
                                <div className="font-medium">{doctor.full_name}</div>
                                <div className="text-sm text-muted-foreground">{doctor.qualification}</div>
                              </div>
                            </td>
                            <td className="py-4 text-muted-foreground">{doctor.specialization}</td>
                            <td className="py-4">{doctor.experience_years} years</td>
                            <td className="py-4">₹{doctor.consultation_fee}</td>
                            <td className="py-4">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>{doctor.rating.toFixed(1)}</span>
                                <span className="text-muted-foreground text-sm">({doctor.review_count})</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="space-y-1">
                                <Badge variant={doctor.is_available ? "default" : "secondary"}>
                                  {doctor.is_available ? "Available" : "Unavailable"}
                                </Badge>
                                <Badge variant={doctor.is_verified ? "default" : "destructive"}>
                                  {doctor.is_verified ? "Verified" : "Unverified"}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingDoctor(doctor);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteDoctor(doctor.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Edit Doctor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
          </DialogHeader>
          {editingDoctor && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleEditDoctor(formData);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_full_name">Full Name</Label>
                  <Input id="edit_full_name" name="full_name" defaultValue={editingDoctor.full_name} required />
                </div>
                <div>
                  <Label htmlFor="edit_specialization">Specialization</Label>
                  <Input id="edit_specialization" name="specialization" defaultValue={editingDoctor.specialization} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_qualification">Qualification</Label>
                  <Input id="edit_qualification" name="qualification" defaultValue={editingDoctor.qualification} required />
                </div>
                <div>
                  <Label htmlFor="edit_experience_years">Experience (Years)</Label>
                  <Input id="edit_experience_years" name="experience_years" type="number" defaultValue={editingDoctor.experience_years} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_consultation_fee">Consultation Fee</Label>
                  <Input id="edit_consultation_fee" name="consultation_fee" type="number" step="0.01" defaultValue={editingDoctor.consultation_fee} required />
                </div>
                <div>
                  <Label htmlFor="edit_license_number">License Number</Label>
                  <Input id="edit_license_number" name="license_number" defaultValue={editingDoctor.license_number} required />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_hospital_affiliation">Hospital Affiliation</Label>
                <Input id="edit_hospital_affiliation" name="hospital_affiliation" defaultValue={editingDoctor.hospital_affiliation || ''} />
              </div>
              <div>
                <Label htmlFor="edit_bio">Bio</Label>
                <Textarea id="edit_bio" name="bio" rows={3} defaultValue={editingDoctor.bio || ''} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_is_available">Available</Label>
                  <select id="edit_is_available" name="is_available" className="w-full p-2 border rounded" defaultValue={editingDoctor.is_available.toString()}>
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit_is_verified">Verified</Label>
                  <select id="edit_is_verified" name="is_verified" className="w-full p-2 border rounded" defaultValue={editingDoctor.is_verified.toString()}>
                    <option value="true">Verified</option>
                    <option value="false">Unverified</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Save Changes</Button>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AdminDoctorsPage;