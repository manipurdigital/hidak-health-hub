import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { type DeliveryAssignment } from '@/hooks/delivery-placeholders';
import { DeliveryMap } from './DeliveryMap';
import { Clock, Truck, CheckCircle, MapPin, User, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface DeliveryDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: DeliveryAssignment | null;
}

export function DeliveryDetailPanel({ open, onOpenChange, assignment }: DeliveryDetailPanelProps) {
  if (!assignment) {
    return null;
  }

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Not yet';
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
  };

  const getTimelineStatus = (status: string, currentStatus: string) => {
    const statusOrder = ['pending', 'on_the_way', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const statusIndex = statusOrder.indexOf(status);
    
    if (statusIndex <= currentIndex) {
      return 'completed';
    }
    return 'pending';
  };

  const timelineItems = [
    {
      status: 'pending',
      title: 'Order Assigned',
      description: 'Rider has been assigned to this order',
      icon: User,
      timestamp: assignment.assigned_at
    },
    {
      status: 'on_the_way', 
      title: 'Picked Up',
      description: 'Rider has started the delivery trip',
      icon: Truck,
      timestamp: assignment.picked_up_at
    },
    {
      status: 'delivered',
      title: 'Delivered',
      description: 'Package delivered to customer',
      icon: CheckCircle,
      timestamp: assignment.delivered_at
    }
  ];

  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address) {
      const parts = [];
      if (address.address_line_1) parts.push(address.address_line_1);
      if (address.address_line_2) parts.push(address.address_line_2);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.postal_code) parts.push(address.postal_code);
      return parts.join(', ');
    }
    return 'Address not available';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order {assignment.order_number}
          </SheetTitle>
          <SheetDescription>
            Detailed delivery information and tracking timeline
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Current Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {assignment.status === 'pending' && <Clock className="h-6 w-6 text-orange-500" />}
                {assignment.status === 'on_the_way' && <Truck className="h-6 w-6 text-blue-500" />}
                {assignment.status === 'delivered' && <CheckCircle className="h-6 w-6 text-green-500" />}
                <div>
                  <p className="font-medium text-lg capitalize">{assignment.status.replace('_', ' ')}</p>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {formatTimestamp(assignment.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rider Information */}
          {assignment.rider_code && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Assigned Rider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{assignment.rider_name}</p>
                    <p className="text-sm text-muted-foreground">Rider ID: {assignment.rider_code}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Delivery Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineItems.map((item, index) => {
                  const isCompleted = getTimelineStatus(item.status, assignment.status) === 'completed';
                  const Icon = item.icon;
                  
                  return (
                    <div key={item.status} className="flex items-start gap-4">
                      {/* Timeline Line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {index < timelineItems.length - 1 && (
                          <div className={`w-0.5 h-8 ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                      
                      {/* Timeline Content */}
                      <div className="flex-1 pb-8">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {item.title}
                          </p>
                          {isCompleted && (
                            <Badge variant="secondary" className="text-xs">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatTimestamp(item.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Delivery Address */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Delivery Address</p>
                  <p className="text-sm text-muted-foreground">
                    {formatAddress(assignment.customer_address)}
                  </p>
                  {assignment.dest_lat && assignment.dest_lng && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Coordinates: {assignment.dest_lat}, {assignment.dest_lng}
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {assignment.notes && (
                <div>
                  <p className="font-medium text-sm mb-1">Delivery Notes</p>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    {assignment.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Delivery Location</CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryMap
                lat={assignment.dest_lat}
                lng={assignment.dest_lng}
                address={formatAddress(assignment.customer_address)}
                className="w-full h-48"
              />
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}