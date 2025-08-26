import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'doctor' | 'lab' | 'user' | 'rider';
  fallbackTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredRole,
  fallbackTo = '/auth' 
}) => {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  // Ensure requiredRole is properly typed as string
  const normalizedRequiredRole = typeof requiredRole === 'string' ? requiredRole : undefined;

  console.log('AuthGuard - user:', user?.email, 'userRole:', userRole, 'requiredRole:', normalizedRequiredRole, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallbackTo} state={{ from: location }} replace />;
  }

  // If a specific role is required but the role hasn't been resolved yet, wait.
  if (normalizedRequiredRole && (userRole === null || userRole === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (normalizedRequiredRole && userRole !== normalizedRequiredRole) {
    // Redirect based on user role
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'doctor':
        return <Navigate to="/doctor" replace />;
      case 'lab':
        return <Navigate to="/lab" replace />;
      case 'rider':
        return <Navigate to="/rider/jobs" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// Public routes that don't require authentication
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Routes that redirect authenticated users
export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    // Redirect authenticated users to their appropriate dashboard
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'doctor':
        return <Navigate to="/doctor" replace />;
      case 'lab':
        return <Navigate to="/lab" replace />;
      case 'rider':
        return <Navigate to="/rider/jobs" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};