'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { apiClient } from '@/lib/api';
import Image from 'next/image';
import { Loader2, User, Wallet, Award, Clock, Settings, Bell, Share2, LogOut, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import { ShareButton } from '@/components/share-button';
import { useAccount as useWagmiAccount } from 'wagmi';
import { InviteDashboard } from '@/components/invite-dashboard';

export default function ProfilePage() {
    const { address, isConnected } = useWagmiAccount();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await apiClient.getUserProfile();
                setProfile(data);
            } catch (error) {
                console.error('Failed to load profile:', error);
            } finally {
                setLoading(false);
            }
        };
        if (isConnected) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [isConnected]);

    if (!isConnected) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Wallet className="w-10 h-10 text-white/50" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
                    <p className="text-gray-400 mb-8 max-w-md">
                        Connect your wallet to access your profile, track your earnings, and manage your AI companions.
                    </p>
                    {/* Connect Button is in the Header */}
                    <div className="text-sm text-purple-400 animate-pulse">
                        Please use the button in the top right corner
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (loading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-[80vh]">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Profile Header */}
                <div className="relative bg-gradient-to-r from-purple-900/40 via-black to-black border border-white/10 rounded-3xl p-6 md:p-8 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 relative z-10 text-center md:text-left">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 p-[2px]">
                            <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                                {/* Avatar Placeholder */}
                                <div className="flex items-center justify-center h-full w-full bg-white/10 text-3xl font-bold">
                                    {profile?.name?.charAt(0).toUpperCase() || <User />}
                                </div>
                            </div>
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl font-bold text-white mb-1">
                                {profile?.name || 'Anonymous User'}
                            </h1>
                            <p className="text-purple-300 flex items-center justify-center md:justify-start gap-2 text-sm font-medium">
                                <span className="truncate max-w-[200px]">{address}</span>
                                <Award className="w-4 h-4 text-yellow-400" /> {profile?.rank || 'Newcomer'}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <ShareButton
                                text="I'm earning LRA tokens by chatting with my AI Soulmate on LauraAI! Join me on BSC. #LauraAI #ChatToEarn"
                                url="https://laura-ai.com"
                            />
                            <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white rounded-full">
                                <Settings className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
                        <div className="text-center md:text-left">
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">LRA Balance</p>
                            <p className="text-xl font-bold text-white">{Math.floor(profile?.lra_balance ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Referrals</p>
                            <p className="text-xl font-bold text-white">{profile?.referral_count || 0}</p>
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Member Since</p>
                            <p className="text-xl font-bold text-white">{profile?.joined_date || 'Just now'}</p>
                        </div>
                    </div>
                </div>

                {/* LRA Balance */}
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Coins className="w-5 h-5 text-purple-400" /> LRA Balance
                        </h3>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">{Math.floor(profile?.lra_balance ?? 0).toLocaleString()} <span className="text-sm font-normal text-purple-300">LRA</span></p>
                    </div>
                </div>

                {/* Invite Dashboard */}
                <InviteDashboard compact />

                {/* Settings / Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Account Settings */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-400" /> Account Settings
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <span className="text-gray-300">Notifications</span>
                                <div className="w-10 h-6 bg-purple-600 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <span className="text-gray-300">Language</span>
                                <span className="text-gray-500 text-sm">English (US)</span>
                            </div>
                        </div>
                    </div>

                    {/* Support / Info */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-gray-400" /> System Status
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-gray-300 text-sm">AI Engine Operational</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-gray-300 text-sm">BSC Mainnet Connected</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
