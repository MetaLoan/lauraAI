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
  const [menuOpen, setMenuOpen] = useState(false);

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
    if (caipNetwork?.id === 1 || caipNetwork?.name?.toLowerCase().includes('ethereum')) {
      return `https://etherscan.io/address/${address}`;
    }
    return `https://etherscan.io/address/${address}`;
  };

  if (!isConnected) {
    return (
      <Button
        onClick={() => open({ view: 'Connect' })}
        className={`liquid-glass-card text-white font-medium hover:brightness-110 ${className}`}
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-md pointer-events-none" />
      )}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className={`bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full !pt-2.5 !pr-2.5 !pb-2.5 !pl-4 ${className}`}
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
        className="w-56 liquid-glass-card border-0 rounded-2xl z-[70]"
        style={{ backgroundColor: 'rgba(112, 61, 91, 0.6)' }}
      >
        <div className="px-3 py-2 whitespace-nowrap">
          <p className="text-sm text-white">Connected to {getNetworkName()}</p>
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
    </>
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
      onClick={() => open({ view: 'Connect' })}
      className={`liquid-glass-card text-white font-medium hover:brightness-110 ${className}`}
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
