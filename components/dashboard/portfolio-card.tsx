import { useState, useEffect } from 'react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { Loader2, Sparkles, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';

// Separate refresh button component for reuse
export function PortfolioRefreshButton({ onRefresh }: { onRefresh?: () => void }) {
    const { address } = useAccount();
    const chainId = useChainId();
    const { refetch: refetchNative } = useBalance({ address });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetchNative();
            if (onRefresh) await onRefresh();
        } finally {
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    if (chainId !== 31337) return null;

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/20 text-gray-300 hover:bg-white/10 h-9"
            onClick={handleRefresh}
            disabled={isRefreshing}
        >
            <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
        </Button>
    );
}

export function PortfolioCard() {
    const { isConnected } = useAccount();
    const [profile, setProfile] = useState<any>(null);

    const fetchProfile = async () => {
        try {
            const profileData = await apiClient.getUserProfile();
            setProfile(profileData);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (isConnected) fetchProfile();
    }, [isConnected]);

    if (!isConnected) {
        return (
            <div className="rounded-2xl bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-white/10 p-6 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Connect Wallet</h3>
                <p className="text-white/60 mb-4">Connect your wallet to view your assets and soulmates.</p>
            </div>
        );
    }

    const lraBalance = profile?.lra_balance ?? 0;

    return (
        <>
            <div className="grid grid-cols-1 gap-4">
                {/* LRA Balance */}
                <div className="rounded-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles className="w-16 h-16 text-purple-400" />
                    </div>
                    <h3 className="text-purple-200 text-sm font-medium mb-1">LRA Balance</h3>
                    <div className="text-2xl font-bold text-white flex items-end gap-2">
                        {profile ? (
                            <span>{Math.floor(lraBalance).toLocaleString()}</span>
                        ) : (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        )}
                        <span className="text-sm font-normal text-purple-200 mb-1">LRA</span>
                    </div>
                </div>
            </div>
        </>
    );
}
