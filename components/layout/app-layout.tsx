'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconDashboard, IconSoulmate, IconMint, IconProfile } from '@/components/icons/custom-icons';
import { cn } from '@/lib/utils';
import { WalletButton } from '@/components/wallet-button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { apiClient } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface NavItemProps {
    href: string;
    icon: React.ElementType;
    label: string;
    active?: boolean;
}

const NavItem = ({ href, icon: Icon, label, active, iconType = 'lucide' }: NavItemProps & { iconType?: 'lucide' | 'custom' }) => (
    <Link
        href={href}
        className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
            active
                ? "bg-white/10 text-white font-medium shadow-[0_0_15px_rgba(168,85,247,0.15)] border border-purple-500/20"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
        )}
    >
        {iconType === 'custom' ? (
            <div className={cn("w-5 h-5 relative flex items-center justify-center transition-transform group-hover:scale-110", active ? "opacity-100" : "opacity-60 group-hover:opacity-100")}>
                {/* Fallback to Lucide if string path provided to component expecting ElementType, but here we treat Icon as string src for custom */}
                <img src={Icon as unknown as string} alt={label} className="w-full h-full object-contain" />
            </div>
        ) : (
            <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "text-gray-500 group-hover:text-gray-300")} />
        )}
        <span className={cn("transition-colors", active && "text-purple-100")}>{label}</span>
    </Link>
);

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isConnected } = useAccount();
    const [lraBalance, setLraBalance] = useState<number | null>(null);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);

    useEffect(() => {
        const fetchBalance = async () => {
            if (!isConnected) {
                setLraBalance(null);
                return;
            }
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

    const navItems = [
        { href: '/dashboard', icon: IconDashboard, label: 'Dashboard' },
        { href: '/market', icon: IconSoulmate, label: 'Soulmate' },
        { href: '/create', icon: IconMint, label: 'Mint AI' },
        { href: '/profile', icon: IconProfile, label: 'Profile' },
    ];

    return (
        <div className="flex h-screen bg-web3-gradient text-white selection:bg-purple-500/30 overflow-hidden relative">
            <div className="bg-noise absolute inset-0 pointer-events-none z-0" />

            {/* Floating Orbs - Animation */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-700 pointer-events-none" />
            <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-pink-600/5 rounded-full blur-[100px] animate-pulse delay-1000 pointer-events-none" />

            {/* Sidebar - Desktop Only */}
            <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-black/50 backdrop-blur-xl fixed inset-y-0 left-0 z-50">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-3 group px-2">
                        <div className="relative w-8 h-8 group-hover:scale-110 transition-transform duration-300">
                            <img src="/logolaura.png" alt="LauraAI Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-gray-400 tracking-tight">
                            LauraAI
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => (
                        <NavItem
                            key={item.href}
                            {...item}
                            active={pathname === item.href || pathname?.startsWith(item.href + '/')}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-4 border border-white/5">
                        <h4 className="text-sm font-medium text-purple-200 mb-1">Your Balance</h4>
                        <div className="flex items-baseline gap-2">
                            {isLoadingBalance ? (
                                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                            ) : (
                                <>
                                    <p className="text-2xl font-bold text-white">
                                        {lraBalance !== null ? Math.floor(lraBalance).toLocaleString() : '—'}
                                    </p>
                                    <span className="text-sm text-purple-200">LRA</span>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-blue-300 mt-1">Earn +5 LRA per chat message</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 flex flex-col h-full relative overflow-hidden pb-safe">
                {/* Header */}
                <header className="h-[72px] md:h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 absolute top-0 left-0 right-0 z-40 pt-safe">
                    <div className="md:hidden flex items-center gap-2">
                        <div className="relative w-7 h-7">
                            <img src="/logolaura.png" alt="LauraAI Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">LauraAI</span>
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        <WalletButton />
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto pt-[76px] md:pt-16 pb-20 md:pb-0 scrollbar-hide overscroll-behavior-y-contain">
                    <div className="container max-w-7xl mx-auto p-4 md:p-8">
                        {children}
                    </div>
                </div>
            </main>

            {/* Bottom Navigation - Mobile Only */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around z-50 pb-safe shadow-[0_-8px_40px_rgba(0,0,0,0.8)]">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-[72px] space-y-1 relative group transition-all duration-300",
                                isActive ? "text-purple-400" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-active"
                                    className="absolute inset-x-4 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_4px_20px_rgba(168,85,247,0.8)]"
                                />
                            )}
                            <div className={cn(
                                "transition-all duration-300 transform",
                                isActive ? "scale-110 -translate-y-1" : "opacity-60 scale-100"
                            )}>
                                {(item as any).iconType === 'custom' ? (
                                    <img src={Icon as unknown as string} alt={item.label} className={cn("w-7 h-7 object-contain", isActive ? "opacity-100 drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]" : "opacity-50")} />
                                ) : (
                                    <Icon className={cn("w-7 h-7", isActive && "drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]")} />
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold tracking-tight transition-all duration-300 uppercase",
                                isActive ? "text-purple-200 opacity-100" : "text-gray-500 opacity-70"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
