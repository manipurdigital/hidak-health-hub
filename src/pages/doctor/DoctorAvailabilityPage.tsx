// @ts-nocheck
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AvailabilityCalendar } from '@/components/doctor/AvailabilityCalendar';

interface DateAvailability {
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
        .order('availability_date');
      
      if (error) throw error;
      return data as DateAvailability[];
    },
    enabled: !!doctor?.id,
  });

  // Update availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (updates: any[]) => {
      if (!doctor?.id) throw new Error('Doctor not found');

      // Delete existing availability for this doctor
      await supabase
        .from('doctor_availability')
        .delete()
        .eq('doctor_id', doctor.id);

      // Convert the enhanced updates to simple availability records
      const simpleUpdates: DateAvailability[] = [];
      
      updates.forEach(update => {
        if (update.slots && update.slots.length > 0) {
          // Create a record for each slot on each date
          update.slots.forEach(slot => {
            simpleUpdates.push({
              availability_date: update.availability_date,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_active: update.is_active,
            });
          });
        }
      });

      // Insert new availability
      if (simpleUpdates.length > 0) {
        const { error } = await supabase
          .from('doctor_availability')
          .insert(
            simpleUpdates.map(update => ({
              doctor_id: doctor.id,
              availability_date: update.availability_date,
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
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveAvailability = (updates: any[]) => {
    updateAvailabilityMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <AvailabilityCalendar 
        availability={availability}
        onSave={handleSaveAvailability}
        isLoading={updateAvailabilityMutation.isPending}
      />
    </div>
  );
}
