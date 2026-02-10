import { useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useChainId } from 'wagmi';
import { Loader2, Wallet, Sparkles, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LAURA_AI_TOKEN_ADDRESS, LAURA_AI_TOKEN_ABI } from '@/lib/contracts';
import { apiClient } from '@/lib/api';
import { parseUnits } from 'viem';

export function PortfolioCard() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const [profile, setProfile] = useState<any>(null);
    const [isClaiming, setIsClaiming] = useState(false);

    const { writeContractAsync } = useWriteContract();

    const { data: nativeBalance, isLoading: isLoadingNative, refetch: refetchNative } = useBalance({
        address,
    });

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

    const handleClaim = async () => {
        if (!profile?.points || profile.points <= 0 || !address) return;

        setIsClaiming(true);
        try {
            const mintAmount = parseUnits(profile.points.toString(), 18);
            await writeContractAsync({
                address: LAURA_AI_TOKEN_ADDRESS as `0x${string}`,
                abi: LAURA_AI_TOKEN_ABI,
                functionName: 'mint',
                args: [address, mintAmount],
            });
            await apiClient.claimLRA();
            await fetchProfile();
            refetchNative();
            alert(`Successfully harvested ${profile.points} LRA!`);
        } catch (error) {
            console.error('Harvest failed:', error);
            alert('Harvest failed.');
        } finally {
            setIsClaiming(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="rounded-2xl bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-white/10 p-6 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Connect Wallet</h3>
                <p className="text-white/60 mb-4">Connect your wallet to view your assets and soulmates.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Native Balance */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-16 h-16 text-white" />
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Native Balance</h3>
                    <div className="text-2xl font-bold text-white flex items-end gap-2">
                        {isLoadingNative ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <span>{parseFloat(nativeBalance?.formatted || '0').toFixed(4)}</span>
                        )}
                        <span className="text-sm font-normal text-gray-400 mb-1">{nativeBalance?.symbol}</span>
                    </div>
                    {chainId === 31337 && (
                        <p className="text-xs text-gray-500 mt-1">Local network</p>
                    )}
                </div>

                {/* LRA Points (points only, no token) */}
                <div className="rounded-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles className="w-16 h-16 text-purple-400" />
                    </div>
                    <h3 className="text-purple-200 text-sm font-medium mb-1">LRA Points</h3>
                    <div className="text-2xl font-bold text-white flex items-end gap-2">
                        {profile ? (
                            <span>{profile.points?.toLocaleString() ?? 0}</span>
                        ) : (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        )}
                        <span className="text-sm font-normal text-purple-200 mb-1">LRA</span>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleClaim}
                        disabled={isClaiming || !profile?.points || profile.points <= 0}
                        className="mt-4 w-full bg-white text-black hover:bg-gray-100 font-bold uppercase tracking-wider text-xs h-10 shadow-lg group"
                    >
                        {isClaiming ? (
                            <RefreshCcw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                        )}
                        Harvest LRA
                    </Button>
                </div>
            </div>

            {chainId === 31337 && (
                <div className="mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-gray-300 hover:bg-white/10"
                        onClick={() => { refetchNative(); fetchProfile(); }}
                    >
                        <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> Refresh
                    </Button>
                </div>
            )}
        </>
    );
}
