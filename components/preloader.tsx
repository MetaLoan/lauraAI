'use client';

import { Loader2 } from 'lucide-react';

export function Preloader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white z-[9999]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 relative flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        </div>
        <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
