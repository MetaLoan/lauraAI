'use client';

import { useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

const HARDHAT_CHAIN_ID = 31337;

/**
 * 当已连接钱包且当前不是 31337 时，自动切换到 31337（本地/云端测试链），
 * 这样 dApp 与钱包都走同一链，余额显示一致。
 * - localhost/127.0.0.1：始终自动切（本地链）
 * - 配置了 NEXT_PUBLIC_RPC_URL（如云端 Fly RPC）时，任意 host 也自动切
 */
export function AutoSwitchChain() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (!isConnected) return;
    if (typeof window === 'undefined') return;
    if (chainId === HARDHAT_CHAIN_ID) return;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const useCloudRpc = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_RPC_URL;
    if (!isLocal && !useCloudRpc) return;
    switchChain?.({ chainId: HARDHAT_CHAIN_ID });
  }, [isConnected, chainId, switchChain]);

  return null;
}
