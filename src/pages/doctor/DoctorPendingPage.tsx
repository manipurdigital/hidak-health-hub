import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Mail, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const DoctorPendingPage: React.FC = () => {
  const { user } = useAuth();

  // Check if doctor profile exists and verification status
  const { data: doctor } = useQuery({
    queryKey: ['doctor-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from('doctors')
        .select('is_verified, full_name, specialization')
        .eq('user_id', user.id)
        .maybeSingle();
      
      return data;
    },
    enabled: !!user?.id,
  });

  const isLinked = !!doctor;
  const isVerified = doctor?.is_verified;

  const getStatusIcon = () => {
    if (isVerified) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (isLinked) return <Clock className="h-5 w-5 text-yellow-500" />;
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  };

  const getStatusMessage = () => {
    if (isVerified) return "Your account is verified! Redirecting to dashboard...";
    if (isLinked) return "Your doctor profile is under review";
    return "Your account needs to be linked to a doctor profile";
  };

  const getStatusDescription = () => {
    if (isVerified) return "You now have full access to the doctor portal.";
    if (isLinked) return "Our admin team is reviewing your doctor profile. You'll receive an email once verified.";
    return "Please contact an administrator to link your account to a doctor profile.";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-xl">Doctor Account Status</CardTitle>
          <CardDescription>{getStatusMessage()}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              {getStatusDescription()}
            </AlertDescription>
          </Alert>

          {isLinked && !isVerified && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>Profile Details:</strong><br />
                Name: {doctor?.full_name}<br />
                Specialization: {doctor?.specialization}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline">
              <Link to="/">Return to Home</Link>
            </Button>
            
            {!isLinked && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Contact support at <strong>admin@healthcare.com</strong> to link your account.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};