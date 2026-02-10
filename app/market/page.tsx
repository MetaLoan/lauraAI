'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { apiClient } from '@/lib/api';
import Image from 'next/image';
import { Loader2, Search, Filter, ShoppingBag, Heart, Sparkles, Plus, X, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { LAURA_AI_MARKETPLACE_ABI, LAURA_AI_MARKETPLACE_ADDRESS, LAURA_AI_SOULMATE_ABI, LAURA_AI_SOULMATE_ADDRESS } from '@/lib/contracts';
import { motion, AnimatePresence } from 'framer-motion';
import { getFullImageUrl } from '@/lib/utils';

interface MarketItem {
    id: string;
    title: string;
    image_url: string;
    type: string;
    price: string;
    list_price?: number;
    rarity: string;
    likes: number;
    on_chain_token_id?: number;
}

type TransactionState = 'idle' | 'approving' | 'buying' | 'confirming' | 'success' | 'error';

export default function MarketPage() {
    const [items, setItems] = useState<MarketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
    const [txState, setTxState] = useState<TransactionState>('idle');
    const [txHash, setTxHash] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState('');
    const { isConnected, address } = useAccount();
    const { writeContractAsync } = useWriteContract();

    useEffect(() => {
        fetchMarket();
    }, []);

    const fetchMarket = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getMarketCharacters();
            setItems(data as MarketItem[]);
        } catch (error) {
            console.error('Failed to load market:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (item: MarketItem) => {
        if (!isConnected || !address) {
            alert("Please connect wallet first!");
            return;
        }

        setSelectedItem(item);
        setTxState('buying');
        setErrorMessage('');

        try {
            // Get the price - either from list_price or parse from price string
            const priceInBNB = item.list_price || parseFloat(item.price.replace(' BNB', ''));
            const priceWei = parseEther(priceInBNB.toString());

            // Call marketplace contract to buy item
            const tokenId = item.on_chain_token_id || parseInt(item.id);

            const hash = await writeContractAsync({
                address: LAURA_AI_MARKETPLACE_ADDRESS as `0x${string}`,
                abi: LAURA_AI_MARKETPLACE_ABI,
                functionName: 'buyItem',
                args: [BigInt(tokenId)],
                value: priceWei,
            });

            setTxHash(hash);
            setTxState('confirming');

            // Notify backend about purchase
            await apiClient.purchaseCharacter(item.id);

            setTxState('success');

            // Refresh market after successful purchase
            setTimeout(() => {
                fetchMarket();
                setSelectedItem(null);
                setTxState('idle');
            }, 3000);

        } catch (error: any) {
            console.error('Purchase failed:', error);
            setTxState('error');
            setErrorMessage(error.message || 'Transaction failed. Please try again.');
        }
    };

    const handleCloseModal = () => {
        if (txState !== 'buying' && txState !== 'confirming') {
            setSelectedItem(null);
            setTxState('idle');
            setErrorMessage('');
        }
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity?.toLowerCase()) {
            case 'legendary': return 'text-orange-400 border-orange-500/50 bg-orange-500/10';
            case 'rare': return 'text-purple-400 border-purple-500/50 bg-purple-500/10';
            case 'uncommon': return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
            default: return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
        }
    };

    const filteredItems = items.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-8 h-8 text-purple-400" />
                            Soulmate Market
                        </h1>
                        <p className="text-gray-400 mt-2">Discover and bond with unique AI personalities.</p>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search traits..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 w-full md:w-64"
                            />
                        </div>
                        <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white">
                            <Filter className="w-4 h-4 mr-2" /> Filter
                        </Button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">Listed:</span>
                        <span className="text-white font-semibold">{items.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">Floor:</span>
                        <span className="text-white font-semibold">
                            {items.length > 0 
                                ? `${Math.min(...items.map(i => i.list_price || parseFloat(i.price.replace(' BNB', '')) || 0)).toFixed(2)} BNB`
                                : 'N/A'
                            }
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">Volume:</span>
                        <span className="text-white font-semibold">12.5 BNB</span>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20">
                        <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Items Found</h3>
                        <p className="text-gray-400">
                            {searchQuery ? 'Try a different search term' : 'No items listed on the market yet'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                        {filteredItems.map((item) => (
                            <div key={item.id} className="group bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1">
                                {/* Image */}
                                <div className="relative aspect-[3/4] overflow-hidden">
                                    <Image
                                        src={getFullImageUrl(item.image_url)}
                                        alt={item.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />

                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 text-white border border-white/10">
                                        <Heart className="w-3 h-3 text-red-500 fill-red-500" /> {item.likes || 0}
                                    </div>

                                    {item.rarity && (
                                        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getRarityColor(item.rarity)}`}>
                                            {item.rarity}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4 relative">
                                    <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                                    <p className="text-xs text-gray-400 mb-4 capitalize">{item.type} Archetype</p>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                                        <span className="text-lg font-bold text-white">{item.price}</span>
                                        <Button
                                            size="sm"
                                            className="bg-white text-black hover:bg-gray-200 font-semibold"
                                            onClick={() => handlePurchase(item)}
                                            disabled={!isConnected}
                                        >
                                            <ShoppingBag className="w-4 h-4 mr-1.5" /> Buy
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Transaction Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">
                                    {txState === 'success' ? 'Purchase Complete!' : 'Confirm Purchase'}
                                </h3>
                                <button
                                    onClick={handleCloseModal}
                                    disabled={txState === 'buying' || txState === 'confirming'}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors disabled:opacity-50"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Item Preview */}
                                <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden relative">
                                        <Image
                                            src={getFullImageUrl(selectedItem.image_url)}
                                            alt={selectedItem.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-semibold">{selectedItem.title}</h4>
                                        <p className="text-gray-400 text-sm capitalize">{selectedItem.type}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold">{selectedItem.price}</p>
                                        <p className="text-gray-500 text-xs">+ gas</p>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="space-y-3">
                                    {txState === 'buying' && (
                                        <div className="flex items-center gap-3 text-yellow-400">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Confirm transaction in wallet...</span>
                                        </div>
                                    )}

                                    {txState === 'confirming' && (
                                        <div className="flex items-center gap-3 text-blue-400">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Confirming on blockchain...</span>
                                        </div>
                                    )}

                                    {txState === 'success' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-green-400">
                                                <Check className="w-5 h-5" />
                                                <span>Transaction confirmed!</span>
                                            </div>
                                            {txHash && (
                                                <a
                                                    href={`https://bscscan.com/tx/${txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    View on BSCScan
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {txState === 'error' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-red-400">
                                                <X className="w-5 h-5" />
                                                <span>Transaction failed</span>
                                            </div>
                                            <p className="text-gray-400 text-sm">{errorMessage}</p>
                                            <Button
                                                onClick={() => handlePurchase(selectedItem)}
                                                className="w-full bg-white text-black hover:bg-gray-200"
                                            >
                                                Try Again
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Platform Fee Notice */}
                                {txState !== 'success' && txState !== 'error' && (
                                    <p className="text-center text-xs text-gray-500">
                                        2.5% platform fee applies to all purchases
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
