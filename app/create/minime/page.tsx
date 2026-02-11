'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import MiniMeUpload from '@/components/mini-me-upload';
import SoulmateDetailPage from '@/components/soulmate-detail-page';
import { ArrowLeft, Camera, Sparkles, User, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@/components/wallet-button';
import { motion } from 'framer-motion';

type Step = 'intro' | 'upload' | 'generating' | 'result';

export default function CreateMiniMePage() {
    const router = useRouter();
    const { isConnected } = useAccount();
    const [step, setStep] = useState<Step>('intro');
    const [characterData, setCharacterData] = useState<any>(null);

    const handleUploadComplete = (data: any) => {
        setCharacterData(data);
        setStep('result');
    };

    const handleStartUpload = () => {
        setStep('upload');
    };

    const handleBack = () => {
        if (step === 'upload') {
            setStep('intro');
        } else if (step === 'result') {
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
                        <img src="/icons/3d/profile.png" className="w-16 h-16 object-contain" alt="Wallet" />
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
            <div className="max-w-2xl mx-auto w-full">
                {/* Back Button */}
                {step !== 'result' && (
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="mb-4 text-white hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                )}

                <div className="liquid-glass-card rounded-2xl overflow-hidden min-h-[600px] relative">

                    {/* Intro Step */}
                    {step === 'intro' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center p-8 space-y-8 h-full min-h-[600px] text-center"
                        >
                            {/* Hero Icon */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500/30 blur-[60px] rounded-full animate-pulse" />
                                <div className="relative w-40 h-40 rounded-3xl liquid-glass-card flex items-center justify-center">
                                    <img src="/icons/3d/profile.png" className="w-24 h-24 object-contain" alt="User" />
                                </div>
                                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-xl">
                                    <img src="/icons/3d/sparkles.png" className="w-10 h-10 object-contain" alt="Sparkles" />
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-3">
                                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                                    Create Your Mini Me
                                </h1>
                                <p className="text-white max-w-md">
                                    Upload a photo and our AI will create a unique digital avatar version of you. Your Mini Me can chat, evolve, and even earn rewards!
                                </p>
                            </div>

                            {/* Features */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg">
                                <div className="liquid-glass-card rounded-2xl p-4 flex flex-col items-center">
                                    <img src="/icons/3d/camera_3d.png" className="w-10 h-10 object-contain mb-3" alt="Camera" />
                                    <p className="text-xs font-bold text-white">Upload Photo</p>
                                </div>
                                <div className="liquid-glass-card rounded-2xl p-4 flex flex-col items-center">
                                    <img src="/icons/3d/sparkles.png" className="w-10 h-10 object-contain mb-3" alt="AI" />
                                    <p className="text-xs font-bold text-white">AI Transforms</p>
                                </div>
                                <div className="liquid-glass-card rounded-2xl p-4 flex flex-col items-center">
                                    <img src="/icons/3d/profile.png" className="w-10 h-10 object-contain mb-3" alt="Avatar" />
                                    <p className="text-xs font-bold text-white">Meet Your Avatar</p>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <Button
                                size="lg"
                                onClick={handleStartUpload}
                                className="px-10 py-7 text-lg bg-gradient-to-r from-purple-600/90 to-pink-600/90 hover:from-purple-600 hover:to-pink-600 text-white font-black shadow-xl shadow-purple-500/20 gap-3 rounded-2xl border border-white/10 backdrop-blur-sm transition-all hover:scale-[1.02]"
                            >
                                <img src="/icons/3d/camera_3d.png" className="w-8 h-8 object-contain" alt="Upload" />
                                Upload & Transform
                            </Button>

                            {/* Privacy Note */}
                            <p className="text-xs text-white max-w-sm">
                                Your photo is processed securely and never stored. Only the generated avatar is saved.
                            </p>
                        </motion.div>
                    )}

                    {/* Upload Step */}
                    {step === 'upload' && (
                        <MiniMeUpload
                            onNext={handleUploadComplete}
                            onBack={handleBack}
                        />
                    )}

                    {/* Generating Step */}
                    {step === 'generating' && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[600px] space-y-6">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 text-white animate-spin" />
                                <img src="/icons/3d/sparkles.png" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 object-contain animate-pulse" alt="Generating" />
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-white">Creating Your Mini Me</h2>
                                <p className="text-white">Our AI is analyzing your photo and generating your avatar...</p>
                            </div>
                            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 30, ease: 'linear' }}
                                />
                            </div>
                        </div>
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
                </div>
            </div>
        </AppLayout>
    );
}
