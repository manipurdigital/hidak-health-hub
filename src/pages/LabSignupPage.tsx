import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Clock, Users, Shield, FileText, Camera } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapLocationPicker } from '@/components/MapLocationPicker';
import { GoogleMapsProvider } from '@/contexts/GoogleMapsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const LabSignupPage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    // Basic Information
    centerName: '',
    ownerName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    
    // Address Information
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    latitude: null as number | null,
    longitude: null as number | null,
    
    // Business Information
    licenseNumber: '',
    gstNumber: '',
    establishedYear: '',
    centerType: '',
    
    // Services & Capabilities
    operatingHours: '',
    servicesOffered: [] as string[],
    homeCollection: false,
    emergencyServices: false,
    
    // Documents
    documents: {
      license: null as File | null,
      gstCertificate: null as File | null,
      ownerIdProof: null as File | null,
      addressProof: null as File | null,
    },
    
    // Terms
    agreeToTerms: false,
    agreeToDataProcessing: false,
  });

  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const serviceOptions = [
    'Blood Tests', 'Urine Tests', 'X-Ray', 'ECG', 'Ultrasound', 
    'CT Scan', 'MRI', 'Pathology', 'Microbiology', 'Biochemistry',
    'Immunology', 'Histopathology', 'Cytology', 'Radiology'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(service)
        ? prev.servicesOffered.filter(s => s !== service)
        : [...prev.servicesOffered, service]
    }));
  };

  const handleFileUpload = (documentType: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: file
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions to continue.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      toast({
        title: "Location Required",
        description: "Please select your center's exact location on the map.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      const applicationData = {
        user_id: user?.id,
        center_name: formData.centerName,
        owner_name: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        license_number: formData.licenseNumber,
        center_type: formData.centerType,
        landmark: formData.landmark,
        gst_number: formData.gstNumber,
        established_year: formData.establishedYear,
        operating_hours: formData.operatingHours,
        services_offered: formData.servicesOffered,
        home_collection: formData.homeCollection,
        emergency_services: formData.emergencyServices,
        status: 'pending'
      };

      const { error } = await supabase
        .from('lab_applications')
        .insert([applicationData]);

      if (error) {
        console.error('Lab application insert error:', error);
        throw error;
      }

      toast({
        title: "Application Submitted!",
        description: "Application received. We'll review and contact you soon.",
      });
      
      // Redirect to success page or back to home
      navigate('/');
      
    } catch (error: any) {
      console.error('Lab application submission error:', error);
      toast({
        title: "Submission Failed",
        description: "An error occurred while submitting your application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleMapsProvider>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4 p-0 h-auto text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Partner with HAK SHEL as a Diagnostic Center
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join our network of trusted healthcare providers and expand your reach. 
              Complete the form below to start your partnership journey.
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Diagnostic Center Registration
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Basic Information */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="centerName">Center Name *</Label>
                    <Input
                      id="centerName"
                      value={formData.centerName}
                      onChange={(e) => handleInputChange('centerName', e.target.value)}
                      placeholder="Enter diagnostic center name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerName">Owner/Director Name *</Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) => handleInputChange('ownerName', e.target.value)}
                      placeholder="Enter owner's full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="center@example.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Primary Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="alternatePhone">Alternate Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="alternatePhone"
                        type="tel"
                        value={formData.alternatePhone}
                        onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="centerType">Center Type *</Label>
                    <Select value={formData.centerType} onValueChange={(value) => handleInputChange('centerType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select center type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diagnostic">Diagnostic Center</SelectItem>
                        <SelectItem value="pathology">Pathology Lab</SelectItem>
                        <SelectItem value="radiology">Radiology Center</SelectItem>
                        <SelectItem value="multi-specialty">Multi-Specialty Lab</SelectItem>
                        <SelectItem value="hospital-lab">Hospital Laboratory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Address Information */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Complete Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter complete address with building number, street name"
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
                        placeholder="Enter city name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="Enter state name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode">PIN Code *</Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                        placeholder="123456"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="landmark">Landmark</Label>
                    <Input
                      id="landmark"
                      value={formData.landmark}
                      onChange={(e) => handleInputChange('landmark', e.target.value)}
                      placeholder="Nearby landmark for easy identification"
                    />
                  </div>
                  
                  {/* Exact Location Selection */}
                  <div className="col-span-full">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Exact Location (Pin Drop) *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLocationPicker(true)}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        {formData.latitude ? 'Update Location' : 'Select Location'}
                      </Button>
                    </div>
                    
                    {formData.latitude && formData.longitude ? (
                      <div className="p-3 bg-muted/50 border rounded-md">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-success text-sm">Location Selected</p>
                            <p className="text-sm text-foreground mt-1">
                              {formData.address || 'Custom location selected'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/30 border border-dashed rounded-md text-center">
                        <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Please select your center's exact location for accurate delivery calculations
                        </p>
                      </div>
                     )}
                  </div>
                </div>
              </section>

              <Separator />

              {/* Business Information */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="licenseNumber">Medical License Number *</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      placeholder="Enter license number"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      value={formData.gstNumber}
                      onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                      placeholder="Enter GST number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="establishedYear">Year Established *</Label>
                    <Input
                      id="establishedYear"
                      type="number"
                      value={formData.establishedYear}
                      onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                      placeholder="2020"
                      min="1900"
                      max={new Date().getFullYear()}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="operatingHours">Operating Hours *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="operatingHours"
                        value={formData.operatingHours}
                        onChange={(e) => handleInputChange('operatingHours', e.target.value)}
                        placeholder="Mon-Sat: 8AM-8PM, Sun: 9AM-5PM"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Services & Capabilities */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Services & Capabilities
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Services Offered *</Label>
                    <p className="text-sm text-muted-foreground mb-3">Select all services your center provides</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {serviceOptions.map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            id={service}
                            checked={formData.servicesOffered.includes(service)}
                            onCheckedChange={() => handleServiceToggle(service)}
                          />
                          <Label htmlFor={service} className="text-sm">{service}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="homeCollection"
                        checked={formData.homeCollection}
                        onCheckedChange={(checked) => handleInputChange('homeCollection', checked)}
                      />
                      <Label htmlFor="homeCollection" className="text-sm font-medium">
                        Home Sample Collection Available
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="emergencyServices"
                        checked={formData.emergencyServices}
                        onCheckedChange={(checked) => handleInputChange('emergencyServices', checked)}
                      />
                      <Label htmlFor="emergencyServices" className="text-sm font-medium">
                        Emergency Services Available
                      </Label>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Document Upload */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Required Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="license">Medical License Copy *</Label>
                    <Input
                      id="license"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('license', e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gstCertificate">GST Certificate</Label>
                    <Input
                      id="gstCertificate"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('gstCertificate', e.target.files?.[0] || null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerIdProof">Owner ID Proof *</Label>
                    <Input
                      id="ownerIdProof"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('ownerIdProof', e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="addressProof">Address Proof *</Label>
                    <Input
                      id="addressProof"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('addressProof', e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Accepted formats: PDF, JPG, JPEG, PNG (Max 5MB per file)
                </p>
              </section>

              <Separator />

              {/* Terms and Conditions */}
              <section>
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked)}
                      required
                    />
                    <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                      I agree to the{' '}
                      <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                      {' '}and{' '}
                      <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                      {' '}of HAK SHEL Health Platform
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeToDataProcessing"
                      checked={formData.agreeToDataProcessing}
                      onCheckedChange={(checked) => handleInputChange('agreeToDataProcessing', checked)}
                    />
                    <Label htmlFor="agreeToDataProcessing" className="text-sm leading-relaxed">
                      I consent to the processing of my personal data for partnership evaluation and communication purposes
                    </Label>
                  </div>
                </div>
              </section>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={loading || !formData.agreeToTerms}
                  className="w-full md:w-auto min-w-[200px]"
                >
                  {loading ? "Submitting Application..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">What happens next?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2">1</div>
                  <p className="font-medium">Application Review</p>
                  <p className="text-muted-foreground">We'll review your application within 2-3 business days</p>
                </div>
                <div>
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2">2</div>
                  <p className="font-medium">Verification</p>
                  <p className="text-muted-foreground">Our team will verify your documents and credentials</p>
                </div>
                <div>
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2">3</div>
                  <p className="font-medium">Onboarding</p>
                  <p className="text-muted-foreground">Once approved, we'll help you set up your profile</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Location Picker Modal */}
        <MapLocationPicker
          isOpen={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onLocationSelect={(location) => {
            handleInputChange('latitude', location.latitude);
            handleInputChange('longitude', location.longitude);
            if (location.address) {
              handleInputChange('address', location.address);
            }
          }}
          initialLocation={
            formData.latitude && formData.longitude
              ? { lat: formData.latitude, lng: formData.longitude, address: formData.address }
              : undefined
          }
          title="Select Center Location"
        />
      </main>
      
      <Footer />
    </div>
  </GoogleMapsProvider>
  );
};

export default LabSignupPage;