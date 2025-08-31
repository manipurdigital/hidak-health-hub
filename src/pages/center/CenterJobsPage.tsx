
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Calendar,
  CheckCircle,
  Truck,
  AlertCircle,
  FileText,
  Navigation,
  ExternalLink
} from 'lucide-react';
import { useCenterBookings, useUpdateLabBooking } from '@/hooks/center-hooks';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryMap } from '@/components/delivery/DeliveryMap';
import { WhatsAppShareButton } from '@/components/WhatsAppShareButton';

export function CenterJobsPage() {
  const { data: bookings = [], isLoading, refetch } = useCenterBookings();
  const updateBooking = useUpdateLabBooking();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('assigned');

  // Set up real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('lab-bookings-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lab_bookings'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const handleAcceptAndStart = async (booking: any) => {
    const collectorName = prompt('Enter collector name:');
    if (!collectorName) return;

    const eta = new Date();
    eta.setHours(eta.getHours() + 1); // Default 1 hour ETA

    try {
      await updateBooking.mutateAsync({
        id: booking.id,
        status: 'en_route',
        collector_name: collectorName,
        eta: eta.toISOString(),
      });
      
      toast({
        title: "Success",
        description: "Job accepted and started successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept job",
        variant: "destructive",
      });
    }
  };

  const handleMarkCollected = async (booking: any) => {
    const notes = prompt('Collection notes (optional):');
    
    try {
      await updateBooking.mutateAsync({
        id: booking.id,
        status: 'collected',
        collected_at: new Date().toISOString(),
        special_instructions: notes || booking.special_instructions,
      });
      
      toast({
        title: "Success",
        description: "Sample collection marked as completed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as collected",
        variant: "destructive",
      });
    }
  };

  const handleCannotCollect = async (booking: any) => {
    const reason = prompt('Reason for not being able to collect:');
    if (!reason) return;

    try {
      await updateBooking.mutateAsync({
        id: booking.id,
        status: 'reschedule_requested',
        reschedule_reason: reason,
      });
      
      toast({
        title: "Reschedule Requested",
        description: "Reschedule request submitted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request reschedule",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { label: 'Assigned', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      en_route: { label: 'En Route', variant: 'default' as const, color: 'bg-orange-100 text-orange-800' },
      collected: { label: 'Collected', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      reschedule_requested: { label: 'Reschedule', variant: 'default' as const, color: 'bg-red-100 text-red-800' },
      canceled: { label: 'Canceled', variant: 'default' as const, color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatTime = (timeString: string) => {
    const [hour] = timeString.split(':');
    const hourNum = parseInt(hour);
    const endHour = hourNum + 2;
    return `${timeString} - ${endHour.toString().padStart(2, '0')}:00`;
  };

  const filterBookings = (status: string) => {
    return bookings.filter(booking => booking.status === status);
  };

  const renderPickupLocation = (booking: any) => {
    if (!booking.pickup_lat || !booking.pickup_lng) {
      return (
        <div className="text-sm text-muted-foreground p-3 bg-amber-50 rounded border border-amber-200">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Location Data Unavailable</p>
              <p className="text-amber-600">Please contact patient for exact pickup address</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Pickup Location</p>
            <div className="text-xs text-muted-foreground mb-2">
              {booking.pickup_lat.toFixed(6)}, {booking.pickup_lng.toFixed(6)}
            </div>
            
            {booking.pickup_address && (
              <div className="text-sm text-muted-foreground mb-3">
                {(() => {
                  try {
                    const addr = typeof booking.pickup_address === 'string' 
                      ? JSON.parse(booking.pickup_address) 
                      : booking.pickup_address;
                    return [
                      addr.address_line_1,
                      addr.address_line_2,
                      addr.city,
                      addr.state,
                      addr.pincode
                    ].filter(Boolean).join(', ');
                  } catch {
                    return 'Address information available';
                  }
                })()}
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `https://maps.google.com/?q=${booking.pickup_lat},${booking.pickup_lng}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Open in Maps
              </Button>
              
              <WhatsAppShareButton
                bookingData={{
                  id: booking.id,
                  patient_name: booking.patient_name,
                  patient_phone: booking.patient_phone,
                  booking_date: booking.booking_date,
                  time_slot: booking.time_slot || '',
                  test_name: booking.test?.name || 'Lab Test'
                }}
                pickupLocation={{
                  lat: booking.pickup_lat,
                  lng: booking.pickup_lng,
                  address: booking.pickup_address
                }}
                size="sm"
              />
            </div>

            <DeliveryMap
              lat={booking.pickup_lat}
              lng={booking.pickup_lng}
              address={booking.pickup_address}
              className="h-32 rounded"
            />
          </div>
        </div>
      </div>
    );
  };

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">{booking.patient_name}</h3>
            <p className="text-muted-foreground">{booking.test?.name || 'Lab Test Collection'}</p>
          </div>
          {getStatusBadge(booking.status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{booking.booking_date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{formatTime(booking.time_slot)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{booking.patient_phone}</span>
            </div>
          </div>

          <div className="space-y-2">
            {renderPickupLocation(booking)}
          </div>
        </div>

        {booking.special_instructions && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Special Instructions</p>
                <p className="text-sm text-muted-foreground">{booking.special_instructions}</p>
              </div>
            </div>
          </div>
        )}

        {booking.collector_name && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Collector: {booking.collector_name}</span>
              {booking.eta && (
                <span className="text-sm text-muted-foreground">
                  • ETA: {new Date(booking.eta).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        )}

        {booking.reschedule_reason && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Reschedule Reason</p>
                <p className="text-sm text-red-600">{booking.reschedule_reason}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {booking.status === 'assigned' && (
            <Button 
              onClick={() => handleAcceptAndStart(booking)}
              className="flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              Accept & Start
            </Button>
          )}
          
          {booking.status === 'en_route' && (
            <>
              <Button 
                onClick={() => handleMarkCollected(booking)}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Collected
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleCannotCollect(booking)}
                className="flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Cannot Collect
              </Button>
              <Button 
                variant="outline"
                asChild
                className="flex items-center gap-2"
              >
                <Link to={`/center/tracking/lab/${booking.id}`}>
                  <Navigation className="w-4 h-4" />
                  Track
                </Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Lab Collection Jobs</h1>
        <p className="text-muted-foreground">
          Manage your assigned lab sample collections and track payments
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="assigned">
            Assigned ({filterBookings('assigned').length})
          </TabsTrigger>
          <TabsTrigger value="en_route">
            En Route ({filterBookings('en_route').length})
          </TabsTrigger>
          <TabsTrigger value="collected">
            Collected ({filterBookings('collected').length})
          </TabsTrigger>
          <TabsTrigger value="reschedule_requested">
            Reschedule ({filterBookings('reschedule_requested').length})
          </TabsTrigger>
          <TabsTrigger value="canceled">
            Canceled ({filterBookings('canceled').length})
          </TabsTrigger>
        </TabsList>

        {['assigned', 'en_route', 'collected', 'reschedule_requested', 'canceled'].map((status) => (
          <TabsContent key={status} value={status} className="mt-6">
            {isLoading ? (
              <p className="text-center text-muted-foreground">Loading bookings...</p>
            ) : filterBookings(status).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No bookings in this category</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filterBookings(status).map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
