'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { apiClient } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, MessageCircle, Plus, Heart, Sparkles, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { getFullImageUrl } from '@/lib/utils';
import SoulmateDetailPage from '@/components/soulmate-detail-page';

// Character type labels
const TYPE_LABELS: Record<string, string> = {
    soulmate: 'Soulmate',
    girlfriend: 'AI Girlfriend',
    boyfriend: 'AI Boyfriend',
    best_friend: 'Best Friend',
    future_wife: 'Future Wife',
    future_husband: 'Future Husband',
    future_baby: 'Future Baby',
    companion: 'Companion',
    wise_mentor: 'Wise Mentor',
    dream_guide: 'Dream Guide',
    mysterious_stranger: 'Mysterious Stranger',
    mini_me: 'Mini Me',
};

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
}

export default function MySoulmatePage() {
    const router = useRouter();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

    useEffect(() => {
        fetchCharacters();
    }, []);

    const fetchCharacters = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getCharacters() as any[];
            const mappedData = data.map((char: any) => ({
                id: char.id.toString(),
                title: char.title || 'Soulmate',
                image_url: char.image_url,
                image: char.image,
                type: char.type,
                unlock_status: char.unlock_status,
                compatibility: char.compatibility,
                astro_sign: char.astro_sign,
                description: char.description,
            }));
            setCharacters(mappedData);
        } catch (error) {
            console.error('Failed to load characters:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3 tracking-tight">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                                <Heart className="w-5 h-5 text-white" />
                            </div>
                            My Soulmate
                        </h1>
                        <p className="text-gray-400 mt-2 text-lg font-light">
                            Your AI soulmates. Tap to start a conversation.
                        </p>
                    </div>

                    <Link href="/create">
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-6 py-3 rounded-xl gap-2 shadow-lg shadow-purple-500/20">
                            <Plus className="w-5 h-5" />
                            Create New
                        </Button>
                    </Link>
                </div>

                {/* Character Count */}
                {characters.length > 0 && (
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-gray-300"><span className="text-white font-semibold">{characters.length}</span> characters created</span>
                        </div>
                    </div>
                )}

                {/* Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                        <p className="text-gray-400">Loading...</p>
                    </div>
                ) : characters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="relative mb-8">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
                                <Heart className="w-16 h-16 text-purple-400/50" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <Plus className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">No Soulmates Yet</h3>
                        <p className="text-gray-400 mb-8 text-center max-w-md leading-relaxed">
                            Head to Mint AI to create your first AI character.<br />
                            Girlfriend, boyfriend, best friend, mentor, and more.
                        </p>
                        <Link href="/create">
                            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-xl text-lg gap-2 shadow-lg shadow-purple-500/25">
                                <Sparkles className="w-5 h-5" />
                                Create Now
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {characters.map((char, index) => (
                            <motion.div
                                key={char.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
                            >
                                <button onClick={() => setSelectedCharacter(char)} className="block w-full text-left">
                                    <div className="group relative bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer">
                                        {/* Image */}
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
                                                    <span className="text-white/30 text-6xl font-bold">{char.title.charAt(0)}</span>
                                                </div>
                                            )}

                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                                            {/* Type Badge - Top Right with enhanced visibility */}
                                            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-md border border-white/30 text-white shadow-lg shadow-purple-500/50">
                                                {TYPE_LABELS[char.type] || char.type}
                                            </div>

                                            {/* Content Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                                                {/* Title row: title left, percentage right */}
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-white truncate min-w-0">{char.title}</h3>
                                                    {char.compatibility != null && (
                                                        <span className="flex items-center gap-1 flex-shrink-0 text-sm font-bold text-white">
                                                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                            {char.compatibility}%
                                                        </span>
                                                    )}
                                                </div>
                                                {char.astro_sign && (
                                                    <p className="text-xs text-purple-300/80 mb-3">{char.astro_sign}</p>
                                                )}

                                                {/* Chat Button */}
                                                <div className="flex items-center gap-2 w-full bg-white/10 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/10 group-hover:bg-white/20 transition-colors">
                                                    <MessageCircle className="w-4 h-4 text-purple-300" />
                                                    <span className="text-sm font-medium text-white">Start Chat</span>
                                                    <span className="ml-auto text-[10px] text-green-400 font-medium">+5 LRA</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </motion.div>
                        ))}

                        {/* Add New Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: characters.length * 0.08, duration: 0.4 }}
                        >
                            <Link href="/create" className="block h-full">
                                <div className="group flex flex-col items-center justify-center aspect-[3/4] bg-white/[0.02] border border-dashed border-white/10 rounded-2xl hover:bg-white/5 hover:border-purple-500/30 transition-all duration-300 cursor-pointer">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-500/10 transition-all duration-300">
                                        <Plus className="w-8 h-8 text-white/30 group-hover:text-purple-400 transition-colors" />
                                    </div>
                                    <span className="text-gray-500 font-medium group-hover:text-purple-300 transition-colors text-sm">Create New</span>
                                </div>
                            </Link>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* Character Detail Modal */}
            <AnimatePresence>
                {selectedCharacter && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedCharacter(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl h-[90vh] bg-black border border-white/10 rounded-3xl overflow-hidden relative"
                        >
                            <button
                                onClick={() => setSelectedCharacter(null)}
                                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
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
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
