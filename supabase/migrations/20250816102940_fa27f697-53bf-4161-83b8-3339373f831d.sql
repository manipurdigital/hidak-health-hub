-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL,
  plan_code TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- monthly, quarterly, yearly
  features JSONB NOT NULL DEFAULT '[]',
  max_consultations INTEGER, -- null means unlimited
  free_delivery BOOLEAN DEFAULT false,
  extra_discount_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  subscription_id TEXT NOT NULL, -- Razorpay subscription ID
  customer_id TEXT, -- Razorpay customer ID
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired, paused
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  consultations_used INTEGER DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  razorpay_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription_usage table to track feature usage
CREATE TABLE public.subscription_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL,
  feature_type TEXT NOT NULL, -- consultation, delivery, discount
  used_count INTEGER DEFAULT 0,
  month_year TEXT NOT NULL, -- YYYY-MM format
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subscription_id, feature_type, month_year)
);

-- Enable Row Level Security
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Subscription plans are viewable by everyone" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.user_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for subscription_usage
CREATE POLICY "Users can view their own subscription usage" 
ON public.subscription_usage 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_subscriptions 
  WHERE user_subscriptions.id = subscription_usage.subscription_id 
  AND user_subscriptions.user_id = auth.uid()
));

CREATE POLICY "System can manage subscription usage" 
ON public.subscription_usage 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create foreign key constraints
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT fk_user_subscriptions_plan 
FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE CASCADE;

ALTER TABLE public.subscription_usage 
ADD CONSTRAINT fk_subscription_usage_subscription 
FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE CASCADE;

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample subscription plans
INSERT INTO public.subscription_plans (plan_name, plan_code, description, price, billing_cycle, features, max_consultations, free_delivery, extra_discount_percentage) VALUES
('Care+ Basic', 'CARE_BASIC', 'Essential healthcare plan with basic benefits', 299, 'monthly', 
 '["5 Consultations per month", "10% extra discount on medicines", "Priority support"]', 
 5, false, 10),

('Care+ Premium', 'CARE_PREMIUM', 'Comprehensive healthcare plan with enhanced benefits', 599, 'monthly', 
 '["15 Consultations per month", "Free medicine delivery", "20% extra discount", "Premium support", "Lab test discounts"]', 
 15, true, 20),

('Care+ Ultimate', 'CARE_ULTIMATE', 'Complete healthcare plan with unlimited benefits', 999, 'monthly', 
 '["Unlimited Consultations", "Free medicine delivery", "25% extra discount", "24/7 support", "Free lab tests", "Health monitoring"]', 
 null, true, 25),

('Care+ Annual Basic', 'CARE_BASIC_ANNUAL', 'Essential healthcare plan - Annual billing (2 months free)', 2990, 'yearly', 
 '["5 Consultations per month", "10% extra discount on medicines", "Priority support"]', 
 5, false, 10),

('Care+ Annual Premium', 'CARE_PREMIUM_ANNUAL', 'Comprehensive healthcare plan - Annual billing (2 months free)', 5990, 'yearly', 
 '["15 Consultations per month", "Free medicine delivery", "20% extra discount", "Premium support", "Lab test discounts"]', 
 15, true, 20),

('Care+ Annual Ultimate', 'CARE_ULTIMATE_ANNUAL', 'Complete healthcare plan - Annual billing (2 months free)', 9990, 'yearly', 
 '["Unlimited Consultations", "Free medicine delivery", "25% extra discount", "24/7 support", "Free lab tests", "Health monitoring"]', 
 null, true, 25);

-- Create function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions
    WHERE user_id = user_uuid
      AND status = 'active'
      AND current_period_end >= CURRENT_DATE
  )
$$;

-- Create function to get user's current subscription
CREATE OR REPLACE FUNCTION public.get_user_subscription(user_uuid UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name TEXT,
  plan_code TEXT,
  status TEXT,
  current_period_end DATE,
  max_consultations INTEGER,
  free_delivery BOOLEAN,
  extra_discount_percentage INTEGER,
  consultations_used INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    us.id,
    sp.plan_name,
    sp.plan_code,
    us.status,
    us.current_period_end,
    sp.max_consultations,
    sp.free_delivery,
    sp.extra_discount_percentage,
    us.consultations_used
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND us.current_period_end >= CURRENT_DATE
  ORDER BY us.created_at DESC
  LIMIT 1
$$;

-- Create function to check consultation limit
CREATE OR REPLACE FUNCTION public.can_book_consultation(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM public.user_subscriptions 
      WHERE user_id = user_uuid 
        AND status = 'active' 
        AND current_period_end >= CURRENT_DATE
    ) THEN true -- No subscription, allow booking (will be charged)
    WHEN EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      JOIN public.subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = user_uuid 
        AND us.status = 'active'
        AND us.current_period_end >= CURRENT_DATE
        AND sp.max_consultations IS NULL -- Unlimited plan
    ) THEN true
    WHEN EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      JOIN public.subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = user_uuid 
        AND us.status = 'active'
        AND us.current_period_end >= CURRENT_DATE
        AND us.consultations_used < sp.max_consultations
    ) THEN true
    ELSE false
  END
$$;