import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_code: string;
  max_consultations: number | null;
  free_delivery: boolean;
  extra_discount_percentage: number;
}

interface UserSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: string;
  current_period_end: string;
  consultations_used: number;
}

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  hasActiveSubscription: boolean;
  isUnlimited: boolean;
  canBookConsultation: boolean;
  extraDiscount: number;
  freeDelivery: boolean;
  refreshSubscription: () => Promise<void>;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const refreshSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setSubscription(null);
      } else {
        setSubscription(data?.subscription || null);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [user]);

  const hasActiveSubscription = Boolean(
    subscription && 
    subscription.status === 'active' && 
    new Date(subscription.current_period_end) >= new Date()
  );

  const isUnlimited = Boolean(
    hasActiveSubscription && 
    subscription?.plan.max_consultations === null
  );

  const canBookConsultation = Boolean(
    !hasActiveSubscription || // No subscription, can book (will be charged)
    isUnlimited || // Unlimited plan
    (subscription && subscription.consultations_used < (subscription.plan.max_consultations || 0))
  );

  const extraDiscount = hasActiveSubscription ? (subscription?.plan.extra_discount_percentage || 0) : 0;
  const freeDelivery = hasActiveSubscription ? (subscription?.plan.free_delivery || false) : false;

  const value: SubscriptionContextType = {
    subscription,
    hasActiveSubscription,
    isUnlimited,
    canBookConsultation,
    extraDiscount,
    freeDelivery,
    refreshSubscription,
    loading,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionProvider;