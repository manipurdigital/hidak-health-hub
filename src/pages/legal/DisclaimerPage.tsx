import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Medical Disclaimer</CardTitle>
            <p className="text-muted-foreground">Last updated: January 19, 2025</p>
          </CardHeader>
          
          <CardContent className="prose prose-gray max-w-none">
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-bold text-red-800 mb-4">🚨 IMPORTANT MEDICAL DISCLAIMER</h2>
              <p className="text-red-700 font-semibold">
                This disclaimer is legally required and critically important for your safety. 
                Please read carefully before using our services.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. General Medical Disclaimer</h2>
              <p className="mb-4">
                HealthPlus is a technology platform that facilitates access to healthcare services. 
                <strong> We do not provide medical advice, diagnosis, or treatment.</strong> 
                All medical services are provided by licensed healthcare professionals who are 
                independent practitioners and not employees of HealthPlus.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Not a Substitute for Professional Medical Care</h2>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <p className="font-semibold text-amber-800 mb-2">Our platform IS NOT a replacement for:</p>
                <ul className="list-disc pl-6 space-y-2 text-amber-700">
                  <li>In-person medical consultations</li>
                  <li>Emergency medical care</li>
                  <li>Specialist medical treatment</li>
                  <li>Mental health crisis intervention</li>
                  <li>Surgical procedures</li>
                  <li>Complex diagnostic procedures</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Emergency Situations</h2>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="font-bold text-red-800 mb-2">⚠️ FOR MEDICAL EMERGENCIES:</p>
                <ul className="list-disc pl-6 space-y-2 text-red-700">
                  <li><strong>Call 102/108 immediately</strong> (Emergency Medical Services)</li>
                  <li>Visit the nearest emergency room</li>
                  <li>Contact your local emergency services</li>
                  <li><strong>DO NOT</strong> use our platform for emergency care</li>
                </ul>
                
                <p className="font-semibold text-red-800 mt-4 mb-2">Emergency signs include but are not limited to:</p>
                <ul className="list-disc pl-6 space-y-1 text-red-700 text-sm">
                  <li>Chest pain or pressure</li>
                  <li>Difficulty breathing</li>
                  <li>Severe bleeding</li>
                  <li>Loss of consciousness</li>
                  <li>Severe allergic reactions</li>
                  <li>Signs of stroke or heart attack</li>
                  <li>Suicidal thoughts</li>
                  <li>Severe trauma or injury</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Consultation Limitations</h2>
              <p className="mb-4">Online consultations have inherent limitations:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Physical Examination:</strong> Doctors cannot perform physical examinations</li>
                <li><strong>Diagnostic Equipment:</strong> Advanced diagnostic tools are not available</li>
                <li><strong>Technology Dependence:</strong> Service depends on internet connectivity</li>
                <li><strong>Communication Barriers:</strong> Video/audio quality may affect consultation</li>
                <li><strong>Time Constraints:</strong> Online consultations may be time-limited</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Medication Disclaimer</h2>
              
              <h3 className="text-xl font-semibold mb-3">5.1 Prescription Medications:</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>All prescriptions are verified by licensed pharmacists</li>
                <li>Medications are dispensed according to prescriber instructions</li>
                <li>We are not responsible for prescribing decisions</li>
                <li>Follow medical professional guidance for medication use</li>
                <li>Report adverse reactions to your healthcare provider immediately</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">5.2 Over-the-Counter Medications:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Read and follow package instructions carefully</li>
                <li>Consult a pharmacist or doctor if unsure about usage</li>
                <li>Be aware of drug interactions and contraindications</li>
                <li>We provide information but not medical advice about OTC products</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Lab Test Disclaimer</h2>
              <p className="mb-4">Regarding laboratory services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tests are performed by certified laboratories</li>
                <li>Results should be interpreted by qualified healthcare professionals</li>
                <li>Normal ranges may vary between individuals</li>
                <li>Follow-up care is the responsibility of your healthcare provider</li>
                <li>Critical results are communicated to ordering physicians</li>
                <li>We facilitate testing but do not interpret results</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Privacy and Confidentiality</h2>
              <p className="mb-4">While we implement security measures:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>No digital communication is 100% secure</li>
                <li>Sensitive information should be shared with caution</li>
                <li>Healthcare providers are bound by medical confidentiality</li>
                <li>Platform security cannot guarantee complete privacy</li>
                <li>Use secure networks when accessing our services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Regulatory Compliance</h2>
              <p className="mb-4">Our services comply with Indian healthcare regulations:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Licensed under applicable state pharmacy laws</li>
                <li>Healthcare providers are independently licensed</li>
                <li>Laboratory partners are certified and accredited</li>
                <li>We follow Digital Personal Data Protection Act 2023</li>
                <li>Telemedicine guidelines as per Indian Medical Association</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <p className="font-semibold mb-2">HealthPlus is not liable for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Medical outcomes or treatment results</li>
                  <li>Decisions made by healthcare providers</li>
                  <li>Adverse reactions to medications</li>
                  <li>Delays in emergency care due to platform use</li>
                  <li>Misunderstandings in remote consultations</li>
                  <li>Third-party service provider actions</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Age and Capacity</h2>
              <p className="mb-4">Service usage requirements:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Services intended for users 18 years and above</li>
                <li>Minors require guardian consent and supervision</li>
                <li>Users must be capable of understanding medical instructions</li>
                <li>Guardians are responsible for minor's healthcare decisions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Data Accuracy</h2>
              <p className="mb-4">Users are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing accurate medical history</li>
                <li>Updating health information as needed</li>
                <li>Verifying prescription details before ordering</li>
                <li>Confirming personal information accuracy</li>
                <li>Reporting data errors promptly</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Professional Relationships</h2>
              <p>Use of our platform does not create a doctor-patient relationship between you and HealthPlus. 
              Medical relationships exist between you and the individual healthcare providers who treat you.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
              <div className="bg-muted p-4 rounded-lg">
                <p className="mb-2"><strong>Medical Queries:</strong> medical@healthplus.com</p>
                <p className="mb-2"><strong>Pharmacy Questions:</strong> pharmacy@healthplus.com</p>
                <p className="mb-2"><strong>Emergency Contact:</strong> Call 102/108 (Do not use platform)</p>
                <p className="mb-2"><strong>Customer Support:</strong> +91 98765 43210</p>
                <p><strong>Address:</strong> 123 Healthcare Street, Mumbai, Maharashtra 400001</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Acknowledgment</h2>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-blue-800">
                  <strong>By using HealthPlus services, you acknowledge that you have read, 
                  understood, and agree to this medical disclaimer.</strong> You understand the 
                  limitations of online healthcare services and agree to use them appropriately.
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