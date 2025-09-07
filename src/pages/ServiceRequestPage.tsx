import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SimpleSearchInput } from '@/components/SimpleSearchInput';
import { SimpleFileUpload } from '@/components/SimpleFileUpload';
import { AuthPromptDialog } from '@/components/auth/AuthPromptDialog';
import { SimpleLocationInput } from '@/components/SimpleLocationInput';
import { useServiceability } from '@/contexts/ServiceabilityContext';
import { useCreateServiceRequest, ServiceRequestData, ServiceRequestItem, ServiceRequestFile, useUploadServiceRequestFile } from '@/hooks/service-request-hooks';
import { supabase } from '@/integrations/supabase/client';
import { Pill, TestTube, Stethoscope, MapPin, Upload, X, Plus } from 'lucide-react';

const ServiceRequestPage = () => {
  const navigate = useNavigate();
  const createServiceRequest = useCreateServiceRequest();
  const uploadFile = useUploadServiceRequestFile();
  const { setManualLocation, location } = useServiceability();

  const [currentStep, setCurrentStep] = useState<'services' | 'details' | 'items' | 'review'>('services');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '',
    address: '',
  });
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [files, setFiles] = useState<ServiceRequestFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ file: File; fileType: string } | null>(null);

  // Pre-fill customer details from profile if available
  useEffect(() => {
    const loadUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setCustomerDetails(prev => ({
            ...prev,
            name: profile.full_name || '',
            email: profile.email || user.email || '',
          }));
        }
      }
    };

    loadUserProfile();
  }, []);

  const services = [
    { id: 'medicine', name: 'Medicines', icon: Pill, description: 'Order prescription and OTC medicines' },
    { id: 'lab', name: 'Lab Tests', icon: TestTube, description: 'Book diagnostic tests and health checkups' },
    { id: 'consultation', name: 'Doctor Consultation', icon: Stethoscope, description: 'Consult with qualified doctors' },
  ];

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleLocationSelect = (locationData: any) => {
    setManualLocation(locationData);
    setCustomerDetails(prev => ({
      ...prev,
      address: locationData.address || '',
    }));
  };

  const addItem = (serviceType: string, itemType: string, itemValue: string, quantity = 1, notes = '') => {
    setItems(prev => [...prev, { serviceType, itemType, itemValue, quantity, notes }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (file: File, fileType: string) => {
    try {
      const result = await uploadFile.mutateAsync({ 
        file, 
        folder: fileType,
        onAuthRequired: () => {
          setPendingUpload({ file, fileType });
          setShowAuthDialog(true);
        }
      });
      setFiles(prev => [...prev, result]);
    } catch (error) {
      if (error instanceof Error && error.message === 'Authentication required') {
        // Auth dialog will be shown, don't log error
        return;
      }
      console.error('File upload failed:', error);
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthDialog(false);
    
    // Retry the pending upload
    if (pendingUpload) {
      try {
        const result = await uploadFile.mutateAsync({ 
          file: pendingUpload.file, 
          folder: pendingUpload.fileType 
        });
        setFiles(prev => [...prev, result]);
      } catch (error) {
        console.error('File upload failed after auth:', error);
      } finally {
        setPendingUpload(null);
      }
    }
  };

  const handleAuthCancel = () => {
    setShowAuthDialog(false);
    setPendingUpload(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedServices.length) return;

    setIsSubmitting(true);
    try {
      const requestData: ServiceRequestData = {
        customerName: customerDetails.name,
        customerPhone: customerDetails.phone,
        customerEmail: customerDetails.email,
        customerGender: customerDetails.gender,
        customerAddress: location?.address ? { address: location.address } : undefined,
        customerLat: location?.lat,
        customerLng: location?.lng,
        services: selectedServices,
        items,
        files,
      };

      await createServiceRequest.mutateAsync(requestData);
      navigate('/');
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToDetails = selectedServices.length > 0;
  const canProceedToItems = customerDetails.name && customerDetails.phone && 
    (selectedServices.includes('consultation') ? customerDetails.gender : true) &&
    (selectedServices.some(s => ['medicine', 'lab'].includes(s)) ? location?.lat : true);

  if (currentStep === 'services') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Select Services</CardTitle>
            <p className="text-muted-foreground text-center">Choose the services you need (you can select multiple)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.map(service => {
              const Icon = service.icon;
              const isSelected = selectedServices.includes(service.id);
              
              return (
                <Card 
                  key={service.id}
                  className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                  onClick={() => handleServiceToggle(service.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                      <Checkbox checked={isSelected} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            <Button 
              onClick={() => setCurrentStep('details')}
              disabled={!canProceedToDetails}
              className="w-full mt-6"
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'details') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Customer Details</CardTitle>
            <p className="text-muted-foreground text-center">Please provide your contact information</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={customerDetails.phone}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
              />
            </div>

            {selectedServices.includes('consultation') && (
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={customerDetails.gender} onValueChange={(value) => setCustomerDetails(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedServices.some(s => ['medicine', 'lab'].includes(s)) && (
              <div>
                <SimpleLocationInput
                  onLocationSelect={handleLocationSelect}
                  placeholder="Enter your address"
                />
                {location && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Location captured: {location.address || `${location.lat}, ${location.lng}`}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('services')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep('items')}
                disabled={!canProceedToItems}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'items') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Add Items & Upload Files</CardTitle>
            <p className="text-muted-foreground text-center">Add the specific items you need and upload any relevant files</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Medicine Section */}
            {selectedServices.includes('medicine') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medicines
                </h3>
                <div className="space-y-2">
                  <SimpleSearchInput
                    placeholder="Type medicine name and press Enter"
                    onAdd={(value) => addItem('medicine', 'medicine_name', value)}
                  />
                  <p className="text-sm text-muted-foreground">Type medicine names and press Enter to add them</p>
                </div>
              </div>
            )}

            {/* Lab Tests Section */}
            {selectedServices.includes('lab') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Lab Tests
                </h3>
                <div className="space-y-2">
                  <SimpleSearchInput
                    placeholder="Type lab test name and press Enter"
                    onAdd={(value) => addItem('lab', 'test_name', value)}
                  />
                  <p className="text-sm text-muted-foreground">Type test names and press Enter to add them</p>
                </div>
              </div>
            )}

            {/* Consultation Section */}
            {selectedServices.includes('consultation') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Doctor Consultation
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>By Specialty</Label>
                    <SimpleSearchInput
                      placeholder="e.g., Cardiology, Dermatology..."
                      onAdd={(value) => addItem('consultation', 'consultation_specialty', value)}
                    />
                  </div>
                  <div>
                    <Label>By Symptoms</Label>
                    <SimpleSearchInput
                      placeholder="e.g., fever, headache, cough..."
                      onAdd={(value) => addItem('consultation', 'consultation_symptom', value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Added Items */}
            {items.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Added Items</h3>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <Badge variant="outline" className="mr-2">
                          {item.serviceType}
                        </Badge>
                        <span>{item.itemValue}</span>
                        {item.quantity > 1 && <span className="text-muted-foreground ml-2">x{item.quantity}</span>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Files (Optional)
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <SimpleFileUpload
                  onFileSelect={(file) => handleFileUpload(file, 'prescription')}
                  accept="image/*,.pdf"
                  maxSize={5 * 1024 * 1024}
                  label="Prescription Files"
                  onAuthRequired={() => {
                    setShowAuthDialog(true);
                  }}
                />
                <SimpleFileUpload
                  onFileSelect={(file) => handleFileUpload(file, 'report')}
                  accept="image/*,.pdf"
                  maxSize={5 * 1024 * 1024}
                  label="Lab Reports"
                  onAuthRequired={() => {
                    setShowAuthDialog(true);
                  }}
                />
              </div>
            </div>

            {/* Uploaded Files */}
            {files.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Uploaded Files</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <Badge variant="outline" className="mr-2">
                          {file.fileType}
                        </Badge>
                        <span>{file.fileName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('details')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep('review')}
                className="flex-1"
              >
                Review & Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Review step
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Review Your Request</CardTitle>
          <p className="text-muted-foreground text-center">Please review your request before submitting</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Selected Services</h3>
            <div className="flex gap-2">
              {selectedServices.map(service => (
                <Badge key={service}>{service}</Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Customer Details</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {customerDetails.name}</p>
              <p><strong>Phone:</strong> {customerDetails.phone}</p>
              {customerDetails.email && <p><strong>Email:</strong> {customerDetails.email}</p>}
              {customerDetails.gender && <p><strong>Gender:</strong> {customerDetails.gender}</p>}
              {location && <p><strong>Address:</strong> {location.address || `${location.lat}, ${location.lng}`}</p>}
            </div>
          </div>

          {items.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Items ({items.length})</h3>
              <div className="space-y-1">
                {items.map((item, index) => (
                  <p key={index} className="text-sm">
                    <Badge variant="outline" className="mr-2">{item.serviceType}</Badge>
                    {item.itemValue}
                  </p>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Uploaded Files ({files.length})</h3>
              <div className="space-y-1">
                {files.map((file, index) => (
                  <p key={index} className="text-sm">
                    <Badge variant="outline" className="mr-2">{file.fileType}</Badge>
                    {file.fileName}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('items')}
              className="flex-1"
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button 
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <AuthPromptDialog
        isOpen={showAuthDialog}
        onClose={handleAuthCancel}
        onAuthSuccess={handleAuthSuccess}
        message="You need to be signed in to upload files. Please sign in or create an account to continue with your file upload."
      />
    </div>
  );
};

export default ServiceRequestPage;