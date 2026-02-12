'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { Loader2, ArrowLeft, Check, Sparkles, ChevronRight, User, Heart, Users, Baby, Crown, Compass, BookOpen, Ghost, Star, Moon, X, RefreshCw, Home, AlertTriangle, RotateCw } from 'lucide-react';
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

const PRESET_ICON_STYLE = "w-10 h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]";

const PRESET_TYPES: PresetType[] = [
    {
        type: 'mini_me',
        label: 'Mini Me',
        description: 'Upload a selfie and AI creates your unique avatar',
        icon: <img src="/icons/3d/profile.png" className={PRESET_ICON_STYLE} alt="Mini Me" />,
        gradient: 'from-cyan-500 to-blue-600',
        bgGlow: 'bg-cyan-500/10',
        presetImage: '/minime.jpg',
    },
    {
        type: 'girlfriend',
        label: 'AI Girlfriend',
        description: 'Sweet and caring companion who truly understands you',
        icon: <img src="/icons/3d/soulmate.png" className={PRESET_ICON_STYLE} alt="Girlfriend" />,
        gradient: 'from-pink-500 to-rose-600',
        bgGlow: 'bg-pink-500/10',
        presetImage: '/presets/girlfriend.jpg',
    },
    {
        type: 'boyfriend',
        label: 'AI Boyfriend',
        description: 'Warm, charming partner always by your side',
        icon: <img src="/icons/3d/star.png" className={PRESET_ICON_STYLE} alt="Boyfriend" />,
        gradient: 'from-blue-500 to-indigo-600',
        bgGlow: 'bg-blue-500/10',
        presetImage: '/presets/boyfriend.jpg',
    },
    {
        type: 'best_friend',
        label: 'Best Friend',
        description: 'Your ride-or-die, the one you tell everything to',
        icon: <img src="/icons/3d/users.png" className={PRESET_ICON_STYLE} alt="Best Friend" />,
        gradient: 'from-amber-500 to-orange-600',
        bgGlow: 'bg-amber-500/10',
        presetImage: '/presets/best_friend.jpg',
    },
    {
        type: 'soulmate',
        label: 'Soulmate',
        description: 'Your destined other half, a bond beyond time',
        icon: <img src="/icons/3d/sparkles.png" className={PRESET_ICON_STYLE} alt="Soulmate" />,
        gradient: 'from-purple-500 to-violet-600',
        bgGlow: 'bg-purple-500/10',
        presetImage: '/presets/soulmate.jpg',
    },
    {
        type: 'future_baby',
        label: 'Future Baby',
        description: 'A glimpse of your future child',
        icon: <img src="/icons/3d/baby.png" className={PRESET_ICON_STYLE} alt="Future Baby" />,
        gradient: 'from-green-400 to-emerald-600',
        bgGlow: 'bg-green-500/10',
        presetImage: '/presets/future_baby.jpg',
    },
    {
        type: 'future_wife',
        label: 'Future Wife',
        description: 'Elegant, wise partner for life',
        icon: <img src="/icons/3d/crown.png" className={PRESET_ICON_STYLE} alt="Future Wife" />,
        gradient: 'from-rose-400 to-pink-600',
        bgGlow: 'bg-rose-500/10',
        presetImage: '/presets/future_wife.jpg',
    },
    {
        type: 'future_husband',
        label: 'Future Husband',
        description: 'Mature, dependable soulmate',
        icon: <img src="/icons/3d/crown.png" className={PRESET_ICON_STYLE} alt="Future Husband" />,
        gradient: 'from-slate-400 to-zinc-600',
        bgGlow: 'bg-slate-500/10',
        presetImage: '/presets/future_husband.jpg',
    },
    {
        type: 'companion',
        label: 'Companion',
        description: 'Warm, reliable travel partner for life',
        icon: <img src="/icons/3d/compass.png" className={PRESET_ICON_STYLE} alt="Companion" />,
        gradient: 'from-teal-500 to-cyan-600',
        bgGlow: 'bg-teal-500/10',
        presetImage: '/presets/companion.jpg',
    },
    {
        type: 'wise_mentor',
        label: 'Wise Mentor',
        description: 'Knowledgeable guide for life',
        icon: <img src="/icons/3d/book.png" className={PRESET_ICON_STYLE} alt="Wise Mentor" />,
        gradient: 'from-yellow-500 to-amber-600',
        bgGlow: 'bg-yellow-500/10',
        presetImage: '/presets/wise_mentor.jpg',
    },
    {
        type: 'dream_guide',
        label: 'Dream Guide',
        description: 'Mysterious guide across time and dreams',
        icon: <img src="/icons/3d/moon.png" className={PRESET_ICON_STYLE} alt="Dream Guide" />,
        gradient: 'from-indigo-500 to-purple-700',
        bgGlow: 'bg-indigo-500/10',
        presetImage: '/presets/dream_guide.jpg',
    },
    {
        type: 'mysterious_stranger',
        label: 'Mysterious Stranger',
        description: 'A fateful unknown encounter',
        icon: <img src="/icons/3d/ghost.png" className={PRESET_ICON_STYLE} alt="Mysterious Stranger" />,
        gradient: 'from-gray-500 to-zinc-700',
        bgGlow: 'bg-gray-500/10',
        presetImage: '/presets/mysterious_stranger.jpg',
    },
];

