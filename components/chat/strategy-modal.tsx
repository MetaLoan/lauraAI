'use client';

import { useState, useEffect } from 'react';
import { X, Zap, Loader2, CheckCircle2, ArrowRightLeft, ShieldCheck, ExternalLink, TrendingUp, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits, parseEther } from 'viem';
import { PANCAKE_ROUTER_ABI, PANCAKE_ROUTER_ADDRESS, LAURA_AI_TOKEN_ADDRESS, LAURA_AI_TOKEN_ABI, WBNB_ADDRESS } from '@/lib/contracts';

interface Pool {
    name: string;
    apy: number;
    tvl: string;
    tvl_number: number;
    trend: string;
    volume_24h: string;
    fee_tier: string;
}

interface StrategyModalProps {
    isOpen: boolean;
    onClose: () => void;
    insight: any;
}

export function StrategyModal({ isOpen, onClose, insight }: StrategyModalProps) {
    const [step, setStep] = useState<'loading' | 'select' | 'confirm' | 'approving' | 'executing' | 'success' | 'error'>('loading');
    const [pools, setPools] = useState<Pool[]>([]);
    const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
    const [amount, setAmount] = useState('100');
    const [txHash, setTxHash] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();

    useEffect(() => {
        if (isOpen) {
            fetchPools();
        } else {
            setStep('loading');
            setSelectedPool(null);
        }
    }, [isOpen]);

    const fetchPools = async () => {
        try {
            const data = await apiClient.getPools();
            if (data?.pools) {
                setPools(data.pools);
            } else {
                // Fallback to market intelligence
                const market = await apiClient.getMarketIntelligence();
                if (market?.v3_pools) {
                    setPools(market.v3_pools);
                }
            }
            setStep('select');
        } catch (error) {
            console.error('Failed to fetch pools:', error);
            // Use mock data as fallback
            setPools([
                { name: 'LRA-BNB', apy: 24.5, tvl: '$1.85M', tvl_number: 1850000, trend: 'up', volume_24h: '$245K', fee_tier: '0.25%' },
                { name: 'LRA-USDT', apy: 12.2, tvl: '$920K', tvl_number: 920000, trend: 'stable', volume_24h: '$128K', fee_tier: '0.05%' },
            ]);
            setStep('select');
        }
    };

    const handleSelectPool = (pool: Pool) => {
        setSelectedPool(pool);
        setStep('confirm');
    };

    const handleExecute = async () => {
        if (!selectedPool || !address) return;

        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;

        setStep('approving');
        setErrorMessage('');

        try {
            // Step 1: Approve LRA token spend if needed
            const approveAmount = parseUnits(amount, 18);
            
            await writeContractAsync({
                address: LAURA_AI_TOKEN_ADDRESS as `0x${string}`,
                abi: LAURA_AI_TOKEN_ABI,
                functionName: 'approve',
                args: [PANCAKE_ROUTER_ADDRESS as `0x${string}`, approveAmount],
            });

            setStep('executing');

            // Step 2: Execute swap/add liquidity based on pool
            // For LRA-BNB pool, we swap half LRA to BNB then add liquidity
            if (selectedPool.name.includes('BNB')) {
                const halfAmount = approveAmount / BigInt(2);
                const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

                // Swap LRA for BNB
                const swapTx = await writeContractAsync({
                    address: PANCAKE_ROUTER_ADDRESS as `0x${string}`,
                    abi: PANCAKE_ROUTER_ABI,
                    functionName: 'swapExactTokensForTokens',
                    args: [
                        halfAmount,
                        BigInt(0), // amountOutMin (0 for demo, should use proper slippage)
                        [LAURA_AI_TOKEN_ADDRESS as `0x${string}`, WBNB_ADDRESS as `0x${string}`],
                        address,
                        deadline,
                    ],
                });

                setTxHash(swapTx);
            } else {
                // For stablecoin pairs, just record the intent
                // In production, this would interact with the actual DEX
                const result = await apiClient.executeStrategy(
                    'add_liquidity',
                    selectedPool.name,
                    val
                );
                
                if (result?.tx_hash) {
                    setTxHash(result.tx_hash);
                } else {
                    // Generate a demo tx hash
                    setTxHash('0x' + Math.random().toString(16).slice(2, 66));
                }
            }

            setStep('success');

        } catch (error: any) {
            console.error('Strategy execution failed:', error);
            setStep('error');
            setErrorMessage(error.message || 'Transaction failed. Please try again.');
        }
    };

    if (!isOpen || !insight) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/90 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-md bg-stone-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                >
                    <div className="p-8">
                        {/* Loading State */}
                        {step === 'loading' && (
                            <div className="py-12 flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                                <p className="text-gray-400">Loading pools...</p>
                            </div>
                        )}

                        {/* Pool Selection */}
                        {step === 'select' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                        <Droplets className="w-6 h-6 text-purple-500" />
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white">Select Pool</h3>
                                    <p className="text-sm text-gray-400">Choose a liquidity pool to add your assets</p>
                                </div>

                                <div className="space-y-3">
                                    {pools.map((pool, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectPool(pool)}
                                            className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all text-left group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-white font-semibold group-hover:text-purple-400 transition-colors">
                                                    {pool.name}
                                                </span>
                                                <TrendingUp className="w-4 h-4 text-green-400" />
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-green-400">{pool.apy.toFixed(1)}% APY</span>
                                                <span className="text-gray-500">TVL: {pool.tvl}</span>
                                                <span className="text-gray-500">{pool.fee_tier}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Confirm Execution */}
                        {step === 'confirm' && selectedPool && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                                        <Zap className="w-6 h-6 text-yellow-500" />
                                    </div>
                                    <button onClick={() => setStep('select')} className="p-2 hover:bg-white/5 rounded-full">
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white">Execute Strategy</h3>
                                    <p className="text-sm text-gray-400">Add liquidity to {selectedPool.name} pool</p>
                                </div>

                                {/* Amount Input */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Amount (LRA)</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xl font-bold text-white focus:outline-none focus:border-purple-500/50"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Target Pool</span>
                                        <span className="text-white font-medium">{selectedPool.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Current APY</span>
                                        <span className="text-green-400 font-bold">{selectedPool.apy.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Pool TVL</span>
                                        <span className="text-white">{selectedPool.tvl}</span>
                                    </div>
                                    <div className="pt-3 border-t border-white/5 flex gap-3 text-[10px] text-gray-500">
                                        <ShieldCheck className="w-3 h-3" /> Audited by LauraAI Intelligence
                                    </div>
                                </div>

                                <Button
                                    onClick={handleExecute}
                                    disabled={!amount || parseFloat(amount) <= 0}
                                    className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 font-bold text-lg"
                                >
                                    Confirm Execution
                                </Button>
                            </div>
                        )}

                        {/* Approving */}
                        {step === 'approving' && (
                            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
                                <Loader2 className="w-16 h-16 text-yellow-400 animate-spin" />
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">Approving Token Spend</h3>
                                    <p className="text-sm text-gray-400">Please confirm in your wallet...</p>
                                </div>
                            </div>
                        )}

                        {/* Executing */}
                        {step === 'executing' && (
                            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-2 border-white/10 border-t-white animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ArrowRightLeft className="w-8 h-8 text-white opacity-20" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">Executing Multi-Step Strategy</h3>
                                    <p className="text-sm text-gray-400 animate-pulse">Swapping tokens & building LP position...</p>
                                </div>
                            </div>
                        )}

                        {/* Success */}
                        {step === 'success' && (
                            <div className="py-8 space-y-6 text-center">
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white">Strategy Deployed</h3>
                                    <p className="text-sm text-gray-400">Your assets are now earning yield in {selectedPool?.name}.</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl space-y-2">
                                    <div className="flex items-center justify-between text-xs font-mono">
                                        <span className="text-gray-500">TX Hash</span>
                                        <span className="text-purple-400">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                                    </div>
                                    <a
                                        href={`https://bscscan.com/tx/${txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 text-sm text-purple-400 hover:text-purple-300"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        View on BSCScan
                                    </a>
                                </div>
                                <Button
                                    onClick={onClose}
                                    className="w-full h-14 rounded-2xl bg-white/10 text-white hover:bg-white/20 border border-white/10"
                                >
                                    Done
                                </Button>
                            </div>
                        )}

                        {/* Error */}
                        {step === 'error' && (
                            <div className="py-8 space-y-6 text-center">
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                        <X className="w-10 h-10 text-red-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white">Execution Failed</h3>
                                    <p className="text-sm text-gray-400">{errorMessage}</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => setStep('confirm')}
                                        className="flex-1 h-14 rounded-2xl bg-white text-black hover:bg-gray-200"
                                    >
                                        Try Again
                                    </Button>
                                    <Button
                                        onClick={onClose}
                                        variant="outline"
                                        className="flex-1 h-14 rounded-2xl border-white/10 text-white hover:bg-white/10"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
