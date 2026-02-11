'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { WalletButton } from '@/components/wallet-button';
import { motion } from 'framer-motion';

/**
 * AppLayout — 只负责内容区域的 shell（header + 可滚动内容区 + padding）。
 * 桌面端 header 在页面滚动后自动收缩为仅 Logo+文字（弱玻璃），
 * 滚到顶部或 hover 时展开为完整宽度 + 钱包按钮（强玻璃）。
 * 手机端始终展开。
 */
export function AppLayout({ children }: { children: React.ReactNode }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isAtTop, setIsAtTop] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    // 监听滚动容器，判断是否在顶部
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onScroll = () => {
            setIsAtTop(el.scrollTop <= 10);
        };
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, []);

    // 桌面端：滚到顶部 或 hover → 展开；否则收缩
    const expanded = isAtTop || isHovered;

    return (
        <div className="flex h-screen text-white selection:bg-purple-500/30 overflow-hidden relative">
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden pb-safe">

                {/* ───── Desktop Header（md+）：可收缩/展开，收缩时居中 ───── */}
                <motion.header
                    className="hidden md:flex items-center justify-center glass-bar rounded-full absolute top-3 z-40 h-14 overflow-hidden"
                    animate={{
                        left: expanded ? '0.75rem' : '50%',
                        x: expanded ? '0%' : '-50%',
                        width: expanded ? 'calc(100% - 1.5rem)' : '180px',
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 24, mass: 0.8 }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Logo + 文字（始终可见） */}
                    <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity px-5 h-full flex-shrink-0">
                        <div className="relative w-10 h-10">
                            <img src="/logo1.png" alt="LauraAI Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                        </div>
                        <span className="text-xl font-thin text-white tracking-tight whitespace-nowrap">
                            LauraAI
                        </span>
                    </Link>

                    {/* 钱包按钮（始终挂载，收缩时隐藏避免卡顿） */}
                    <motion.div
                        className="flex items-center gap-3 pr-2.5 flex-shrink-0 overflow-hidden"
                        animate={{
                            opacity: expanded ? 1 : 0,
                            width: expanded ? 'auto' : 0,
                            marginLeft: expanded ? 'auto' : 0,
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        <WalletButton />
                    </motion.div>
                </motion.header>

                {/* ───── Mobile Header（始终展开） ───── */}
                <header className="md:hidden h-14 glass-bar rounded-full flex items-center justify-between pl-5 pr-2.5 absolute top-3 left-3 right-3 z-40">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <div className="relative w-10 h-10">
                            <img src="/logo1.png" alt="LauraAI Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                        </div>
                        <span className="text-xl font-thin text-white tracking-tight">
                            LauraAI
                        </span>
                    </Link>
                    <div className="ml-auto flex items-center gap-3">
                        <WalletButton />
                    </div>
                </header>

                {/* Scrollable Content — 边缘通过 mask-image 渐隐，不再用遮罩层 */}
                <div
                    ref={scrollRef}
                    className="content-edge-fade flex-1 overflow-y-auto pt-[76px] md:pt-20 pb-20 md:pb-0 scrollbar-hide overscroll-behavior-y-contain"
                >
                    <div className="container max-w-7xl mx-auto p-4 md:p-8 md:pl-24">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
