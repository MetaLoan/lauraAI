'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider, type Config } from 'wagmi';
import { bsc, bscTestnet } from '@reown/appkit/networks';
import { defineChain } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { AutoSwitchChain } from '@/components/auto-switch-chain';

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// 2. Create a metadata object - optional
const metadata = {
  name: 'LauraAI',
  description: 'AI Soulmate & DeFi Asset Management',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://laura-ai.com',
  icons: ['https://laura-ai.com/logolaura.png']
};

// 3. 链 31337：浏览器内走同源代理，避免 CORS；Node/直连用原始 URL
function getLocalHardhat() {
  const envRpc = process.env.NEXT_PUBLIC_RPC_URL;
  let rpcUrl: string;
  if (typeof window !== 'undefined') {
    // 浏览器：云端 RPC 走 /cloud-rpc 代理（避免 CORS），本地走 /hardhat-rpc
    rpcUrl = envRpc && envRpc.startsWith('http')
      ? `${window.location.origin}/cloud-rpc`
      : `${window.location.origin}/hardhat-rpc`;
  } else {
    rpcUrl = envRpc && envRpc.startsWith('http') ? envRpc : 'http://127.0.0.1:8545';
  }
  return defineChain({
    id: 31_337,
    name: 'Hardhat',
    nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
    rpcUrls: { default: { http: [rpcUrl] } },
  });
}

// 4. Create Wagmi Adapter - only on client
let wagmiAdapter: WagmiAdapter | null = null;

function getWagmiAdapter() {
  if (!wagmiAdapter && typeof window !== 'undefined') {
    const localChain = getLocalHardhat();
    wagmiAdapter = new WagmiAdapter({
      networks: [localChain, bsc, bscTestnet],
      projectId,
      ssr: true
    });
  }
  return wagmiAdapter;
}

// AppKit initialization flag
let appKitInitialized = false;

function initAppKit() {
  if (appKitInitialized || typeof window === 'undefined') return;
  
  const adapter = getWagmiAdapter();
  if (!adapter) return;

  createAppKit({
    // Force wallet-only mode and bypass Reown remote auth-feature overrides.
    basic: true,
    adapters: [adapter],
    networks: [getLocalHardhat(), bsc, bscTestnet],
    projectId,
    metadata,
    features: {
      analytics: true,
      // Wallet-only auth flow
      email: false,
      socials: [],
      emailShowWallets: false,
    },
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#8B5CF6', // 紫色主题
      '--w3m-color-mix': '#1a1a2e',
      '--w3m-color-mix-strength': 40,
      '--w3m-border-radius-master': '2px',
    },
    // 支持的钱包 - 包括所有主流 EVM 钱包
    featuredWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
      '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f', // Safe
      '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
      'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
      '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4', // Binance Web3
      '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // OKX Wallet
      '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662', // Bitget
    ],
    allWallets: 'SHOW', // 显示所有支持的钱包
  });
  
  appKitInitialized = true;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => new QueryClient());
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initAppKit();
      initialized.current = true;
    }
    setMounted(true);
  }, []);

  const adapter = getWagmiAdapter();
  
  // During SSR or before mounting, return null
  if (!mounted || !adapter) {
    return null;
  }

  return (
    <WagmiProvider config={adapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        <AutoSwitchChain />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
