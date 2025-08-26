import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface DoctorGuardProps {
  children: React.ReactNode;
}

export const DoctorGuard: React.FC<DoctorGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();

  const { data: doctor, isLoading: doctorLoading } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  if (loading || doctorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to pending page if not linked or not verified
  if (!doctor || !doctor.is_verified) {
    return <Navigate to="/doctor/pending" replace />;
  }

  return <>{children}</>;
};