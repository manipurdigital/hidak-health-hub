import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionBenefits from '@/components/SubscriptionBenefits';
import { supabase } from '@/integrations/supabase/client';
import { checkServiceability, ServiceabilityResult } from '@/services/serviceability';
import { LocationInputField } from '@/components/LocationInputField';
import { ArrowLeft, MapPin, Phone, Mail, CreditCard, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { openRazorpayCheckout, useVerifyPayment } from '@/hooks/payment-hooks';
import { useServiceability } from '@/contexts/ServiceabilityContext';

interface ShippingAddress {
  full_name: string;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

const CheckoutPage = () => {
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    full_name: '',
    phone: '',
    email: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India'
  });
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { state: cartState, clearCart } = useCart();
  const { user } = useAuth();
  const { extraDiscount, freeDelivery } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const verifyPayment = useVerifyPayment();

  const { setManualLocation, feePreview, inDeliveryArea, loading: serviceabilityLoading } = useServiceability();
  const deliveryFee = freeDelivery ? 0 : (feePreview?.fee || 50);
  const subscriptionDiscount = (cartState.totalAmount * extraDiscount) / 100;
  const finalTotal = cartState.totalAmount - subscriptionDiscount;
  const totalAmount = finalTotal + deliveryFee;

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle location selection and parse address components
  const handleLocationSelect = async (location: { latitude: number; longitude: number; address?: string }) => {
    // Update coordinates
    setShippingAddress(prev => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
    }));

    // Check serviceability immediately
    await setManualLocation({ 
      lat: location.latitude, 
      lng: location.longitude, 
      address: location.address 
    });

    // If we have an address, try to parse it into components
    if (location.address) {
      try {
        // Use Google Geocoding API to get detailed address components
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({
          location: { lat: location.latitude, lng: location.longitude }
        });

        if (response.results && response.results.length > 0) {
          const result = response.results[0];
          let streetNumber = '';
          let route = '';
          let locality = '';
          let city = '';
          let state = '';
          let postalCode = '';
          let sublocality = '';

          // Parse address components
          result.address_components?.forEach(component => {
            const types = component.types;
            
            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            } else if (types.includes('route')) {
              route = component.long_name;
            } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
              sublocality = component.long_name;
            } else if (types.includes('locality')) {
              locality = component.long_name;
            } else if (types.includes('administrative_area_level_2')) {
              city = city || component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
            } else if (types.includes('postal_code')) {
              postalCode = component.long_name;
            }
          });

          // Construct address line 1
          const addressLine1 = [streetNumber, route].filter(Boolean).join(' ') || 
                              result.formatted_address.split(',')[0];

          // Update all address fields
          setShippingAddress(prev => ({
            ...prev,
            address_line_1: addressLine1,
            address_line_2: sublocality || prev.address_line_2,
            city: locality || city || prev.city,
            state: state || prev.state,
            postal_code: postalCode || prev.postal_code,
          }));

          toast({
            title: "Address Updated",
            description: "Address fields have been automatically filled from map selection.",
          });
        } else {
          // Fallback to just setting the formatted address
          setShippingAddress(prev => ({
            ...prev,
            address_line_1: location.address || prev.address_line_1,
          }));
        }
      } catch (error) {
        console.warn('Failed to parse address components:', error);
        // Fallback to just setting the formatted address
        setShippingAddress(prev => ({
          ...prev,
          address_line_1: location.address || prev.address_line_1,
        }));
      }
    }
  };

  const validateForm = () => {
    const required = ['full_name', 'phone', 'email', 'address_line_1', 'city', 'state', 'postal_code'];
    for (const field of required) {
      const value = shippingAddress[field as keyof ShippingAddress];
      if (typeof value === 'string' && !value.trim()) {
        toast({
          title: "Missing Information",
          description: `Please fill in ${field.replace('_', ' ')}`,
          variant: "destructive"
        });
        return false;
      }
    }

    // Check serviceability using new context
    if (inDeliveryArea === false) {
      toast({
        title: "Service Not Available",
        description: "This location is outside our delivery area. Please select a different address.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to place an order",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (cartState.items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Check if any items require prescription
      const requiresPrescription = cartState.items.some(item => {
        // You might want to fetch this info from the medicines table
        return false; // For now, assume no prescription required
      });

      // Generate order number using database function to satisfy types
      const { data: generatedOrderNumber, error: genOrderErr } = await supabase.rpc('generate_order_number');
      if (genOrderErr || !generatedOrderNumber) {
        throw genOrderErr ?? new Error('Failed to generate order number');
      }

      // Create order in database with center assignment
      const orderData: any = {
        user_id: user.id,
        order_number: generatedOrderNumber,
        total_amount: totalAmount,
        shipping_address: JSON.parse(JSON.stringify(shippingAddress)),
        prescription_required: requiresPrescription,
        notes: notes || null,
        status: 'pending',
        payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
        payment_method: paymentMethod
      };

      // No need to add center assignment here - it will be handled automatically by the new geofencing system
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartState.items.map(item => ({
        order_id: order.id,
        medicine_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Order Placed Successfully!",
        description: `Order ${order.order_number} has been created. ${paymentMethod === 'cod' ? 'You can pay when the order is delivered.' : 'Redirecting to payment...'}`,
      });

      // Clear cart
      clearCart();

      if (paymentMethod === 'cod') {
        // For COD, redirect to success page directly
        navigate(`/order/success/${order.id}`);
      } else {
        // For online payment, handle payment flow (if needed)
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }

    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to place an order",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (cartState.items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    if (!validateForm()) return;
    
    if (paymentMethod === 'cod') {
      // For COD, use the existing handlePlaceOrder logic
      await handlePlaceOrder();
      return;
    }
    
    setLoading(true);
    
    try {
      // Create order and get Razorpay order details
      const orderResult = await createOrderAndInitiatePayment();
      if (orderResult) {
        // Open Razorpay checkout
        openRazorpayCheckout({
          key: orderResult.razorpay_key_id,
          amount: Math.round(orderResult.total_amount * 100),
          currency: 'INR',
          name: 'Medicine Order',
          description: `Order ${orderResult.order_number}`,
          order_id: orderResult.razorpay_order_id,
          handler: async (response: any) => {
            try {
              await verifyPayment.mutateAsync({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              clearCart();
              navigate('/order-success/' + orderResult.id);
            } catch (e) {
              toast({
                title: 'Payment Verification Failed',
                description: 'We could not verify your payment. Please contact support.',
                variant: 'destructive',
              });
            }
          },
          prefill: {
            name: shippingAddress.full_name,
            email: shippingAddress.email,
            contact: shippingAddress.phone,
          },
          theme: { color: '#06b6d4' },
          modal: {
            ondismiss: () => {
              toast({
                title: 'Payment Cancelled',
                description: 'You dismissed the payment. You can try again.',
                variant: 'destructive',
              });
            },
          },
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrderAndInitiatePayment = async () => {
    // Prepare payload expected by edge function
    const orderData = {
      items: cartState.items.map(item => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      })),
      shippingAddress,
      notes: notes || null,
    };

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Please sign in to pay.');

    const { data, error } = await supabase.functions.invoke('create-order', {
      body: orderData,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Failed to create order');

    return data.order;
  };

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some medicines to your cart to proceed with checkout</p>
            <Button onClick={() => navigate('/')}>
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shopping
          </Button>
          <h1 className="text-xl font-semibold">Checkout</h1>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Subscription Benefits */}
        <SubscriptionBenefits showInCheckout className="mb-6" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Address Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={shippingAddress.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={shippingAddress.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <LocationInputField
                  label="Address Line 1"
                  addressValue={shippingAddress.address_line_1}
                  onAddressChange={(value) => handleInputChange('address_line_1', value)}
                  onLocationSelect={(location) => {
                    handleLocationSelect(location);
                  }}
                  placeholder="House no, Building name, Street"
                  required
                  showGPSPicker={true}
                  showPlacesSearch={true}
                  showMapPicker={true}
                />

                <div>
                  <Label htmlFor="address_line_2">Address Line 2</Label>
                  <Input
                    id="address_line_2"
                    value={shippingAddress.address_line_2}
                    onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                    placeholder="Area, Landmark (Optional)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code *</Label>
                    <Input
                      id="postal_code"
                      value={shippingAddress.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      placeholder="PIN Code"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Special Instructions</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special delivery instructions..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartState.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{cartState.totalAmount.toFixed(0)}</span>
                  </div>
                  
                  {extraDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Care+ Discount ({extraDiscount}%)</span>
                      <span>-₹{subscriptionDiscount.toFixed(0)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      Delivery Fee
                      {freeDelivery && <span className="text-green-600 text-xs">(Free)</span>}
                    </span>
                    <span className={freeDelivery ? "line-through text-muted-foreground" : ""}>
                      ₹{freeDelivery ? 0 : 50}
                    </span>
                  </div>
                  
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>₹{totalAmount.toFixed(0)}</span>
                  </div>
                </div>
                
                {/* Serviceability Status */}
                {serviceabilityLoading && (
                  <Alert className="mt-4">
                    <MapPin className="h-4 w-4" />
                    <AlertDescription>
                      Checking delivery availability for your area...
                    </AlertDescription>
                  </Alert>
                )}
                
                {inDeliveryArea === true && (
                  <Alert className="mt-4 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <div>
                        <span className="text-green-800 font-medium">✓ Delivery Available</span>
                        {feePreview && (
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-xs">
                              Estimated delivery fee: ₹{feePreview.fee}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {inDeliveryArea === false && (
                  <Alert className="mt-4 border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <span className="text-red-800 font-medium">
                        Delivery not available in your area
                      </span>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={(value: 'online' | 'cod') => setPaymentMethod(value)}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="flex-1 cursor-pointer">
                      <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="font-medium">Online Payment</div>
                        <p className="text-sm text-muted-foreground">
                          Pay securely using UPI, Cards, Net Banking
                        </p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="font-medium">Cash on Delivery</div>
                        <p className="text-sm text-muted-foreground">
                          Pay when the order is delivered to your address
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                <Button 
                  className="w-full"
                  onClick={handlePayNow}
                  disabled={loading}
                >
                  {loading ? "Processing..." : paymentMethod === 'cod' ? "Place Order" : "Pay Now"}
                </Button>
                
                <div className="text-xs text-muted-foreground text-center">
                  <p>🔒 Your {paymentMethod === 'cod' ? 'order information is' : 'payment information is'} secure and encrypted</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;