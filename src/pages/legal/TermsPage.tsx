import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Last updated: January 19, 2025</p>
          </CardHeader>
          
          <CardContent className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p>By accessing or using HealthPlus services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Description of Services</h2>
              <p className="mb-4">HealthPlus provides:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Online pharmacy services for medicine ordering and delivery</li>
                <li>Doctor consultations via text, voice, and video</li>
                <li>Lab test booking and sample collection services</li>
                <li>Health records management</li>
                <li>Care+ subscription services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
              <p className="mb-4">You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and truthful information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Use services only for lawful purposes</li>
                <li>Not share prescription medications with others</li>
                <li>Follow medical advice from qualified healthcare providers</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Medical Disclaimer</h2>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <p className="font-semibold text-amber-800 mb-2">IMPORTANT MEDICAL DISCLAIMER:</p>
                <ul className="list-disc pl-6 space-y-2 text-amber-700">
                  <li>Our platform facilitates access to healthcare services but does not provide medical advice</li>
                  <li>Consultations are provided by licensed healthcare professionals</li>
                  <li>Emergency medical situations require immediate in-person care</li>
                  <li>Always consult healthcare providers for serious medical concerns</li>
                  <li>Medication effectiveness and safety depend on proper use</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Prescription and Medication Policy</h2>
              <p className="mb-4">For prescription medications:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Valid prescriptions are required for prescription drugs</li>
                <li>Prescriptions are verified by our licensed pharmacists</li>
                <li>We reserve the right to refuse dispensing if safety concerns arise</li>
                <li>Controlled substances require additional verification</li>
                <li>Prescription transfers are subject to applicable regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Payment and Billing</h2>
              <p className="mb-4">Payment terms:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment is required before order processing</li>
                <li>Accepted payment methods are displayed at checkout</li>
                <li>Subscription fees are billed according to chosen plans</li>
                <li>Refunds are processed according to our refund policy</li>
                <li>Price changes will be communicated in advance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Delivery and Service Areas</h2>
              <p className="mb-4">Service delivery:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Services are available in specified geographic areas</li>
                <li>Delivery times are estimates and may vary</li>
                <li>Emergency deliveries are subject to availability</li>
                <li>Lab sample collection is scheduled based on capacity</li>
                <li>Weather and external factors may affect service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Privacy and Data Protection</h2>
              <p>Your privacy is important to us. Please review our Privacy Policy for details on how we collect, use, and protect your personal and health information in compliance with applicable laws including the Digital Personal Data Protection Act 2023.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
              <p className="mb-4">All content on our platform, including text, graphics, logos, and software, is protected by intellectual property laws. You may not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Copy, reproduce, or distribute our content without permission</li>
                <li>Use our trademarks or branding without authorization</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Create derivative works based on our platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
              <p className="mb-4">To the maximum extent permitted by law:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>Our liability is limited to the amount paid for services</li>
                <li>We do not guarantee uninterrupted or error-free service</li>
                <li>Healthcare outcomes are not guaranteed</li>
                <li>Force majeure events are excluded from liability</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
              <p>These terms are governed by the laws of India. Any disputes will be resolved in the courts of Mumbai, Maharashtra. We comply with Indian healthcare regulations and data protection laws.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
              <p className="mb-4">We may terminate or suspend your account if you:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate these terms of service</li>
                <li>Engage in fraudulent activity</li>
                <li>Misuse our platform or services</li>
                <li>Fail to pay for services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
              <div className="bg-muted p-4 rounded-lg">
                <p className="mb-2"><strong>Customer Support:</strong> support@healthplus.com</p>
                <p className="mb-2"><strong>Legal Queries:</strong> legal@healthplus.com</p>
                <p className="mb-2"><strong>Phone:</strong> +91 98765 43210</p>
                <p><strong>Address:</strong> 123 Healthcare Street, Mumbai, Maharashtra 400001</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
              <p>We reserve the right to modify these terms at any time. Significant changes will be communicated via email or platform notification. Your continued use of our services constitutes acceptance of the updated terms.</p>
            </section>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}