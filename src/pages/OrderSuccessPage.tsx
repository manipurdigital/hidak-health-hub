import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BackToHome } from '@/components/BackToHome';
import { Link } from 'react-router-dom';
import { useOrder } from '@/hooks/api-hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-states';

export function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading, error } = useOrder(orderId || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <ErrorState 
              title="Order Not Found"
              description="The order you're looking for could not be found."
            />
          </div>
        </div>
      </div>
    );
  }

  
  // Parse shipping address from JSON
  const shippingAddress = order.shipping_address as any;

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
                <p className="text-lg font-mono font-semibold">{order.order_number}</p>
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
                {order.order_items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.medicine?.name || 'Medicine'}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₹{item.total_price?.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total Amount</span>
                <span>₹{order.total_amount?.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="font-medium">Delivery Address</p>
                <p className="text-sm text-muted-foreground">
                  {shippingAddress?.full_name}<br />
                  {shippingAddress?.phone && (
                    <>
                      {shippingAddress.phone}<br />
                    </>
                  )}
                  {shippingAddress?.address_line_1}
                  {shippingAddress?.address_line_2 && <>, {shippingAddress.address_line_2}</>}<br />
                  {shippingAddress?.city}, {shippingAddress?.state} - {shippingAddress?.postal_code}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/dashboard">
                View All Orders
              </Link>
            </Button>
            <BackToHome text="Continue Shopping" className="flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}