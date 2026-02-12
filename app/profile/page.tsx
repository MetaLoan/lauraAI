'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { apiClient } from '@/lib/api';
import Image from 'next/image';
import { Loader2, User, Wallet, Award, Clock, Bell, Share2, LogOut, Coins } from 'lucide-react';
import { useAccount } from 'wagmi';
import { cn, getAssetPath } from '@/lib/utils';
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
                    <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10 backdrop-blur-md">
                        <img src={getAssetPath('/icons/3d/wallet.png')} className="w-16 h-16 object-contain" alt="Wallet" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
                    <p className="text-white mb-8 max-w-md">
                        Connect your wallet to access your profile, track your earnings, and manage your AI companions.
                    </p>
                    {/* Connect Button is in the Header */}
                    <div className="text-sm text-white animate-pulse">
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
                    <Loader2 className="w-12 h-12 animate-spin text-white" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Profile Header */}
                <div className="relative liquid-glass-card rounded-3xl p-6 md:p-8 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 relative z-10 text-center md:text-left">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 p-[2px]">
                            <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                                {/* 默认动物头像（花栗鼠） */}
                                <div className="flex items-center justify-center h-full w-full bg-transparent relative">
                                    <img src={getAssetPath('/icons/3d/default_avatar.png')} className="w-full h-full object-cover" alt="Avatar" />
                                </div>
                            </div>
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl font-bold text-white mb-1">
                                {profile?.name || 'Anonymous User'}
                            </h1>
                            <p className="text-white flex items-center justify-center md:justify-start gap-2 text-sm font-medium">
                                <span className="truncate max-w-[200px]">{address}</span>
                                <img src={getAssetPath('/icons/3d/crown.png')} className="w-5 h-5 object-contain" alt="Rank" /> {profile?.rank || 'Newcomer'}
                            </p>
                        </div>

                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/50">
                        <div className="text-center md:text-left">
                            <p className="text-white text-xs uppercase tracking-wider mb-1">LRA Balance</p>
                            <p className="text-xl font-bold text-white">{Math.floor(profile?.lra_balance ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-white text-xs uppercase tracking-wider mb-1">Referrals</p>
                            <p className="text-xl font-bold text-white">{profile?.referral_count || 0}</p>
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-white text-xs uppercase tracking-wider mb-1">Member Since</p>
                            <p className="text-xl font-bold text-white">{profile?.joined_date || 'Just now'}</p>
                        </div>
                    </div>
                </div>

                {/* LRA Balance */}
                <div className="liquid-glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                            <img src={getAssetPath('/icons/3d/mint.png')} className="w-8 h-8 object-contain" alt="LRA" /> LRA Balance
                        </h3>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">{Math.floor(profile?.lra_balance ?? 0).toLocaleString()} <span className="text-sm font-normal text-white">LRA</span></p>
                    </div>
                </div>

                {/* Invite Dashboard */}
                <InviteDashboard compact />

                {/* Settings / Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Account Settings */}
                    <div className="liquid-glass-card rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                            <img src={getAssetPath('/icons/3d/settings_3d.png')} className="w-8 h-8 object-contain" alt="Settings" /> Account Settings
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-white/50">
                                <span className="text-white">Notifications</span>
                                <div className="w-10 h-6 bg-purple-600 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/50">
                                <span className="text-white">Language</span>
                                <span className="text-white text-sm">English (US)</span>
                            </div>
                        </div>
                    </div>

                    {/* Support / Info */}
                    <div className="liquid-glass-card rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                            <img src={getAssetPath('/icons/3d/bell_3d.png')} className="w-12 h-12 object-contain" alt="Status" /> System Status
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-white text-sm">AI Engine Operational</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-white text-sm">Ethereum Mainnet Connected</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
