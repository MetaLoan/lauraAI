'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, Share2, Loader2, MessageSquare, ExternalLink, Gem, Star } from 'lucide-react'
import { getFullImageUrl, cn } from '@/lib/utils'
import { ShareButton } from '@/components/share-button'
import { apiClient } from '@/lib/api'
import { useTranslations, useI18n } from '@/components/i18n-provider'
import ReportLoading from '@/components/report-loading'
import { useAccount, useWriteContract } from 'wagmi'
import { LAURA_AI_SOULMATE_ABI, LAURA_AI_SOULMATE_ADDRESS } from '@/lib/contracts'

// 解锁状态枚举
const UnlockStatus = {
  LOCKED: 0,
  HALF_UNLOCKED: 1,
  FULL_UNLOCKED: 2,
} as const

// Character type to translation key mapping (supports both old raw type names and new proper titles)
const characterTypeToKey: Record<string, string> = {
  'Soulmate': 'soulmate',
  'soulmate': 'soulmate',
  'Mini Me': 'miniMe',
  'mini_me': 'miniMe',
  'Future Husband': 'futureHusband',
  'future_husband': 'futureHusband',
  'Future Baby': 'futureBaby',
  'future_baby': 'futureBaby',
  'Future Wife': 'futureWife',
  'future_wife': 'futureWife',
  'AI Boyfriend': 'boyfriend',
  'Boyfriend': 'boyfriend',
  'boyfriend': 'boyfriend',
  'Best Friend': 'bestFriend',
  'best_friend': 'bestFriend',
  'AI Girlfriend': 'girlfriend',
  'Girlfriend': 'girlfriend',
  'girlfriend': 'girlfriend',
  'Companion': 'companion',
  'companion': 'companion',
  'Mysterious Stranger': 'mysteriousStranger',
  'mysterious_stranger': 'mysteriousStranger',
  'Wise Mentor': 'wiseMentor',
  'wise_mentor': 'wiseMentor',
  'Dream Guide': 'dreamGuide',
  'dream_guide': 'dreamGuide',
}

interface SoulmateDetailPageProps {
  character?: {
    id?: string | number
    title?: string
    type?: string
    image?: string
    image_url?: string
    full_blur_image_url?: string
    half_blur_image_url?: string
    clear_image_url?: string
    unlock_status?: number
    share_code?: string
    gender?: string
    ethnicity?: string
    description?: string
    career?: string        // AI 生成的事业运势
    personality?: string   // AI 生成的性格特点
    meeting_time?: string  // AI 生成的相遇时机
    distance?: string      // AI 生成的距离预测
    strength?: string      // AI 生成的缘分优势
    weakness?: string      // AI 生成的成长机遇
    compatibility?: number
    astro_sign?: string
  }
  onNext: () => void
  onBack: () => void
  onShare?: (shareCode: string) => void
  onUnlockSuccess?: () => void
  onCharacterUpdate?: (character: any) => void
}

