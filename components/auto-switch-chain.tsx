'use client';

import { useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

const BSC_TESTNET_CHAIN_ID = 97;

/**
 * 当已连接钱包且当前不是 BSC Testnet(97) 时，自动切换到测试网，
 * 确保 dApp 与钱包网络一致。
 */
export function AutoSwitchChain() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (!isConnected) return;
    if (chainId === BSC_TESTNET_CHAIN_ID) return;
    switchChain?.({ chainId: BSC_TESTNET_CHAIN_ID });
  }, [isConnected, chainId, switchChain]);

  return null;
}
