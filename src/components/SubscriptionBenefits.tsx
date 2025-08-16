import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Crown, Truck, Percent, MessageCircle, Star } from 'lucide-react';

interface SubscriptionBenefitsProps {
  showInCheckout?: boolean;
  className?: string;
}

const SubscriptionBenefits: React.FC<SubscriptionBenefitsProps> = ({ 
  showInCheckout = false, 
  className = "" 
}) => {
  const { 
    hasActiveSubscription, 
    subscription, 
    extraDiscount, 
    freeDelivery, 
    isUnlimited 
  } = useSubscription();

  if (!hasActiveSubscription) {
    return null;
  }

  return (
    <Card className={`bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-yellow-800">Care+ Benefits Active</h3>
          <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">
            {subscription?.plan.plan_name}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <MessageCircle className="w-4 h-4 text-yellow-600" />
            <span>
              {isUnlimited ? 'Unlimited' : subscription?.plan.max_consultations} Consultations
            </span>
          </div>
          
          {freeDelivery && (
            <div className="flex items-center gap-2 text-sm">
              <Truck className="w-4 h-4 text-yellow-600" />
              <span>Free Delivery</span>
            </div>
          )}
          
          {extraDiscount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Percent className="w-4 h-4 text-yellow-600" />
              <span>{extraDiscount}% Extra Discount</span>
              {showInCheckout && (
                <Badge variant="secondary" className="ml-1">Applied</Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Star className="w-4 h-4 text-yellow-600" />
            <span>Priority Support</span>
          </div>
        </div>

        {subscription && subscription.consultations_used !== undefined && subscription.plan.max_consultations && (
          <div className="mt-3 text-sm text-yellow-700">
            Used: {subscription.consultations_used}/{subscription.plan.max_consultations} consultations this period
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionBenefits;