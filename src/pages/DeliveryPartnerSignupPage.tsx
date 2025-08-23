import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Truck, Mail, Phone, User, Calendar, FileText, Upload, Shield, MapPin } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DeliveryPartnerSignupPage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    emergencyContact: '',
    
    // Address Information (for contact purposes)
    currentAddress: '',
    city: '',
    state: '',
    pincode: '',
    
    // Vehicle Information
    vehicleType: '',
    vehicleNumber: '',
    drivingLicenseNumber: '',
    vehicleInsurance: '',
    
    // Documents
    documents: {
      aadharCard: null as File | null,
      drivingLicense: null as File | null,
      vehicleRC: null as File | null,
      insurance: null as File | null,
    },
    
    // Experience & Preferences
    experience: '',
    preferredAreas: '',
    availability: '',
    
    // Additional Information
    bankAccountNumber: '',
    ifscCode: '',
    panNumber: '',
    
    // Agreements
    agreeToTerms: false,
    agreeToBackground: false,
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFileUpload = (fieldName: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [fieldName]: file
      }
    }));
  };

  const validateForm = () => {
    const required = [
      'fullName', 'email', 'phone', 'dateOfBirth', 'currentAddress', 
      'city', 'state', 'pincode', 'vehicleType', 'vehicleNumber', 
      'drivingLicenseNumber', 'bankAccountNumber', 'ifscCode', 'panNumber'
    ];

    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          title: "Validation Error",
          description: `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`,
          variant: "destructive",
        });
        return false;
      }
    }

    if (!formData.documents.aadharCard) {
      toast({
        title: "Document Required",
        description: "Please upload your Aadhar card.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.documents.drivingLicense) {
      toast({
        title: "Document Required", 
        description: "Please upload your driving license.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.agreeToTerms || !formData.agreeToBackground) {
      toast({
        title: "Agreement Required",
        description: "Please agree to all terms and conditions.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const applicationData = {
        user_id: user?.id,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        current_address: formData.currentAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        vehicle_type: formData.vehicleType,
        vehicle_number: formData.vehicleNumber,
        driving_license_number: formData.drivingLicenseNumber,
        bank_account_number: formData.bankAccountNumber,
        ifsc_code: formData.ifscCode,
        pan_number: formData.panNumber,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('delivery_partner_applications')
        .insert([applicationData])
        .select()
        .single();

      if (error) {
        console.error('Delivery partner application insert error:', error);
        throw error;
      }
      if (!data) {
        console.error('Delivery partner application insert returned no data');
        throw new Error('Insert succeeded but returned no data');
      }

      console.log('Delivery partner application created:', data);
      
      toast({
        title: "Application Submitted Successfully!",
        description: `We'll review your application and contact you within 24-48 hours. Ref: ${data.id}`,
        variant: "default",
      });

      // Redirect after successful submission
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypes = [
    'Two Wheeler',
    'Three Wheeler',
    'Four Wheeler',
    'Bicycle',
    'Electric Vehicle'
  ];

  const experienceLevels = [
    'No Experience',
    '6 months - 1 year',
    '1-2 years',
    '2-5 years',
    '5+ years'
  ];

  const availabilityOptions = [
    'Full Time (8+ hours)',
    'Part Time (4-8 hours)',
    'Weekend Only',
    'Flexible Hours'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Join as Delivery Partner
            </h1>
            <p className="text-muted-foreground text-lg">
              Become part of our reliable delivery network and earn flexibly
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="Emergency contact number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentAddress">Current Address *</Label>
                <Textarea
                  id="currentAddress"
                  value={formData.currentAddress}
                  onChange={(e) => handleInputChange('currentAddress', e.target.value)}
                  placeholder="Enter your full address"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="State"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">PIN Code *</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    placeholder="PIN Code"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleType">Vehicle Type *</Label>
                  <Select
                    value={formData.vehicleType}
                    onValueChange={(value) => handleInputChange('vehicleType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                  <Input
                    id="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                    placeholder="XX 00 XX 0000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="drivingLicenseNumber">Driving License Number *</Label>
                  <Input
                    id="drivingLicenseNumber"
                    value={formData.drivingLicenseNumber}
                    onChange={(e) => handleInputChange('drivingLicenseNumber', e.target.value)}
                    placeholder="DL Number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleInsurance">Vehicle Insurance Policy</Label>
                  <Input
                    id="vehicleInsurance"
                    value={formData.vehicleInsurance}
                    onChange={(e) => handleInputChange('vehicleInsurance', e.target.value)}
                    placeholder="Insurance policy number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aadharCard">Aadhar Card * (Max 5MB)</Label>
                  <div className="mt-1">
                    <Input
                      id="aadharCard"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('aadharCard', e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {formData.documents.aadharCard && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ {formData.documents.aadharCard.name}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="drivingLicense">Driving License * (Max 5MB)</Label>
                  <div className="mt-1">
                    <Input
                      id="drivingLicense"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('drivingLicense', e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {formData.documents.drivingLicense && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ {formData.documents.drivingLicense.name}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="vehicleRC">Vehicle RC (Optional)</Label>
                  <div className="mt-1">
                    <Input
                      id="vehicleRC"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('vehicleRC', e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {formData.documents.vehicleRC && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ {formData.documents.vehicleRC.name}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="insurance">Insurance Document (Optional)</Label>
                  <div className="mt-1">
                    <Input
                      id="insurance"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('insurance', e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {formData.documents.insurance && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ {formData.documents.insurance.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience & Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Experience & Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experience">Delivery Experience</Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) => handleInputChange('experience', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(value) => handleInputChange('availability', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      {availabilityOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="preferredAreas">Preferred Delivery Areas</Label>
                <Textarea
                  id="preferredAreas"
                  value={formData.preferredAreas}
                  onChange={(e) => handleInputChange('preferredAreas', e.target.value)}
                  placeholder="List areas where you prefer to make deliveries (e.g., Sector 1, Sector 2, etc.)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bankAccountNumber">Bank Account Number *</Label>
                  <Input
                    id="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                    placeholder="Account number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ifscCode">IFSC Code *</Label>
                  <Input
                    id="ifscCode"
                    value={formData.ifscCode}
                    onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                    placeholder="IFSC Code"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="panNumber">PAN Number *</Label>
                  <Input
                    id="panNumber"
                    value={formData.panNumber}
                    onChange={(e) => handleInputChange('panNumber', e.target.value)}
                    placeholder="PAN Number"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked)}
                />
                <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                  I agree to the <span className="text-primary cursor-pointer hover:underline">Terms and Conditions</span> and <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToBackground"
                  checked={formData.agreeToBackground}
                  onCheckedChange={(checked) => handleInputChange('agreeToBackground', checked)}
                />
                <Label htmlFor="agreeToBackground" className="text-sm leading-relaxed">
                  I consent to background verification and document verification for the delivery partner role
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="min-w-[200px]"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default DeliveryPartnerSignupPage;