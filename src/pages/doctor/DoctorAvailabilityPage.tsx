import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Save,
  LogOut
} from 'lucide-react';

interface AvailabilitySlot {
  id?: string;
  availability_date: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export default function DoctorAvailabilityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  // Get doctor profile
  const { data: doctor } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
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
        .gte('availability_date', format(new Date(), 'yyyy-MM-dd'))
        .order('availability_date, start_time');
      
      if (error) throw error;
      return data as AvailabilitySlot[];
    },
    enabled: !!doctor?.id,
  });

  // Add availability mutation
  const addAvailabilityMutation = useMutation({
    mutationFn: async (slot: { availability_date: string; start_time: string; end_time: string }) => {
      if (!doctor?.id) throw new Error('Doctor not found');

      const { error } = await supabase
        .from('doctor_availability')
        .insert({
          doctor_id: doctor.id,
          availability_date: slot.availability_date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_active: true,
          is_available: true
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-availability'] });
      toast({
        title: "Success",
        description: "Availability slot added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete availability mutation  
  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('doctor_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-availability'] });
      toast({
        title: "Success",
        description: "Availability slot removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddSlot = () => {
    if (!selectedDate) return;
    
    addAvailabilityMutation.mutate({
      availability_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: startTime,
      end_time: endTime
    });
  };

  const handleQuickAdd = (days: number) => {
    const date = addDays(new Date(), days);
    setSelectedDate(date);
  };

  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const groupedAvailability = availability.reduce((acc, slot) => {
    const date = slot.availability_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse space-y-6 w-full max-w-4xl p-6">
          <div className="h-10 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Manage Availability</h1>
                <p className="text-muted-foreground">Set your availability for specific dates to help patients book consultations with you.</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Add Availability */}
          <div className="space-y-6">
            {/* Select Date */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Quick Actions:</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleQuickAdd(0)}>
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleQuickAdd(1)}>
                        Tomorrow
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleQuickAdd(7)}>
                        Next Week
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Slots */}
            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Slots for {format(selectedDate, "MMMM do, yyyy")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Start Time</label>
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">End Time</label>
                        <Input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleAddSlot}
                      disabled={addAvailabilityMutation.isPending}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Time Slot
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Current Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Current Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.keys(groupedAvailability).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No availability set. Select a date above to add your availability.
                  </p>
                ) : (
                  Object.entries(groupedAvailability)
                    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                    .map(([date, slots]) => (
                      <div key={date} className="border rounded-lg p-4">
                        <h3 className="font-medium mb-3">
                          {format(new Date(date), "EEEE, MMMM do, yyyy")}
                        </h3>
                        <div className="space-y-2">
                          {slots.map((slot) => (
                            <div key={slot.id} className="flex items-center justify-between bg-muted/50 rounded p-3">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {formatTime12Hour(slot.start_time)} - {formatTime12Hour(slot.end_time)}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => slot.id && deleteAvailabilityMutation.mutate(slot.id)}
                                disabled={deleteAvailabilityMutation.isPending}
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
