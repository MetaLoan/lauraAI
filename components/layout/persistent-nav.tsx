'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconDashboard, IconMint, IconMine, IconProfile } from '@/components/icons/custom-icons';
import { cn } from '@/lib/utils';
import { motion, LayoutGroup } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const NAV_ITEMS = [
    { href: '/dashboard', icon: IconDashboard, label: 'Dashboard' },
    { href: '/create', icon: IconMint, label: 'Mint AI' },
    { href: '/mine', icon: IconMine, label: 'Mine' },
    { href: '/profile', icon: IconProfile, label: 'Profile' },
];

// 需要显示导航的路径前缀
const NAV_PATHS = ['/dashboard', '/create', '/mine', '/profile', '/chat', '/market'];

/**
 * 持久化导航组件 —— 挂载在 ClientWrapper 中，永远不会因页面切换而卸载。
 * 只在应用页面（非 Landing）显示。
 */
export function PersistentNav({
    lraBalance,
    isLoadingBalance,
}: {
    lraBalance: number | null;
    isLoadingBalance: boolean;
}) {
    const pathname = usePathname();
    const [hovered, setHovered] = useState(false);

    // 只在应用页面显示导航
    const shouldShow = NAV_PATHS.some(p => pathname === p || pathname?.startsWith(p + '/'));
    if (!shouldShow) return null;

    return (
        <>
            {/* ───── Desktop Floating Capsule Nav ───── */}
            <LayoutGroup id="desktop-nav">
                <motion.nav
                    className={cn("hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-50 flex-col items-start gap-5 py-5 glass-bar", hovered ? "rounded-[28px]" : "rounded-full")}
                    animate={{ width: hovered ? 196 : 68, paddingLeft: hovered ? 12 : 14, paddingRight: hovered ? 12 : 14, backgroundColor: hovered ? 'rgba(112, 61, 91, 0.6)' : 'rgba(112, 61, 91, 0)' }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    <div className="flex flex-col gap-2 w-full">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} href={item.href} className="relative flex items-center gap-3 h-10 rounded-full overflow-hidden group w-full">
                                    {/* bg pill — always rendered, opacity controls visibility */}
                                    <motion.div
                                        className="absolute inset-0 rounded-full"
                                        initial={false}
                                        animate={{
                                            opacity: isActive ? 1 : 0,
                                            background: 'rgba(255, 255, 255, 0.28)',
                                        }}
                                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                                    />
                                    {!isActive && (
                                        <div className="absolute inset-0 rounded-full bg-white/[0.07] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                    )}

                                    <div className={cn(
                                        'w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full relative z-10 transition-colors duration-200',
                                        isActive ? 'text-white' : 'text-white group-hover:text-white',
                                    )}>
                                        <Icon className="w-5 h-5" />
                                    </div>

                                    <motion.span
                                        className={cn(
                                            'text-sm font-semibold whitespace-nowrap relative z-10 pr-3',
                                            isActive ? 'text-white' : 'text-white group-hover:text-white',
                                        )}
                                        animate={{
                                            opacity: hovered ? 1 : 0,
                                            x: hovered ? 0 : -8,
                                        }}
                                        transition={{ duration: 0.18, delay: hovered ? 0.06 : 0 }}
                                    >
                                        {item.label}
                                    </motion.span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="w-full h-px bg-white/10 flex-shrink-0" />

                    {/* Balance */}
                    <div className="flex items-center gap-3 w-full pl-[2px]">
                        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-white/5 border border-white/10">
                            {isLoadingBalance ? (
                                <Loader2 className="w-3 h-3 animate-spin text-white" />
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse" />
                            )}
                        </div>
                        <motion.div
                            className="flex flex-col overflow-hidden whitespace-nowrap"
                            animate={{ opacity: hovered ? 1 : 0, width: hovered ? 'auto' : 0 }}
                            transition={{ duration: 0.18 }}
                        >
                            <span className="text-[10px] text-white uppercase tracking-wider leading-tight">Balance</span>
                            <span className="text-sm font-bold text-white leading-tight">
                                {lraBalance !== null ? Math.floor(lraBalance).toLocaleString() : '0'}
                                <span className="text-[10px] text-white ml-1 font-medium">LRA</span>
                            </span>
                        </motion.div>
                    </div>
                </motion.nav>
            </LayoutGroup>

            {/* ───── Mobile Bottom Nav：与顶栏一致的胶囊悬浮态 ───── */}
            <nav className="md:hidden fixed bottom-nav-float glass-bar rounded-full h-14 flex items-center justify-around z-50">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 min-w-0 h-full py-2 space-y-0.5 relative group transition-all duration-300",
                                isActive ? "text-white" : "text-white hover:text-white"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-active"
                                    className="absolute inset-x-4 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_4px_20px_rgba(168,85,247,0.8)]"
                                />
                            )}
                            <div className={cn(
                                "transition-all duration-300 transform flex-shrink-0",
                                isActive ? "scale-110 -translate-y-0.5" : "opacity-60 scale-100"
                            )}>
                                <Icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]")} />
                            </div>
                            <span className={cn(
                                "text-[9px] font-bold tracking-tight transition-all duration-300 uppercase flex-shrink-0",
                                isActive ? "text-white opacity-100" : "text-white opacity-100"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
