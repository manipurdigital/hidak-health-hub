import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Cookie Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: January 19, 2025</p>
          </CardHeader>
          
          <CardContent className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
              <p className="mb-4">
                Cookies are small text files that are stored on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences, 
                keeping you logged in, and analyzing how you use our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
              <p className="mb-4">We use cookies for several purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Essential Functions:</strong> To keep you logged in and maintain security</li>
                <li><strong>User Experience:</strong> To remember your preferences and settings</li>
                <li><strong>Analytics:</strong> To understand how you use our platform</li>
                <li><strong>Performance:</strong> To optimize our website's speed and functionality</li>
                <li><strong>Marketing:</strong> To show you relevant content and advertisements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-semibold mb-3">3.1 Essential Cookies</h3>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                <p className="font-semibold text-green-800 mb-2">Required for basic functionality:</p>
                <ul className="list-disc pl-6 space-y-1 text-green-700">
                  <li>Authentication and login sessions</li>
                  <li>Security and fraud prevention</li>
                  <li>Shopping cart functionality</li>
                  <li>Form submission and data validation</li>
                  <li>Load balancing and performance</li>
                </ul>
                <p className="text-green-700 text-sm mt-2">
                  <strong>Duration:</strong> Session or until you log out<br />
                  <strong>Can be disabled:</strong> No (required for platform functionality)
                </p>
              </div>

              <h3 className="text-xl font-semibold mb-3">3.2 Preference Cookies</h3>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                <p className="font-semibold text-blue-800 mb-2">Store your preferences:</p>
                <ul className="list-disc pl-6 space-y-1 text-blue-700">
                  <li>Language and region settings</li>
                  <li>Notification preferences</li>
                  <li>Display preferences (dark/light mode)</li>
                  <li>Accessibility settings</li>
                  <li>Search and filter preferences</li>
                </ul>
                <p className="text-blue-700 text-sm mt-2">
                  <strong>Duration:</strong> Up to 1 year<br />
                  <strong>Can be disabled:</strong> Yes (may affect personalization)
                </p>
              </div>

              <h3 className="text-xl font-semibold mb-3">3.3 Analytics Cookies</h3>
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-4">
                <p className="font-semibold text-purple-800 mb-2">Help us understand usage:</p>
                <ul className="list-disc pl-6 space-y-1 text-purple-700">
                  <li>Page views and user behavior</li>
                  <li>Popular features and content</li>
                  <li>Error tracking and debugging</li>
                  <li>Performance monitoring</li>
                  <li>User journey analysis</li>
                </ul>
                <p className="text-purple-700 text-sm mt-2">
                  <strong>Duration:</strong> Up to 2 years<br />
                  <strong>Can be disabled:</strong> Yes
                </p>
              </div>

              <h3 className="text-xl font-semibold mb-3">3.4 Marketing Cookies</h3>
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <p className="font-semibold text-orange-800 mb-2">For personalized marketing:</p>
                <ul className="list-disc pl-6 space-y-1 text-orange-700">
                  <li>Targeted advertisements</li>
                  <li>Social media integration</li>
                  <li>Remarketing campaigns</li>
                  <li>Conversion tracking</li>
                  <li>Interest-based content</li>
                </ul>
                <p className="text-orange-700 text-sm mt-2">
                  <strong>Duration:</strong> Up to 1 year<br />
                  <strong>Can be disabled:</strong> Yes
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Third-Party Cookies</h2>
              <p className="mb-4">We use services from trusted third-party providers that may set their own cookies:</p>
              
              <h3 className="text-xl font-semibold mb-3">4.1 Analytics Services:</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Google Analytics:</strong> Website usage analytics</li>
                <li><strong>Mixpanel:</strong> User behavior tracking</li>
                <li><strong>Hotjar:</strong> User experience analysis</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">4.2 Payment Processors:</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Razorpay:</strong> Payment processing</li>
                <li><strong>Stripe:</strong> International payments</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">4.3 Communication Tools:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Zoom:</strong> Video consultations</li>
                <li><strong>WhatsApp Business:</strong> Customer support</li>
                <li><strong>Email Service Providers:</strong> Notification delivery</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Cookie Consent</h2>
              
              <h3 className="text-xl font-semibold mb-3">5.1 Your Choices:</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Accept all cookies for the best experience</li>
                <li>Accept only essential cookies</li>
                <li>Customize cookie preferences by category</li>
                <li>Change preferences at any time</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">5.2 Managing Consent:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cookie banner appears on first visit</li>
                <li>Preferences saved for future visits</li>
                <li>Update settings in your account preferences</li>
                <li>Clear cookies to reset preferences</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Browser Cookie Controls</h2>
              <p className="mb-4">You can also manage cookies directly through your browser:</p>
              
              <h3 className="text-xl font-semibold mb-3">6.1 Popular Browsers:</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">6.2 Browser Actions:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Block all cookies (may break functionality)</li>
                <li>Block third-party cookies</li>
                <li>Clear existing cookies</li>
                <li>Set automatic deletion rules</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Mobile App Data</h2>
              <p className="mb-4">Our mobile apps use similar tracking technologies:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Device IDs:</strong> For analytics and crash reporting</li>
                <li><strong>App Preferences:</strong> Stored locally on your device</li>
                <li><strong>Push Tokens:</strong> For sending notifications</li>
                <li><strong>Analytics SDKs:</strong> For app performance monitoring</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Data Protection Compliance</h2>
              <p className="mb-4">Our cookie practices comply with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>DPDP Act 2023:</strong> India's Digital Personal Data Protection Act</li>
                <li><strong>IT Rules 2021:</strong> Information Technology Rules</li>
                <li><strong>GDPR:</strong> For users in European Union</li>
                <li><strong>CCPA:</strong> For users in California</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Cookie Security</h2>
              <p className="mb-4">We implement security measures for cookies:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Secure Flag:</strong> HTTPS-only transmission</li>
                <li><strong>HttpOnly Flag:</strong> Prevents JavaScript access</li>
                <li><strong>SameSite Attribute:</strong> Cross-site request protection</li>
                <li><strong>Encryption:</strong> Sensitive data is encrypted</li>
                <li><strong>Regular Cleanup:</strong> Automatic expiration of old cookies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Impact of Disabling Cookies</h2>
              
              <h3 className="text-xl font-semibold mb-3">10.1 Essential Cookies Disabled:</h3>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                <ul className="list-disc pl-6 space-y-1 text-red-700">
                  <li>Cannot log in or stay logged in</li>
                  <li>Cart items may not be saved</li>
                  <li>Security features may not work</li>
                  <li>Form submissions may fail</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold mb-3">10.2 Other Cookies Disabled:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Preferences reset on each visit</li>
                <li>Less personalized experience</li>
                <li>May see irrelevant advertisements</li>
                <li>Some features may not work optimally</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Updates to Cookie Policy</h2>
              <p className="mb-4">We may update this policy when:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Adding new cookie types or purposes</li>
                <li>Changing third-party services</li>
                <li>Updating legal compliance requirements</li>
                <li>Improving user experience features</li>
              </ul>
              <p className="mt-4">Updates will be communicated via email and platform notifications.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
              <div className="bg-muted p-4 rounded-lg">
                <p className="mb-2"><strong>Data Protection Officer:</strong> privacy@healthplus.com</p>
                <p className="mb-2"><strong>Cookie Questions:</strong> cookies@healthplus.com</p>
                <p className="mb-2"><strong>Technical Support:</strong> +91 98765 43210</p>
                <p><strong>Address:</strong> 123 Healthcare Street, Mumbai, Maharashtra 400001</p>
              </div>
            </section>

            <section>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Cookie Preferences</h3>
                <p className="text-blue-700">
                  You can update your cookie preferences at any time by visiting your account settings 
                  or contacting our support team. Changes take effect immediately upon saving.
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}