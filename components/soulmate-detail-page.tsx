'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ArrowLeft } from 'lucide-react'
import { getAssetPath, getFullImageUrl, cn } from '@/lib/utils'
import { ShareButton } from '@/components/share-button'
import { apiClient } from '@/lib/api'
import { useTranslations, useI18n } from '@/components/i18n-provider'
import ReportLoading from '@/components/report-loading'

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
  showMiniMeBackButton?: boolean
}

export default function SoulmateDetailPage({
  character,
  onNext,
  onBack,
  onShare,
  onUnlockSuccess,
  onCharacterUpdate,
  showMiniMeBackButton = true,
}: SoulmateDetailPageProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [progressWidth, setProgressWidth] = useState(0)
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
    <div className="h-full flex flex-col min-h-0">
      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 px-6 pb-6 space-y-8 overflow-y-auto scrollbar-hide">
        {/* Portrait Card */}
        <div
          className="flex flex-col items-center space-y-4"
          style={{
            paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px))'
          }}
        >
          {/* Title above image */}
          <h2 className="text-5xl font-bold text-balance text-center px-2 flex-shrink-0 pt-4">{title}</h2>

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

          {/* 头像下方：2 个圆形玻璃态按钮，跟随滚动 */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              onClick={onNext}
              className="liquid-glass-card rounded-full w-14 h-14 p-0 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
              title={t('startChat')}
            >
              <img src={getAssetPath('/icons/3d/message_chat.png')} className="w-7 h-7 object-contain" alt="" />
            </Button>
            <ShareButton
              title={`Meet my ${rawTitle}!`}
              text={`I just created a unique AI ${rawTitle} with ${targetScore}% compatibility on SoulFace! #SoulFace #Ethereum #Web3AI`}
              size="icon"
              className="liquid-glass-card rounded-full w-14 h-14 p-0 border-0 text-white hover:scale-105 active:scale-95 transition-transform [&>img]:w-7 [&>img]:h-7 [&>img]:object-contain"
            />
          </div>

          {isMiniMe && showMiniMeBackButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="rounded-full border border-white/20 text-white hover:bg-white/10 h-9 px-5 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}

        </div>

        {/* Divider - 只在非 Mini Me 时显示 */}
        {!isMiniMe && (
          <div className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        )}

        {/* Compatibility Score - 只在非 Mini Me 时显示 */}
        {!isMiniMe && (
          <div className="mb-8">
            <h3 className="text-center text-title-md font-bold mb-6">{tResults('compatibility')}</h3>

            {/* Progress Bar */}
            <div className="mb-4 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-white"
                style={{ width: `${progressWidth}%` }}
              />
            </div>

            <p className="text-center text-5xl font-bold mb-6">{score}%</p>

            {/* Personality Report */}
            <div className="relative">
              {isDescriptionVisible ? (
                isReportLoading ? (
                  isTimeout ? (
                    <div className="w-full liquid-glass-card rounded-xl p-8 flex flex-col items-center justify-center min-h-[200px] space-y-4">
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
                  <p className="text-center text-body-sm text-white leading-relaxed mb-8">
                    {description || t('noDescription')}
                  </p>
                )
              ) : (
                <p className="text-center text-body-sm text-white">
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
              className="w-full liquid-glass-card rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-title-md font-bold">{t('career')}</h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${expandedSection === 'career' ? 'rotate-180' : ''
                    }`}
                />
              </div>
              {expandedSection === 'career' && (
                <p className="mt-4 text-body-sm text-white leading-relaxed">
                  {character?.career || t('careerDesc')}
                </p>
              )}
            </button>

            {/* Personality - 性格特点 */}
            <button
              onClick={() => toggleSection('personality')}
              className="w-full liquid-glass-card rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-title-md font-bold">{t('personality')}</h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${expandedSection === 'personality' ? 'rotate-180' : ''
                    }`}
                />
              </div>
              {expandedSection === 'personality' && (
                <p className="mt-4 text-body-sm text-white leading-relaxed">
                  {character?.personality || t('personalityDesc')}
                </p>
              )}
            </button>

            {/* Meeting Time - 相遇时机 */}
            <button
              onClick={() => toggleSection('meetingTime')}
              className="w-full liquid-glass-card rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-title-md font-bold">{t('meetingTime')}</h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${expandedSection === 'meetingTime' ? 'rotate-180' : ''
                    }`}
                />
              </div>
              {expandedSection === 'meetingTime' && (
                <p className="mt-4 text-body-sm text-white leading-relaxed">
                  {character?.meeting_time || t('meetingTimeDesc')}
                </p>
              )}
            </button>

            {/* Distance - 距离预测 */}
            <button
              onClick={() => toggleSection('distance')}
              className="w-full liquid-glass-card rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-title-md font-bold">{t('distance')}</h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${expandedSection === 'distance' ? 'rotate-180' : ''
                    }`}
                />
              </div>
              {expandedSection === 'distance' && (
                <p className="mt-4 text-body-sm text-white leading-relaxed">
                  {character?.distance || t('distanceDesc')}
                </p>
              )}
            </button>

            {/* Strength - 缘分优势 */}
            <button
              onClick={() => toggleSection('strength')}
              className="w-full liquid-glass-card rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-title-md font-bold">{t('strength')}</h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${expandedSection === 'strength' ? 'rotate-180' : ''
                    }`}
                />
              </div>
              {expandedSection === 'strength' && (
                <p className="mt-4 text-body-sm text-white leading-relaxed">
                  {character?.strength || t('strengthDesc')}
                </p>
              )}
            </button>

            {/* Challenge - 成长机遇 */}
            <button
              onClick={() => toggleSection('challenge')}
              className="w-full liquid-glass-card rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-title-md font-bold">{t('challenge')}</h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${expandedSection === 'challenge' ? 'rotate-180' : ''
                    }`}
                />
              </div>
              {expandedSection === 'challenge' && (
                <p className="mt-4 text-body-sm text-white leading-relaxed">
                  {character?.weakness || t('challengeDesc')}
                </p>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
