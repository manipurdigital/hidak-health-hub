import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Shield, Heart, Zap, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CarePlanPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription } = useSubscription();

  const plans = [
    {
      name: "Care+ Basic",
      price: "₹299",
      period: "/month",
      description: "Essential healthcare benefits for individuals",
      features: [
        "5 free doctor consultations",
        "10% discount on medicines",
        "Free delivery on orders above ₹199",
        "Priority customer support",
        "Basic health tracking"
      ],
      recommended: false,
      color: "border-border"
    },
    {
      name: "Care+ Premium",
      price: "₹599",
      period: "/month",
      description: "Comprehensive healthcare for you and your family",
      features: [
        "Unlimited doctor consultations",
        "20% discount on medicines",
        "Free delivery on all orders",
        "Family health plans (up to 4 members)",
        "Advanced health tracking",
        "Lab test discounts up to 30%",
Wellness program access
      ],
      recommended: true,
      color: "border-primary"
    },
    {
      name: "Care+ Gold",
      price: "₹999",
      period: "/month",
      description: "Premium healthcare with exclusive benefits",
      features: [
        "Unlimited doctor consultations",
        "30% discount on medicines",
        "Free delivery on all orders",
        "Extended family plans (up to 6 members)",
        "Premium health tracking & analytics",
        "Lab test discounts up to 50%",
        "All wellness programs included",
        "Dedicated health manager",
        "Annual health checkup included",
        "Specialist consultations included"
      ],
      recommended: false,
      color: "border-yellow-500"
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Comprehensive Coverage",
      description: "Complete healthcare protection for you and your family with wide range of services"
    },
    {
      icon: Zap,
      title: "Instant Access",
      description: "Immediate access to doctors, medicines, and lab tests without waiting times"
    },
    {
      icon: Heart,
      title: "Preventive Care",
      description: "Focus on prevention with regular health monitoring and wellness programs"
    },
    {
      icon: Users,
      title: "Family Plans",
      description: "Extend benefits to your entire family with special family coverage options"
    }
  ];

  const handleSubscribe = (planName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate('/care-plus');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="w-8 h-8 text-yellow-500" />
              <h1 className="text-4xl font-bold text-foreground">Care+ Plans</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              Comprehensive healthcare membership plans designed to give you and your family the best medical care 
              at affordable prices. Choose the plan that fits your needs.
            </p>
            {hasActiveSubscription && (
              <Badge variant="secondary" className="text-green-600 bg-green-100">
                You have an active Care+ subscription
              </Badge>
            )}
          </div>

          {/* Pricing Plans */}
          <div className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`relative hover:shadow-lg transition-shadow ${plan.color} ${
                    plan.recommended ? 'scale-105 shadow-lg' : ''
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-primary">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.recommended ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.name)}
                      disabled={hasActiveSubscription}
                    >
                      {hasActiveSubscription ? 'Active Plan' : 'Choose Plan'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Care+?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-center mb-4">
                        <div className="p-3 rounded-full bg-primary/10">
                          <IconComponent className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Plan Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-card rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-4 font-semibold">Features</th>
                    <th className="text-center p-4 font-semibold">Basic</th>
                    <th className="text-center p-4 font-semibold">Premium</th>
                    <th className="text-center p-4 font-semibold">Gold</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-4">Doctor Consultations</td>
                    <td className="text-center p-4">5/month</td>
                    <td className="text-center p-4">Unlimited</td>
                    <td className="text-center p-4">Unlimited</td>
                  </tr>
                  <tr className="border-t bg-muted/50">
                    <td className="p-4">Medicine Discount</td>
                    <td className="text-center p-4">10%</td>
                    <td className="text-center p-4">20%</td>
                    <td className="text-center p-4">30%</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-4">Lab Test Discount</td>
                    <td className="text-center p-4">-</td>
                    <td className="text-center p-4">30%</td>
                    <td className="text-center p-4">50%</td>
                  </tr>
                  <tr className="border-t bg-muted/50">
                    <td className="p-4">Family Members</td>
                    <td className="text-center p-4">1</td>
                    <td className="text-center p-4">4</td>
                    <td className="text-center p-4">6</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-4">24/7 Support</td>
                    <td className="text-center p-4">-</td>
                    <td className="text-center p-4">✓</td>
                    <td className="text-center p-4">✓</td>
                  </tr>
                  <tr className="border-t bg-muted/50">
                    <td className="p-4">Annual Health Checkup</td>
                    <td className="text-center p-4">-</td>
                    <td className="text-center p-4">-</td>
                    <td className="text-center p-4">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Can I upgrade my plan anytime?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes, you can upgrade your plan at any time. The benefits will be effective immediately.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Is there a cancellation fee?</h3>
                  <p className="text-sm text-muted-foreground">
                    No, there are no cancellation fees. You can cancel your subscription anytime.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Do unused consultations roll over?</h3>
                  <p className="text-sm text-muted-foreground">
                    For Basic plan, unused consultations don't roll over. Premium and Gold have unlimited consultations.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">How do family plans work?</h3>
                  <p className="text-sm text-muted-foreground">
                    You can add family members to your plan and they get access to all the benefits included in your subscription.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-primary/5 p-8 rounded-xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of satisfied members who trust Care+ for their healthcare needs. 
              Start your subscription today and get immediate access to all benefits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8" onClick={() => handleSubscribe('Premium')}>
                Start with Premium
              </Button>
              <Button size="lg" variant="outline" className="px-8">
                Compare All Plans
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarePlanPage;