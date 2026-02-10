import { useState, useEffect } from 'react';
import { X, TrendingUp, ShieldCheck, Zap, Loader2, Lock, Unlock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { LAURA_AI_TOKEN_ADDRESS, LAURA_AI_TOKEN_ABI, LAURA_AI_STAKING_ADDRESS, LAURA_AI_STAKING_ABI } from '@/lib/contracts';
import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';

interface StakingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newStaked: number, newMultiplier: number) => void;
    currentStaked: number;
}

export function StakingModal({ isOpen, onClose, onSuccess, currentStaked }: StakingModalProps) {
    const [amount, setAmount] = useState('1000');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'input' | 'approve' | 'stake'>('input');
    const [stakingInfo, setStakingInfo] = useState<any>(null);
    const { writeContractAsync } = useWriteContract();
    const { address } = useAccount();

    // Read staking info from contract
    const { data: contractStakeInfo, refetch: refetchStakeInfo } = useReadContract({
        address: LAURA_AI_STAKING_ADDRESS as `0x${string}`,
        abi: LAURA_AI_STAKING_ABI,
        functionName: 'getStakeInfo',
        args: address ? [address] : undefined,
    });

    // Read LRA balance
    const { data: lraBalance } = useReadContract({
        address: LAURA_AI_TOKEN_ADDRESS as `0x${string}`,
        abi: LAURA_AI_TOKEN_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
    });

    // Read allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: LAURA_AI_TOKEN_ADDRESS as `0x${string}`,
        abi: LAURA_AI_TOKEN_ABI,
        functionName: 'allowance',
        args: address ? [address, LAURA_AI_STAKING_ADDRESS as `0x${string}`] : undefined,
    });

    // Fetch backend staking info
    useEffect(() => {
        if (isOpen) {
            apiClient.getStakingInfo().then(setStakingInfo).catch(console.error);
        }
    }, [isOpen]);

    const handleStake = async () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;

        setLoading(true);
        try {
            const stakeAmount = parseUnits(amount, 18);

            // Check if approval is needed
            const currentAllowance = allowance as bigint || BigInt(0);
            if (currentAllowance < stakeAmount) {
                setStep('approve');
                
                // Approve staking contract to spend LRA
                await writeContractAsync({
                    address: LAURA_AI_TOKEN_ADDRESS as `0x${string}`,
                    abi: LAURA_AI_TOKEN_ABI,
                    functionName: 'approve',
                    args: [LAURA_AI_STAKING_ADDRESS as `0x${string}`, stakeAmount],
                });

                await refetchAllowance();
            }

            setStep('stake');

            // Call staking contract
            const tx = await writeContractAsync({
                address: LAURA_AI_STAKING_ADDRESS as `0x${string}`,
                abi: LAURA_AI_STAKING_ABI,
                functionName: 'stake',
                args: [stakeAmount],
            });

            console.log("Staking TX:", tx);

            // Sync with backend
            const result = await apiClient.stakeLRA(val);
            if (result) {
                await refetchStakeInfo();
                onSuccess(result.staking_balance, result.staking_multiplier);
                onClose();
            }
        } catch (error) {
            console.error("Staking failed:", error);
            alert("Staking transaction failed. Check your LRA balance and approval.");
        } finally {
            setLoading(false);
            setStep('input');
        }
    };

    if (!isOpen) return null;

    const lraBalanceFormatted = lraBalance ? parseFloat(formatUnits(lraBalance as bigint, 18)) : 0;
    const stakedFromContract = contractStakeInfo ? parseFloat(formatUnits((contractStakeInfo as any)[0] as bigint, 18)) : currentStaked;
    const multiplierFromContract = contractStakeInfo ? Number((contractStakeInfo as any)[3]) / 100 : 1.0;
    const isLocked = contractStakeInfo ? (contractStakeInfo as any)[2] > BigInt(Math.floor(Date.now() / 1000)) : false;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Stake LRA</h3>
                                <p className="text-xs text-gray-400">Increase your Chat-to-Earn multiplier</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Current Staked</p>
                                <p className="text-xl font-mono font-bold text-white">{stakedFromContract.toLocaleString()} LRA</p>
                                {isLocked && (
                                    <div className="flex items-center gap-1 mt-1 text-yellow-400 text-xs">
                                        <Lock className="w-3 h-3" />
                                        <span>Locked</span>
                                    </div>
                                )}
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Your Multiplier</p>
                                <p className="text-xl font-mono font-bold text-green-400">{multiplierFromContract.toFixed(2)}x</p>
                                <p className="text-[10px] text-gray-500 mt-1">12.5% base APY</p>
                            </div>
                        </div>

                        {/* Wallet Balance */}
                        <div className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5">
                            <span className="text-gray-400 text-sm">Wallet Balance:</span>
                            <span className="text-white font-mono font-semibold">{lraBalanceFormatted.toLocaleString()} LRA</span>
                        </div>

                        {/* Input Area */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-gray-300 ml-1">Staking Amount</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-2xl font-bold focus:outline-none focus:border-purple-500/50 transition-all font-mono"
                                    placeholder="0.00"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <span className="text-gray-500 font-bold">LRA</span>
                                    <button
                                        onClick={() => setAmount(Math.floor(lraBalanceFormatted).toString())}
                                        className="text-[10px] px-2 py-1 bg-white/10 hover:bg-white/20 rounded uppercase font-bold text-white/70"
                                    >
                                        Max
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Benefits Panel */}
                        <div className="space-y-3 bg-purple-500/5 rounded-2xl p-5 border border-purple-500/10">
                            <div className="flex items-center gap-3 text-sm text-purple-200">
                                <Zap className="w-4 h-4 text-purple-400" />
                                <span>Boost Chat Multiplier to <b>{(1.0 + (stakedFromContract + parseFloat(amount || '0')) / 5000).toFixed(2)}x</b></span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-purple-200">
                                <ShieldCheck className="w-4 h-4 text-purple-400" />
                                <span>Unlock Premium Soulmate Features</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-purple-200">
                                <Lock className="w-4 h-4 text-purple-400" />
                                <span>7 day lock period after staking</span>
                            </div>
                        </div>

                        {/* Transaction Steps */}
                        {loading && (
                            <div className="flex items-center gap-3 text-sm">
                                {step === 'approve' && (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                                        <span className="text-yellow-400">Approving LRA spend...</span>
                                    </>
                                )}
                                {step === 'stake' && (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                        <span className="text-purple-400">Staking tokens...</span>
                                    </>
                                )}
                            </div>
                        )}

                        <Button
                            onClick={handleStake}
                            disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > lraBalanceFormatted}
                            className="w-full h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-lg font-bold shadow-lg shadow-purple-500/20"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                "Stake Now"
                            )}
                        </Button>

                        {parseFloat(amount) > lraBalanceFormatted && (
                            <div className="flex items-center gap-2 text-red-400 text-sm justify-center">
                                <AlertCircle className="w-4 h-4" />
                                <span>Insufficient LRA balance</span>
                            </div>
                        )}

                        <p className="text-center text-[10px] text-gray-500">
                            LRA tokens are locked for 7 days after staking. Early withdrawal may incur fees.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
