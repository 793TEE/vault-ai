'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CrossPromoPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem('hsv-promo-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show popup after 30 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('hsv-promo-dismissed', 'true');
  };

  if (isDismissed || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl border border-dark-700 shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-dark-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-600" />

        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                <rect x="2" y="4" width="20" height="16" rx="2" fill="url(#vaultGradPopup)" stroke="none"/>
                <circle cx="12" cy="12" r="4" fill="none" stroke="#fff" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="1.5" fill="#fff"/>
                <defs>
                  <linearGradient id="vaultGradPopup" x1="12" y1="4" x2="12" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ff4d4d"/>
                    <stop offset="100%" stopColor="#ff8c00"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">His Secret Vault AI</h3>
              <p className="text-sm text-dark-400">From the makers of Vault AI</p>
            </div>
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold text-white mb-3">
            14 AI Experts at Your Fingertips
          </h2>
          <p className="text-dark-300 mb-6">
            Need help with credit repair, starting an LLC, getting business funding, or marketing?
            Our AI platform gives you instant expert guidance on all of it.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              'Fix Your Credit',
              'Start an LLC',
              'Get Business Funding',
              'Marketing Campaigns',
              'Legal Documents',
              'Tax Strategies',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-dark-300">
                <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://hissecretvault.net"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-6 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg text-center hover:opacity-90 transition-opacity"
            >
              Try Free Tools
            </a>
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 px-6 bg-dark-800 text-dark-300 font-medium rounded-lg text-center hover:bg-dark-700 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
