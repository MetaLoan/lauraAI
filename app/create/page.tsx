'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { Loader2, ArrowLeft, Check, Sparkles, ChevronRight, User, Heart, Users, Baby, Crown, Compass, BookOpen, Ghost, Star, Moon, X, Gem } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@/components/wallet-button';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import Image from 'next/image';
import { getFullImageUrl } from '@/lib/utils';
import SoulmateDetailPage from '@/components/soulmate-detail-page';
import DrawingLoading from '@/components/drawing-loading';
import { LAURA_AI_SOULMATE_ABI, LAURA_AI_SOULMATE_ADDRESS } from '@/lib/contracts';

// ============ 预设角色类型定义 ============
interface PresetType {
    type: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    bgGlow: string;
    presetImage?: string;
}

const PRESET_TYPES: PresetType[] = [
    {
        type: 'girlfriend',
        label: 'AI Girlfriend',
        description: 'Sweet and caring companion who truly understands you',
        icon: <Heart className="w-7 h-7" />,
        gradient: 'from-pink-500 to-rose-600',
        bgGlow: 'bg-pink-500/10',
        presetImage: '/presets/girlfriend.jpg',
    },
    {
        type: 'boyfriend',
        label: 'AI Boyfriend',
        description: 'Warm, charming partner always by your side',
        icon: <Star className="w-7 h-7" />,
        gradient: 'from-blue-500 to-indigo-600',
        bgGlow: 'bg-blue-500/10',
        presetImage: '/presets/boyfriend.jpg',
    },
    {
        type: 'best_friend',
        label: 'Best Friend',
        description: 'Your ride-or-die, the one you tell everything to',
        icon: <Users className="w-7 h-7" />,
        gradient: 'from-amber-500 to-orange-600',
        bgGlow: 'bg-amber-500/10',
        presetImage: '/presets/best_friend.jpg',
    },
    {
        type: 'soulmate',
        label: 'Soulmate',
        description: 'Your destined other half, a bond beyond time',
        icon: <Sparkles className="w-7 h-7" />,
        gradient: 'from-purple-500 to-violet-600',
        bgGlow: 'bg-purple-500/10',
        presetImage: '/presets/soulmate.jpg',
    },
    {
        type: 'future_baby',
        label: 'Future Baby',
        description: 'A glimpse of your future child',
        icon: <Baby className="w-7 h-7" />,
        gradient: 'from-green-400 to-emerald-600',
        bgGlow: 'bg-green-500/10',
        presetImage: '/presets/future_baby.jpg',
    },
    {
        type: 'future_wife',
        label: 'Future Wife',
        description: 'Elegant, wise partner for life',
        icon: <Crown className="w-7 h-7" />,
        gradient: 'from-rose-400 to-pink-600',
        bgGlow: 'bg-rose-500/10',
        presetImage: '/presets/future_wife.jpg',
    },
    {
        type: 'future_husband',
        label: 'Future Husband',
        description: 'Mature, dependable soulmate',
        icon: <Crown className="w-7 h-7" />,
        gradient: 'from-slate-400 to-zinc-600',
        bgGlow: 'bg-slate-500/10',
        presetImage: '/presets/future_husband.jpg',
    },
    {
        type: 'companion',
        label: 'Companion',
        description: 'Warm, reliable travel partner for life',
        icon: <Compass className="w-7 h-7" />,
        gradient: 'from-teal-500 to-cyan-600',
        bgGlow: 'bg-teal-500/10',
        presetImage: '/presets/companion.jpg',
    },
    {
        type: 'wise_mentor',
        label: 'Wise Mentor',
        description: 'Knowledgeable guide for life',
        icon: <BookOpen className="w-7 h-7" />,
        gradient: 'from-yellow-500 to-amber-600',
        bgGlow: 'bg-yellow-500/10',
        presetImage: '/presets/wise_mentor.jpg',
    },
    {
        type: 'dream_guide',
        label: 'Dream Guide',
        description: 'Mysterious guide across time and dreams',
        icon: <Moon className="w-7 h-7" />,
        gradient: 'from-indigo-500 to-purple-700',
        bgGlow: 'bg-indigo-500/10',
        presetImage: '/presets/dream_guide.jpg',
    },
    {
        type: 'mysterious_stranger',
        label: 'Mysterious Stranger',
        description: 'A fateful unknown encounter',
        icon: <Ghost className="w-7 h-7" />,
        gradient: 'from-gray-500 to-zinc-700',
        bgGlow: 'bg-gray-500/10',
        presetImage: '/presets/mysterious_stranger.jpg',
    },
];

