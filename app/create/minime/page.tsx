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
                    <div className="p-4 bg-white/5 rounded-full">
                        <User className="w-12 h-12 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Connect Wallet</h2>
                    <p className="text-gray-400 max-w-md text-center">
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
                        className="mb-4 text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                )}

                <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden min-h-[600px] relative">
                    
                    {/* Intro Step */}
                    {step === 'intro' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center p-8 space-y-8 h-full min-h-[600px] text-center"
                        >
                            {/* Hero Icon */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full" />
                                <div className="relative w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                                    <User className="w-16 h-16 text-white" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-3">
                                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                                    Create Your Mini Me
                                </h1>
                                <p className="text-gray-400 max-w-md">
                                    Upload a photo and our AI will create a unique digital avatar version of you. Your Mini Me can chat, evolve, and even earn rewards!
                                </p>
                            </div>

                            {/* Features */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <Camera className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-300">Upload Photo</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <Sparkles className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-300">AI Transforms</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <User className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-300">Meet Your Avatar</p>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <Button
                                size="lg"
                                onClick={handleStartUpload}
                                className="px-10 py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-500/25"
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                Upload Your Photo
                            </Button>

                            {/* Privacy Note */}
                            <p className="text-xs text-gray-500 max-w-sm">
                                Your photo is processed securely and never stored. Only the generated avatar is saved.
                            </p>
                        </motion.div>
                    )}

                    {/* Upload Step */}
                    {step === 'upload' && (
                        <MiniMeUpload
                            onComplete={handleUploadComplete}
                            onBack={handleBack}
                        />
                    )}

                    {/* Generating Step */}
                    {step === 'generating' && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[600px] space-y-6">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 text-purple-400 animate-spin" />
                                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-pink-400 animate-pulse" />
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-white">Creating Your Mini Me</h2>
                                <p className="text-gray-400">Our AI is analyzing your photo and generating your avatar...</p>
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
                            onUnlockSuccess={() => {}}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
