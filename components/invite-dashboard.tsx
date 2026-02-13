'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Loader2, Copy, Check, Users, Gift, UserPlus, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { getAssetPath } from '@/lib/utils';

interface Referral {
    id: number;
    name: string;
    avatar_url: string;
    created_at: string;
}

interface InviteDashboardProps {
    isExpanded?: boolean;
    onToggle?: () => void;
    compact?: boolean;
}

export function InviteDashboard({ isExpanded = false, onToggle, compact = false }: InviteDashboardProps) {
    const [inviteCode, setInviteCode] = useState<string>('');
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [referralCount, setReferralCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(isExpanded);

    useEffect(() => {
        fetchInviteData();
    }, []);

    const fetchInviteData = async () => {
        try {
            setLoading(true);
            const [codeData, referralsData] = await Promise.all([
                apiClient.getInviteCode(),
                apiClient.getReferrals(),
            ]);

            if (codeData?.invite_code) {
                setInviteCode(codeData.invite_code);
            }
            if (referralsData) {
                setReferrals(referralsData.referrals || []);
                setReferralCount(referralsData.count || 0);
            }
        } catch (error) {
            console.error('Failed to load invite data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = async () => {
        if (!inviteCode) return;

        try {
            await navigator.clipboard.writeText(inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const getInviteLink = () => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://laura-ai.com';
        return `${baseUrl}?invite=${inviteCode}`;
    };

    const handleCopyLink = async () => {
        if (!inviteCode) return;

        try {
            await navigator.clipboard.writeText(getInviteLink());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    const handleShareTwitter = () => {
        if (!inviteCode) return;

        const inviteLink = getInviteLink();
        const text = `Create your AI Soulmate on @SoulFace_BSC! Join with my invite code: ${inviteCode}`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(inviteLink)}`;

        window.open(twitterUrl, '_blank');
    };

    const toggleExpand = () => {
        setExpanded(!expanded);
        onToggle?.();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="liquid-glass-card rounded-2xl p-6 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
        );
    }

    // Compact mode: 单层底 + 间距，与页面协调
    if (compact) {
        return (
            <div className="rounded-2xl liquid-glass-card overflow-hidden">
                {/* Header */}
                <button
                    onClick={toggleExpand}
                    className="w-full py-4 px-4 flex items-center justify-between hover:bg-white/[0.04] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <img src={getAssetPath('/icons/3d/referral.png')} className="w-10 h-10 object-contain flex-shrink-0" alt="Referral" />
                        <div className="text-left">
                            <h3 className="text-white font-semibold">Referral Program</h3>
                            <p className="text-white text-sm mt-0.5">{referralCount} friends invited</p>
                        </div>
                    </div>
                    {expanded ? (
                        <ChevronUp className="w-5 h-5 text-white flex-shrink-0" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-white flex-shrink-0" />
                    )}
                </button>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-4 pt-0 space-y-5 border-t border-white/50">
                                {/* Invite Code */}
                                <div className="pt-4">
                                    <p className="text-[10px] text-white uppercase tracking-wider mb-2">Your Invite Code</p>
                                    <div className="flex items-center gap-3">
                                        <code className="flex-1 text-xl font-mono font-bold text-white py-2.5 truncate min-w-0">
                                            {inviteCode}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={handleCopyCode}
                                            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors flex-shrink-0"
                                        >
                                            {copied ? (
                                                <Check className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <img src={getAssetPath('/icons/3d/copy_3d.png')} className="w-5 h-5 object-contain" alt="Copy" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Share buttons */}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCopyLink}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.08] hover:bg-white/12 border border-white/10 text-white text-sm font-medium transition-colors"
                                    >
                                        <img src={getAssetPath('/icons/3d/copy_3d.png')} className="w-5 h-5 object-contain" alt="" />
                                        Copy Link
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleShareTwitter}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.08] hover:bg-white/12 border border-white/10 text-white text-sm font-medium transition-colors"
                                    >
                                        <img src={getAssetPath('/icons/3d/share_3d.png')} className="w-5 h-5 object-contain" alt="" />
                                        Share on X
                                    </button>
                                </div>

                                {/* Referrals List */}
                                {referrals.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] text-white uppercase tracking-wider">Your Referrals</p>
                                        <div className="space-y-1 max-h-48 overflow-y-auto">
                                            {referrals.slice(0, 5).map((referral) => (
                                                <div
                                                    key={referral.id}
                                                    className="flex items-center gap-3 py-3 border-b border-white/50 last:border-0"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                                                        {referral.avatar_url ? (
                                                            <Image
                                                                src={referral.avatar_url}
                                                                alt={referral.name}
                                                                width={32}
                                                                height={32}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            referral.name?.charAt(0).toUpperCase() || '?'
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white text-sm font-medium truncate">
                                                            {referral.name || 'Anonymous'}
                                                        </p>
                                                        <p className="text-white text-xs">
                                                            Joined {formatDate(referral.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {referrals.length > 5 && (
                                            <p className="text-center text-white text-xs">
                                                +{referrals.length - 5} more
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Full dashboard mode
    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="liquid-glass-card rounded-2xl p-4 text-center">
                    <img src={getAssetPath('/icons/3d/referral.png')} className="w-10 h-10 mx-auto mb-2 object-contain" alt="Referrals" />
                    <p className="text-2xl font-bold text-white">{referralCount}</p>
                    <p className="text-xs text-white">Total Referrals</p>
                </div>
                <div className="liquid-glass-card rounded-2xl p-4 text-center">
                    <img src={getAssetPath('/icons/3d/mint.png')} className="w-10 h-10 mx-auto mb-2 object-contain" alt="Earned" />
                    <p className="text-2xl font-bold text-white">{referralCount * 100}</p>
                    <p className="text-xs text-white">LRA Earned</p>
                </div>
                <div className="liquid-glass-card rounded-2xl p-4 text-center">
                    <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">#{Math.max(1, 100 - referralCount)}</p>
                    <p className="text-xs text-white">Leaderboard</p>
                </div>
                <div className="liquid-glass-card rounded-2xl p-4 text-center">
                    <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">5%</p>
                    <p className="text-xs text-white">Commission Rate</p>
                </div>
            </div>

            {/* Invite Code Card */}
            <div className="liquid-glass-card rounded-2xl p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-white mb-1">Your Invite Code</h3>
                        <p className="text-white text-sm">Share with friends to earn LRA rewards</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <code className="text-2xl md:text-3xl font-mono font-bold text-white liquid-glass-card px-6 py-3 rounded-xl">
                            {inviteCode}
                        </code>
                        <Button
                            size="icon"
                            onClick={handleCopyCode}
                            className="h-12 w-12 bg-white text-black hover:bg-gray-200"
                        >
                            {copied ? (
                                <Check className="w-5 h-5 text-green-600" />
                            ) : (
                                <Copy className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Share Options */}
                <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-end">
                    <Button
                        onClick={handleShareTwitter}
                        className="bg-black hover:bg-gray-900 text-white gap-2 border border-white/20"
                    >
                        <img src={getAssetPath('/icons/3d/share_3d.png')} className="w-4 h-4 object-contain" alt="" />
                        Share on X
                    </Button>
                    <Button
                        onClick={handleCopyLink}
                        variant="outline"
                        className="border-white/20 hover:bg-white/10 text-white gap-2"
                    >
                        <img src={getAssetPath('/icons/3d/copy_3d.png')} className="w-4 h-4 object-contain" alt="" />
                        Copy Invite Link
                    </Button>
                </div>
            </div>

            {/* Referrals List */}
            <div className="liquid-glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <img src={getAssetPath('/icons/3d/referral.png')} className="w-6 h-6 object-contain" alt="Referrals" />
                    Your Referrals ({referralCount})
                </h3>

                {referrals.length === 0 ? (
                    <div className="text-center py-8">
                        <UserPlus className="w-12 h-12 text-white mx-auto mb-3" />
                        <p className="text-white">No referrals yet</p>
                        <p className="text-white text-sm mt-1">Share your invite code to get started!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {referrals.map((referral) => (
                            <div
                                key={referral.id}
                                className="flex items-center gap-4 p-4 liquid-glass-card rounded-xl transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold overflow-hidden">
                                    {referral.avatar_url ? (
                                        <Image
                                            src={referral.avatar_url}
                                            alt={referral.name}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        referral.name?.charAt(0).toUpperCase() || '?'
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">{referral.name || 'Anonymous User'}</p>
                                    <p className="text-white text-sm">Joined {formatDate(referral.created_at)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-green-400 font-semibold">+100 LRA</p>
                                    <p className="text-white text-xs">Reward earned</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
