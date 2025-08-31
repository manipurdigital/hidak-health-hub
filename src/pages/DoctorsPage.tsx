
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Clock, Globe, GraduationCap, MapPin, Stethoscope, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  bio: string;
  profile_image_url?: string;
  rating: number;
  review_count: number;
  languages: string[];
  hospital_affiliation: string;
  is_verified: boolean;
}

const DoctorsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { hasActiveSubscription, canBookConsultation } = useSubscription();
  const { toast } = useToast();

  const specialties = [
    'All', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 
    'Gynecology', 'Neurology', 'General Medicine', 'ENT', 'Psychiatry'
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, selectedSpecialty, searchTerm]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_available', true)
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    if (selectedSpecialty !== 'All') {
      filtered = filtered.filter(doctor => doctor.specialization === selectedSpecialty);
    }

    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.hospital_affiliation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleDoctorClick = (doctorId: string) => {
    navigate(`/doctors/${doctorId}`);
  };

  const handleBookConsultation = (doctor: Doctor) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book a consultation",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    
    if (!canBookConsultation) {
      toast({
        title: "Consultation Limit Reached",
        description: "You've reached your monthly consultation limit. Upgrade your Care+ plan for more consultations.",
        variant: "destructive"
      });
      navigate('/care-plus');
      return;
    }
    
    navigate(`/doctors/${doctor.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Consult with Doctors</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Book online consultations with verified doctors and get expert medical advice
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search doctors by name, specialty, or hospital..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="md:w-48">
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <Card 
                key={doctor.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleDoctorClick(doctor.id)}
              >
                <CardHeader className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    {doctor.profile_image_url ? (
                      <img 
                        src={doctor.profile_image_url} 
                        alt={doctor.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Stethoscope className="w-10 h-10 text-primary" />
                    )}
                  </div>
                  <CardTitle className="text-xl">{doctor.full_name}</CardTitle>
                  <Badge variant="secondary" className="mx-auto">
                    {doctor.specialization}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{(doctor.rating ?? 0).toFixed(1)}</span>
                    </div>
                    <span className="text-muted-foreground">({doctor.review_count ?? 0} reviews)</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span>{doctor.qualification}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{doctor.experience_years} years experience</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{doctor.hospital_affiliation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      <span>{doctor.languages ? doctor.languages.join(', ') : 'Not specified'}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{doctor.bio}</p>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Consultation Fee</span>
                      <div className="text-right">
                        {hasActiveSubscription ? (
                          <div>
                            <span className="text-lg font-bold text-green-600">FREE</span>
                            <p className="text-xs text-muted-foreground line-through">₹{doctor.consultation_fee}</p>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-primary">₹{doctor.consultation_fee}</span>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookConsultation(doctor);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Book Consultation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDoctors.length === 0 && (
            <div className="text-center py-12">
              <Stethoscope className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No doctors found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? `No doctors found for "${searchTerm}"` : 'Try adjusting your search or filters'}
              </p>
            </div>
          )}

          {/* Benefits section */}
          <div className="mt-16 bg-muted/30 p-8 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-2xl mb-2">👨‍⚕️</div>
                <h3 className="font-semibold mb-1">Verified Doctors</h3>
                <p className="text-sm text-muted-foreground">All doctors are verified and licensed professionals</p>
              </div>
              <div>
                <div className="text-2xl mb-2">💬</div>
                <h3 className="font-semibold mb-1">Instant Consultation</h3>
                <p className="text-sm text-muted-foreground">Get medical advice through chat, audio, or video</p>
              </div>
              <div>
                <div className="text-2xl mb-2">📄</div>
                <h3 className="font-semibold mb-1">Digital Prescription</h3>
                <p className="text-sm text-muted-foreground">Receive digital prescriptions and medical reports</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DoctorsPage;