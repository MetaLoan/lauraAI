'use client';

import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { PortfolioCard } from '@/components/dashboard/portfolio-card';
import { SoulmateGrid } from '@/components/dashboard/soulmate-grid';
import { useAccount } from 'wagmi';
import { Loader2, User, Camera, Plus, ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Sparkles } from 'lucide-react';

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

                        {/* My Soulmate Card */}
                        <Link href="/market">
                            <div className="group relative bg-gradient-to-br from-pink-900/40 to-rose-900/40 border border-pink-500/30 rounded-2xl p-6 hover:border-pink-500/50 transition-all hover:-translate-y-1 cursor-pointer overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-[60px] group-hover:bg-pink-500/20 transition-all" />
                                <div className="relative z-10 flex items-start gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Heart className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                            My Soulmate
                                            <ArrowRight className="w-4 h-4 text-pink-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </h3>
                                        <p className="text-gray-400 text-sm">View your AI soulmates and tap to start chatting</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-pink-400 text-xs font-medium">
                                    <Sparkles className="w-3 h-3" />
                                    Earn LRA points by chatting
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
                            View All <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <SoulmateGrid />
                </section>
            </div>
        </AppLayout>
    );
}
