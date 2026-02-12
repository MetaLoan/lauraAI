'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { apiClient } from '@/lib/api';
import { Loader2, MessageCircle, Sparkles, ChevronRight, AlertTriangle, RotateCw, Wallet, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@/components/wallet-button';
import { getFullImageUrl } from '@/lib/utils';
import Image from 'next/image';

// Character type display names
const CHARACTER_LABELS: Record<string, string> = {
    soulmate: 'Soulmate',
    mini_me: 'Mini Me',
    future_husband: 'Future Husband',
    future_wife: 'Future Wife',
    future_baby: 'Future Baby',
    boyfriend: 'AI Boyfriend',
    girlfriend: 'AI Girlfriend',
    best_friend: 'Best Friend',
    companion: 'Companion',
    mysterious_stranger: 'Mysterious Stranger',
    wise_mentor: 'Wise Mentor',
    dream_guide: 'Dream Guide',
};

interface CharacterChat {
    id: string;
    title: string;
    type: string;
    image_url?: string;
    image_status?: string;
    lastMessage?: string;
    lastMessageTime?: Date;
    dailyUsed: number;
    dailyLimit: number;
    dailyRemaining: number;
    /** 该角色累积收益（LRA） */
    earnedLra: number;
}

export default function MinePage() {
    const router = useRouter();
    const { isConnected } = useAccount();
    const [characters, setCharacters] = useState<CharacterChat[]>([]);
    const [loading, setLoading] = useState(true);
    const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

    const loadData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);

            // Load characters and per-character daily limits in parallel
            const [chars, limitsRes] = await Promise.all([
                apiClient.getCharacters() as Promise<any[]>,
                apiClient.getAllDailyLimits() as Promise<any>,
            ]);

            // Parse per-character limits into a map: characterId -> {used, remaining, limit}
            const limitsData = limitsRes?.data || limitsRes || {};
            const perCharLimit = limitsData.per_character_limit || 10;
            const charLimits: Record<string, { used: number; remaining: number; earned_lra: number }> = {};
            if (Array.isArray(limitsData.characters)) {
                for (const cl of limitsData.characters) {
                    charLimits[String(cl.character_id)] = {
                        used: cl.used || 0,
                        remaining: cl.remaining ?? (perCharLimit - (cl.used || 0)),
                        earned_lra: Number(cl.earned_lra) || 0,
                    };
                }
            }

            // Include characters with images, generating, or failed status
            const validChars = (chars || []).filter(
                (c: any) => (c.image_url && c.image_url !== '') || c.image_status === 'generating' || c.image_status === 'failed'
            );

            // Load last message for each character
            const chatsWithMessages = await Promise.all(
                validChars.map(async (char: any) => {
                    let lastMessage = '';
                    let lastMessageTime: Date | undefined;

                    // Only load messages for characters that have images
                    if (char.image_url && char.image_url !== '') {
                        try {
                            const messages = (await apiClient.getMessages(
                                char.id.toString(),
                                1
                            )) as any[];
                            if (messages && messages.length > 0) {
                                lastMessage = messages[0].content || '';
                                lastMessageTime = new Date(messages[0].created_at);
                            }
                        } catch {
                            // Ignore message fetch errors
                        }
                    }

                    const charId = char.id?.toString?.() ?? String(char.id);
                    const usage = charLimits[charId] || { used: 0, remaining: perCharLimit, earned_lra: 0 };

                    return {
                        id: charId,
                        title: char.title || CHARACTER_LABELS[char.type] || 'Character',
                        type: char.type,
                        image_url: char.clear_image_url || char.image_url,
                        image_status: char.image_status || '',
                        lastMessage,
                        lastMessageTime,
                        dailyUsed: usage.used,
                        dailyLimit: perCharLimit,
                        dailyRemaining: usage.remaining,
                        earnedLra: Number(usage.earned_lra) || 0,
                    };
                })
            );

            // Sort: generating first, then by last message time
            chatsWithMessages.sort((a, b) => {
                // Generating characters go to top
                if (a.image_status === 'generating' && b.image_status !== 'generating') return -1;
                if (b.image_status === 'generating' && a.image_status !== 'generating') return 1;
                if (!a.lastMessageTime && !b.lastMessageTime) return 0;
                if (!a.lastMessageTime) return 1;
                if (!b.lastMessageTime) return -1;
                return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
            });

            setCharacters(chatsWithMessages);
        } catch (error) {
            console.error('Failed to load mine data:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (isConnected) {
            loadData();
        } else {
            setLoading(false);
        }

        return () => {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        };
    }, [isConnected]);

    // 页面可见性变化时重新加载数据（返回 Mine 页时刷新积分）
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isConnected) {
                loadData(true); // 静默刷新
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isConnected]);

    // 轮询 generating 状态的角色
    useEffect(() => {
        const hasGenerating = characters.some(c => c.image_status === 'generating');
        if (hasGenerating) {
            if (!pollTimerRef.current) {
                pollTimerRef.current = setInterval(() => {
                    loadData(true);
                }, 5000);
            }
        } else {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        }
    }, [characters]);

    // 重试生图
    const handleRetryGeneration = async (charId: string) => {
        try {
            await apiClient.generateImage(charId);
        } catch {
            // 请求可能超时但后端仍在处理
        }
        loadData(true);
    };

    if (!isConnected) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-6">
                    <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-md">
                        <img src="/icons/3d/mine.png" className="w-16 h-16 object-contain" alt="Mine" />
                    </div>
                    <h2 className="text-2xl font-bold">Connect Wallet to View</h2>
                    <p className="text-white max-w-md text-center">
                        Connect your Web3 wallet to see your AI conversations.
                    </p>
                    <ConnectButton />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto w-full space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Mine</h1>
                    <p className="text-white mt-1">Your AI conversations</p>
                </div>

                {/* Chat List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-10 h-10 animate-spin text-white mb-4" />
                        <p className="text-white">Loading...</p>
                    </div>
                ) : characters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 liquid-glass-card rounded-2xl">
                        <h3 className="text-xl font-semibold mb-6 text-white">No Characters Yet</h3>
                        <button
                            onClick={() => router.push('/create')}
                            className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5 flex items-center gap-2 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Now
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {characters.map((char, index) => (
                            <motion.div
                                key={char.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                            >
                                {char.image_status === 'generating' ? (
                                    /* 生成中的角色条目 */
                                    <div className="w-full flex items-center gap-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl text-left">
                                        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-white truncate">{char.title}</h3>
                                            <p className="text-sm text-white animate-pulse">AI Generating...</p>
                                        </div>
                                        <span className="text-xs text-white bg-white/5 px-2 py-1 rounded-full">Auto-refresh</span>
                                    </div>
                                ) : char.image_status === 'failed' ? (
                                    /* 生成失败的角色条目 */
                                    <div className="w-full flex items-center gap-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-left">
                                        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-red-900/20 flex items-center justify-center">
                                            <AlertTriangle className="w-6 h-6 text-amber-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-white truncate">{char.title}</h3>
                                            <p className="text-sm text-amber-300">Generation timed out</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRetryGeneration(char.id)}
                                            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex-shrink-0"
                                        >
                                            <RotateCw className="w-3.5 h-3.5" />
                                            Retry
                                        </button>
                                    </div>
                                ) : (
                                <button
                                    type="button"
                                    onClick={() => router.push(`/chat/${char.id}`)}
                                    className="w-full flex items-center gap-3 p-3 liquid-glass-card rounded-2xl transition-all duration-300 group text-left"
                                >
                                    {/* Avatar */}
                                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                                        {char.image_url ? (
                                            <Image
                                                src={getFullImageUrl(char.image_url)}
                                                alt={char.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                                                <img src="/icons/3d/message_chat.png" className="w-8 h-8 object-contain opacity-50" alt="Chat" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-white truncate">
                                            {char.title}
                                        </h3>
                                        <div className={`mt-1 inline-flex items-center h-7 px-2.5 rounded-full text-xs font-bold ${char.dailyRemaining > 3
                                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                            : char.dailyRemaining > 0
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                            }`}>
                                            {char.dailyRemaining}/{char.dailyLimit}
                                        </div>
                                    </div>

                                    {/* Right Meta */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-transparent rounded-full border border-white/25">
                                            <Wallet className="w-3.5 h-3.5 text-white" />
                                            <span className="text-[10px] font-semibold text-white uppercase tracking-widest">{char.earnedLra} LRA</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-white group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
                                    </div>
                                </button>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
