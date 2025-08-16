import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  // Mock order data - in real app, fetch from API
  const orderData = {
    id: orderId,
    orderNumber: `ORD-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
    status: 'confirmed',
    items: [
      { name: 'Paracetamol 500mg', quantity: 2, price: 25 },
      { name: 'Crocin Advance', quantity: 1, price: 45 },
    ],
    totalAmount: 95,
    deliveryAddress: {
      name: 'John Doe',
      address: '123 Main St, Apartment 4B',
      city: 'Mumbai',
      postalCode: '400001',
    },
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  };

  const orderSteps = [
    { icon: CheckCircle, label: 'Order Confirmed', completed: true },
    { icon: Package, label: 'Preparing', completed: false },
    { icon: Truck, label: 'On the Way', completed: false },
    { icon: Home, label: 'Delivered', completed: false },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <Card className="text-center mb-8">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-green-600 mb-2">Order Placed Successfully!</h1>
              <p className="text-muted-foreground mb-4">
                Thank you for your order. We'll send you a confirmation email shortly.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="text-lg font-mono font-semibold">{orderData.orderNumber}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                {orderSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className={`text-xs mt-2 text-center ${
                        step.completed ? 'text-green-600 font-medium' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </p>
                      {index < orderSteps.length - 1 && (
                        <div className={`absolute h-0.5 w-full top-5 left-1/2 transform -translate-x-1/2 ${
                          step.completed ? 'bg-green-200' : 'bg-muted'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-3">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total Amount</span>
                <span>₹{orderData.totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">Delivery Address</p>
                <p className="text-sm text-muted-foreground">
                  {orderData.deliveryAddress.name}<br />
                  {orderData.deliveryAddress.address}<br />
                  {orderData.deliveryAddress.city} - {orderData.deliveryAddress.postalCode}
                </p>
              </div>
              
              <div>
                <p className="font-medium">Estimated Delivery</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{orderData.estimatedDelivery}</Badge>
                  <span className="text-sm text-muted-foreground">
                    (2-3 business days)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
              View All Orders
            </Button>
            <Button onClick={() => navigate('/')} className="flex-1">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}