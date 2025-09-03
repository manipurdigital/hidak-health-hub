import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit2, Save, X, Camera, Mail, Phone, MapPin, Clock, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDoctorInfo } from '@/hooks/use-doctor-upcoming';

export default function DoctorProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: doctorInfo, isLoading } = useDoctorInfo();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('doctors')
        .update(data)
        .eq('id', doctorInfo?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-info'] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleEdit = () => {
    setFormData({
      full_name: doctorInfo?.full_name || '',
      contact_email: doctorInfo?.contact_email || '',
      specialization: doctorInfo?.specialization || '',
      qualification: doctorInfo?.qualification || '',
      experience_years: doctorInfo?.experience_years || 0,
      consultation_fee: doctorInfo?.consultation_fee || 0,
      bio: doctorInfo?.bio || '',
      hospital_affiliation: doctorInfo?.hospital_affiliation || '',
      languages: doctorInfo?.languages || []
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!doctorInfo) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Doctor profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile Management</h1>
          <p className="text-muted-foreground">Manage your professional information</p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={doctorInfo.profile_image_url} />
                <AvatarFallback className="text-lg">
                  {doctorInfo.full_name ? doctorInfo.full_name.split(' ').map(n => n[0]).join('') : 'DR'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button variant="outline" size="sm" className="mb-4">
                  <Camera className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
              )}
              <h3 className="font-semibold text-lg">{doctorInfo.full_name}</h3>
              <p className="text-muted-foreground">{doctorInfo.specialization}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>{doctorInfo.experience_years} years</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>₹{doctorInfo.consultation_fee}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{doctorInfo.contact_email}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{doctorInfo.hospital_affiliation || 'Not specified'}</span>
              </div>
            </div>

            {doctorInfo.languages && doctorInfo.languages.length > 0 && (
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium">Languages</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {doctorInfo.languages.map((lang: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                ) : (
                  <p className="mt-1 text-sm">{doctorInfo.full_name}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="contact_email">Email</Label>
                {isEditing ? (
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  />
                ) : (
                  <p className="mt-1 text-sm">{doctorInfo.contact_email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                {isEditing ? (
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  />
                ) : (
                  <p className="mt-1 text-sm">{doctorInfo.specialization}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="qualification">Qualification</Label>
                {isEditing ? (
                  <Input
                    id="qualification"
                    value={formData.qualification}
                    onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                  />
                ) : (
                  <p className="mt-1 text-sm">{doctorInfo.qualification}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience_years">Years of Experience</Label>
                {isEditing ? (
                  <Input
                    id="experience_years"
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value)})}
                  />
                ) : (
                  <p className="mt-1 text-sm">{doctorInfo.experience_years} years</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="consultation_fee">Consultation Fee (₹)</Label>
                {isEditing ? (
                  <Input
                    id="consultation_fee"
                    type="number"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({...formData, consultation_fee: parseFloat(e.target.value)})}
                  />
                ) : (
                  <p className="mt-1 text-sm">₹{doctorInfo.consultation_fee}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="hospital_affiliation">Hospital/Clinic Affiliation</Label>
              {isEditing ? (
                <Input
                  id="hospital_affiliation"
                  value={formData.hospital_affiliation}
                  onChange={(e) => setFormData({...formData, hospital_affiliation: e.target.value})}
                />
              ) : (
                <p className="mt-1 text-sm">{doctorInfo.hospital_affiliation || 'Not specified'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="bio">Professional Bio</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell patients about your experience and approach to healthcare..."
                />
              ) : (
                <p className="mt-1 text-sm">{doctorInfo.bio || 'No bio provided'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}