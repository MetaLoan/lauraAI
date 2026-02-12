'use client';

import { useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

/**
 * 当已连接钱包且当前不是 Ethereum Mainnet(1) 时，自动切换到主网，
 * 确保 dApp 与钱包网络一致。
 */
export function AutoSwitchChain() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (!isConnected) return;
    if (chainId === 1) return;
    switchChain?.({ chainId: 1 });
  }, [isConnected, chainId, switchChain]);

  return null;
}
