import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Truck, CheckCircle, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface DeliveryTrackingProps {
  orderId: string;
}

export function DeliveryTracking({ orderId }: DeliveryTrackingProps) {
  const { data: assignment, isLoading } = useQuery({
    queryKey: ['order-delivery-tracking', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          orders!inner(
            order_number,
            shipping_address
          ),
          riders(
            code,
            full_name
          )
        `)
        .eq('order_id', orderId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delivery Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading delivery information...</div>
        </CardContent>
      </Card>
    );
  }

  if (!assignment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delivery Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-orange-600">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Preparing for dispatch</span>
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            Your order is being prepared and will be assigned to a rider soon.
          </p>
        </CardContent>
      </Card>
    );
  }

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

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return null;
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center gap-3">
          {getStatusIcon(assignment.status)}
          <div>
            <p className="font-medium">{getStatusText(assignment.status)}</p>
            <p className="text-sm text-muted-foreground">Order #{assignment.orders?.order_number}</p>
          </div>
        </div>

        {/* Rider Information */}
        {assignment.riders && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{assignment.riders.full_name}</p>
              <p className="text-sm text-muted-foreground">Rider ID: {assignment.riders.code}</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-3">
          <h4 className="font-medium">Delivery Timeline</h4>
          
          <div className="space-y-3">
            {/* Assigned */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${assignment.assigned_at ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">Order Assigned</p>
                {assignment.assigned_at && (
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(assignment.assigned_at)}
                  </p>
                )}
              </div>
            </div>

            {/* Picked Up */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${assignment.picked_up_at ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">Picked Up</p>
                {assignment.picked_up_at && (
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(assignment.picked_up_at)}
                  </p>
                )}
              </div>
            </div>

            {/* Delivered */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${assignment.delivered_at ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">Delivered</p>
                {assignment.delivered_at && (
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(assignment.delivered_at)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {assignment.orders?.shipping_address && (
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Delivery Address</p>
              <p className="text-sm text-muted-foreground">
                {typeof assignment.orders.shipping_address === 'string' 
                  ? assignment.orders.shipping_address 
                  : JSON.stringify(assignment.orders.shipping_address)
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}