// ============ Gender options ============
const GENDER_OPTIONS = [
    { value: 'Female', label: 'Female', icon: '/icons/3d/female.png' },
    { value: 'Male', label: 'Male', icon: '/icons/3d/male.png' },
    { value: 'Other', label: 'Other', icon: '/icons/3d/other_gender.png' },
];

// ============ Ethnicity options ============
const ETHNICITY_OPTIONS = [
    { value: 'East Asian', label: 'East Asian', icon: '/icons/3d/asian_blossom.png' },
    { value: 'South Asian', label: 'South Asian', icon: '/icons/3d/south_asian_lotus.png' },
    { value: 'Southeast Asian', label: 'Southeast Asian', icon: '/icons/3d/southeast_asian_hibiscus.png' },
    { value: 'White', label: 'White/European', icon: '/icons/3d/mountain.png' },
    { value: 'Black/African', label: 'Black/African', icon: '/icons/3d/earth.png' },
    { value: 'Hispanic/Latino', label: 'Hispanic/Latino', icon: '/icons/3d/taco.png' },
    { value: 'Middle Eastern', label: 'Middle Eastern', icon: '/icons/3d/mosque.png' },
    { value: 'Indigenous', label: 'Indigenous', icon: '/icons/3d/feather.png' },
    { value: 'Mixed', label: 'Mixed', icon: '/icons/3d/earth.png' },
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

                // Load existing characters (已生成或生成中的都算已创建)
                const characters = await apiClient.getCharacters() as any[];
                if (characters && Array.isArray(characters)) {
                    const created = characters.filter((c: any) =>
                        (c.image_url && c.image_url !== '') || c.image_status === 'generating'
                    );
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

    // 正在生成中的角色 ID（用于轮询）
    const [generatingCharacterId, setGeneratingCharacterId] = useState<string | null>(null);
    const pollRef = React.useRef<NodeJS.Timeout | null>(null);

    // 是否处于 "生图失败，等待用户重试" 的状态
    const [generationFailed, setGenerationFailed] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    // 轮询检查生图结果
    const pollForResult = React.useCallback(async (charId: string) => {
        try {
            const chars = await apiClient.getCharacters() as any[];
            const found = chars?.find((c: any) => String(c.id) === charId);
            if (found && found.image_status === 'done' && found.image_url) {
                // 生成完成！跳转到结果页
                if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
                setCreatedCharacter({ ...found, id: found.id.toString() });
                setCurrentStep('result');
                setIsGenerating(false);
                setMintStep('idle');
                setGeneratingCharacterId(null);
                setGenerationFailed(false);
            } else if (found && found.image_status === 'failed') {
                // 后端重试多次仍失败 → 停留在当前页面，显示失败 UI
                if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
                setGenerationFailed(true);
                setMintStep('generating'); // 保持在 generating 步骤，不退回
            }
        } catch {
            // 轮询出错不中断
        }
    }, []);

    // 启动轮询
    const startPolling = React.useCallback((charId: string) => {
        if (pollRef.current) clearInterval(pollRef.current);
        setGenerationFailed(false);
        pollRef.current = setInterval(() => pollForResult(charId), 5000);
    }, [pollForResult]);

    // 手动刷新
    const handleManualRefresh = () => {
        if (generatingCharacterId) {
            pollForResult(generatingCharacterId);
        }
    };

    // 重试生图（已付过 Mint 费用，后端直接允许 failed → generating）
    const handleRetryGeneration = async () => {
        if (!generatingCharacterId) return;
        setIsRetrying(true);
        setGenerationFailed(false);

        try {
            await apiClient.generateImage(generatingCharacterId);
            // 后端已接受，重新开始轮询
            startPolling(generatingCharacterId);
        } catch (err: any) {
            console.warn('Retry request sent (continues in background):', err);
            // 即使前端请求报错，后端可能已经开始了，照样轮询
            startPolling(generatingCharacterId);
        } finally {
            setIsRetrying(false);
        }
    };

    // 清理轮询
    React.useEffect(() => {
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []);

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

            // Step 3: Mint succeeded → 触发后台生图（后端异步，客户端关闭不影响）
            setMintStep('generating');
            const charId = character.id.toString();
            setGeneratingCharacterId(charId);

            apiClient.generateImage(charId).catch((err: any) => {
                console.warn('Generate image request sent (continues in background):', err);
            });

            // 启动轮询，每5秒检查一次
            startPolling(charId);

        } catch (error: any) {
            console.error('Failed to create character:', error);
            const msg = error?.shortMessage || error?.message || 'Creation failed. Please try again.';
            setGenerationError(msg);
            setCurrentStep('ethnicity'); // Go back
            setIsGenerating(false);
            setMintStep('idle');
        }
    };

    // ============ 返回逻辑 ============
    const handleBack = () => {
        switch (currentStep) {
            case 'profile':
                // 总是允许返回到 preset 选择页面
                setCurrentStep('preset');
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
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Connect Wallet to Create</h2>
                    <p className="text-white max-w-md text-center">
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
                    <Loader2 className="w-10 h-10 animate-spin text-white mb-4" />
                    <p className="text-white">Loading...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <>
        <AppLayout>
            <div className="max-w-4xl mx-auto w-full px-4 py-6">
                <AnimatePresence mode="wait">
                    {/* ============ 资料收集步骤 ============ */}
                    {currentStep === 'profile' && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-0"
                        >
                            {/* Back Button - 放在步骤内部，跟随步骤一起动画 */}
                            <div className="mb-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBack}
                                    className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                                    Back
                                </Button>
                            </div>
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl md:text-3xl font-bold text-white">Complete Your Profile</h2>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Your Name *</label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Enter your name"
                                            className="w-full rounded-xl px-4 py-3 text-white placeholder-gray-500 bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    {/* Gender */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Your Gender *</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {GENDER_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setProfileData(prev => ({ ...prev, gender: opt.value }))}
                                                    className={`liquid-glass-card flex flex-col items-center gap-2 p-3 rounded-xl transition-all text-white ${profileData.gender === opt.value
                                                        ? 'glass-active'
                                                        : 'glass-dormant'
                                                        }`}
                                                >
                                                    <img src={opt.icon} className="w-8 h-8 object-contain" alt={opt.label} />
                                                    <span className="text-xs font-bold leading-tight mt-1">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Birth Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Birth Date *</label>
                                        <input
                                            type="date"
                                            value={profileData.birthDate}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, birthDate: e.target.value }))}
                                            className="w-full rounded-xl px-4 py-3 text-white bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition-colors [color-scheme:dark]"
                                        />
                                    </div>

                                    {/* Birth Time (optional) */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Birth Time <span className="text-white/60">(optional)</span></label>
                                        <input
                                            type="time"
                                            value={profileData.birthTime}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, birthTime: e.target.value }))}
                                            className="w-full rounded-xl px-4 py-3 text-white bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition-colors [color-scheme:dark]"
                                        />
                                    </div>

                                    {/* Birth Place (optional) */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Birth Place <span className="text-white/60">(optional)</span></label>
                                        <input
                                            type="text"
                                            value={profileData.birthPlace}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, birthPlace: e.target.value }))}
                                            placeholder="e.g. London, New York"
                                            className="w-full rounded-xl px-4 py-3 text-white placeholder-gray-400 bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    {/* Ethnicity */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Your Ethnicity *</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {ETHNICITY_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setProfileData(prev => ({ ...prev, ethnicity: opt.value }))}
                                                    className={`liquid-glass-card flex flex-col items-center gap-2 p-2.5 rounded-xl transition-all text-center text-white ${profileData.ethnicity === opt.value
                                                        ? 'glass-active'
                                                        : 'glass-dormant'
                                                        }`}
                                                >
                                                    <img src={opt.icon} className="w-8 h-8 object-contain drop-shadow-sm" alt={opt.label} />
                                                    <span className="text-[10px] font-medium leading-tight">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Submit - 复用 Enter Dashboard 按钮样式 */}
                                <div className="mt-8">
                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={!profileData.name || !profileData.gender || !profileData.birthDate || !profileData.ethnicity || isSavingProfile}
                                        className="enter-dashboard-btn group w-full h-14 text-lg font-bold liquid-glass-card rounded-full text-white disabled:opacity-40 disabled:cursor-not-allowed gap-2 relative overflow-hidden transform hover:scale-105 active:scale-[0.98] shadow-[0_0_20px_rgba(168,85,247,0.25)] ![transition:box-shadow_0.4s_ease,scale_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
                                    >
                                        <span className="btn-gradient-layer absolute inset-0 rounded-full pointer-events-none opacity-50 transition-opacity duration-200 group-hover:opacity-75 group-active:opacity-75" aria-hidden />
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isSavingProfile ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>Saving...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-5 h-5" />
                                                    <span>Save &amp; Continue</span>
                                                </>
                                            )}
                                        </span>
                                    </Button>
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
                                <p className="text-white text-lg font-light">
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
                                                } else if (preset.type === 'mini_me') {
                                                    router.push('/create/minime');
                                                } else {
                                                    setSelectedType(preset.type);
                                                    setCurrentStep('gender');
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key !== 'Enter' && e.key !== ' ') return;
                                                if (isCreated && existingChar) setSelectedCharacterForDetail(existingChar);
                                                else if (preset.type === 'mini_me') router.push('/create/minime');
                                                else { setSelectedType(preset.type); setCurrentStep('gender'); }
                                            }}
                                            className={`group relative rounded-2xl text-left transition-all duration-300 overflow-hidden aspect-[3/4] cursor-pointer ${isCreated
                                                ? 'hover:opacity-90 hover:-translate-y-1 hover:shadow-xl'
                                                : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10'
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
                                                    <div className="absolute top-3 right-3 z-20 px-3 py-2 rounded-xl bg-green-600/95 backdrop-blur-md text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 shadow-lg shadow-green-500/40">
                                                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                        Created
                                                    </div>
                                                    <div className="absolute inset-0 z-15" />
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
                                                    <ChevronRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                                </h3>
                                                <p className="text-[11px] text-white leading-relaxed line-clamp-2">{preset.description}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Profile Edit Link */}
                            <div className="text-center pt-2">
                                <button
                                    onClick={() => setCurrentStep('profile')}
                                    className="text-sm liquid-glass-card rounded-full px-4 py-2 text-white hover:text-white transition-colors"
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
                            className="space-y-8"
                        >
                                {/* Back Button */}
                                <div className="mb-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleBack}
                                        className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                                        Back
                                    </Button>
                                </div>

                                {/* Header */}
                                <div className="text-center space-y-3">
                                    <div className="text-sm text-white font-medium">
                                        Create {PRESET_TYPES.find(p => p.type === selectedType)?.label}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white">Choose Their Gender</h2>
                                </div>

                                {/* Options */}
                                <div className="grid grid-cols-3 gap-4">
                                    {GENDER_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                setSoulmateGender(opt.value);
                                                setCurrentStep('ethnicity');
                                            }}
                                            className={`liquid-glass-card group flex flex-col items-center gap-3 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 text-white ${soulmateGender === opt.value
                                                ? 'glass-active'
                                                : 'glass-dormant'
                                                }`}
                                        >
                                            <img src={opt.icon} className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" alt={opt.label} />
                                            <span className="text-sm font-bold">{opt.label}</span>
                                        </button>
                                    ))}
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
                            className="space-y-8"
                        >
                                {/* Back Button */}
                                <div className="mb-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleBack}
                                        className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                                        Back
                                    </Button>
                                </div>

                                {/* Header */}
                                <div className="text-center space-y-3">
                                    <div className="text-sm text-white font-medium">
                                        Create {PRESET_TYPES.find(p => p.type === selectedType)?.label} · {soulmateGender === 'Female' ? 'Female' : soulmateGender === 'Male' ? 'Male' : 'Other'}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white">Choose Ethnicity / Skin Tone</h2>
                                </div>

                                {/* Error Message */}
                                {generationError && (
                                    <div className="rounded-xl p-4 text-center">
                                        <p className="text-red-300 text-sm">{generationError}</p>
                                    </div>
                                )}

                                {/* Options */}
                                <div className="grid grid-cols-3 gap-3">
                                    {ETHNICITY_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                setSoulmateEthnicity(opt.value);
                                            }}
                                            className={`liquid-glass-card group flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 text-white ${soulmateEthnicity === opt.value
                                                ? 'glass-active'
                                                : 'glass-dormant'
                                                }`}
                                        >
                                            <img src={opt.icon} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" alt={opt.label} />
                                            <span className="text-[11px] font-bold leading-tight text-center">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Mint & Generate Button - 与 Enter Dashboard 同款 hover/active 样式与动画 */}
                                <div className="space-y-3">
                                    <Button
                                        onClick={handleCreateCharacter}
                                        disabled={!soulmateEthnicity || isGenerating || !address}
                                        className="enter-dashboard-btn group w-full h-14 text-lg font-bold liquid-glass-card rounded-full text-white disabled:opacity-40 disabled:cursor-not-allowed gap-2 relative overflow-hidden transform hover:scale-105 active:scale-[0.98] shadow-[0_0_20px_rgba(168,85,247,0.25)] ![transition:box-shadow_0.4s_ease,scale_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
                                    >
                                        <span className="btn-gradient-layer absolute inset-0 rounded-full pointer-events-none opacity-50 transition-opacity duration-200 group-hover:opacity-75 group-active:opacity-75" aria-hidden />
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            <img src="/icons/3d/gem_3d.png" className="w-6 h-6 object-contain" alt="Gem" />
                                            <span>Mint & Create</span>
                                            {mintPrice > 0 && (
                                                <span className="text-sm opacity-90">({mintPriceDisplay} BNB)</span>
                                            )}
                                        </span>
                                    </Button>
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
                                /* ===== 阶段 1：等待钱包确认 ===== */
                                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center">
                                        <Image src="/icons/3d/gem_3d.png" alt="" width={40} height={40} className="w-10 h-10 object-contain animate-pulse" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Confirm in Wallet</h2>
                                    <p className="text-white text-center max-w-sm">
                                        Please confirm the mint transaction in your wallet.
                                        {mintPrice > 0 && <span className="block mt-1 text-amber-400 font-medium">Fee: {mintPriceDisplay} BNB</span>}
                                    </p>
                                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                                </div>
                            ) : generationError ? (
                                /* ===== Mint 阶段失败（钱包拒绝等） ===== */
                                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center">
                                        <AlertTriangle className="w-8 h-8 text-red-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Transaction Failed</h2>
                                    <p className="text-red-400 text-center max-w-sm">{generationError}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setGenerationError(null);
                                            setCurrentStep('ethnicity');
                                        }}
                                        className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                                        Back
                                    </Button>
                                </div>
                            ) : generationFailed ? (
                                /* ===== 阶段 3：生图超时/失败，允许重试 ===== */
                                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                    <div className="w-20 h-20 rounded-full flex items-center justify-center">
                                        <AlertTriangle className="w-10 h-10 text-amber-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Generation Timed Out</h2>
                                    <p className="text-white text-center max-w-sm leading-relaxed">
                                        AI image generation didn&apos;t complete in time. Your Mint has been confirmed — tap Retry to regenerate at no extra cost.
                                    </p>

                                    <div className="flex items-center gap-3 pt-4">
                                        <Button
                                            onClick={handleRetryGeneration}
                                            disabled={isRetrying}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold gap-2 px-8"
                                        >
                                            {isRetrying ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                            ) : (
                                                <RotateCw className="w-4 h-4" />
                                            )}
                                            {isRetrying ? 'Retrying...' : 'Retry Generation'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push('/dashboard')}
                                            className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5"
                                        >
                                            <Home className="w-4 h-4 mr-1.5" />
                                            Back to Home
                                        </Button>
                                    </div>

                                    <p className="text-xs text-white pt-2">
                                        Mint already paid · Retry is free
                                    </p>
                                </div>
                            ) : (
                                /* ===== 阶段 2：生图进行中（完整动画） ===== */
                                <div className="flex flex-col min-h-[600px]">
                                    {/* DrawingLoading 动画主体 */}
                                    <div className="flex-1">
                                        <DrawingLoading
                                            characterTitle={PRESET_TYPES.find(p => p.type === selectedType)?.label || 'Character'}
                                        />
                                    </div>

                                    {/* 底部操作栏 */}
                                    <div className="flex flex-col items-center gap-3 pb-6 pt-2">
                                        <div className="flex flex-wrap items-center justify-center gap-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleManualRefresh}
                                                className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5"
                                            >
                                                <RefreshCw className="w-4 h-4 mr-1.5" />
                                                Refresh
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push('/dashboard')}
                                                className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5"
                                            >
                                                <Home className="w-4 h-4 mr-1.5" />
                                                Back to Home
                                            </Button>
                                        </div>
                                        <p className="text-xs text-white">
                                            Auto-refreshing every 5s · You can safely close this page
                                        </p>
                                    </div>
                                </div>
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

        </AppLayout>

            {/* Detail modal for "Created" characters — 放在 AppLayout 外，确保 backdrop-blur 覆盖所有层 */}
            <AnimatePresence>
                {selectedCharacterForDetail && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60]"
                        onClick={() => setSelectedCharacterForDetail(null)}
                    >
                        {/* 模糊 + 遮罩层：超出视口以消除边缘清晰区域 */}
                        <div className="absolute -inset-[50%] bg-black/30 backdrop-blur-xl pointer-events-none" />

                        {/* 内容居中层：严格与视口对齐 */}
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl max-h-[90vh] liquid-glass-card rounded-3xl overflow-hidden relative flex flex-col"
                        >
                            <button
                                type="button"
                                onClick={() => setSelectedCharacterForDetail(null)}
                                className="!absolute top-4 right-4 z-50 w-10 h-10 rounded-full liquid-glass-card flex items-center justify-center transition-colors"
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
                                showMiniMeBackButton={false}
                                onCharacterUpdate={(updated) => {
                                    setSelectedCharacterForDetail(updated);
                                    setExistingCharacters((prev) =>
                                        prev.map((c: any) => (c.id === updated?.id ? { ...c, ...updated } : c))
                                    );
                                }}
                            />
                        </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
