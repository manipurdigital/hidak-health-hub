import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: January 19, 2025</p>
          </CardHeader>
          
          <CardContent className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              <p className="mb-4">We collect information to provide and improve our healthcare services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Personal Information:</strong> Name, email, phone number, address, date of birth</li>
                <li><strong>Health Information:</strong> Medical history, prescriptions, test results, consultation records</li>
                <li><strong>Payment Information:</strong> Payment details for processing transactions</li>
                <li><strong>Location Data:</strong> For delivery and center assignment (with your consent)</li>
                <li><strong>Device Information:</strong> Browser type, IP address, device identifiers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">Your information is used for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing healthcare services and consultations</li>
                <li>Processing orders and lab bookings</li>
                <li>Scheduling and managing appointments</li>
                <li>Delivering medicines and collecting samples</li>
                <li>Communication about your health and services</li>
                <li>Improving our platform and services</li>
                <li>Compliance with legal and regulatory requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
              <p className="mb-4">We share your information only as necessary:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Healthcare Providers:</strong> With doctors and labs for consultation and testing</li>
                <li><strong>Service Partners:</strong> With delivery partners for fulfillment</li>
                <li><strong>Legal Requirements:</strong> When required by law or regulation</li>
                <li><strong>Emergency Situations:</strong> To protect health and safety</li>
              </ul>
              <p className="mt-4 font-semibold">We never sell your personal information to third parties.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Your Rights Under DPDP Act 2023</h2>
              <p className="mb-4">As per India's Digital Personal Data Protection Act 2023, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request copies of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Erasure:</strong> Request deletion of your data (subject to legal requirements)</li>
                <li><strong>Portability:</strong> Request transfer of your data</li>
                <li><strong>Restriction:</strong> Request limitation of processing</li>
                <li><strong>Grievance:</strong> File complaints with our Data Protection Officer</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p className="mb-4">We implement appropriate security measures to protect your information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Access controls and authentication</li>
                <li>Regular security audits and monitoring</li>
                <li>Staff training on data protection</li>
                <li>Secure payment processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p className="mb-4">We retain your information as long as necessary for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing ongoing healthcare services</li>
                <li>Legal and regulatory compliance</li>
                <li>Resolving disputes</li>
                <li>Fraud prevention</li>
              </ul>
              <p className="mt-4">Medical records are retained as per applicable healthcare regulations.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
              <p className="mb-4">We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Enhance user experience</li>
                <li>Remember your preferences</li>
                <li>Analyze platform usage</li>
                <li>Provide personalized content</li>
              </ul>
              <p className="mt-4">You can manage cookie preferences in your browser settings.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
              <p>Our services are not intended for children under 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. International Transfers</h2>
              <p>Your data may be processed in countries outside India. We ensure appropriate safeguards are in place to protect your information during such transfers.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
              <div className="bg-muted p-4 rounded-lg">
                <p className="mb-2"><strong>Data Protection Officer:</strong> privacy@healthplus.com</p>
                <p className="mb-2"><strong>Address:</strong> 123 Healthcare Street, Mumbai, Maharashtra 400001</p>
                <p className="mb-2"><strong>Phone:</strong> +91 98765 43210</p>
                <p><strong>Grievance Portal:</strong> Available in your account settings</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Policy Updates</h2>
              <p>We may update this policy periodically. We will notify you of significant changes via email or platform notification. Your continued use of our services constitutes acceptance of the updated policy.</p>
            </section>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}