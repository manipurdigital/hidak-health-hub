import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Activity, Brain, Leaf, Shield, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const WellnessPage = () => {
  const wellnessPrograms = [
    {
      title: "Heart Health Program",
      description: "Comprehensive cardiac care with regular monitoring and lifestyle guidance",
      features: ["ECG monitoring", "Diet consultation", "Exercise plans", "Medication tracking"],
      price: "₹2,999",
      duration: "3 months",
      icon: Heart,
      color: "text-red-500"
    },
    {
      title: "Mental Wellness",
      description: "Mental health support with therapy sessions and stress management",
      features: ["1-on-1 therapy", "Stress management", "Meditation guidance", "24/7 support"],
      price: "₹3,499",
      duration: "3 months",
      icon: Brain,
      color: "text-purple-500"
    },
    {
      title: "Fitness & Nutrition",
      description: "Personalized fitness and nutrition plans for optimal health",
      features: ["Custom diet plans", "Workout routines", "Progress tracking", "Expert guidance"],
      price: "₹1,999",
      duration: "3 months",
      icon: Activity,
      color: "text-green-500"
    },
    {
      title: "Diabetes Management",
      description: "Complete diabetes care with monitoring and lifestyle support",
      features: ["Blood sugar tracking", "Diet planning", "Medication reminders", "Regular check-ups"],
      price: "₹2,499",
      duration: "3 months",
      icon: Shield,
      color: "text-blue-500"
    }
  ];

  const benefits = [
    {
      title: "Personalized Care",
      description: "Tailored wellness programs based on your health profile and goals",
      icon: "🎯"
    },
    {
      title: "Expert Guidance",
      description: "Access to certified nutritionists, fitness experts, and wellness coaches",
      icon: "👨‍⚕️"
    },
    {
      title: "Progress Tracking",
      description: "Monitor your health journey with detailed analytics and reports",
      icon: "📊"
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock support for any health-related queries or emergencies",
      icon: "🔄"
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      program: "Heart Health Program",
      rating: 5,
      comment: "The program helped me manage my blood pressure effectively. The regular monitoring and expert guidance made all the difference."
    },
    {
      name: "Rajesh Kumar",
      program: "Diabetes Management",
      rating: 5,
      comment: "Excellent support for diabetes management. The diet plans and medication reminders are very helpful."
    },
    {
      name: "Anita Singh",
      program: "Mental Wellness",
      rating: 5,
      comment: "The therapy sessions and stress management techniques have significantly improved my mental health."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-4">Wellness Programs</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              Transform your health with our comprehensive wellness programs designed by expert healthcare professionals. 
              Get personalized care, expert guidance, and 24/7 support for your wellness journey.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-500" />
                <span>Natural & Holistic</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span>Medically Supervised</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>Proven Results</span>
              </div>
            </div>
          </div>

          {/* Wellness Programs */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Our Wellness Programs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {wellnessPrograms.map((program, index) => {
                const IconComponent = program.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-3 rounded-full bg-muted ${program.color}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{program.title}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-semibold text-primary text-lg">{program.price}</span>
                            <span>{program.duration}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{program.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">What's Included:</h4>
                        <ul className="space-y-1">
                          {program.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <span className="w-2 h-2 bg-primary rounded-full"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button className="w-full">
                        Enroll Now
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Wellness Programs?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4">{benefit.icon}</div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Members Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">"{testimonial.comment}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.program}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-primary/5 p-8 rounded-xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Wellness Journey?</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of satisfied members who have transformed their health with our wellness programs. 
              Get started today and take the first step towards a healthier you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8">
                Browse All Programs
              </Button>
              <Button size="lg" variant="outline" className="px-8">
                Talk to Wellness Expert
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WellnessPage;