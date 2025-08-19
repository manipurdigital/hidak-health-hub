import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Refund & Cancellation Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: January 19, 2025</p>
          </CardHeader>
          
          <CardContent className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. General Refund Policy</h2>
              <p className="mb-4">We strive to provide quality healthcare services. Refunds are processed according to the specific service type and circumstances outlined below.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Medicine Orders</h2>
              
              <h3 className="text-xl font-semibold mb-3">2.1 Eligible for Refund:</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Wrong medicine delivered</li>
                <li>Damaged or expired products</li>
                <li>Quality issues with the medicine</li>
                <li>Order cancelled before dispatch</li>
                <li>Non-delivery despite confirmation</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">2.2 Not Eligible for Refund:</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Change of mind after delivery</li>
                <li>Prescription medicines (unless quality issues)</li>
                <li>Orders cancelled after dispatch</li>
                <li>Medicines opened or tampered with</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">2.3 Refund Process:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contact customer support within 24 hours of delivery</li>
                <li>Provide order details and reason for refund</li>
                <li>Return medicines in original packaging</li>
                <li>Refund processed within 7-10 business days</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Doctor Consultations</h2>
              
              <h3 className="text-xl font-semibold mb-3">3.1 Eligible for Refund:</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Doctor unavailable for scheduled consultation</li>
                <li>Technical issues preventing consultation</li>
                <li>Cancellation at least 2 hours before appointment</li>
                <li>Consultation did not occur due to platform issues</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">3.2 Cancellation Policy:</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>More than 24 hours:</strong> Full refund</li>
                <li><strong>2-24 hours:</strong> 50% refund</li>
                <li><strong>Less than 2 hours:</strong> No refund</li>
                <li><strong>No-show:</strong> No refund</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">3.3 Rescheduling:</h3>
              <p>Free rescheduling available up to 2 hours before the appointment.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Lab Tests</h2>
              
              <h3 className="text-xl font-semibold mb-3">4.1 Eligible for Refund:</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Sample collection not completed</li>
                <li>Test cancelled before sample collection</li>
                <li>Laboratory processing errors</li>
                <li>Incorrect test performed</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">4.2 Cancellation Policy:</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Before sample collection:</strong> Full refund</li>
                <li><strong>After sample collection:</strong> No refund</li>
                <li><strong>Rescheduling:</strong> Free up to 1 hour before collection</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Care+ Subscription</h2>
              
              <h3 className="text-xl font-semibold mb-3">5.1 Cancellation:</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Cancel anytime from account settings</li>
                <li>Cancellation effective at end of current billing period</li>
                <li>No refund for partial months</li>
                <li>Access continues until subscription expires</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">5.2 Refund for Annual Plans:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pro-rated refund for unused months</li>
                <li>Minimum 30-day commitment required</li>
                <li>Processing fee may apply</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Emergency Situations</h2>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="font-semibold text-red-800 mb-2">Special Considerations:</p>
                <ul className="list-disc pl-6 space-y-2 text-red-700">
                  <li>Medical emergencies may qualify for expedited refunds</li>
                  <li>Hospitalization during service period considered</li>
                  <li>Death of patient qualifies for immediate full refund</li>
                  <li>Documentation may be required for verification</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Refund Processing</h2>
              
              <h3 className="text-xl font-semibold mb-3">7.1 Timeline:</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Credit/Debit Cards:</strong> 5-7 business days</li>
                <li><strong>Net Banking:</strong> 3-5 business days</li>
                <li><strong>UPI/Wallets:</strong> 1-3 business days</li>
                <li><strong>Cash on Delivery:</strong> Bank transfer within 7-10 days</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">7.2 Refund Method:</h3>
              <p>Refunds are processed to the original payment method. For cash payments, refunds are processed via bank transfer to your registered account.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Dispute Resolution</h2>
              
              <h3 className="text-xl font-semibold mb-3">8.1 Escalation Process:</h3>
              <ol className="list-decimal pl-6 space-y-2 mb-4">
                <li>Contact customer support: support@healthplus.com</li>
                <li>Escalate to supervisor if unresolved within 48 hours</li>
                <li>Formal complaint to grievance officer</li>
                <li>External dispute resolution as per applicable law</li>
              </ol>

              <h3 className="text-xl font-semibold mb-3">8.2 Required Information:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Order or booking ID</li>
                <li>Payment transaction details</li>
                <li>Detailed description of issue</li>
                <li>Supporting evidence (photos, documents)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Quality Assurance</h2>
              <p className="mb-4">To ensure quality and prevent misuse:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All refund requests are investigated</li>
                <li>Frequent refund requests may trigger account review</li>
                <li>Fraudulent claims may result in account suspension</li>
                <li>Quality feedback helps improve our services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
              <div className="bg-muted p-4 rounded-lg">
                <p className="mb-2"><strong>Customer Support:</strong> support@healthplus.com</p>
                <p className="mb-2"><strong>Refund Queries:</strong> refunds@healthplus.com</p>
                <p className="mb-2"><strong>Phone:</strong> +91 98765 43210</p>
                <p className="mb-2"><strong>Hours:</strong> 9 AM - 9 PM (Mon-Sun)</p>
                <p><strong>Average Response Time:</strong> 24 hours</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Policy Updates</h2>
              <p>This refund policy may be updated periodically. Changes will be communicated via email and platform notifications. The updated policy applies to all transactions after the effective date.</p>
            </section>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}