export default function SoulmateDetailPage({
  character,
  onNext,
  onBack,
  onShare,
  onUnlockSuccess,
  onCharacterUpdate,
}: SoulmateDetailPageProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [progressWidth, setProgressWidth] = useState(0)
  const [isMinting, setIsMinting] = useState(false)
  const [mintSuccess, setMintSuccess] = useState(false)
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [unlockStatus, setUnlockStatus] = useState(character?.unlock_status ?? UnlockStatus.FULL_UNLOCKED)

  const { t } = useTranslations('detail')
  const { t: tResults } = useTranslations('results')
  const { t: tCharacters } = useTranslations('characters')

  const rawTitle = character?.title || "Soulmate"
  const targetScore = character?.compatibility || 92
  const isMiniMe = character?.type === 'mini_me'

  // Get localized character name (check title first, then type field)
  const getLocalizedTitle = () => {
    const key = characterTypeToKey[rawTitle] || (character?.type ? characterTypeToKey[character.type] : undefined)
    return key ? tCharacters(key) : rawTitle
  }

  const title = getLocalizedTitle()

  // 直接出结果：优先清晰图，不再区分解锁状态
  const getDisplayImage = () => {
    return character?.clear_image_url || character?.image_url || character?.image
      || character?.half_blur_image_url || character?.full_blur_image_url
      || "/avatars/soulmate-female.jpg"
  }

  const image = getDisplayImage()

  // NFT minting handler
  const handleMintNFT = async () => {
    if (!address || !character?.id) return
    setIsMinting(true)
    try {
      // Build NFT metadata URI with full HTTPS URL (required by NFT standards)
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:8081'
        : 'https://lauraai-backend.fly.dev'
      const metadataURI = `${baseUrl}/api/nft/metadata/${character.id}`
      
      console.log('Minting NFT with metadata URI:', metadataURI)
      
      await writeContractAsync({
        address: LAURA_AI_SOULMATE_ADDRESS as `0x${string}`,
        abi: LAURA_AI_SOULMATE_ABI,
        functionName: 'safeMint',
        args: [address, metadataURI],
        value: BigInt(0), // free mint or adjust if mintPrice > 0
      })
      
      setMintSuccess(true)
    } catch (error: any) {
      console.error('NFT mint failed:', error)
      alert(error?.shortMessage || error?.message || 'Mint failed. Please try again.')
    } finally {
      setIsMinting(false)
    }
  }

  // 有清晰图或后端已完全解锁则直接展示报告
  const isDescriptionVisible = unlockStatus === UnlockStatus.FULL_UNLOCKED
    || !!character?.clear_image_url
    || !!character?.image_url
  // 检查报告内容是否已生成（如果为空或为默认值，说明还在生成中）
  // 注意：后端如果生成失败，可能会返回空字符串，或者旧的默认值
  // 我们认为如果 description 存在且不为空，就是生成好了
  const hasReportContent = character?.description && character.description.length > 0
  const isReportLoading = isDescriptionVisible && !hasReportContent && !isMiniMe

  // 轮询检查报告状态
  const [isPolling, setIsPolling] = useState(false)
  const [pollStartTime, setPollStartTime] = useState<number | null>(null)
  const [isTimeout, setIsTimeout] = useState(false)

  // 初始化轮询状态
  useEffect(() => {
    if (isReportLoading && !isPolling && !isTimeout) {
      setIsPolling(true)
      setPollStartTime(Date.now())
    }
  }, [isReportLoading, isPolling, isTimeout, character, unlockStatus, hasReportContent])

  // 使用 ref 存储最新的 character，避免闭包陷阱
  const characterRef = useRef(character)
  useEffect(() => {
    characterRef.current = character
  }, [character])

  // 轮询逻辑
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (isPolling && character?.id) {
      intervalId = setInterval(async () => {
        // 检查是否超时 (30秒)
        if (pollStartTime && Date.now() - pollStartTime > 30000) {
          setIsPolling(false)
          setIsTimeout(true)
          return
        }

        try {
          if (!character?.id) return;
          const updatedChar = await apiClient.getCharacter(character.id.toString()) as any;

          if (updatedChar && updatedChar.description && updatedChar.description.length > 0) {
            // 更新本地数据，避免页面刷新
            if (onCharacterUpdate) {
              const currentCharacter = characterRef.current;
              onCharacterUpdate({
                ...currentCharacter,
                description: updatedChar.description,
                career: updatedChar.career,
                personality: updatedChar.personality,
                meeting_time: updatedChar.meeting_time,
                distance: updatedChar.distance,
                strength: updatedChar.strength,
                weakness: updatedChar.weakness,
              });
            }

            // 停止轮询
            setIsPolling(false)
          }
        } catch (error) {
          console.error('Failed to poll character status:', error)
        }
      }, 10000) // 每10秒请求一次
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isPolling, character?.id, pollStartTime, onCharacterUpdate])

  const handleRetryReport = async () => {
    if (!character?.id) return;
    try {
      // In a real app, this would be an API call
      console.log('Retrying report for:', character.id);
      setIsTimeout(false);
      setIsPolling(true);
      setPollStartTime(Date.now());
    } catch (error) {
      console.error('Failed to retry report:', error);
    }
  }

  const description = character?.description || ''

  useEffect(() => {
    // 更新解锁状态
    if (character?.unlock_status !== undefined) {
      setUnlockStatus(character.unlock_status)
    }
  }, [character?.unlock_status])

  useEffect(() => {
    // 动画持续时间（毫秒）
    const duration = 2000
    const startTime = Date.now()
    const startScore = 0
    const startWidth = 0

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // 使用 ease-out 缓动函数
      const easeOut = 1 - Math.pow(1 - progress, 3)

      const currentScore = Math.floor(startScore + (targetScore - startScore) * easeOut)
      const currentWidth = startWidth + (targetScore - startWidth) * easeOut

      setScore(currentScore)
      setProgressWidth(currentWidth)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // 确保最终值准确
        setScore(targetScore)
        setProgressWidth(targetScore)
      }
    }

    // 延迟一点再开始动画，让页面先渲染
    const timer = setTimeout(() => {
      requestAnimationFrame(animate)
    }, 300)

    return () => clearTimeout(timer)
  }, [targetScore])

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 px-6 pb-8 space-y-8 overflow-y-auto scrollbar-hide">
        {/* Portrait Card */}
        <div
          className="flex flex-col items-center space-y-4"
          style={{
            paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px))'
          }}
        >
          {/* Title and Compatibility Score */}
          <div className="w-full max-w-[280px] flex items-center justify-between px-2 flex-shrink-0">
            <h2 className="text-title-lg font-bold">{title}</h2>
            {!isMiniMe && targetScore && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/90 to-orange-500/90 border border-amber-400/50 backdrop-blur-sm shadow-lg shadow-amber-500/30">
                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                <span className="text-xl font-bold text-white">{score}%</span>
              </div>
            )}
          </div>

          {/* Image with lock overlay */}
          <div className="w-full max-w-[280px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="w-full h-full bg-amber-200 flex items-center justify-center relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFullImageUrl(image)}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 直接出结果，已移除邀请好友助力与解锁状态角标 */}
        </div>

        {/* Divider - 只在非 Mini Me 时显示 */}
        {!isMiniMe && (
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}

        {/* Compatibility Score - 只在非 Mini Me 时显示 */}
        {!isMiniMe && (
          <div className="mb-8">
            <h3 className="text-center text-title-md font-bold mb-6">{tResults('compatibility')}</h3>

            {/* Progress Bar */}
            <div className="mb-6 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
                style={{ width: `${progressWidth}%` }}
              />
            </div>

            {/* Personality Report */}
            <div className="relative">
              {isDescriptionVisible ? (
                isReportLoading ? (
                  isTimeout ? (
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center min-h-[200px] space-y-4">
                      <p className="text-center text-red-400 font-medium text-lg">
                        {t('loading.timeout')}
                      </p>
                      <Button
                        onClick={handleRetryReport}
                        variant="outline"
                        className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                      >
                        {t('loading.retryReport')}
                      </Button>
                    </div>
                  ) : (
                    <ReportLoading />
                  )
                ) : (
                  <p className="text-center text-body-sm text-gray-300 leading-relaxed mb-8">
                    {description || t('noDescription')}
                  </p>
                )
              ) : (
                <p className="text-center text-body-sm text-gray-500">
                  {t('noDescription')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Expandable Sections - Only visible when unlocked and not Mini Me */}
        {isDescriptionVisible && !isMiniMe && !isReportLoading && (
          <div className="space-y-3">
            {/* Career - 事业运势 */}
            <button
              onClick={() => toggleSection('career')}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-title-md font-bold">{t('career')}</h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${expandedSection === 'career' ? 'rotate-180' : ''
                    }`}
                />
              </div>
              {expandedSection === 'career' && (
                <p className="mt-4 text-body-sm text-gray-300 leading-relaxed">
                  {character?.career || t('careerDesc')}
                </p>
              )}
            </button>

            {/* Personality - 性格特点 */}
            <button
              onClick={() => toggleSection('personality')}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-title-md font-bold">{t('personality')}</h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${expandedSection === 'personality' ? 'rotate-180' : ''
                    }`}
                />
              </div>
              {expandedSection === 'personality' && (
                <p className="mt-4 text-body-sm text-gray-300 leading-relaxed">
                  {character?.personality || t('personalityDesc')}
                </p>
              )}
            </button>

            {/* Meeting Time - 相遇时机 */}
            <button
              onClick={() => toggleSection('meetingTime')}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-title-md font-bold">{t('meetingTime')}</h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${expandedSection === 'meetingTime' ? 'rotate-180' : ''
                    }`}
                />
              </div>
              {expandedSection === 'meetingTime' && (
                <p className="mt-4 text-body-sm text-gray-300 leading-relaxed">
                  {character?.meeting_time || t('meetingTimeDesc')}
                </p>
              )}
            </button>

            {/* Distance - 距离预测 */}
            <button
              onClick={() => toggleSection('distance')}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-title-md font-bold">{t('distance')}</h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${expandedSection === 'distance' ? 'rotate-180' : ''
                    }`}
                />
              </div>
              {expandedSection === 'distance' && (
                <p className="mt-4 text-body-sm text-gray-300 leading-relaxed">
                  {character?.distance || t('distanceDesc')}
                </p>
              )}
            </button>

            {/* Strength - 缘分优势 */}
            <button
              onClick={() => toggleSection('strength')}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-title-md font-bold">{t('strength')}</h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${expandedSection === 'strength' ? 'rotate-180' : ''
                    }`}
                />
              </div>
              {expandedSection === 'strength' && (
                <p className="mt-4 text-body-sm text-gray-300 leading-relaxed">
                  {character?.strength || t('strengthDesc')}
                </p>
              )}
            </button>

            {/* Challenge - 成长机遇 */}
            <button
              onClick={() => toggleSection('challenge')}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-title-md font-bold">{t('challenge')}</h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${expandedSection === 'challenge' ? 'rotate-180' : ''
                    }`}
                />
              </div>
              {expandedSection === 'challenge' && (
                <p className="mt-4 text-body-sm text-gray-300 leading-relaxed">
                  {character?.weakness || t('challengeDesc')}
                </p>
              )}
            </button>
          </div>
        )}

        {/* Bottom spacer for fixed button (increased to prevent content being hidden) */}
        <div className="h-40" />
      </div>

      {/* Footer Buttons - Redesigned 3-button layout */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-[#0B0218]/95 via-[#0B0218]/90 to-transparent backdrop-blur-sm z-50">
        <div className="max-w-md mx-auto space-y-3">
          {/* Primary: Start Chat */}
          <Button
            onClick={onNext}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-base rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2.5 transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            {t('startChat')}
          </Button>
          
          {/* Secondary Actions Row */}
          <div className="flex gap-2.5">
            {/* Mint NFT */}
            <Button
              onClick={handleMintNFT}
              disabled={isMinting || mintSuccess || !address}
              className={cn(
                "flex-1 h-11 flex items-center justify-center gap-2 font-semibold text-sm rounded-xl transition-all shadow-md",
                mintSuccess
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-green-500/20"
                  : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/20",
                (isMinting || !address) && "opacity-60 cursor-not-allowed"
              )}
            >
              {isMinting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Minting...</>
              ) : mintSuccess ? (
                <>✓ Minted</>
              ) : (
                <><Gem className="w-4 h-4" /> Mint NFT</>
              )}
            </Button>
            
            {/* Share */}
            <ShareButton
              title={`Meet my ${rawTitle}!`}
              text={`I just created a unique AI ${rawTitle} with ${targetScore}% compatibility on LauraAI! #LauraAI #BSC #Web3AI`}
              className="flex-1 h-11 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm rounded-xl shadow-md shadow-black/10 transition-all backdrop-blur-sm flex items-center justify-center gap-2"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
