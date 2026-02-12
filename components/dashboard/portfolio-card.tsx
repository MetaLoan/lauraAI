import { useState, useEffect } from 'react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { Loader2, RefreshCcw } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { getAssetPath } from '@/lib/utils';

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

    if (chainId !== 97) return null;

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5"
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
            <div className="rounded-2xl liquid-glass-card p-6 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Connect Wallet</h3>
                <p className="text-white mb-4">Connect your wallet to view your assets and soulmates.</p>
            </div>
        );
    }

    const lraBalance = profile?.lra_balance ?? 0;

    return (
        <>
            <div className="grid grid-cols-1 gap-4">
                {/* LRA Balance */}
                <div className="rounded-2xl liquid-glass-card p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-80">
                        <Image src={getAssetPath('/icons/3d/lra_balance.png')} alt="" width={64} height={64} className="w-16 h-16 object-contain" />
                    </div>
                    <h3 className="text-white text-sm font-medium mb-1">LRA Balance</h3>
                    <div className="text-2xl font-bold text-white flex items-end gap-2">
                        {profile ? (
                            <span>{Math.floor(lraBalance).toLocaleString()}</span>
                        ) : (
                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                        )}
                        <span className="text-sm font-normal text-white mb-1">LRA</span>
                    </div>
                </div>
            </div>
        </>
    );
}
