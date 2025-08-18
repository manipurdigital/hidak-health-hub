import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, MapPin, Phone, Mail, CreditCard, Truck, CheckCircle, AlertTriangle } from 'lucide-react';

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
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [serviceability, setServiceability] = useState<ServiceabilityResult | null>(null);
  const [checkingServiceability, setCheckingServiceability] = useState(false);
  
  const { state: cartState, clearCart } = useCart();
  const { user } = useAuth();
  const { extraDiscount, freeDelivery } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  const deliveryFee = freeDelivery ? 0 : 50;
  const subscriptionDiscount = (cartState.totalAmount * extraDiscount) / 100;
  const finalTotal = cartState.totalAmount - subscriptionDiscount;
  const totalAmount = finalTotal + deliveryFee;

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Check serviceability when lat/lng is available
  useEffect(() => {
    const checkAddressServiceability = async () => {
      if (shippingAddress.latitude && shippingAddress.longitude) {
        setCheckingServiceability(true);
        try {
          const result = await checkServiceability(
            'delivery',
            shippingAddress.latitude,
            shippingAddress.longitude
          );
          setServiceability(result);
        } catch (error) {
          console.error('Error checking serviceability:', error);
        } finally {
          setCheckingServiceability(false);
        }
      } else {
        setServiceability(null);
      }
    };

    checkAddressServiceability();
  }, [shippingAddress.latitude, shippingAddress.longitude]);

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

    // Check serviceability
    if (serviceability && !serviceability.isServiceable) {
      toast({
        title: "Service Not Available",
        description: serviceability.error || "Delivery not available in your area",
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
        payment_status: 'pending'
      };

      // Add assigned center if available
      if (serviceability?.center) {
        orderData.delivery_center_id = serviceability.center.id;
      }

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
        description: `Order ${order.order_number} has been created. Redirecting to payment...`,
      });

      // Clear cart
      clearCart();

      // Here you would integrate with payment gateway
      // For now, we'll simulate a successful order
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

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

  const handlePayWithStripe = () => {
    toast({
      title: "Payment Integration",
      description: "Stripe payment integration will be set up next. For now, placing order without payment.",
    });
    handlePlaceOrder();
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

                <div>
                  <Label htmlFor="address_line_1">Address Line 1 *</Label>
                  <Input
                    id="address_line_1"
                    value={shippingAddress.address_line_1}
                    onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                    placeholder="House no, Building name, Street"
                    required
                  />
                </div>

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
                {checkingServiceability && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Checking delivery availability for your area...
                    </AlertDescription>
                  </Alert>
                )}
                
                {serviceability && (
                  <Alert className={`mt-4 ${serviceability.isServiceable ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
                    {serviceability.isServiceable ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      {serviceability.isServiceable ? (
                        <div>
                          <span className="text-green-800 font-medium">✓ Delivery Available</span>
                          {serviceability.center && (
                            <div className="mt-1">
                              <Badge variant="secondary" className="text-xs">
                                Serviceable by: {serviceability.center.name}
                              </Badge>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-red-800 font-medium">
                          {serviceability.error || "Delivery not available in your area"}
                        </span>
                      )}
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
                <Button 
                  className="w-full"
                  onClick={handlePayWithStripe}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Pay with Stripe"}
                </Button>
                
                <div className="text-xs text-muted-foreground text-center">
                  <p>🔒 Your payment information is secure and encrypted</p>
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