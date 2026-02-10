'use client';

import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { PortfolioCard } from '@/components/dashboard/portfolio-card';
import { SoulmateGrid } from '@/components/dashboard/soulmate-grid';
import { DefiAnalytics } from '@/components/dashboard/defi-analytics';
import { useAccount } from 'wagmi';
import { Loader2, User, Camera, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { ShareButton } from '@/components/share-button';
import { Sparkles, Trophy } from 'lucide-react';

export default function DashboardPage() {
    const { address, isConnected, isConnecting } = useAccount();

    if (isConnecting) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    // Fallback for address display
    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Guest';

    return (
        <AppLayout>
            <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Promo Banner */}
                <div className="relative group overflow-hidden rounded-3xl bg-black border border-purple-500/20 p-8 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                                <Sparkles className="w-3 h-3" /> Genesis Phase
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Expand the Protocol.</h2>
                            <p className="text-gray-400 text-lg font-light leading-relaxed">
                                Share the vision. Earn LRA genesis rewards for every Tier-1 invitation.
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <ShareButton
                                text="Sovereign AI is here. Join the genesis of @LauraAI_BSC. #LauraAI #AIFi"
                                className="h-16 px-10 text-lg font-bold bg-white text-black hover:bg-gray-200 border-none transition-all"
                            />
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 uppercase tracking-widest font-medium">
                                <Trophy className="w-4 h-4 text-purple-500" /> 1,245 Pioneers Active
                            </div>
                        </div>
                    </div>
                </div>

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
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        Your Portfolio
                    </h2>
                    <PortfolioCard />
                    <DefiAnalytics />
                </section>

                {/* Quick Actions */}
                <section>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        Create New
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Create MiniMe Card */}
                        <Link href="/create/minime">
                            <div className="group relative bg-gradient-to-br from-pink-900/40 to-purple-900/40 border border-pink-500/30 rounded-2xl p-6 hover:border-pink-500/50 transition-all hover:-translate-y-1 cursor-pointer overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-[60px] group-hover:bg-pink-500/20 transition-all" />
                                <div className="relative z-10 flex items-start gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <User className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                            Create Mini Me
                                            <ArrowRight className="w-4 h-4 text-pink-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </h3>
                                        <p className="text-gray-400 text-sm">Upload your photo and get an AI avatar version of yourself</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-pink-400 text-xs font-medium">
                                    <Camera className="w-3 h-3" />
                                    Takes 30 seconds
                                </div>
                            </div>
                        </Link>

                        {/* Create Soulmate Card */}
                        <Link href="/create">
                            <div className="group relative bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-500/50 transition-all hover:-translate-y-1 cursor-pointer overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[60px] group-hover:bg-purple-500/20 transition-all" />
                                <div className="relative z-10 flex items-start gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                            Mint Soulmate
                                            <ArrowRight className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </h3>
                                        <p className="text-gray-400 text-sm">Create your unique AI companion based on your profile</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-purple-400 text-xs font-medium">
                                    <Plus className="w-3 h-3" />
                                    Powered by AI
                                </div>
                            </div>
                        </Link>

                        {/* Browse Market Card */}
                        <Link href="/market">
                            <div className="group relative bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-2xl p-6 hover:border-blue-500/50 transition-all hover:-translate-y-1 cursor-pointer overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] group-hover:bg-blue-500/20 transition-all" />
                                <div className="relative z-10 flex items-start gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Trophy className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                            Browse Market
                                            <ArrowRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </h3>
                                        <p className="text-gray-400 text-sm">Discover and trade unique AI companions on the marketplace</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-blue-400 text-xs font-medium">
                                    <Sparkles className="w-3 h-3" />
                                    100+ Available
                                </div>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* My Soulmates */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            Your AI Soulmates
                        </h2>
                        <Link href="/market" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
                            Visit Market <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <SoulmateGrid />
                </section>
            </div>
        </AppLayout>
    );
}
