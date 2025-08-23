import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; userRole?: string | null }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signInWithPhone: (phone: string) => Promise<{ error: any }>;
  signUpWithPhone: (phone: string, fullName?: string) => Promise<{ error: any }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: any; userRole?: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role when session changes
        if (session?.user) {
          setTimeout(async () => {
            try {
              console.log('Fetching role for user:', session.user.id);
              const { data: roles, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .single();
              
              console.log('Role query result:', { roles, error });
              
              setUserRole(roles?.role || 'user');
              console.log('Set user role to:', roles?.role || 'user');
            } catch (error) {
              console.error('Error fetching user role:', error);
              setUserRole('user');
            }
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Immediately fetch role for successful login to enable instant redirection
    if (!error && data.user) {
      try {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();
        
        return { error, userRole: roles?.role || 'user' };
      } catch (roleError) {
        console.error('Error fetching user role during sign in:', roleError);
        return { error, userRole: 'user' };
      }
    }
    
    return { error, userRole: null };
  };

  const signOut = async () => {
    try {
      // Attempt to sign out; ignore "session not found" style errors
      const { error } = await supabase.auth.signOut();

      // Regardless of API response, clear local auth state to avoid stale sessions
      setSession(null);
      setUser(null);
      setUserRole(null);

      // Treat missing session as success to prevent noisy toasts
      if (error && !(error.message || '').toLowerCase().includes('session')) {
        return { error };
      }
      return { error: null };
    } catch (e) {
      // Ensure local cleanup even if API throws
      setSession(null);
      setUser(null);
      setUserRole(null);
      return { error: null };
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    return { error };
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms',
        shouldCreateUser: false,
      }
    });
    return { error };
  };

  const signUpWithPhone = async (phone: string, fullName?: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms',
        shouldCreateUser: true,
        data: {
          full_name: fullName
        }
      }
    });
    return { error };
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    
    // Immediately fetch role for successful verification to enable instant redirection
    if (!error && data.user) {
      try {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();
        
        return { error, userRole: roles?.role || 'user' };
      } catch (roleError) {
        console.error('Error fetching user role during OTP verification:', roleError);
        return { error, userRole: 'user' };
      }
    }
    
    return { error, userRole: null };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRole,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      signInWithPhone,
      signUpWithPhone,
      verifyOtp
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}