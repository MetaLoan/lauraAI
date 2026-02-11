'use client';

import React, { useState } from 'react';
import { Share2, Twitter, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
    title?: string;
    text?: string;
    url?: string;
    variant?: 'outline' | 'ghost' | 'default';
    className?: string;
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ShareButton({
    title = 'Meet my AI Soulmate on LauraAI',
    text = 'I just minted my sovereign AI companion on BSC. Start your Chat-to-Earn journey with LauraAI!',
    url = typeof window !== 'undefined' ? window.location.href : 'https://laura-ai.com',
    variant = 'outline',
    className,
    size = 'default'
}: ShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleShareClick = () => {
        // App-level share only: always show in-app modal, never trigger system share sheet
        setIsOpen(true);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareToTwitter = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&via=LauraAI_BSC`;
        window.open(twitterUrl, '_blank');
    };

    return (
        <div className="relative">
            <Button
                variant={variant}
                size={size}
                onClick={handleShareClick}
                className={cn("rounded-full border-white/10 hover:bg-white/10 text-white", className)}
            >
                <Share2 className={size === 'icon' ? "w-5 h-5" : "w-4 h-4 mr-2"} />
                {size !== 'icon' && "Share"}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-black/80 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 z-[101] shadow-[0_0_50px_rgba(168,85,247,0.3)]"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">Share LauraAI</h3>
                            <p className="text-gray-400 text-sm mb-6">Spread the word and invite others to the AI sovereign revolution.</p>

                            <div className="space-y-3">
                                <Button
                                    onClick={shareToTwitter}
                                    className="w-full bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white font-bold h-12 rounded-xl"
                                >
                                    <Twitter className="w-5 h-5 mr-3" />
                                    Share on Twitter
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={handleCopy}
                                    className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white h-12 rounded-xl"
                                >
                                    {copied ? (
                                        <Check className="w-5 h-5 mr-3 text-green-400" />
                                    ) : (
                                        <Copy className="w-5 h-5 mr-3" />
                                    )}
                                    {copied ? "Copied!" : "Copy Link"}
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                className="w-full mt-4 text-gray-500 hover:text-white"
                            >
                                Close
                            </Button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
