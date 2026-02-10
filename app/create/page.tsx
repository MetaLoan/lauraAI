'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { Loader2, ArrowLeft, Check, Sparkles, ChevronRight, User, Heart, Users, Baby, Crown, Compass, BookOpen, Ghost, Star, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@/components/wallet-button';
import { useAccount } from 'wagmi';
import Image from 'next/image';
import { getFullImageUrl } from '@/lib/utils';
import SoulmateDetailPage from '@/components/soulmate-detail-page';

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
    const { isConnected } = useAccount();

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

                // 加载已创建的角色
                const characters = await apiClient.getCharacters() as any[];
                if (characters && Array.isArray(characters)) {
                    setExistingTypes(characters.map((c: any) => c.type));
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

    // ============ 创建角色 ============
    const handleCreateCharacter = async () => {
        if (!soulmateGender || !soulmateEthnicity || !selectedType) return;
        setIsGenerating(true);
        setGenerationError(null);
        setCurrentStep('generating');

        try {
            const character = await apiClient.createCharacter({
                type: selectedType,
                gender: soulmateGender,
                ethnicity: soulmateEthnicity,
            }) as any;

            if (!character?.id) throw new Error('Failed to create character');

            // 生成图片
            const imageResult = await apiClient.generateImage(character.id.toString()) as any;
            if (imageResult?.image_url) {
                character.image_url = imageResult.image_url;
                character.full_blur_image_url = imageResult.full_blur_image_url;
                character.unlock_status = imageResult.unlock_status;
                character.share_code = imageResult.share_code;
            }

            setCreatedCharacter({
                ...character,
                id: character.id.toString(),
            });
            setCurrentStep('result');
        } catch (error: any) {
            console.error('Failed to create character:', error);
            setGenerationError(error.message || 'Creation failed. Please try again.');
            setCurrentStep('ethnicity'); // Go back
        } finally {
            setIsGenerating(false);
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
                                    return (
                                        <motion.button
                                            key={preset.type}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                            onClick={() => {
                                                setSelectedType(preset.type);
                                                setCurrentStep('gender');
                                            }}
                                            className="group relative bg-black/40 border border-white/10 rounded-2xl text-left hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 overflow-hidden aspect-[3/4]"
                                        >
                                            {/* Preset Image Background */}
                                            {preset.presetImage && (
                                                <Image
                                                    src={preset.presetImage}
                                                    alt={preset.label}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                />
                                            )}

                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />

                                            {/* Created Badge */}
                                            {isCreated && (
                                                <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-full bg-green-500/20 backdrop-blur-md border border-green-500/30 text-[10px] font-bold text-green-400">
                                                    Created
                                                </div>
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
                                        </motion.button>
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

                                {/* Generate Button */}
                                <div className="max-w-md mx-auto">
                                    <Button
                                        onClick={handleCreateCharacter}
                                        disabled={!soulmateEthnicity || isGenerating}
                                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-40 disabled:cursor-not-allowed gap-2"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        Generate AI Avatar
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ============ 生成中 ============ */}
                    {currentStep === 'generating' && (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center min-h-[500px] space-y-8"
                        >
                            {/* Animated DNA-style loader */}
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-2 border-purple-500/30 flex items-center justify-center">
                                    <div className="w-24 h-24 rounded-full border-2 border-pink-500/30 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                                        <div className="w-16 h-16 rounded-full border-2 border-purple-500/50 flex items-center justify-center animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
                                            <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-purple-500/5 rounded-full blur-[40px] animate-pulse" />
                            </div>

                            <div className="text-center space-y-3">
                                <h3 className="text-2xl font-bold text-white">AI Is Generating Your Character</h3>
                                <p className="text-gray-400 max-w-sm">
                                    Analyzing DNA traits and creating your avatar. Please wait...
                                </p>
                                <div className="flex items-center justify-center gap-2 text-purple-400 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Estimated 15-30 seconds</span>
                                </div>
                            </div>
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
                                    // Refresh existing types
                                    apiClient.getCharacters().then((chars: any) => {
                                        if (Array.isArray(chars)) {
                                            setExistingTypes(chars.map((c: any) => c.type));
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
        </AppLayout>
    );
}
