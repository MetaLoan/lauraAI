'use client';

import React, { useEffect, useState } from 'react';
import { Providers } from '@/components/providers';
import { I18nProvider } from '@/components/i18n-provider';

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial client render, show nothing to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-white/50">Loading...</div>
      </div>
    );
  }

  return (
    <Providers>
      <I18nProvider>
        {children}
      </I18nProvider>
    </Providers>
  );
}
