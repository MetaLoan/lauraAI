'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { apiClient } from '@/lib/api';
import { Loader2, MessageCircle, Sparkles, ChevronRight } from 'lucide-react';
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
    lastMessage?: string;
    lastMessageTime?: Date;
    dailyUsed: number;
    dailyLimit: number;
    dailyRemaining: number;
}

export default function MinePage() {
    const router = useRouter();
    const { isConnected } = useAccount();
    const [characters, setCharacters] = useState<CharacterChat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load characters and per-character daily limits in parallel
                const [chars, limitsRes] = await Promise.all([
                    apiClient.getCharacters() as Promise<any[]>,
                    apiClient.getAllDailyLimits() as Promise<any>,
                ]);

                // Parse per-character limits into a map: characterId -> {used, remaining, limit}
                const limitsData = limitsRes?.data || limitsRes || {};
                const perCharLimit = limitsData.per_character_limit || 10;
                const charLimits: Record<string, { used: number; remaining: number }> = {};
                if (Array.isArray(limitsData.characters)) {
                    for (const cl of limitsData.characters) {
                        charLimits[String(cl.character_id)] = {
                            used: cl.used || 0,
                            remaining: cl.remaining ?? (perCharLimit - (cl.used || 0)),
                        };
                    }
                }

                // Filter to only characters with generated images
                const validChars = (chars || []).filter(
                    (c: any) => c.image_url && c.image_url !== ''
                );

                // Load last message for each character
                const chatsWithMessages = await Promise.all(
                    validChars.map(async (char: any) => {
                        let lastMessage = '';
                        let lastMessageTime: Date | undefined;

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

                        const charId = char.id?.toString?.() ?? String(char.id);
                        const usage = charLimits[charId] || { used: 0, remaining: perCharLimit };

                        return {
                            id: charId,
                            title: char.title || CHARACTER_LABELS[char.type] || 'Character',
                            type: char.type,
                            image_url: char.clear_image_url || char.image_url,
                            lastMessage,
                            lastMessageTime,
                            dailyUsed: usage.used,
                            dailyLimit: perCharLimit,
                            dailyRemaining: usage.remaining,
                        };
                    })
                );

                // Sort by last message time (most recent first)
                chatsWithMessages.sort((a, b) => {
                    if (!a.lastMessageTime && !b.lastMessageTime) return 0;
                    if (!a.lastMessageTime) return 1;
                    if (!b.lastMessageTime) return -1;
                    return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
                });

                setCharacters(chatsWithMessages);
            } catch (error) {
                console.error('Failed to load mine data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isConnected) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [isConnected]);

    // Format relative time
    const formatTime = (date?: Date) => {
        if (!date) return '';
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (!isConnected) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-white/10">
                        <MessageCircle className="w-10 h-10 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Connect Wallet to View</h2>
                    <p className="text-gray-400 max-w-md text-center">
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
                    <p className="text-gray-400 mt-1">Your AI conversations</p>
                </div>

                {/* Chat List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                        <p className="text-gray-400">Loading...</p>
                    </div>
                ) : characters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                        <h3 className="text-xl font-semibold mb-6 text-white">No Characters Yet</h3>
                        <button
                            onClick={() => router.push('/create')}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
                        >
                            <Sparkles className="w-4 h-4" /> Create Now
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
                                <button
                                    type="button"
                                    onClick={() => router.push(`/chat/${char.id}`)}
                                    className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-2xl transition-all duration-300 group text-left"
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
                                            <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                                                <MessageCircle className="w-6 h-6 text-purple-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="text-base font-bold text-white truncate">
                                                {char.title}
                                            </h3>
                                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                                {formatTime(char.lastMessageTime)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 truncate">
                                            {char.lastMessage || 'Start a conversation...'}
                                        </p>
                                    </div>

                                    {/* Per-character remaining badge */}
                                    <div className="flex flex-col items-center flex-shrink-0 ml-1">
                                        <div className={`min-w-[36px] h-9 px-2 rounded-full flex items-center justify-center text-sm font-bold ${
                                            char.dailyRemaining > 3
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : char.dailyRemaining > 0
                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        }`}>
                                            {char.dailyRemaining}/{char.dailyLimit}
                                        </div>
                                        <span className="text-[9px] text-gray-500 mt-0.5">today</span>
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
