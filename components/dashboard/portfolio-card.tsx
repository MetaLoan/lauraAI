import { useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useReadContract, useChainId } from 'wagmi';
import { Loader2, TrendingUp, Wallet, Coins, Sparkles, RefreshCcw, Plus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LAURA_AI_TOKEN_ADDRESS, LAURA_AI_TOKEN_ABI, LAURA_AI_STAKING_ADDRESS, LAURA_AI_STAKING_ABI } from '@/lib/contracts';
import { apiClient } from '@/lib/api';
import { parseUnits, formatUnits } from 'viem';
import { StakingModal } from './staking-modal';

export function PortfolioCard() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const [profile, setProfile] = useState<any>(null);
    const [stakingInfo, setStakingInfo] = useState<any>(null);
    const [isClaiming, setIsClaiming] = useState(false);
    const [isStakingOpen, setIsStakingOpen] = useState(false);

    const { writeContractAsync } = useWriteContract();

    // Native BNB Balance
    const { data: nativeBalance, isLoading: isLoadingNative, refetch: refetchNative } = useBalance({
        address,
    });

    // LRA Token Balance
    const { data: lraBalance, isLoading: isLoadingLra, refetch: refetchLra } = useBalance({
        address,
        token: LAURA_AI_TOKEN_ADDRESS as `0x${string}`,
    });

    // Read staking info from contract
    const { data: contractStakeInfo, refetch: refetchStakeInfo } = useReadContract({
        address: LAURA_AI_STAKING_ADDRESS as `0x${string}`,
        abi: LAURA_AI_STAKING_ABI,
        functionName: 'getStakeInfo',
        args: address ? [address] : undefined,
    });

    const fetchProfile = async () => {
        try {
            const [profileData, stakingData] = await Promise.all([
                apiClient.getUserProfile(),
                apiClient.getStakingInfo().catch(() => null)
            ]);
            setProfile(profileData);
            if (stakingData) {
                setStakingInfo(stakingData);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (isConnected) {
            fetchProfile();
        }
    }, [isConnected]);

    const handleClaim = async () => {
        if (!profile?.points || profile.points <= 0 || !address) return;

        setIsClaiming(true);
        try {
            // 1. Transaction: Real Minting on BSC (Localhost)
            // Note: In production, the backend would typically handle this or a MasterChef-like contract
            // For testing, we call the token's mint function directly
            const mintAmount = parseUnits(profile.points.toString(), 18);

            const tx = await writeContractAsync({
                address: LAURA_AI_TOKEN_ADDRESS as `0x${string}`,
                abi: LAURA_AI_TOKEN_ABI,
                functionName: 'mint',
                args: [address, mintAmount],
            });

            console.log("Mint Transaction Hash:", tx);

            // 2. Call local API to reset points
            await apiClient.claimLRA();

            // 3. Refresh data
            await fetchProfile();
            refetchNative();
            refetchLra();

            alert(`Successfully harvested ${profile.points} LRA! View on BSCScan (Simulated).`);
        } catch (error) {
            console.error("Harvest failed:", error);
            alert("Harvest failed. Make sure you are the contract owner or have permission.");
        } finally {
            setIsClaiming(false);
        }
    };

    const handleStakingSuccess = (newStaked: number, newMultiplier: number) => {
        fetchProfile();
        refetchLra();
        refetchStakeInfo();
        // Update local state immediately for better UX
        setStakingInfo((prev: any) => ({
            ...prev,
            staking_balance: newStaked,
            staking_multiplier: newMultiplier
        }));
    };

    // Get staking data from contract or backend
    const stakedAmount = contractStakeInfo 
        ? parseFloat(formatUnits((contractStakeInfo as any)[0] as bigint, 18))
        : stakingInfo?.staking_balance || 0;
    
    const multiplier = contractStakeInfo
        ? Number((contractStakeInfo as any)[3]) / 100
        : stakingInfo?.staking_multiplier || 1.0;
    
    const isLocked = contractStakeInfo 
        ? (contractStakeInfo as any)[2] > BigInt(Math.floor(Date.now() / 1000))
        : stakingInfo?.is_locked || false;
    
    const effectiveAPY = stakingInfo?.effective_apy || (multiplier * 12.5);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Native Balance Card */}
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
                        <>
                            <p className="text-xs text-gray-500 mt-1">本地网络原生币（钱包中可能显示为 GO）</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                dApp 当前 RPC: {process.env.NEXT_PUBLIC_RPC_URL ? '云端（同源代理）' : '本地 /hardhat-rpc'}
                            </p>
                        </>
                    )}
                </div>

                {/* LRA Balance Card */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Coins className="w-16 h-16 text-purple-400" />
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">LRA Balance</h3>
                    <div className="text-2xl font-bold text-white flex items-end gap-2">
                        {isLoadingLra ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <span>{parseFloat(lraBalance?.formatted || '0').toFixed(2)}</span>
                        )}
                        <span className="text-sm font-normal text-gray-400 mb-1">LRA</span>
                    </div>
                </div>

                {/* Staked Assets Card */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-16 h-16 text-green-400" />
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Staked Assets</h3>
                    <div className="text-2xl font-bold text-white flex items-end gap-2">
                        <span>{stakedAmount.toLocaleString()}</span>
                        <span className="text-sm font-normal text-gray-400 mb-1">LRA</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                            +{effectiveAPY.toFixed(1)}% APY
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                            {multiplier.toFixed(2)}x
                        </span>
                        {isLocked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                                <Lock className="w-3 h-3" /> Locked
                            </span>
                        )}
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsStakingOpen(true)}
                        className="mt-4 w-full border border-white/10 hover:bg-white/10 text-xs text-gray-300 gap-2 h-9"
                    >
                        <Plus className="w-3.5 h-3.5" /> Stake More
                    </Button>
                </div>

                {/* Pending Yield Card (Chat-to-Earn Points) */}
                <div className="rounded-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles className="w-16 h-16 text-purple-400" />
                    </div>
                    <h3 className="text-purple-200 text-sm font-medium mb-1">Chat-to-Earn Rewards</h3>
                    <div className="text-2xl font-bold text-white flex items-end gap-2">
                        {profile ? (
                            <span>{profile.points.toLocaleString()}</span>
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
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-gray-300 hover:bg-white/10"
                        onClick={() => { refetchNative(); refetchLra(); refetchStakeInfo(); }}
                    >
                        <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> 刷新余额
                    </Button>
                    {parseFloat(nativeBalance?.formatted || '0') === 0 && parseFloat(lraBalance?.formatted || '0') === 0 && (
                        <p className="text-xs text-amber-200/90">
                            若钱包有余额但此处为 0：请确认钱包网络为 Chain ID 31337，且 RPC 与上方「dApp 当前 RPC」一致（云端即 lauraai-rpc.fly.dev）。代理失败时可改用本地链：.env.local 去掉 NEXT_PUBLIC_RPC_URL，运行 <code className="bg-black/30 px-1 rounded">npx hardhat node</code> 与 <code className="bg-black/30 px-1 rounded">fund-address.js</code>，钱包连 127.0.0.1:8545。
                        </p>
                    )}
                </div>
            )}

            <StakingModal
                isOpen={isStakingOpen}
                onClose={() => setIsStakingOpen(false)}
                onSuccess={handleStakingSuccess}
                currentStaked={stakedAmount}
            />
        </>
    );
}
