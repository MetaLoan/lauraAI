'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { getFullImageUrl } from '@/lib/utils';

interface Character {
    id: string;
    title: string;
    image_url?: string;
    image?: string;
    type: string;
    unlock_status?: number; // 0: Locked, 1: Half, 2: Full
}

export function SoulmateGrid() {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCharacters = async () => {
            try {
                const data = await apiClient.getCharacters() as any[];
                // Map backend data to frontend interface
                const mappedData = data.map((char) => ({
                    id: char.id.toString(),
                    title: char.title || 'Soulmate',
                    image_url: char.image_url,
                    image: char.image,
                    type: char.type,
                    unlock_status: char.unlock_status
                }));
                setCharacters(mappedData);
            } catch (error) {
                console.error('Failed to load characters:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCharacters();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (characters.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Soulmates Found</h3>
                <p className="text-gray-400 mb-6 text-center max-w-sm">
                    You haven't minted any AI soulmates yet. Create one to start your journey.
                </p>
                <Link href="/create">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                        Mint Your Soulmate
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((char) => (
                <div
                    key={char.id}
                    className="group relative bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300"
                >
                    {/* Image */}
                    <div className="aspect-[3/4] relative w-full overflow-hidden bg-gray-900">
                        {char.image_url || char.image ? (
                            <Image
                                src={getFullImageUrl(char.image_url || char.image || '')}
                                alt={char.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                <span className="text-white/20 text-4xl font-bold">{char.title.charAt(0)}</span>
                            </div>
                        )}

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                        {/* Type Badge - Top Right */}
                        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-md border border-white/30 text-white shadow-lg shadow-purple-500/50">
                            {char.type.replace('_', ' ')}
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className="text-xl font-bold text-white mb-0.5">{char.title}</h3>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] text-green-400 font-medium">Chat +5 LRA/msg</span>
                            </div>

                            {/* Bond Progress Line */}
                            <div className="w-full h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-[65%]" />
                            </div>

                            <Link href={`/chat/${char.id}`}>
                                <Button className="w-full bg-white text-black hover:bg-gray-200 font-bold py-5 text-sm uppercase tracking-wider gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Enter Space
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            ))}

            {/* Add New Card */}
            <Link href="/create" className="group flex flex-col items-center justify-center aspect-[3/4] bg-white/5 border border-white/10 border-dashed rounded-2xl hover:bg-white/10 hover:border-purple-500/50 transition-all cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-white/50 group-hover:text-white" />
                </div>
                <span className="text-gray-400 font-medium group-hover:text-white transition-colors">Mint New Soulmate</span>
            </Link>
        </div>
    );
}
