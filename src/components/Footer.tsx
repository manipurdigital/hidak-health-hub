import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">
              HAK SHEL<span className="text-accent">+</span>
            </h3>
            <p className="text-background/80 leading-relaxed">
              Your trusted digital healthcare partner. Providing authentic medicines, 
              expert consultations, and comprehensive wellness solutions.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" className="text-background hover:text-primary hover:bg-background/10">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-background hover:text-primary hover:bg-background/10">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-background hover:text-primary hover:bg-background/10">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-background hover:text-primary hover:bg-background/10">
                <Linkedin className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-3 text-background/80">
              <li><a href="/medicines" className="hover:text-primary transition-colors">Online Pharmacy</a></li>
              <li><a href="/doctors" className="hover:text-primary transition-colors">Doctor Consultations</a></li>
              <li><a href="/lab-tests" className="hover:text-primary transition-colors">Lab Tests</a></li>
              <li><a href="/wellness" className="hover:text-primary transition-colors">Health Packages</a></li>
              <li><a href="/wellness" className="hover:text-primary transition-colors">Wellness Plans</a></li>
              <li><a href="/features" className="hover:text-primary transition-colors">All Features</a></li>
              {/* <li><a href="#" className="hover:text-primary transition-colors">Care+ Subscription</a></li> */}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-3 text-background/80">
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Track Orders</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Return Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contact</h4>
            <div className="space-y-4 text-background/80">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary" />
                <span>1800-000-0000</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary" />
                <span>support@hakshel.com</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-1" />
                <span>123 Healthcare Street,<br />Medical District, Mumbai 400001</span>
              </div>
            </div>

            {/* App download */}
            <div className="mt-6">
              <h5 className="text-white font-medium mb-3">Download App</h5>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="bg-transparent border-background/20 text-background hover:bg-background/10 justify-start">
                  📱 Download for iOS
                </Button>
                <Button variant="outline" size="sm" className="bg-transparent border-background/20 text-background hover:bg-background/10 justify-start">
                  🤖 Download for Android
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-background/20 mb-8" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/80">
          <div>
            <p>&copy; 2024 HAK SHEL Healthcare Pvt. Ltd. All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
          </div>
        </div>

        {/* Regulatory info */}
        <div className="mt-8 p-4 bg-background/5 rounded-lg text-xs text-background/60">
          <p className="mb-2">
            <strong>Regulatory Information:</strong> HAK SHEL Healthcare Pvt. Ltd. is a licensed online pharmacy 
            platform. All medicines are dispensed from licensed pharmacies. Prescription medicines require 
            valid prescription from registered medical practitioners.
          </p>
          <p>
            Drug License No: DL-XXXX-XXXX | Registration No: XXXX-XXXX | 
            GST No: XXXXXXXXXXXXXXX
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;