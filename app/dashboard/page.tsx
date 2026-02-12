'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AppLayout } from '@/components/layout/app-layout';
import { PortfolioCard, PortfolioRefreshButton } from '@/components/dashboard/portfolio-card';
import { ConnectButton } from '@/components/wallet-button';
import { useAccount } from 'wagmi';
import { Loader2, User, Camera, Plus, ArrowRight, Heart, Sparkles, MessageCircle, Star, X, AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api';
import { getFullImageUrl } from '@/lib/utils';
import { getZodiacGlyph } from '@/lib/zodiac';
import SoulmateDetailPage from '@/components/soulmate-detail-page';

interface Character {
    id: string;
    title: string;
    image_url?: string;
    image?: string;
    type: string;
    unlock_status?: number;
    compatibility?: number;
    astro_sign?: string;
    description?: string;
    image_status?: string; // "", "generating", "done", "failed"
}

export default function DashboardPage() {
    const router = useRouter();
    const { address, isConnected, isConnecting } = useAccount();

    const [characters, setCharacters] = useState<Character[]>([]);
    const [charactersLoading, setCharactersLoading] = useState(true);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isConnected) fetchCharacters();
        else setCharactersLoading(false);

        return () => {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        };
    }, [isConnected]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash === '#soulmates') {
            document.getElementById('soulmates')?.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    // 当有 generating 状态的角色时，启动轮询
    useEffect(() => {
        const hasGenerating = characters.some(c => c.image_status === 'generating' || (!c.image_url && !c.image && c.image_status !== 'done' && c.image_status !== 'failed' && c.image_status !== ''));
        if (hasGenerating) {
            if (!pollTimerRef.current) {
                pollTimerRef.current = setInterval(() => {
                    fetchCharactersSilent();
                }, 5000); // 每5秒轮询一次
            }
        } else {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        }
    }, [characters]);

    const fetchCharacters = async () => {
        try {
            setCharactersLoading(true);
            const data = await apiClient.getCharacters() as any[];
            const mappedData = mapCharacters(data);
            setCharacters(mappedData);
        } catch (error) {
            console.error('Failed to load characters:', error);
        } finally {
            setCharactersLoading(false);
        }
    };

    // 静默刷新（不显示 loading）
    const fetchCharactersSilent = async () => {
        try {
            const data = await apiClient.getCharacters() as any[];
            const mappedData = mapCharacters(data);
            setCharacters(mappedData);
        } catch (error) {
            console.error('Failed to refresh characters:', error);
        }
    };

    const mapCharacters = (data: any[]): Character[] => {
        return (data || []).map((char: any) => ({
            id: char.id.toString(),
            title: char.title || 'Soulmate',
            image_url: char.image_url,
            image: char.image,
            type: char.type,
            unlock_status: char.unlock_status,
            compatibility: char.compatibility,
            astro_sign: char.astro_sign,
            description: char.description,
            image_status: char.image_status || '',
        }));
    };

    // 重试生图（已付过 Mint，后端直接允许 failed → generating）
    const handleRetryGeneration = async (charId: string) => {
        try {
            await apiClient.generateImage(charId);
        } catch {
            // 请求可能超时但后端仍在处理
        }
        // 刷新列表以反映新状态
        fetchCharactersSilent();
    };

    if (isConnecting) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
            </AppLayout>
        );
    }

    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Guest';

    return (
        <>
        <AppLayout>
            <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter">
                            HELLO, <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 uppercase">{shortAddress}</span>
                        </h1>
                        <p className="text-white text-xl font-light">
                            Your sovereign bond is active. Intelligence is scaling.
                        </p>
                    </div>
                    {!isConnected && (
                        <div className="transform scale-110 shadow-[0_0_20px_rgba(59,130,246,0.3)] rounded-xl flex-shrink-0 self-center md:self-auto">
                            <ConnectButton className="px-8 py-3 text-lg" />
                        </div>
                    )}
                </div>

                {/* Portfolio Overview */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">Your Portfolio</h2>
                        <PortfolioRefreshButton />
                    </div>
                    <PortfolioCard />
                </section>

                {/* Quick Actions - Create Mini Me & Mint Soulmate only */}
                <section>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">Create New</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/create/minime">
                            <div className="group relative liquid-glass-card rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1.5 cursor-pointer overflow-visible">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-pink-500/10 rounded-full blur-[60px] group-hover:bg-pink-500/30 group-hover:scale-125 transition-all duration-700" />
                                <div className="absolute right-5 bottom-2 h-[calc((100%+10px)*0.6667)] aspect-[3/4] pointer-events-none z-10 origin-bottom-right rotate-[7deg] transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:translate-x-1 group-hover:scale-105 group-hover:rotate-[10deg] drop-shadow-[0_14px_30px_rgba(244,114,182,0.38)]">
                                    <img src="/minime.jpg" className="w-full h-full object-cover rounded-2xl border border-white/20" alt="" />
                                </div>
                                <div className="relative z-30 pr-20 md:pr-24">
                                    <div className="flex items-center gap-4 mb-3">
                                        <img src="/icons/3d/profile.png" className="w-12 h-12 object-contain flex-shrink-0 group-hover:scale-110 transition-transform" alt="Mini Me" />
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            Create Mini Me
                                            <ArrowRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </h3>
                                    </div>
                                    <p className="text-white text-sm leading-relaxed mb-4">Upload your photo and get an AI avatar version of yourself</p>
                                    <div className="flex items-center gap-2 text-white text-xs font-medium">
                                        <Camera className="w-3 h-3" /> Takes 30 seconds
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <Link href="/create">
                            <div className="group relative liquid-glass-card rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1.5 cursor-pointer overflow-visible">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px] group-hover:bg-purple-500/35 group-hover:scale-125 transition-all duration-700" />
                                <div className="absolute right-5 bottom-2 h-[calc((100%+10px)*0.6667)] aspect-[3/4] pointer-events-none z-10 origin-bottom-right rotate-[7deg] transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:translate-x-1 group-hover:scale-105 group-hover:rotate-[10deg] drop-shadow-[0_14px_30px_rgba(139,92,246,0.4)]">
                                    <img src="/presets/soulmate.jpg" className="w-full h-full object-cover rounded-2xl border border-white/20" alt="" />
                                </div>
                                <div className="relative z-30 pr-20 md:pr-24">
                                    <div className="flex items-center gap-4 mb-3">
                                        <img src="/icons/3d/mint.png" className="w-12 h-12 object-contain flex-shrink-0 group-hover:scale-110 transition-transform" alt="Mint Soulmate" />
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            Mint Soulmate
                                            <ArrowRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </h3>
                                    </div>
                                    <p className="text-white text-sm leading-relaxed mb-4">Create your unique AI companion based on your profile</p>
                                    <div className="flex items-center gap-2 text-white text-xs font-medium">
                                        <Plus className="w-3 h-3" /> Powered by AI
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* My Soulmates - merged from Soulmate page */}
                <section id="soulmates">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Heart className="w-5 h-5 text-pink-400" />
                            My Soulmate
                        </h2>
                        {characters.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 text-sm w-fit">
                                <img src="/icons/3d/sparkles.png" className="w-6 h-6 object-contain" alt="" />
                                <span className="text-white"><span className="text-white font-semibold">{characters.length}</span> characters</span>
                            </div>
                        )}
                    </div>

                    {charactersLoading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="w-10 h-10 animate-spin text-white mb-4" />
                            <p className="text-white">Loading...</p>
                        </div>
                    ) : characters.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 liquid-glass-card rounded-2xl">
                            <h3 className="text-xl font-semibold mb-6 text-white">No Soulmates Yet</h3>
                            <Link href="/create">
                                <Button variant="outline" size="sm" className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5">
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    Create Now
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide md:grid md:grid-cols-3 xl:grid-cols-4 md:gap-6 md:overflow-visible md:snap-none md:pb-0">
                            {characters.map((char, index) => (
                                <motion.div
                                    key={char.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
                                    className="w-[70vw] flex-shrink-0 snap-center md:w-auto md:flex-shrink"
                                >
                                    {char.image_status === 'generating' ? (
                                        /* 正在生成中的角色卡片 */
                                        <div className="block w-full text-left">
                                            <div className="group relative liquid-glass-card rounded-2xl overflow-hidden">
                                                <div className="relative aspect-[3/4] overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/40 to-indigo-900/40">
                                                    <div className="relative mb-4">
                                                        <div className="w-16 h-16 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                                        <Sparkles className="w-6 h-6 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white mb-2">{char.title}</h3>
                                                    <p className="text-sm text-white animate-pulse">AI Generating...</p>
                                                    <p className="text-xs text-white mt-2">Auto-refreshing</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : char.image_status === 'failed' ? (
                                        /* 生成失败的角色卡片 */
                                        <div className="block w-full text-left">
                                            <div className="group relative liquid-glass-card rounded-2xl overflow-hidden">
                                                <div className="relative aspect-[3/4] overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-amber-900/20 to-red-900/20 px-4">
                                                    <AlertTriangle className="w-12 h-12 text-amber-400 mb-3" />
                                                    <h3 className="text-lg font-bold text-white mb-1">{char.title}</h3>
                                                    <p className="text-sm text-amber-300 mb-4">Generation timed out</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRetryGeneration(char.id)}
                                                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all hover:scale-105"
                                                    >
                                                        <RotateCw className="w-4 h-4" />
                                                        Retry (Free)
                                                    </button>
                                                    <p className="text-[10px] text-white mt-3">Mint already paid</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* 正常角色卡片 */
                                    <button type="button" onClick={() => setSelectedCharacter(char)} className="block w-full text-left">
                                        <div className="group relative liquid-glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                                            <div className="relative aspect-[3/4] overflow-hidden">
                                                {char.image_url || char.image ? (
                                                    <Image
                                                        src={getFullImageUrl(char.image_url || char.image || '')}
                                                        alt={char.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/60 to-pink-900/60">
                                                        <span className="text-white text-6xl font-bold">{char.title.charAt(0)}</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h3 className="text-lg font-bold text-white truncate min-w-0">{char.title}</h3>
                                                        {char.compatibility != null && (
                                                            <span className="flex items-center gap-1.5 flex-shrink-0 text-sm font-black text-white bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                                                                <img src="/icons/3d/star_compatibility.png" className="w-4 h-4 object-contain" alt="Star" />
                                                                {char.compatibility}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    {char.astro_sign && (
                                                        <p className="text-xs text-white mb-3 flex items-center gap-1.5">
                                                            {getZodiacGlyph(char.astro_sign) ? (
                                                                <span className="font-zodiac text-lg leading-none" title={char.astro_sign}>
                                                                    {getZodiacGlyph(char.astro_sign)}
                                                                </span>
                                                            ) : (
                                                                char.astro_sign
                                                            )}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3 w-full bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20 group-hover:bg-white/20 transition-all shadow-lg">
                                                        <img src="/icons/3d/message_chat.png" className="w-5 h-5 object-contain" alt="Chat" />
                                                        <span className="text-sm font-bold text-white tracking-wide">Start Chat</span>
                                                        <span className="ml-auto text-[10px] text-green-400 font-black bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 translate-x-1">+5 LRA</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                    )}
                                </motion.div>
                            ))}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: characters.length * 0.06, duration: 0.35 }}
                                className="w-[70vw] flex-shrink-0 snap-center md:w-auto md:flex-shrink"
                            >
                                <Link href="/create" className="block h-full">
                                    <div className="group flex flex-col items-center justify-center aspect-[3/4] rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer">
                                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300">
                                            <img src="/icons/3d/plus_new.png" className="w-12 h-12 object-contain group-hover:rotate-90 transition-transform duration-500" alt="Create New" />
                                        </div>
                                        <span className="text-white/60 font-medium group-hover:text-white transition-colors text-sm">Create New</span>
                                    </div>
                                </Link>
                            </motion.div>
                        </div>
                    )}
                </section>
            </div>

        </AppLayout>

            {/* Character Detail Modal — 放在 AppLayout 外，确保 backdrop-blur 覆盖所有层 */}
            <AnimatePresence>
                {selectedCharacter && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60]"
                        onClick={() => setSelectedCharacter(null)}
                    >
                        {/* 模糊 + 遮罩层：超出视口以消除边缘清晰区域 */}
                        <div className="absolute -inset-[50%] bg-black/30 backdrop-blur-xl pointer-events-none" />

                        {/* 内容居中层：严格与视口对齐 */}
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl max-h-[90vh] liquid-glass-card rounded-3xl overflow-hidden relative flex flex-col"
                        >
                            <button
                                type="button"
                                onClick={() => setSelectedCharacter(null)}
                                className="!absolute top-4 right-4 z-50 w-10 h-10 rounded-full liquid-glass-card flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                            <SoulmateDetailPage
                                character={selectedCharacter}
                                onNext={() => {
                                    setSelectedCharacter(null);
                                    router.push(`/chat/${selectedCharacter.id}`);
                                }}
                                onBack={() => setSelectedCharacter(null)}
                                onCharacterUpdate={(updated) => {
                                    setSelectedCharacter(updated);
                                    fetchCharacters();
                                }}
                            />
                        </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
