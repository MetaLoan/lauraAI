'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AppLayout } from '@/components/layout/app-layout';
import { PortfolioCard, PortfolioRefreshButton } from '@/components/dashboard/portfolio-card';
import { useAccount } from 'wagmi';
import { Loader2, User, Camera, Plus, ArrowRight, Heart, Sparkles, MessageCircle, Star, X } from 'lucide-react';
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
}

export default function DashboardPage() {
    const router = useRouter();
    const { address, isConnected, isConnecting } = useAccount();

    const [characters, setCharacters] = useState<Character[]>([]);
    const [charactersLoading, setCharactersLoading] = useState(true);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

    useEffect(() => {
        if (isConnected) fetchCharacters();
        else setCharactersLoading(false);
    }, [isConnected]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash === '#soulmates') {
            document.getElementById('soulmates')?.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    const fetchCharacters = async () => {
        try {
            setCharactersLoading(true);
            const data = await apiClient.getCharacters() as any[];
            const mappedData = (data || []).map((char: any) => ({
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
            setCharactersLoading(false);
        }
    };

    if (isConnecting) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Guest';

    return (
        <AppLayout>
            <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter">
                            HELLO, <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 uppercase">{shortAddress}</span>
                        </h1>
                        <p className="text-gray-400 text-xl font-light">
                            Your sovereign bond is active. Intelligence is scaling.
                        </p>
                    </div>
                    {!isConnected && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 px-4 py-2 rounded-lg text-sm">
                            Connect wallet to view your full portfolio
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
                            <div className="group relative bg-gradient-to-br from-pink-900/40 to-purple-900/40 border border-pink-500/30 rounded-2xl p-6 hover:border-pink-500/50 transition-all hover:-translate-y-1 cursor-pointer overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-[60px] group-hover:bg-pink-500/20 transition-all" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                            <User className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            Create Mini Me
                                            <ArrowRight className="w-4 h-4 text-pink-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </h3>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-4">Upload your photo and get an AI avatar version of yourself</p>
                                    <div className="flex items-center gap-2 text-pink-400 text-xs font-medium">
                                        <Camera className="w-3 h-3" /> Takes 30 seconds
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <Link href="/create">
                            <div className="group relative bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-500/50 transition-all hover:-translate-y-1 cursor-pointer overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[60px] group-hover:bg-purple-500/20 transition-all" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                            <Sparkles className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            Mint Soulmate
                                            <ArrowRight className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </h3>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-4">Create your unique AI companion based on your profile</p>
                                    <div className="flex items-center gap-2 text-purple-400 text-xs font-medium">
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
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                <span className="text-gray-300"><span className="text-white font-semibold">{characters.length}</span> characters</span>
                            </div>
                        )}
                    </div>

                    {charactersLoading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                            <p className="text-gray-400">Loading...</p>
                        </div>
                    ) : characters.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                            <h3 className="text-xl font-semibold mb-6 text-white">No Soulmates Yet</h3>
                            <Link href="/create">
                                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold gap-2">
                                    <Sparkles className="w-4 h-4" /> Create Now
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
                                    transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
                                >
                                    <button type="button" onClick={() => setSelectedCharacter(char)} className="block w-full text-left">
                                        <div className="group relative bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer">
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
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
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
                                                        <p className="text-xs text-purple-300/80 mb-3 flex items-center gap-1.5">
                                                            {getZodiacGlyph(char.astro_sign) ? (
                                                                <span className="font-zodiac text-lg leading-none" title={char.astro_sign}>
                                                                    {getZodiacGlyph(char.astro_sign)}
                                                                </span>
                                                            ) : (
                                                                char.astro_sign
                                                            )}
                                                        </p>
                                                    )}
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
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: characters.length * 0.06, duration: 0.35 }}
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
                </section>
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
                                type="button"
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
