'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import SoulmateDetailPage from '@/components/soulmate-detail-page';
import DrawingLoading from '@/components/drawing-loading';
import { ArrowLeft, Loader2, Upload, AlertTriangle, RefreshCw, Home, RotateCw } from 'lucide-react';
import { useAccount, useWriteContract, useConfig } from 'wagmi';
import { ConnectButton } from '@/components/wallet-button';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api';
import imageCompression from 'browser-image-compression';
import { parseUnits } from 'viem';
import { waitForTransactionReceipt } from '@wagmi/core';
import { getAssetPath } from '@/lib/utils';
import { toMintUserMessage } from '@/lib/mint-error';
import {
    confirmWithRecovery,
    flushPendingMintConfirms,
    getPendingMintConfirm,
} from '@/lib/mint-confirm-recovery';
import {
    LAURA_AI_SOULMATE_ABI,
    LAURA_AI_SOULMATE_ADDRESS,
    LAURA_AI_TOKEN_ABI,
    FF_TOKEN_ADDRESS,
    MINT_PRICE_FF,
    MINT_PRICE_FF_DECIMALS,
} from '@/lib/contracts';

type Step = 'intro' | 'generating' | 'result';
type MintStep = 'idle' | 'awaiting_approve' | 'awaiting_mint' | 'mint_verifying' | 'generating' | 'done';
type MintUiState = 'new' | 'minting' | 'retry_mint' | 'generating' | 'retry_generation' | 'done';

function isWalletMintStep(step: MintStep): boolean {
    return step === 'awaiting_approve' || step === 'awaiting_mint' || step === 'mint_verifying';
}

function getMintStageContent(step: MintStep): { title: string; desc: string } {
    if (step === 'awaiting_approve') {
        return {
            title: 'Approve FF Spending',
            desc: 'Please confirm token approve in your wallet.',
        };
    }
    if (step === 'awaiting_mint') {
        return {
            title: 'Confirm Mint Transaction',
            desc: 'Please confirm the safeMint transaction in your wallet.',
        };
    }
    return {
        title: 'Verifying On-chain Payment',
        desc: 'Transaction sent. Waiting for chain confirmation and backend verification.',
    };
}

function getMiniMeUiState(character: any): MintUiState {
    const backendState = String(character?.mint_ui_state || '').toLowerCase();
    if (backendState === 'minting' || backendState === 'retry_mint' || backendState === 'generating' || backendState === 'retry_generation' || backendState === 'done') {
        return backendState as MintUiState;
    }
    const hasImage = !!(character?.image_url || character?.clear_image_url);
    if (hasImage) return 'done';
    if (character?.image_status === 'failed') return 'retry_generation';
    const orderStatus = String(character?.mint_order_status || '').toLowerCase();
    if (orderStatus === 'failed') return 'retry_mint';
    if (orderStatus === 'confirmed') return 'generating';
    return 'minting';
}

