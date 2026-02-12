'use client';

import React, { MouseEvent, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

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

    const handleShareClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
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
                type="button"
                onClick={handleShareClick}
                className={cn("rounded-full border-white/10 hover:bg-white/10 text-white", className)}
            >
                <img src="/icons/3d/share_3d.png" className={size === 'icon' ? "w-5 h-5 object-contain" : "w-4 h-4 object-contain mr-2"} alt="" />
                {size !== 'icon' && "Share"}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    typeof window !== 'undefined' ? createPortal(
                        <>
                            {/* Oversized blur layer (+20%) to avoid edge leakage */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed -inset-[20%] bg-black/30 backdrop-blur-xl z-[1200]"
                            />

                            {/* Strict viewport-centered modal */}
                            <div className="fixed inset-0 z-[1201] flex items-center justify-center p-4 pointer-events-none">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    onClick={(event) => event.stopPropagation()}
                                    className="w-[90%] max-w-sm liquid-glass-card rounded-3xl p-6 pointer-events-auto"
                                >
                                    <h3 className="text-xl font-bold text-white mb-2">Share LauraAI</h3>
                                    <p className="text-white text-sm mb-6">Spread the word and invite others to the AI sovereign revolution.</p>

                                    <div className="space-y-3">
                                        <Button
                                            type="button"
                                            onClick={shareToTwitter}
                                            className="w-full bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white font-bold h-12 rounded-xl gap-3"
                                        >
                                            <img src="/icons/3d/share_3d.png" className="w-5 h-5 object-contain" alt="" />
                                            Share on Twitter
                                        </Button>

                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={handleCopy}
                                            className="w-full bg-white/5 border border-white/20 hover:bg-white/10 text-white h-12 rounded-xl gap-3"
                                        >
                                            {copied ? (
                                                <Check className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <img src="/icons/3d/copy_3d.png" className="w-5 h-5 object-contain" alt="" />
                                            )}
                                            {copied ? "Copied!" : "Copy Link"}
                                        </Button>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full mt-4 text-white hover:text-white"
                                    >
                                        Close
                                    </Button>
                                </motion.div>
                            </div>
                        </>,
                        document.body
                    ) : null
                )}
            </AnimatePresence>
        </div>
    );
}
