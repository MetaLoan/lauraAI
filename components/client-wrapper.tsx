'use client';

import React, { useEffect, useState } from 'react';
import { Providers } from '@/components/providers';
import { I18nProvider } from '@/components/i18n-provider';
import { useWalletAuth } from '@/hooks/use-wallet-auth';

// Inner component that runs within WagmiProvider context
function WalletAuthGate({ children }: { children: React.ReactNode }) {
  // This hook auto-signs the auth message when wallet connects
  useWalletAuth();
  return <>{children}</>;
}

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
      <WalletAuthGate>
        <I18nProvider>
          {children}
        </I18nProvider>
      </WalletAuthGate>
    </Providers>
  );
}
