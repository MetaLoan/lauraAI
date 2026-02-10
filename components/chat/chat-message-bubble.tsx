'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, Clock, TrendingUp, Shield, Zap, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Message {
    id: number;
    type: 'user' | 'character';
    text: string;
    timestamp: Date;
    isStreaming?: boolean;
    insight?: {
        type: 'yield' | 'market' | 'risk';
        title: string;
        value: string;
        label: string;
        actionText: string;
    };
}

interface ChatMessageProps {
    message: Message;
    isLast: boolean;
    onAction?: (insight: any) => void;
}

export function ChatMessage({ message, isLast, onAction }: ChatMessageProps) {
    const [copied, setCopied] = useState(false);
    const [displayedText, setDisplayedText] = useState('');

    // Typewriter effect logic for streaming messages
    useEffect(() => {
        if (message.type === 'character' && message.isStreaming) {
            // If streaming, update displayed text to match message.text (assuming stream handles pace)
            // OR implement smoothing here. For now, let's sync directly but allow CSS cursor
            setDisplayedText(message.text);
        } else {
            setDisplayedText(message.text);
        }
    }, [message.text, message.type, message.isStreaming]);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isUser = message.type === 'user';

    return (
        <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[85%] md:max-w-[75%] relative group",
                    isUser ? "items-end" : "items-start"
                )}
            >
                {/* Message Bubble */}
                <div
                    className={cn(
                        "px-5 py-3.5 rounded-2xl text-sm md:text-base shadow-sm leading-relaxed whitespace-pre-wrap break-words",
                        isUser
                            ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-sm"
                            : "bg-white/10 text-gray-100 rounded-bl-sm border border-white/5 backdrop-blur-sm"
                    )}
                >
                    {/* Text Content */}
                    <span className={cn(
                        !isUser && isLast && message.isStreaming && "after:content-['|'] after:ml-0.5 after:animate-pulse after:text-purple-400"
                    )}>
                        {displayedText}
                    </span>

                    {/* Rich Insight Card */}
                    {!isUser && message.insight && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mt-4 p-4 rounded-xl bg-black/40 border border-white/10 overflow-hidden relative group/card"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/card:opacity-20 transition-opacity">
                                {message.insight.type === 'yield' && <Zap className="w-12 h-12 text-yellow-400" />}
                                {message.insight.type === 'market' && <TrendingUp className="w-12 h-12 text-green-400" />}
                                {message.insight.type === 'risk' && <Shield className="w-12 h-12 text-red-400" />}
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
                                    message.insight.type === 'yield' && "bg-yellow-500/20 text-yellow-400",
                                    message.insight.type === 'market' && "bg-green-500/20 text-green-400",
                                    message.insight.type === 'risk' && "bg-red-500/20 text-red-400"
                                )}>
                                    {message.insight.type}
                                </span>
                                <span className="text-xs font-semibold text-white/90">{message.insight.title}</span>
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-xl font-bold text-white leading-none">{message.insight.value}</div>
                                    <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight">{message.insight.label}</div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => onAction?.(message.insight)}
                                    className="bg-white text-black hover:bg-gray-200 h-8 rounded-lg text-xs gap-1.5 group/btn"
                                >
                                    {message.insight.actionText}
                                    <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Timestamp & Actions Row */}
                    <div className={cn(
                        "flex items-center gap-2 mt-1.5 opacity-60 text-[10px] select-none",
                        isUser ? "justify-end text-purple-100" : "justify-start text-gray-400"
                    )}>
                        <span>
                            {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(message.timestamp))}
                        </span>
                    </div>
                </div>

                {/* Action Buttons (Visible on Hover) */}
                <button
                    onClick={handleCopy}
                    className={cn(
                        "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-black/40 text-white/80 hover:bg-black/60",
                        isUser ? "-left-10" : "-right-10"
                    )}
                    title="Copy message"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
            </div>
        </div>
    );
}

export function TypingIndicator() {
    return (
        <div className="flex justify-start w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white/10 border border-white/5 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 min-w-[60px]">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
            </div>
        </div>
    );
}
