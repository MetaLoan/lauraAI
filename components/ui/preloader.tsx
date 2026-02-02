'use client';

import Image from 'next/image';
import { getAssetPath } from '@/lib/utils';

export default function Preloader() {
  return (
    <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center overflow-hidden">
      {/* Decorative striped background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 800" preserveAspectRatio="none">
          <defs>
            <pattern id="preloader-stripes" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="100" y2="100" stroke="white" strokeWidth="20" />
            </pattern>
          </defs>
          <rect width="400" height="800" fill="url(#preloader-stripes)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {/* Logo */}
        <div className="w-48 h-48 relative mb-6">
          <Image
            src={getAssetPath('/logo.png')}
            alt="Soul Face"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-white tracking-widest mb-2">Soul Face</h1>
        
        {/* Slogan */}
        <p className="text-sm font-light text-white/50 tracking-wide">Where Destiny Takes Form</p>
      </div>

      {/* Loading Bar - positioned at bottom */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 z-10">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-white rounded-full absolute top-0 animate-loading-slide"
            style={{ width: '30%' }}
          ></div>
        </div>
      </div>
    </div>
  );
}
