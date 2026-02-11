'use client';

import React, { useEffect, useState } from 'react';
import { Providers } from '@/components/providers';
import { I18nProvider } from '@/components/i18n-provider';
import { useWalletAuth } from '@/hooks/use-wallet-auth';
import { PersistentNav } from '@/components/layout/persistent-nav';
import { LiquidMeshBg } from '@/components/liquid-mesh-bg';
import { useAccount } from 'wagmi';
import { apiClient } from '@/lib/api';

// Inner component that runs within WagmiProvider context
function WalletAuthGate({ children }: { children: React.ReactNode }) {
  useWalletAuth();
  return <>{children}</>;
}

// Inner component for nav data (needs wagmi context)
function NavWithBalance({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const [lraBalance, setLraBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected) { setLraBalance(null); return; }
      setIsLoadingBalance(true);
      try {
        const profile = await apiClient.getUserProfile();
        setLraBalance(profile?.lra_balance ?? 0);
      } catch (e) {
        console.error('Failed to load LRA balance:', e);
      } finally {
        setIsLoadingBalance(false);
      }
    };
    fetchBalance();
  }, [isConnected]);

  return (
    <>
      {/* 全局渐变背景 */}
      <LiquidMeshBg />
      {/* 导航 + 页面内容 */}
      <div className="relative z-[1]">
        <PersistentNav lraBalance={lraBalance} isLoadingBalance={isLoadingBalance} />
        {children}
      </div>
    </>
  );
}

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  return (
    <Providers>
      <WalletAuthGate>
        <I18nProvider>
          <NavWithBalance>
            {children}
          </NavWithBalance>
        </I18nProvider>
      </WalletAuthGate>
    </Providers>
  );
}