// ============ Gender options ============
const GENDER_OPTIONS = [
    { value: 'Female', label: 'Female', emoji: '👩' },
    { value: 'Male', label: 'Male', emoji: '👨' },
    { value: 'Other', label: 'Other', emoji: '🌈' },
];

// ============ Ethnicity options ============
const ETHNICITY_OPTIONS = [
    { value: 'East Asian', label: 'East Asian', emoji: '🌸' },
    { value: 'South Asian', label: 'South Asian', emoji: '🪷' },
    { value: 'Southeast Asian', label: 'Southeast Asian', emoji: '🌺' },
    { value: 'White', label: 'White/European', emoji: '🏔️' },
    { value: 'Black/African', label: 'Black/African', emoji: '🌍' },
    { value: 'Hispanic/Latino', label: 'Hispanic/Latino', emoji: '🌮' },
    { value: 'Middle Eastern', label: 'Middle Eastern', emoji: '🕌' },
    { value: 'Indigenous', label: 'Indigenous', emoji: '🪶' },
    { value: 'Mixed', label: 'Mixed', emoji: '🌎' },
];

// ============ 步骤类型 ============
type StepType = 'profile' | 'preset' | 'gender' | 'ethnicity' | 'generating' | 'result';

export default function CreatePage() {
    const router = useRouter();
    const { isConnected, address } = useAccount();
    const { writeContractAsync } = useWriteContract();

    // Read mint price from contract
    const { data: mintPriceRaw } = useReadContract({
        address: LAURA_AI_SOULMATE_ADDRESS as `0x${string}`,
        abi: LAURA_AI_SOULMATE_ABI,
        functionName: 'mintPrice',
    });
    const mintPrice = mintPriceRaw ? BigInt(mintPriceRaw.toString()) : BigInt(0);
    const mintPriceDisplay = mintPrice > 0 ? formatEther(mintPrice) : '0';

    // Mint state
    const [mintStep, setMintStep] = useState<'idle' | 'minting' | 'generating' | 'done'>('idle');

    // 步骤状态
    const [currentStep, setCurrentStep] = useState<StepType>('preset');
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileComplete, setProfileComplete] = useState(false);

    // 用户资料（首次填写）
    const [profileData, setProfileData] = useState({
        name: '',
        gender: '',
        birthDate: '',
        birthTime: '',
        birthPlace: '',
        ethnicity: '',
    });

    // 角色创建数据
    const [selectedType, setSelectedType] = useState<string>('');
    const [soulmateGender, setSoulmateGender] = useState('');
    const [soulmateEthnicity, setSoulmateEthnicity] = useState('');

    // 已创建的角色列表（用于标记"已创建"）
    const [existingTypes, setExistingTypes] = useState<string[]>([]);
    // 已创建角色的完整数据（用于点击跳转详情弹窗）
    const [existingCharacters, setExistingCharacters] = useState<any[]>([]);
    // 详情弹窗中选中的角色
    const [selectedCharacterForDetail, setSelectedCharacterForDetail] = useState<any>(null);

    // 生成状态
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [createdCharacter, setCreatedCharacter] = useState<any>(null);

    // 加载用户资料
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profile = await apiClient.getMe() as any;
                const hasProfile = !!(profile?.name && profile?.gender && profile?.birth_date && profile?.ethnicity);
                setProfileComplete(hasProfile);

                if (profile) {
                    setProfileData({
                        name: profile.name || '',
                        gender: profile.gender || '',
                        birthDate: profile.birth_date ? profile.birth_date.split('T')[0] : '',
                        birthTime: profile.birth_time || '',
                        birthPlace: profile.birth_place || '',
                        ethnicity: profile.ethnicity || '',
                    });
                }

                // Load existing characters (only those with images count as "created")
                const characters = await apiClient.getCharacters() as any[];
                if (characters && Array.isArray(characters)) {
                    const created = characters.filter((c: any) => c.image_url && c.image_url !== '');
                    setExistingTypes(created.map((c: any) => c.type));
                    setExistingCharacters(created.map((c: any) => ({ ...c, id: c.id?.toString?.() ?? String(c.id) })));
                }

                // 如果资料不完整，先填资料
                setCurrentStep(hasProfile ? 'preset' : 'profile');
            } catch (error) {
                console.error('Failed to load profile:', error);
                setCurrentStep('profile');
            } finally {
                setIsLoadingProfile(false);
            }
        };

        loadProfile();
    }, []);

    // ============ 保存用户资料 ============
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const handleSaveProfile = async () => {
        if (!profileData.name || !profileData.gender || !profileData.birthDate || !profileData.ethnicity) return;
        setIsSavingProfile(true);
        try {
            await apiClient.updateMe({
                name: profileData.name,
                gender: profileData.gender,
                birth_date: profileData.birthDate,
                birth_time: profileData.birthTime || undefined,
                birth_place: profileData.birthPlace || undefined,
                ethnicity: profileData.ethnicity,
            });
            setProfileComplete(true);
            setCurrentStep('preset');
        } catch (error) {
            console.error('Failed to save profile:', error);
        } finally {
            setIsSavingProfile(false);
        }
    };

    // ============ 创建角色（Mint + 生图一体化） ============
    const handleCreateCharacter = async () => {
        if (!soulmateGender || !soulmateEthnicity || !selectedType || !address) return;
        setIsGenerating(true);
        setGenerationError(null);
        setCurrentStep('generating');
        setMintStep('minting');

        try {
            // Step 1: Create character in backend (get character ID)
            const character = await apiClient.createCharacter({
                type: selectedType,
                gender: soulmateGender,
                ethnicity: soulmateEthnicity,
            }) as any;

            if (!character?.id) throw new Error('Failed to create character');

            // Step 2: Mint NFT on-chain (pay mint fee)
            const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? 'http://localhost:8081'
                : 'https://lauraai-backend.fly.dev';
            const metadataURI = `${baseUrl}/api/nft/metadata/${character.id}`;

            console.log('Minting NFT with metadata URI:', metadataURI, 'mintPrice:', mintPrice.toString());

            await writeContractAsync({
                address: LAURA_AI_SOULMATE_ADDRESS as `0x${string}`,
                abi: LAURA_AI_SOULMATE_ABI,
                functionName: 'safeMint',
                args: [address, metadataURI],
                value: mintPrice,
            });

            // Step 3: Mint succeeded → Generate image
            setMintStep('generating');

            const imageResult = await apiClient.generateImage(character.id.toString()) as any;
            if (imageResult?.image_url) {
                character.image_url = imageResult.image_url;
                character.full_blur_image_url = imageResult.full_blur_image_url;
                character.unlock_status = imageResult.unlock_status;
                character.share_code = imageResult.share_code;
            }

            setMintStep('done');
            setCreatedCharacter({
                ...character,
                id: character.id.toString(),
            });
            setCurrentStep('result');
        } catch (error: any) {
            console.error('Failed to create character:', error);
            const msg = error?.shortMessage || error?.message || 'Creation failed. Please try again.';
            setGenerationError(msg);
            setCurrentStep('ethnicity'); // Go back
        } finally {
            setIsGenerating(false);
            setMintStep('idle');
        }
    };

    // ============ 返回逻辑 ============
    const handleBack = () => {
        switch (currentStep) {
            case 'profile':
                if (profileComplete) setCurrentStep('preset');
                break;
            case 'gender':
                setCurrentStep('preset');
                break;
            case 'ethnicity':
                setCurrentStep('gender');
                break;
            case 'result':
                setCurrentStep('preset');
                break;
            default:
                break;
        }
    };

    // ============ 加载/连接钱包判断 ============
    if (!isConnected) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
                        <Sparkles className="w-10 h-10 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Connect Wallet to Create</h2>
                    <p className="text-gray-400 max-w-md text-center">
                        Connect your Web3 wallet to create your AI character.
                    </p>
                    <ConnectButton />
                </div>
            </AppLayout>
        );
    }

    if (isLoadingProfile) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                    <p className="text-gray-400">Loading...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto w-full px-4 py-6">
                {/* Back Button */}
                {currentStep !== 'preset' && currentStep !== 'generating' && (
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="mb-4 text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                )}

                <AnimatePresence mode="wait">
                    {/* ============ 资料收集步骤 ============ */}
                    {currentStep === 'profile' && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
                        >
                            <div className="p-6 md:p-8 space-y-8">
                                {/* Header */}
                                <div className="text-center space-y-3">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto">
                                        <User className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white">Complete Your Profile</h2>
                                    <p className="text-gray-400 max-w-md mx-auto">Fill this in once. Future character creation only requires gender and ethnicity.</p>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-6 max-w-lg mx-auto">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Your Name *</label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Enter your name"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                                        />
                                    </div>

                                    {/* Gender */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Your Gender *</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {GENDER_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setProfileData(prev => ({ ...prev, gender: opt.value }))}
                                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${profileData.gender === opt.value
                                                        ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    <span className="text-2xl">{opt.emoji}</span>
                                                    <span className="text-xs font-medium">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Birth Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Birth Date *</label>
                                        <input
                                            type="date"
                                            value={profileData.birthDate}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, birthDate: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors [color-scheme:dark]"
                                        />
                                    </div>

                                    {/* Birth Time (optional) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Birth Time <span className="text-gray-500">(optional)</span></label>
                                        <input
                                            type="time"
                                            value={profileData.birthTime}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, birthTime: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors [color-scheme:dark]"
                                        />
                                    </div>

                                    {/* Birth Place (optional) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Birth Place <span className="text-gray-500">(optional)</span></label>
                                        <input
                                            type="text"
                                            value={profileData.birthPlace}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, birthPlace: e.target.value }))}
                                            placeholder="e.g. London, New York"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                                        />
                                    </div>

                                    {/* Ethnicity */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Your Ethnicity *</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {ETHNICITY_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setProfileData(prev => ({ ...prev, ethnicity: opt.value }))}
                                                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all text-center ${profileData.ethnicity === opt.value
                                                        ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    <span className="text-lg">{opt.emoji}</span>
                                                    <span className="text-[10px] font-medium leading-tight">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="max-w-lg mx-auto">
                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={!profileData.name || !profileData.gender || !profileData.birthDate || !profileData.ethnicity || isSavingProfile}
                                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {isSavingProfile ? (
                                            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving...</>
                                        ) : (
                                            <><Check className="w-5 h-5 mr-2" /> Save & Continue</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ============ 预设角色选择 ============ */}
                    {currentStep === 'preset' && (
                        <motion.div
                            key="preset"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Header */}
                            <div className="text-center space-y-3">
                                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Choose Your AI Character</h2>
                                <p className="text-gray-400 text-lg font-light">
                                    Pick a character type. AI will generate a unique avatar for you.
                                </p>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                {PRESET_TYPES.map((preset, index) => {
                                    const isCreated = existingTypes.includes(preset.type);
                                    const existingChar = existingCharacters.find((c: any) => c.type === preset.type);
                                    return (
                                        <motion.div
                                            key={preset.type}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => {
                                                if (isCreated && existingChar) {
                                                    setSelectedCharacterForDetail(existingChar);
                                                } else {
                                                    setSelectedType(preset.type);
                                                    setCurrentStep('gender');
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key !== 'Enter' && e.key !== ' ') return;
                                                if (isCreated && existingChar) setSelectedCharacterForDetail(existingChar);
                                                else { setSelectedType(preset.type); setCurrentStep('gender'); }
                                            }}
                                            className={`group relative bg-black/40 border rounded-2xl text-left transition-all duration-300 overflow-hidden aspect-[3/4] cursor-pointer ${
                                                isCreated
                                                    ? 'border-green-500/20 hover:border-green-500/40 hover:opacity-90 hover:-translate-y-1 hover:shadow-xl'
                                                    : 'border-white/10 hover:border-purple-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10'
                                            }`}
                                        >
                                            {/* Card Image: generated image when created, else preset at 50% opacity */}
                                            {isCreated && existingChar && (existingChar.image_url || existingChar.clear_image_url) ? (
                                                <Image
                                                    src={getFullImageUrl(existingChar.image_url || existingChar.clear_image_url || '')}
                                                    alt={preset.label}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                />
                                            ) : preset.presetImage ? (
                                                <Image
                                                    src={preset.presetImage}
                                                    alt={preset.label}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-50"
                                                />
                                            ) : null}

                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />

                                            {/* Created Badge - more visible */}
                                            {isCreated && (
                                                <>
                                                    <div className="absolute top-3 right-3 z-20 px-3 py-2 rounded-xl bg-green-600/95 backdrop-blur-md border-2 border-green-400/80 text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 shadow-lg shadow-green-500/40">
                                                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                                        Created
                                                    </div>
                                                    <div className="absolute inset-0 z-15 bg-black/5" />
                                                </>
                                            )}

                                            {/* Content at Bottom */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                                                {/* Icon Badge */}
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${preset.gradient} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                                    <div className="text-white scale-75">{preset.icon}</div>
                                                </div>

                                                {/* Text */}
                                                <h3 className="text-base font-bold text-white mb-0.5 flex items-center gap-1">
                                                    {preset.label}
                                                    <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                                </h3>
                                                <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-2">{preset.description}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Profile Edit Link */}
                            <div className="text-center pt-2">
                                <button
                                    onClick={() => setCurrentStep('profile')}
                                    className="text-sm text-gray-500 hover:text-purple-400 transition-colors"
                                >
                                    Edit Profile
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ============ 性别选择 ============ */}
                    {currentStep === 'gender' && (
                        <motion.div
                            key="gender"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
                        >
                            <div className="p-6 md:p-8 space-y-8">
                                {/* Header */}
                                <div className="text-center space-y-3">
                                    <div className="text-sm text-purple-400 font-medium">
                                        Create {PRESET_TYPES.find(p => p.type === selectedType)?.label}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white">Choose Their Gender</h2>
                                    <p className="text-gray-400">What gender should they be?</p>
                                </div>

                                {/* Options */}
                                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                                    {GENDER_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                setSoulmateGender(opt.value);
                                                setCurrentStep('ethnicity');
                                            }}
                                            className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${soulmateGender === opt.value
                                                ? 'bg-purple-500/20 border-purple-500/50 text-white shadow-lg shadow-purple-500/10'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20'
                                                }`}
                                        >
                                            <span className="text-4xl group-hover:scale-110 transition-transform">{opt.emoji}</span>
                                            <span className="text-sm font-bold">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ============ 族裔选择 ============ */}
                    {currentStep === 'ethnicity' && (
                        <motion.div
                            key="ethnicity"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
                        >
                            <div className="p-6 md:p-8 space-y-8">
                                {/* Header */}
                                <div className="text-center space-y-3">
                                    <div className="text-sm text-purple-400 font-medium">
                                        Create {PRESET_TYPES.find(p => p.type === selectedType)?.label} · {soulmateGender === 'Female' ? 'Female' : soulmateGender === 'Male' ? 'Male' : 'Other'}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white">Choose Ethnicity / Skin Tone</h2>
                                    <p className="text-gray-400">AI will generate matching physical features</p>
                                </div>

                                {/* Error Message */}
                                {generationError && (
                                    <div className="max-w-md mx-auto bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                                        <p className="text-red-300 text-sm">{generationError}</p>
                                    </div>
                                )}

                                {/* Options */}
                                <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                                    {ETHNICITY_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                setSoulmateEthnicity(opt.value);
                                            }}
                                            className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 ${soulmateEthnicity === opt.value
                                                ? 'bg-purple-500/20 border-purple-500/50 text-white shadow-lg shadow-purple-500/10'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20'
                                                }`}
                                        >
                                            <span className="text-2xl group-hover:scale-110 transition-transform">{opt.emoji}</span>
                                            <span className="text-[11px] font-bold leading-tight text-center">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Mint & Generate Button */}
                                <div className="max-w-md mx-auto space-y-3">
                                    <Button
                                        onClick={handleCreateCharacter}
                                        disabled={!soulmateEthnicity || isGenerating || !address}
                                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-40 disabled:cursor-not-allowed gap-2"
                                    >
                                        <Gem className="w-5 h-5" />
                                        Mint & Create
                                        {mintPrice > 0 && (
                                            <span className="ml-1 text-sm opacity-90">({mintPriceDisplay} BNB)</span>
                                        )}
                                    </Button>
                                    {mintPrice > 0 && (
                                        <p className="text-center text-xs text-gray-500">
                                            Minting fee: {mintPriceDisplay} BNB · Paid on-chain to mint your unique NFT
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ============ 生成中（Mint + 生图） ============ */}
                    {currentStep === 'generating' && (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="min-h-[600px]"
                        >
                            {mintStep === 'minting' ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                                        <Gem className="w-10 h-10 text-amber-400 animate-pulse" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Confirm in Wallet</h2>
                                    <p className="text-gray-400 text-center max-w-sm">
                                        Please confirm the mint transaction in your wallet.
                                        {mintPrice > 0 && <span className="block mt-1 text-amber-400 font-medium">Fee: {mintPriceDisplay} BNB</span>}
                                    </p>
                                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                                </div>
                            ) : (
                                <DrawingLoading
                                    characterTitle={PRESET_TYPES.find(p => p.type === selectedType)?.label || 'Character'}
                                    error={generationError}
                                    onRetry={() => {
                                        setGenerationError(null);
                                        handleCreateCharacter();
                                    }}
                                />
                            )}
                        </motion.div>
                    )}

                    {/* ============ 生成结果 ============ */}
                    {currentStep === 'result' && createdCharacter && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                        <SoulmateDetailPage
                                character={createdCharacter}
                                onNext={() => router.push(`/chat/${createdCharacter.id}`)}
                                onBack={() => {
                                    setCreatedCharacter(null);
                                    setCurrentStep('preset');
                                    // Refresh existing types and full list (only with images count)
                                    apiClient.getCharacters().then((chars: any) => {
                                        if (Array.isArray(chars)) {
                                            const created = chars.filter((c: any) => c.image_url && c.image_url !== '');
                                            setExistingTypes(created.map((c: any) => c.type));
                                            setExistingCharacters(created.map((c: any) => ({ ...c, id: c.id?.toString?.() ?? String(c.id) })));
                                        }
                                    });
                                }}
                                onCharacterUpdate={setCreatedCharacter}
                            onUnlockSuccess={() => { }}
                        />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Detail modal for "Created" characters */}
            <AnimatePresence>
                {selectedCharacterForDetail && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedCharacterForDetail(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl h-[90vh] bg-black border border-white/10 rounded-3xl overflow-hidden relative"
                        >
                            <button
                                type="button"
                                onClick={() => setSelectedCharacterForDetail(null)}
                                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                            <SoulmateDetailPage
                                character={selectedCharacterForDetail}
                                onNext={() => {
                                    setSelectedCharacterForDetail(null);
                                    router.push(`/chat/${selectedCharacterForDetail.id}`);
                                }}
                                onBack={() => setSelectedCharacterForDetail(null)}
                                onCharacterUpdate={(updated) => {
                                    setSelectedCharacterForDetail(updated);
                                    setExistingCharacters((prev) =>
                                        prev.map((c: any) => (c.id === updated?.id ? { ...c, ...updated } : c))
                                    );
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
