'use client';

import React, { MouseEvent, useEffect, useRef, useState } from 'react';
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
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        const trigger = wrapperRef.current?.querySelector('[data-slot="button"]') as HTMLButtonElement | null;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        setPosition({
            top: rect.top - 12,
            left: rect.left + rect.width / 2
        });
    };

    useEffect(() => {
        if (!isOpen) return;
        updatePosition();

        const handleClickOutside = (event: globalThis.MouseEvent) => {
            const target = event.target as Node;
            const trigger = wrapperRef.current?.querySelector('[data-slot="button"]') as HTMLButtonElement | null;
            const clickedTrigger = trigger?.contains(target);
            const clickedPopover = popoverRef.current?.contains(target);
            if (!clickedTrigger && !clickedPopover) {
                setIsOpen(false);
            }
        };

        const handleViewportChange = () => updatePosition();

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('scroll', handleViewportChange, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('scroll', handleViewportChange, true);
        };
    }, [isOpen]);

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
        <div className="relative inline-flex shrink-0" ref={wrapperRef}>
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
                    createPortal(
                        <motion.div
                            ref={popoverRef}
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="fixed z-[1400] w-[280px] -translate-x-1/2 -translate-y-full liquid-glass-card rounded-2xl p-4"
                            style={{ top: `${position.top}px`, left: `${position.left}px` }}
                        >
                            <h3 className="text-base font-bold text-white mb-1">Share LauraAI</h3>
                            <p className="text-white/90 text-xs mb-3">Spread the word and invite others.</p>

                            <div className="space-y-2">
                                <Button
                                    type="button"
                                    onClick={shareToTwitter}
                                    className="w-full bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white font-bold h-10 rounded-xl gap-2"
                                >
                                    <img src="/icons/3d/share_3d.png" className="w-4 h-4 object-contain" alt="" />
                                    Share on Twitter
                                </Button>

                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={handleCopy}
                                    className="w-full bg-white/5 border border-white/20 hover:bg-white/10 text-white h-10 rounded-xl gap-2"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <img src="/icons/3d/copy_3d.png" className="w-4 h-4 object-contain" alt="" />
                                    )}
                                    {copied ? "Copied!" : "Copy Link"}
                                </Button>
                            </div>
                        </motion.div>,
                        document.body
                    )
                )}
            </AnimatePresence>
        </div>
    );
}
