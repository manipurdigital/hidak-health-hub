import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { 
  Check, Crown, Star, Zap, Shield, Heart, ArrowLeft,
  MessageCircle, Truck, Percent, Clock, Phone
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_code: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: any;
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

const CareSubscriptionPage = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlansAndSubscription();
  }, [user]);

  const fetchPlansAndSubscription = async () => {
    try {
      // Fetch available plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (plansError) throw plansError;
      setPlans(plansData || []);

      if (user) {
        // Check user's current subscription
        const { data: subscriptionData } = await supabase.functions.invoke('check-subscription');
        
        if (subscriptionData?.subscription) {
          setUserSubscription(subscriptionData.subscription);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to subscribe to a plan",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    setSubscribing(planId);

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { planId }
      });

      if (error) throw error;

      if (data.short_url) {
        // Open Razorpay payment in new tab
        window.open(data.short_url, '_blank');
        
        toast({
          title: "Subscription Created",
          description: "Complete payment in the new tab to activate your subscription",
        });

        // Refresh subscription status after a delay
        setTimeout(() => {
          fetchPlansAndSubscription();
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Subscription Failed",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubscribing(null);
    }
  };

  const getPlanIcon = (planCode: string) => {
    if (planCode.includes('BASIC')) return <Heart className="w-6 h-6" />;
    if (planCode.includes('PREMIUM')) return <Star className="w-6 h-6" />;
    if (planCode.includes('ULTIMATE')) return <Crown className="w-6 h-6" />;
    return <Shield className="w-6 h-6" />;
  };

  const getPlanColor = (planCode: string) => {
    if (planCode.includes('BASIC')) return 'from-blue-500 to-blue-600';
    if (planCode.includes('PREMIUM')) return 'from-purple-500 to-purple-600';
    if (planCode.includes('ULTIMATE')) return 'from-yellow-500 to-yellow-600';
    return 'from-gray-500 to-gray-600';
  };

  const isCurrentPlan = (planId: string) => {
    return userSubscription?.plan?.id === planId;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4">Login Required</h2>
            <p className="text-muted-foreground mb-6">Please login to view subscription plans</p>
            <Button onClick={() => navigate('/auth')}>
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="container mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Care+ Subscription Plans</h1>
            <p className="text-lg text-primary-foreground/90">
              Unlock premium healthcare benefits with unlimited access and exclusive perks
            </p>
          </div>
        </div>
      </div>

      {/* Current Subscription Status */}
      {userSubscription && (
        <div className="container mx-auto p-6">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">
                      Active Subscription: {userSubscription.plan.plan_name}
                    </h3>
                    <p className="text-green-600">
                      Expires on {new Date(userSubscription.current_period_end).toLocaleDateString()}
                    </p>
                    {userSubscription.plan.max_consultations && (
                      <p className="text-sm text-green-600">
                        {userSubscription.consultations_used}/{userSubscription.plan.max_consultations} consultations used this period
                      </p>
                    )}
                  </div>
                </div>
                <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                isCurrentPlan(plan.id) ? 'ring-2 ring-green-500 scale-105' : 'hover:scale-105'
              }`}
            >
              {/* Plan Header with Gradient */}
              <div className={`bg-gradient-to-r ${getPlanColor(plan.plan_code)} text-white p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    {getPlanIcon(plan.plan_code)}
                  </div>
                  {plan.billing_cycle === 'yearly' && (
                    <Badge className="bg-white/20 text-white">Save 17%</Badge>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{plan.plan_name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">₹{plan.price.toFixed(0)}</span>
                  <span className="text-sm opacity-90">/{plan.billing_cycle}</span>
                </div>
                <p className="text-sm opacity-90 mt-2">{plan.description}</p>
              </div>

              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Features List */}
                  <div className="space-y-3">
                    {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Key Benefits */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      <span>
                        {plan.max_consultations 
                          ? `${plan.max_consultations} consultations/month`
                          : 'Unlimited consultations'
                        }
                      </span>
                    </div>
                    
                    {plan.free_delivery && (
                      <div className="flex items-center gap-3 text-sm">
                        <Truck className="w-4 h-4 text-primary" />
                        <span>Free medicine delivery</span>
                      </div>
                    )}
                    
                    {plan.extra_discount_percentage > 0 && (
                      <div className="flex items-center gap-3 text-sm">
                        <Percent className="w-4 h-4 text-primary" />
                        <span>{plan.extra_discount_percentage}% extra discount</span>
                      </div>
                    )}
                  </div>

                  {/* Subscribe Button */}
                  <div className="pt-4">
                    {isCurrentPlan(plan.id) ? (
                      <Button 
                        className="w-full" 
                        variant="outline" 
                        disabled
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={subscribing === plan.id}
                      >
                        {subscribing === plan.id ? (
                          <>
                            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Subscribe Now
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Why Choose Care+?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Instant Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Get immediate access to consultations without waiting times
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Phone className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">24/7 Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Round-the-clock customer support for all your healthcare needs
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Secure & Private</h3>
                  <p className="text-sm text-muted-foreground">
                    Your health data is completely secure and confidential
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CareSubscriptionPage;