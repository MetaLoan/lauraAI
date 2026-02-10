'use client';

import React from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

interface WalletButtonProps {
  className?: string;
  showBalance?: boolean;
}

export function WalletButton({ className, showBalance = true }: WalletButtonProps) {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = () => {
    if (!caipNetwork) return 'Unknown';
    return caipNetwork.name || 'Unknown Network';
  };

  const getExplorerUrl = () => {
    if (!address) return '';
    if (caipNetwork?.name?.includes('BSC') || caipNetwork?.id === 56) {
      return `https://bscscan.com/address/${address}`;
    }
    if (caipNetwork?.id === 97) {
      return `https://testnet.bscscan.com/address/${address}`;
    }
    return `https://etherscan.io/address/${address}`;
  };

  if (!isConnected) {
    return (
      <Button
        onClick={() => open()}
        className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium ${className}`}
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-white ${className}`}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-mono">{truncateAddress(address || '')}</span>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-black/90 border-white/10 backdrop-blur-xl"
      >
        <div className="px-3 py-2">
          <p className="text-xs text-white/50">Connected to</p>
          <p className="text-sm font-medium text-white">{getNetworkName()}</p>
        </div>
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuItem
          onClick={handleCopy}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {copied ? 'Copied!' : 'Copy Address'}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => window.open(getExplorerUrl(), '_blank')}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Explorer
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => open({ view: 'Account' })}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Wallet Details
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuItem
          onClick={() => open({ view: 'Networks' })}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          Switch Network
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => open({ view: 'Account' })}
          className="text-red-400 hover:bg-red-500/10 cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 简单版本的连接按钮
export function ConnectButton({ className }: { className?: string }) {
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();

  if (isConnected) {
    return <WalletButton className={className} />;
  }

  return (
    <Button
      onClick={() => open()}
      className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium ${className}`}
    >
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  );
}

// AppKit 内置的 Web Component 按钮 (最简单的方式)
export function AppKitButton() {
  return <appkit-button />;
}

// 网络切换按钮
export function NetworkButton() {
  return <appkit-network-button />;
}

// 声明 Web Component 类型
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'appkit-network-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'appkit-account-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
