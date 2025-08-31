// @ts-nocheck
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Plus, Trash2, Save } from 'lucide-react';
import { format } from 'date-fns';

interface TimeSlot {
  start_time: string;
  end_time: string;
}

interface DayAvailability {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export default function DoctorAvailabilityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [timeSlots, setTimeSlots] = useState<Record<number, TimeSlot[]>>({});

  // Get doctor profile
  const { data: doctor } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get current availability
  const { data: availability = [], isLoading } = useQuery({
    queryKey: ['doctor-availability', doctor?.id],
    queryFn: async () => {
      if (!doctor?.id) return [];
      
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctor.id)
        .order('day_of_week');
      
      if (error) throw error;
      return data as DayAvailability[];
    },
    enabled: !!doctor?.id,
  });

  // Update availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (updates: DayAvailability[]) => {
      if (!doctor?.id) throw new Error('Doctor not found');

      // Delete existing availability for this doctor
      await supabase
        .from('doctor_availability')
        .delete()
        .eq('doctor_id', doctor.id);

      // Insert new availability
      if (updates.length > 0) {
        const { error } = await supabase
          .from('doctor_availability')
          .insert(
            updates.map(update => ({
              doctor_id: doctor.id,
              day_of_week: update.day_of_week,
              start_time: update.start_time,
              end_time: update.end_time,
              is_active: update.is_active,
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-availability'] });
      toast({
        title: "Success",
        description: "Availability updated successfully",
      });
      setEditingDay(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveAvailability = () => {
    const updates: DayAvailability[] = [];
    
    DAYS_OF_WEEK.forEach(day => {
      const slots = timeSlots[day.value] || [];
      const existingAvailability = availability.find(a => a.day_of_week === day.value);
      
      if (slots.length > 0) {
        // For simplicity, we'll take the first slot as the day's availability
        // In a more complex system, you might want to handle multiple slots per day
        const slot = slots[0];
        updates.push({
          day_of_week: day.value,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_active: true,
        });
      } else if (existingAvailability) {
        // Keep existing availability but mark as inactive if no slots
        updates.push({
          ...existingAvailability,
          is_active: false,
        });
      }
    });

    updateAvailabilityMutation.mutate(updates);
  };

  const addTimeSlot = (dayValue: number) => {
    setTimeSlots(prev => ({
      ...prev,
      [dayValue]: [
        ...(prev[dayValue] || []),
        { start_time: '09:00', end_time: '17:00' }
      ]
    }));
  };

  const removeTimeSlot = (dayValue: number, index: number) => {
    setTimeSlots(prev => ({
      ...prev,
      [dayValue]: (prev[dayValue] || []).filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (dayValue: number, index: number, field: 'start_time' | 'end_time', value: string) => {
    setTimeSlots(prev => ({
      ...prev,
      [dayValue]: (prev[dayValue] || []).map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  // Initialize timeSlots from existing availability
  React.useEffect(() => {
    if (availability.length > 0) {
      const slots: Record<number, TimeSlot[]> = {};
      availability.forEach(avail => {
        if (avail.is_active) {
          slots[avail.day_of_week] = [{
            start_time: avail.start_time,
            end_time: avail.end_time,
          }];
        }
      });
      setTimeSlots(slots);
    }
  }, [availability]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calendar className="w-8 h-8" />
          Manage Availability
        </h1>
        <p className="text-muted-foreground mt-2">
          Set your weekly availability to help patients book consultations with you.
        </p>
      </div>

      <div className="space-y-4">
        {DAYS_OF_WEEK.map(day => {
          const dayAvailability = availability.find(a => a.day_of_week === day.value);
          const daySlots = timeSlots[day.value] || [];
          const isEditing = editingDay === day.value;

          return (
            <Card key={day.value} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {day.label}
                    {dayAvailability?.is_active && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Available
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDay(day.value)}
                      >
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingDay(null);
                            // Reset to original state
                            if (dayAvailability?.is_active) {
                              setTimeSlots(prev => ({
                                ...prev,
                                [day.value]: [{
                                  start_time: dayAvailability.start_time,
                                  end_time: dayAvailability.end_time,
                                }]
                              }));
                            } else {
                              setTimeSlots(prev => ({
                                ...prev,
                                [day.value]: []
                              }));
                            }
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveAvailability}
                          disabled={updateAvailabilityMutation.isPending}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <div>
                    {dayAvailability?.is_active ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {dayAvailability.start_time} - {dayAvailability.end_time}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Not available
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {daySlots.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">
                          No availability set for {day.label}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => addTimeSlot(day.value)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Time Slot
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {daySlots.map((slot, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">From:</Label>
                              <Input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) => updateTimeSlot(day.value, index, 'start_time', e.target.value)}
                                className="w-32"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">To:</Label>
                              <Input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) => updateTimeSlot(day.value, index, 'end_time', e.target.value)}
                                className="w-32"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeTimeSlot(day.value, index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addTimeSlot(day.value)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Another Slot
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Important Notes:</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Patients can book consultations during your available hours</li>
          <li>Changes to availability apply immediately</li>
          <li>Existing bookings will not be affected by availability changes</li>
          <li>Consider buffer time between consultations when setting availability</li>
        </ul>
      </div>
    </div>
  );
}
