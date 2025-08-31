import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Truck, CheckCircle, User, MapPin } from 'lucide-react';

interface DeliveryTrackingProps {
  orderId: string;
}

export function DeliveryTracking({ orderId }: DeliveryTrackingProps) {
  // Mock delivery data since the table structure is being updated
  const mockAssignment = {
    status: 'pending',
    order_number: `ORD-${orderId.substring(0, 8)}`,
    rider: { full_name: 'John Doe', code: 'RD001' },
    assigned_at: new Date().toISOString(),
    delivery_address: '123 Main Street, City, State'
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'on_the_way':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order assigned, rider preparing';
      case 'on_the_way':
        return 'On the way to you';
      case 'delivered':
        return 'Delivered successfully';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(mockAssignment.status)}
          Delivery Status - {getStatusText(mockAssignment.status)}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Order #{mockAssignment.order_number}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {mockAssignment.rider && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <User className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{mockAssignment.rider.full_name}</p>
              <p className="text-sm text-muted-foreground">Rider ID: {mockAssignment.rider.code}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="font-medium">Delivery Timeline</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <div>
                <p className="text-sm font-medium">Assigned</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(mockAssignment.assigned_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium mb-2">Delivery Address</h4>
              <p className="text-sm text-muted-foreground">
                {mockAssignment.delivery_address}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}