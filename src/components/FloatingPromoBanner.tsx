'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function FloatingPromoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('hsv-banner-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      // Show again after 24 hours
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
        return;
      }
    }

    // Show after scrolling 50% of the page
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 50) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('hsv-banner-dismissed', Date.now().toString());
  };

  if (isDismissed || !isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 animate-in slide-in-from-bottom duration-500">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-2xl overflow-hidden">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                <rect x="2" y="4" width="20" height="16" rx="2" fill="white" stroke="none"/>
                <circle cx="12" cy="12" r="4" fill="none" stroke="#f97316" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="1.5" fill="#f97316"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-sm">His Secret Vault AI</h4>
              <p className="text-white/80 text-xs mt-1">
                Free AI tools for credit repair, LLC formation, funding & more!
              </p>
              <a
                href="https://hissecretvault.net"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-4 py-1.5 bg-white text-orange-600 font-semibold text-xs rounded-lg hover:bg-orange-50 transition-colors"
              >
                Explore Free
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
