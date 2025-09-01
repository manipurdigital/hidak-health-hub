import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, MapPin, Clock, Package, MessageCircle } from 'lucide-react';
import { WhatsAppShareButton } from '@/components/WhatsAppShareButton';

interface Order {
  id: string;
  order_number: string;
  patient_name: string;
  patient_phone: string;
  shipping_address: string;
  patient_location_lat: number | null;
  patient_location_lng: number | null;
  total_amount: number;
  status: string;
  is_within_service_area?: boolean;
  assignment_notes?: string;
  order_items?: {
    quantity: number;
    medicine: { name: string };
  }[];
}

interface LabBooking {
  id: string;
  patient_name: string;
  patient_phone: string;
  booking_date: string;
  booking_time: string;
  test_name?: string;
  status: string;
  is_within_service_area?: boolean;
  assignment_notes?: string;
}

interface ManualAssignmentPanelProps {
  type: 'order' | 'lab_booking';
  data: Order | LabBooking;
  onUpdate?: () => void;
}

export function ManualAssignmentPanel({ type, data, onUpdate }: ManualAssignmentPanelProps) {
  const [riderCode, setRiderCode] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState(data.assignment_notes || '');
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  const handleAssignment = async () => {
    if (!riderCode.trim()) {
      toast({
        title: "Rider code required",
        description: "Please enter a rider code for assignment",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    try {
      const tableName = type === 'order' ? 'orders' : 'lab_bookings';
      const updateData = {
        assignment_notes: `Rider: ${riderCode.trim()}\nNotes: ${assignmentNotes.trim()}`,
        status: 'assigned'
      };

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', data.id);

      if (error) throw error;

      // Log assignment notification
      await supabase.from('admin_notifications').insert({
        type: 'assignment_made',
        entity_type: type,
        entity_id: data.id,
        message: `Assigned to rider ${riderCode}`,
        status: 'completed',
        processed_at: new Date().toISOString()
      });

      toast({
        title: "Assignment successful",
        description: `${type === 'order' ? 'Order' : 'Lab booking'} assigned to rider ${riderCode}`
      });

      setRiderCode('');
      onUpdate?.();
    } catch (error) {
      console.error('Assignment error:', error);
      toast({
        title: "Assignment failed",
        description: "Failed to assign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const buildWhatsAppData = () => {
    if (type === 'order') {
      const order = data as Order;
      return {
        orderNumber: order.order_number,
        patientName: order.patient_name,
        patientPhone: order.patient_phone,
        totalAmount: order.total_amount,
        medicines: order.order_items?.map(item => ({
          name: item.medicine.name,
          quantity: item.quantity
        })) || []
      };
    } else {
      const booking = data as LabBooking;
      return {
        id: booking.id,
        patient_name: booking.patient_name,
        patient_phone: booking.patient_phone,
        booking_date: booking.booking_date,
        time_slot: booking.booking_time,
        test_name: booking.test_name || 'Lab Test'
      };
    }
  };

  const getLocationData = () => {
    if (type === 'order') {
      const order = data as Order;
      return {
        lat: order.patient_location_lat || 24.817,
        lng: order.patient_location_lng || 93.938,
        address: order.shipping_address
      };
    }
    return {
      lat: 24.817, // Default Imphal coordinates
      lng: 93.938,
      address: 'Address not available'
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type === 'order' ? <Package className="h-5 w-5" /> : <User className="h-5 w-5" />}
          Manual Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Area Status */}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Badge variant={data.is_within_service_area ? "default" : "destructive"}>
            {data.is_within_service_area ? "Within Service Area" : "Outside Service Area"}
          </Badge>
        </div>

        {/* Patient Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{data.patient_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{data.patient_phone}</span>
          </div>
          {type === 'lab_booking' && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{(data as LabBooking).booking_date} at {(data as LabBooking).booking_time}</span>
            </div>
          )}
        </div>

        {/* Assignment Form */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="rider-code">Rider Code</Label>
            <Input
              id="rider-code"
              value={riderCode}
              onChange={(e) => setRiderCode(e.target.value)}
              placeholder="Enter rider code (e.g., R001)"
            />
          </div>

          <div>
            <Label htmlFor="assignment-notes">Assignment Notes</Label>
            <Textarea
              id="assignment-notes"
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              placeholder="Add special instructions or notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleAssignment}
              disabled={isAssigning || !riderCode.trim()}
              className="flex-1"
            >
              {isAssigning ? 'Assigning...' : 'Assign Rider'}
            </Button>
          </div>
        </div>

        {/* WhatsApp Integration */}
        <div className="pt-4 border-t">
          <Label className="text-sm font-medium">Quick Actions</Label>
          <div className="mt-2">
            <WhatsAppShareButton
              bookingData={buildWhatsAppData()}
              pickupLocation={getLocationData()}
              variant="outline"
              size="sm"
              className="w-full"
            />
          </div>
        </div>

        {/* Current Assignment */}
        {data.assignment_notes && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm font-medium">Current Assignment</Label>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
              {data.assignment_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}