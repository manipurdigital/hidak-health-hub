import React, { useState, useEffect } from 'react';
import { ConsentBanner } from './ConsentBanner';

export function ConsentManager() {
  const [showLocationConsent, setShowLocationConsent] = useState(false);
  const [showMarketingConsent, setShowMarketingConsent] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  useEffect(() => {
    // Check for existing consents in localStorage
    const locationConsent = localStorage.getItem('consent_location');
    const marketingConsent = localStorage.getItem('consent_marketing');
    const cookieConsent = localStorage.getItem('consent_cookies');

    // Show cookie consent first if not set
    if (!cookieConsent) {
      setShowCookieConsent(true);
    } else if (!marketingConsent) {
      // Show marketing consent after a delay if cookies accepted
      setTimeout(() => setShowMarketingConsent(true), 3000);
    }
  }, []);

  const handleLocationRequest = () => {
    const locationConsent = localStorage.getItem('consent_location');
    if (!locationConsent) {
      setShowLocationConsent(true);
    }
  };

  // Expose function globally for other components to trigger location consent
  useEffect(() => {
    (window as any).requestLocationConsent = handleLocationRequest;
    return () => {
      delete (window as any).requestLocationConsent;
    };
  }, []);

  return (
    <>
      {showCookieConsent && (
        <ConsentBanner
          type="cookies"
          onConsent={(granted) => {
            if (granted) {
              // If cookies accepted, show marketing consent after delay
              setTimeout(() => setShowMarketingConsent(true), 2000);
            }
          }}
          onClose={() => setShowCookieConsent(false)}
        />
      )}

      {showMarketingConsent && (
        <ConsentBanner
          type="marketing"
          onConsent={() => {}}
          onClose={() => setShowMarketingConsent(false)}
        />
      )}

      {showLocationConsent && (
        <ConsentBanner
          type="location"
          onConsent={() => {}}
          onClose={() => setShowLocationConsent(false)}
        />
      )}
    </>
  );
}