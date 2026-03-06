'use client';

import dynamic from 'next/dynamic';

// Dynamic imports to avoid SSR issues
const CrossPromoPopup = dynamic(() => import('./CrossPromoPopup'), { ssr: false });
const FloatingPromoBanner = dynamic(() => import('./FloatingPromoBanner'), { ssr: false });

export default function PromoWrapper() {
  return (
    <>
      <CrossPromoPopup />
      <FloatingPromoBanner />
    </>
  );
}
