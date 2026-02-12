'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Send, ArrowLeft, Loader2, Sparkles, MessageSquarePlus } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { getFullImageUrl } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { ChatMessage, TypingIndicator } from '@/components/chat/chat-message-bubble';
import { motion, AnimatePresence } from 'framer-motion';
// Assuming the utility `cn` is globally available or you imported it
// If not, we might need to inline logic or ensure it's imported correctly in msg component.

// Update Message Interface
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

interface Character {
    id: string;
    title: string;
    image_url?: string;
    image?: string;
    type: string;
}

export default function ChatPageClient({ characterId }: { characterId: string }) {
    const router = useRouter();
    const { isConnected } = useAccount();

    const [character, setCharacter] = useState<Character | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [messagesLoaded, setMessagesLoaded] = useState(false);
    const [lraBalance, setLraBalance] = useState(0);
    const [showEarned, setShowEarned] = useState(false);

    const [isSending, setIsSending] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [dailyUsed, setDailyUsed] = useState(0);
    const [dailyLimit, setDailyLimit] = useState(10);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);
    const isLimitReached = dailyRemaining <= 0;

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profile = await apiClient.getUserProfile();
                if (profile) setLraBalance(profile.lra_balance ?? 0);
            } catch (e) {
                console.error('Failed to load points:', e);
            }
        };
        const loadDailyLimit = async () => {
            try {
                const result = await apiClient.getDailyLimit() as any;
                if (result) {
                    setDailyUsed(result.used ?? 0);
                    setDailyLimit(result.limit ?? 10);
                }
            } catch (e) {
                console.error('Failed to load daily limit:', e);
            }
        };
        loadProfile();
        loadDailyLimit();
    }, []);

    // Use `useEffect` to scroll whenever messages length or content changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, isStreaming]);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Character Info
                const charData = await apiClient.getCharacter(characterId);
                setCharacter(charData as unknown as Character);

                // 2. Fetch Messages
                const history = await apiClient.getMessages(characterId, 50) as any[];
                const reversedHistory = [...history].reverse();

                setMessages(reversedHistory.map((msg, idx) => ({
                    id: idx, // In real app use unique ID from DB
                    type: msg.sender_type === 'user' ? 'user' : 'character',
                    text: msg.content,
                    timestamp: new Date(msg.created_at),
                    isStreaming: false,
                })));

                setMessagesLoaded(true);
            } catch (error) {
                console.error('Failed to load chat data:', error);
                const message = error instanceof Error ? error.message : '';
                if (message.includes('Complete Mint') || message.includes('not ready for chat') || message.includes('Mint is not confirmed')) {
                    router.push('/create');
                    return;
                }
            } finally {
                setLoading(false);
            }
        };

        if (characterId) {
            fetchData();
        }
    }, [characterId]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !characterId || isSending || isStreaming || isLimitReached) return;

        const userMessage = inputValue.trim();
        setInputValue('');

        // Set 'Thinking' state
        setIsSending(true);

        // Optimistic Update
        const userMsgObj: Message = {
            id: Date.now(),
            type: 'user',
            text: userMessage,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsgObj]);

        // Sync Earning (adds directly to lra_balance)
        const earnAmount = 5;
        const syncResult = await apiClient.syncPoints(earnAmount);
        if (syncResult) {
            setLraBalance(syncResult.lra_balance ?? lraBalance + earnAmount);
        }
        setDailyUsed(prev => prev + 1);
        setShowEarned(true);
        setTimeout(() => setShowEarned(false), 2000);

        try {
            const url = `${apiClient.baseURL}/characters/${characterId}/chat`;

            const authToken = sessionStorage.getItem('auth_token') || '';

            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            };

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message: userMessage }),
            });

            if (!response.ok) throw new Error('Failed to send');

            // Add placeholder bot message
            const botMsgId = Date.now() + 1;

            // We start streaming now, so remove 'Thinking' state
            setIsSending(false);
            setIsStreaming(true);

            // Add initial empty bot bubble
            setMessages(prev => [...prev, {
                id: botMsgId,
                type: 'character',
                text: '',
                timestamp: new Date(),
                isStreaming: true,
            }]);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let botResponse = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.chunk) {
                                    botResponse += parsed.chunk;
                                    // Update the specific message
                                    setMessages(prev => prev.map(msg =>
                                        msg.id === botMsgId ? { ...msg, text: botResponse } : msg
                                    ));
                                }
                            } catch (e) { }
                        }
                    }
                }
            }

            // Finished streaming
            setMessages(prev => prev.map(msg =>
                msg.id === botMsgId ? { ...msg, isStreaming: false } : msg
            ));

        } catch (error) {
            console.error('Send failed:', error);
            // 不再用假数据：直接提示失败，避免用户误以为 AI 在回复
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'character',
                text: '⚠️ Send failed. Please check your network and try again.',
                timestamp: new Date(),
                isStreaming: false,
            }]);
        } finally {
            setIsSending(false);
            setIsStreaming(false);
        }
    };

    if (!character && loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex flex-col h-[calc(100vh-188px)] md:h-[calc(100vh-144px)] max-w-4xl mx-auto w-full liquid-glass-card rounded-2xl overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 glass-bar rounded-none z-10 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/dashboard')}
                                className="flex-shrink-0 rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1.5" />
                                Back
                            </Button>
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-purple-500/30 flex-shrink-0">
                            {character?.image_url || character?.image ? (
                                <Image
                                    src={getFullImageUrl(character?.image_url || character?.image || '')}
                                    alt={character?.title || 'AI'}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold">
                                    {character?.title?.charAt(0) || 'AI'}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-semibold text-base leading-tight text-white truncate">{character?.title || 'AI Soulmate'}</h2>
                            <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-medium tracking-wide uppercase">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)] flex-shrink-0" />
                                Online
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        <span className="text-[10px] font-medium text-white whitespace-nowrap">{Math.floor(lraBalance)} LRA Earned</span>
                        <span className={`text-[10px] font-semibold uppercase tracking-widest ${isLimitReached ? 'text-red-400' : 'text-white'}`}>{dailyRemaining}/{dailyLimit} msgs</span>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-6 scroll-smooth scrollbar-hide">
                    {messages.length === 0 && messagesLoaded && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-white px-8 animate-in fade-in zoom-in duration-500">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <MessageSquarePlus className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-lg font-medium text-white">Start a conversation</p>
                            <p className="text-sm mt-1 text-white">Your soulmate is waiting to connect with you.</p>
                            <div className="mt-8 text-xs px-3 py-1 bg-purple-500/10 text-white rounded-full border border-purple-500/20">
                                Earn +5 LRA per Message
                            </div>
                        </div>
                    )}

                    {messages.map((msg, index) => (
                        <div
                            key={msg.id}
                            className={`flex w-full ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                            {/* Use Custom Message Bubble Component */}
                            <ChatMessage
                                message={msg}
                                isLast={index === messages.length - 1}
                            />
                        </div>
                    ))}

                    {/* Thinking Indicator */}
                    {isSending && (
                        <TypingIndicator />
                    )}

                    <div ref={messagesEndRef} className="h-4 w-full" />
                </div>

                {/* Input Area - 无渐变，不遮挡内容 */}
                <div className="px-4 pb-4 pt-2 flex-shrink-0 z-20">
                    {isLimitReached ? (
                        <div className="text-center py-4 px-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                            <p className="text-red-300 font-medium text-sm">Daily message limit reached ({dailyLimit}/{dailyLimit})</p>
                            <p className="text-white text-xs mt-1">Come back tomorrow for more conversations!</p>
                        </div>
                    ) : (
                    <div className="relative group p-1 rounded-[28px]">
                        <div className="flex gap-2 liquid-glass-card rounded-[26px] p-1.5 pl-4 items-center">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent text-white placeholder:text-white text-sm focus:outline-none min-h-[44px]"
                                disabled={isSending || isStreaming}
                                autoFocus
                            />

                            <Button
                                size="icon"
                                className={`rounded-full w-10 h-10 transition-all duration-300 ${inputValue.trim()
                                    ? 'bg-white text-black hover:bg-white/90 hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isSending || isStreaming}
                            >
                                {isSending || isStreaming ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                ) : (
                                    <Send className="w-4 h-4 ml-0.5" />
                                )}
                            </Button>
                        </div>
                    </div>
                    )}

                    {/* Floating Earn Animation */}
                    <AnimatePresence>
                        {showEarned && (
                            <motion.div
                                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                                animate={{ opacity: 1, y: -50, scale: 1.2 }}
                                exit={{ opacity: 0, y: -80 }}
                                className="absolute right-10 bottom-20 pointer-events-none"
                            >
                                <div className="flex items-center gap-1 text-green-400 font-bold text-xl drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]">
                                    +5 LRA
                                    <Sparkles className="w-5 h-5" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </AppLayout >
    );
}

// In-file implementation to ensure component availability without creating new file if preferred,
// BUT above I created components/chat/chat-message-bubble.tsx so I will use that.
// The default export above correctly uses the imported components.
