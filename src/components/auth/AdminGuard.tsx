import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, userRole, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to appropriate dashboard if not admin or analyst
  if (userRole !== 'admin' && userRole !== 'analyst') {
    // Redirect based on user role
    switch (userRole) {
      case 'center':
      case 'center_staff':
        return <Navigate to="/center" replace />;
      case 'doctor':
        return <Navigate to="/doctor" replace />;
      case 'lab':
        return <Navigate to="/lab" replace />;
      case 'rider':
        return <Navigate to="/rider/jobs" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}