export default function CreateMiniMePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isConnected, address, chainId } = useAccount();
    const [step, setStep] = useState<Step>('intro');
    const [mintStep, setMintStep] = useState<MintStep>('idle');
    const [characterData, setCharacterData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [generationFailed, setGenerationFailed] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [mintRetryMode, setMintRetryMode] = useState(false);
    const [generatingCharacterId, setGeneratingCharacterId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const lastResumeProbeAtRef = useRef<number>(0);

    const mintPrice = parseUnits(MINT_PRICE_FF, MINT_PRICE_FF_DECIMALS);

    // Mint contract
    const { writeContractAsync } = useWriteContract();
    const config = useConfig();

    // 轮询检查生图结果
    const pollForResult = useCallback(async (charId: string) => {
        try {
            const chars = await apiClient.getCharacters() as any[];
            const found = chars?.find((c: any) => String(c.id) === charId);
            const uiState = getMiniMeUiState(found);
            if (found && found.image_status === 'done' && found.image_url) {
                // 生成完成
                if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
                setCharacterData({ ...found, id: found.id.toString() });
                setStep('result');
                setMintStep('idle');
                setGeneratingCharacterId(null);
                setGenerationFailed(false);
            } else if (found && found.image_status === 'failed') {
                // 生成失败
                if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
                setGenerationFailed(true);
                setMintRetryMode(uiState === 'retry_mint');
                setMintStep(uiState === 'retry_mint' ? 'mint_verifying' : 'generating');
            } else if (found && (found.image_status === '' || !found.image_status)) {
                if (uiState === 'retry_mint') {
                    setMintStep('mint_verifying');
                    setMintRetryMode(true);
                    return;
                }
                if (uiState === 'generating') {
                    setMintStep('generating');
                    setMintRetryMode(false);
                    apiClient.generateImage(String(found.id)).catch(() => { });
                    return;
                }
                const now = Date.now();
                if (now - lastResumeProbeAtRef.current > 10000) {
                    lastResumeProbeAtRef.current = now;
                    try {
                        const probe = await apiClient.createMintOrder({
                            character_id: Number(found.id),
                            chain_id: chainId || 1,
                            token_address: FF_TOKEN_ADDRESS,
                            token_symbol: 'FF',
                            token_amount: MINT_PRICE_FF,
                            token_amount_wei: mintPrice.toString(),
                        });
                        if (probe?.already_paid) {
                            setMintStep('generating');
                            setMintRetryMode(false);
                            apiClient.generateImage(String(found.id)).catch(() => { });
                        } else {
                            setMintStep('mint_verifying');
                            setMintRetryMode(String(probe?.order?.status || '').toLowerCase() === 'failed');
                        }
                    } catch {
                        // ignore and continue polling
                    }
                }
            }
        } catch {
            // 轮询出错不中断
        }
    }, [chainId, mintPrice]);

    // 启动轮询
    const startPolling = useCallback((charId: string) => {
        if (pollRef.current) clearInterval(pollRef.current);
        setGenerationFailed(false);
        pollRef.current = setInterval(() => pollForResult(charId), 5000);
    }, [pollForResult]);

    // 手动刷新
    const handleManualRefresh = () => {
        if (generatingCharacterId) {
            pollForResult(generatingCharacterId);
        }
    };

    // 重试生图
    const handleRetryGeneration = async () => {
        if (!generatingCharacterId) return;
        setIsRetrying(true);
        setGenerationFailed(false);

        try {
            await apiClient.generateImage(generatingCharacterId);
            startPolling(generatingCharacterId);
        } catch (err: any) {
            console.warn('Retry request sent:', err);
            startPolling(generatingCharacterId);
        } finally {
            setIsRetrying(false);
        }
    };

    const handleRetryMintForExisting = async () => {
        if (!generatingCharacterId || !address) return;
        setMintRetryMode(false);
        setGenerationError(null);
        setMintStep('awaiting_approve');

        try {
            const mintOrderResult = await apiClient.createMintOrder({
                character_id: Number(generatingCharacterId),
                chain_id: chainId || 1,
                token_address: FF_TOKEN_ADDRESS,
                token_symbol: 'FF',
                token_amount: MINT_PRICE_FF,
                token_amount_wei: mintPrice.toString(),
            });

            if (!mintOrderResult?.already_paid) {
                const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
                    ? 'http://localhost:8081'
                    : 'https://soulface-backend.fly.dev';
                const metadataURI = `${baseUrl}/api/nft/metadata/${generatingCharacterId}`;

                const approveTx = await writeContractAsync({
                    address: FF_TOKEN_ADDRESS as `0x${string}`,
                    abi: LAURA_AI_TOKEN_ABI,
                    functionName: 'approve',
                    args: [LAURA_AI_SOULMATE_ADDRESS as `0x${string}`, mintPrice],
                });
                await waitForTransactionReceipt(config, { hash: approveTx });
                setMintStep('awaiting_mint');

                const txHash = await writeContractAsync({
                    address: LAURA_AI_SOULMATE_ADDRESS as `0x${string}`,
                    abi: LAURA_AI_SOULMATE_ABI,
                    functionName: 'safeMint',
                    args: [address, metadataURI],
                });
                setMintStep('mint_verifying');

                const confirmed = await confirmWithRecovery(
                    String(mintOrderResult.order?.id),
                    txHash as string,
                    (id, hash) => apiClient.confirmMintOrder(id, hash)
                );
                if (!confirmed) {
                    setMintStep('mint_verifying');
                    setMintRetryMode(true);
                    startPolling(generatingCharacterId);
                    return;
                }
            }

            setMintStep('generating');
            apiClient.generateImage(generatingCharacterId).catch(() => { });
            startPolling(generatingCharacterId);
        } catch (error: any) {
            setGenerationError(toMintUserMessage(error));
            setMintStep('mint_verifying');
            setMintRetryMode(true);
        }
    };

    // 清理轮询
    useEffect(() => {
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []);

    // 与普通角色逻辑一致：若已存在已生成的 Mini Me，直接进入结果页
    useEffect(() => {
        if (!isConnected) return;
        const shouldResume = searchParams.get('resume') === '1';
        let cancelled = false;

        (async () => {
            try {
                const chars = await apiClient.getCharacters() as any[];
                const existingMiniMe = chars?.find((c: any) => c.type === 'mini_me');
                if (!cancelled && shouldResume && existingMiniMe && !(existingMiniMe.image_url || existingMiniMe.clear_image_url)) {
                    const uiState = getMiniMeUiState(existingMiniMe);
                    const charId = String(existingMiniMe.id);
                    setStep('generating');
                    setMintStep(uiState === 'generating' || uiState === 'retry_generation' ? 'generating' : 'mint_verifying');
                    setGeneratingCharacterId(charId);
                    setGenerationFailed(uiState === 'retry_generation');
                    setMintRetryMode(uiState === 'retry_mint');
                    setGenerationError(null);
                    startPolling(charId);
                    return;
                }
                const readyMiniMe = chars?.find((c: any) => c.type === 'mini_me' && (c.image_url || c.clear_image_url));
                if (!cancelled && readyMiniMe) {
                    setCharacterData({ ...readyMiniMe, id: readyMiniMe.id?.toString?.() ?? String(readyMiniMe.id) });
                    setStep('result');
                    setMintStep('idle');
                    setGenerationError(null);
                }
            } catch {
                // ignore preload errors
            }
        })();

        return () => { cancelled = true; };
    }, [isConnected, searchParams, startPolling]);

    // Recover pending mint confirmations from previous interrupted sessions.
    useEffect(() => {
        if (!isConnected) return;
        flushPendingMintConfirms((orderId, txHash) => apiClient.confirmMintOrder(orderId, txHash)).catch(() => {
            // ignore background recovery errors
        });
    }, [isConnected]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !address) return;

        setStep('generating');
        setMintStep('awaiting_approve');
        setMintRetryMode(false);
        setError(null);
        setGenerationError(null);

        try {
            // 1. Process image
            let processingFile = file;

            // Handle HEIC
            if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
                const heic2any = (await import('heic2any')).default;
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                    quality: 0.8
                });
                const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                processingFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), {
                    type: 'image/jpeg'
                });
            }

            // Compress
            const options = {
                maxSizeMB: 0.8,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
                initialQuality: 0.8,
                fileType: 'image/jpeg' as any
            };
            const compressedFile = await imageCompression(processingFile, options);

            // 2. Upload and create character
            const result = await apiClient.generateMiniMe(compressedFile);
            const character = result.character;

            if (!character?.id) throw new Error('Failed to create character');

            const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? 'http://localhost:8081'
                : 'https://soulface-backend.fly.dev';
            const metadataURI = `${baseUrl}/api/nft/metadata/${character.id}`;

            // 3. Create mint order
            const mintOrderResult = await apiClient.createMintOrder({
                character_id: Number(character.id),
                chain_id: chainId || 1,
                token_address: FF_TOKEN_ADDRESS,
                token_symbol: 'FF',
                token_amount: MINT_PRICE_FF,
                token_amount_wei: mintPrice.toString(),
            })

            const orderId = String(mintOrderResult.order?.id || '');
            if (!mintOrderResult?.already_paid && orderId) {
                // If previous payment tx exists locally for this pending order,
                // confirm it first to avoid duplicate on-chain payment.
                const pendingConfirm = getPendingMintConfirm(orderId);
                if (pendingConfirm?.txHash) {
                    const recovered = await confirmWithRecovery(
                        orderId,
                        pendingConfirm.txHash,
                        (id, hash) => apiClient.confirmMintOrder(id, hash),
                        2
                    );
                    if (recovered) {
                        setMintStep('generating');
                        setMintRetryMode(false);
                        const charId = character.id.toString();
                        setGeneratingCharacterId(charId);
                        apiClient.generateImage(charId).catch((err: any) => {
                            console.warn('Generate image request sent:', err);
                        });
                        startPolling(charId);
                        return;
                    }
                }
            }

            if (!mintOrderResult?.already_paid) {
                // 3a. Approve FF token spending (1 FF)
                const approveTx = await writeContractAsync({
                    address: FF_TOKEN_ADDRESS as `0x${string}`,
                    abi: LAURA_AI_TOKEN_ABI,
                    functionName: 'approve',
                    args: [LAURA_AI_SOULMATE_ADDRESS as `0x${string}`, mintPrice],
                });
                await waitForTransactionReceipt(config, { hash: approveTx });
                setMintStep('awaiting_mint');

                // 3b. Mint NFT
                const txHash = await writeContractAsync({
                    address: LAURA_AI_SOULMATE_ADDRESS as `0x${string}`,
                    abi: LAURA_AI_SOULMATE_ABI,
                    functionName: 'safeMint',
                    args: [address, metadataURI],
                });
                setMintStep('mint_verifying');

                // 3c. Confirm mint order
                const confirmed = await confirmWithRecovery(
                    String(mintOrderResult.order?.id),
                    txHash as string,
                    (id, hash) => apiClient.confirmMintOrder(id, hash)
                );
                if (!confirmed) {
                    // Payment sent — enter polling; backend verify worker will
                    // keep retrying and the poll loop will detect the state.
                    const charId = character.id.toString();
                    setGeneratingCharacterId(charId);
                    setMintStep('mint_verifying');
                    setMintRetryMode(true);
                    startPolling(charId);
                    return;
                }
            }

            // 4. Trigger image generation
            setMintStep('generating');
            const charId = character.id.toString();
            setGeneratingCharacterId(charId);
            setMintRetryMode(false);

            apiClient.generateImage(charId).catch((err: any) => {
                console.warn('Generate image request sent:', err);
            });

            // 5. Start polling
            startPolling(charId);

        } catch (err: any) {
            console.error('Mini Me creation failed:', err);
            if (typeof err?.message === 'string' && err.message.includes('already have a Mini Me')) {
                try {
                    const chars = await apiClient.getCharacters() as any[];
                    const existingMiniMe = chars?.find((c: any) => c.type === 'mini_me' && (c.image_url || c.clear_image_url));
                    if (existingMiniMe) {
                        setCharacterData({ ...existingMiniMe, id: existingMiniMe.id?.toString?.() ?? String(existingMiniMe.id) });
                        setStep('result');
                        setMintStep('idle');
                        setGenerationError(null);
                        return;
                    }
                } catch {
                    // fallback to default error handling
                }
            }
            setGenerationError(toMintUserMessage(err));
            setStep('intro');
            setMintStep('idle');
            setMintRetryMode(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleBack = () => {
        if (step === 'result') {
            router.push('/dashboard');
        } else {
            router.back();
        }
    };

    // Require wallet connection
    if (!isConnected) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-6">
                    <div className="p-6 liquid-glass-card rounded-3xl">
                        <img src={getAssetPath('/icons/3d/profile.png')} className="w-16 h-16 object-contain" alt="Wallet" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Connect Wallet</h2>
                    <p className="text-white max-w-md text-center">
                        Connect your Web3 wallet to create your AI Mini Me.
                    </p>
                    <ConnectButton />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                <main className="overflow-hidden min-h-[480px] relative">
                    <AnimatePresence mode="wait">
                        {/* Intro Step */}
                        {step === 'intro' && (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.35 }}
                                className="flex flex-col pb-8"
                            >
                                {/* Top Bar / Back Button */}
                                <div className="w-full flex items-center justify-start mb-8 md:mb-10">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleBack}
                                        className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5 flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back
                                    </Button>
                                </div>

                                <div className="w-full md:grid md:grid-cols-2 md:gap-16 md:items-center">
                                    {/* Left: Example image (on desktop) */}
                                    <div className="order-2 md:order-1 mb-10 md:mb-0">
                                        <div className="relative w-full max-w-sm mx-auto aspect-[3/4] rounded-3xl overflow-hidden liquid-glass-card shadow-2xl">
                                            <img
                                                src={getAssetPath('/minime.jpg')}
                                                className="w-full h-full object-cover"
                                                alt="Mini Me Example"
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Title & Interaction (on desktop) */}
                                    <div className="order-1 md:order-2 flex flex-col items-center md:items-start text-center md:text-left space-y-8">
                                        <div className="space-y-4">
                                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 leading-tight">
                                                Create Your Mini Me
                                            </h2>
                                            <p className="text-white/90 text-base sm:text-lg lg:text-xl max-w-md leading-relaxed">
                                                Transform your photo into a unique, AI-generated digital avatar NFT with just one click.
                                            </p>
                                        </div>

                                        {/* Actions & Feedback */}
                                        <div className="w-full max-w-sm space-y-6">
                                            {/* Error message */}
                                            {generationError && (
                                                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-in fade-in slide-in-from-top-1">
                                                    <div className="flex items-center gap-2 font-semibold mb-1">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        Generation Failed
                                                    </div>
                                                    {generationError}
                                                </div>
                                            )}

                                            {/* Hidden file input */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />

                                            {/* Upload & Mint Button */}
                                            <Button
                                                onClick={handleUploadClick}
                                                disabled={!address}
                                                className="enter-dashboard-btn group w-full h-16 text-xl font-bold liquid-glass-card rounded-full text-white disabled:opacity-40 disabled:cursor-not-allowed gap-3 relative overflow-hidden transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(168,85,247,0.3)] ![transition:box-shadow_0.4s_ease,scale_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
                                            >
                                                <span className="btn-gradient-layer absolute inset-0 rounded-full pointer-events-none opacity-50 transition-opacity duration-200 group-hover:opacity-75 group-active:opacity-75" aria-hidden />
                                                <span className="relative z-10 flex items-center justify-center gap-3">
                                                    <Upload className="w-6 h-6" />
                                                    <span>Upload & Mint</span>
                                                    <span className="text-sm font-medium opacity-80 bg-white/10 px-3 py-1 rounded-full">{MINT_PRICE_FF} FF</span>
                                                </span>
                                            </Button>


                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Generating Step */}
                        {step === 'generating' && (
                            <motion.div
                                key="generating"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="min-h-[600px]"
                            >
                                {isWalletMintStep(mintStep) ? (
                                    /* Waiting for wallet confirmation */
                                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center">
                                            <img src={getAssetPath('/icons/3d/gem_3d.png')} alt="" className="w-10 h-10 object-contain animate-pulse" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">{getMintStageContent(mintStep).title}</h2>
                                        <p className="text-white text-center max-w-sm">
                                            {getMintStageContent(mintStep).desc}
                                            <span className="block mt-1 text-amber-400 font-medium">Fee: {MINT_PRICE_FF} FF</span>
                                        </p>
                                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                                        {mintRetryMode && (
                                            <Button
                                                onClick={handleRetryMintForExisting}
                                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold gap-2 px-8"
                                            >
                                                <RotateCw className="w-4 h-4" />
                                                Retry Mint
                                            </Button>
                                        )}
                                    </div>
                                ) : generationError ? (
                                    /* Mint failed */
                                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center">
                                            <AlertTriangle className="w-8 h-8 text-red-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">Transaction Failed</h2>
                                        <p className="text-red-400 text-center max-w-sm">{generationError}</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setGenerationError(null);
                                                setStep('intro');
                                                setMintStep('idle');
                                            }}
                                            className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-1.5" />
                                            Back
                                        </Button>
                                    </div>
                                ) : generationFailed ? (
                                    /* Generation timed out/failed, allow retry */
                                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                        <div className="w-20 h-20 rounded-full flex items-center justify-center">
                                            <AlertTriangle className="w-10 h-10 text-amber-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">Generation Timed Out</h2>
                                        <p className="text-white text-center max-w-sm leading-relaxed">
                                            AI image generation didn&apos;t complete in time. Your Mint has been confirmed — tap Retry to regenerate at no extra cost.
                                        </p>

                                        <div className="flex items-center gap-3 pt-4">
                                            <Button
                                                onClick={handleRetryGeneration}
                                                disabled={isRetrying}
                                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold gap-2 px-8"
                                            >
                                                {isRetrying ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                ) : (
                                                    <RotateCw className="w-4 h-4" />
                                                )}
                                                {isRetrying ? 'Retrying...' : 'Retry Generation'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push('/dashboard')}
                                                className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5"
                                            >
                                                <Home className="w-4 h-4 mr-1.5" />
                                                Back to Home
                                            </Button>
                                        </div>

                                        <p className="text-xs text-white pt-2">
                                            Mint already paid · Retry is free
                                        </p>
                                    </div>
                                ) : (
                                    /* Generating in progress */
                                    <div className="flex flex-col min-h-[600px]">
                                        <div className="flex-1">
                                            <DrawingLoading characterTitle="Mini Me" />
                                        </div>

                                        <div className="flex flex-col items-center gap-3 pb-6 pt-2">
                                            <div className="flex flex-wrap items-center justify-center gap-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleManualRefresh}
                                                    className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5"
                                                >
                                                    <RefreshCw className="w-4 h-4 mr-1.5" />
                                                    Refresh
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push('/dashboard')}
                                                    className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5"
                                                >
                                                    <Home className="w-4 h-4 mr-1.5" />
                                                    Back to Home
                                                </Button>
                                            </div>
                                            <p className="text-xs text-white">
                                                Auto-refreshing every 5s · You can safely close this page
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Result Step */}
                        {step === 'result' && characterData && (
                            <SoulmateDetailPage
                                character={characterData}
                                onNext={() => router.push(`/chat/${characterData.id}`)}
                                onBack={() => router.push('/dashboard')}
                                onCharacterUpdate={setCharacterData}
                                onUnlockSuccess={() => { }}
                            />
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </AppLayout>
    );
}
