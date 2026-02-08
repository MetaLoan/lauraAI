'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, Share2, Lock, Unlock, Loader2, CloudFog, MessageSquare } from 'lucide-react'
import { getFullImageUrl } from '@/lib/utils'
import { PaymentDrawer } from '@/components/payment-drawer'
import { apiClient } from '@/lib/api'
import { useTranslations, useI18n } from '@/components/i18n-provider'
import ReportLoading from '@/components/report-loading'

// 解锁状态枚举
const UnlockStatus = {
  LOCKED: 0,
  HALF_UNLOCKED: 1,
  FULL_UNLOCKED: 2,
} as const

// 角色类型映射到翻译键
const characterTypeToKey: Record<string, string> = {
  'Soulmate': 'soulmate',
  'Mini Me': 'miniMe',
  'Future Husband': 'futureHusband',
  'Future Baby': 'futureBaby',
  'Future Wife': 'futureWife',
  'Boyfriend': 'boyfriend',
  'Best Friend': 'bestFriend',
  'Girlfriend': 'girlfriend',
  'Mysterious Stranger': 'mysteriousStranger',
  'Wise Mentor': 'wiseMentor',
  'Dream Guide': 'dreamGuide',
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
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [unlockStatus, setUnlockStatus] = useState(character?.unlock_status ?? UnlockStatus.LOCKED)
  const [priceStars, setPriceStars] = useState(300)
  const [priceTON, setPriceTON] = useState(3)
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)

  const { t } = useTranslations('detail')
  const { t: tResults } = useTranslations('results')
  const { t: tCharacters } = useTranslations('characters')
  const { t: tCommon } = useTranslations('common')

  const rawTitle = character?.title || "Soulmate"
  const targetScore = character?.compatibility || 92
  const isMiniMe = character?.type === 'mini_me'

  // 获取本地化的角色名称
  const getLocalizedTitle = () => {
    const key = characterTypeToKey[rawTitle]
    return key ? tCharacters(key) : rawTitle
  }

  const title = getLocalizedTitle()

  // 根据解锁状态选择显示的图片
  const getDisplayImage = () => {
    switch (unlockStatus) {
      case UnlockStatus.FULL_UNLOCKED:
        return character?.clear_image_url || character?.image_url || character?.image || "/avatars/soulmate-female.jpg"
      case UnlockStatus.HALF_UNLOCKED:
        return character?.half_blur_image_url || character?.image_url || character?.image || "/avatars/soulmate-female.jpg"
      default: // LOCKED
        return character?.full_blur_image_url || character?.image_url || character?.image || "/avatars/soulmate-female.jpg"
    }
  }

  const image = getDisplayImage()

  // 性格报告只有完全解锁才可见
  const isDescriptionVisible = unlockStatus === UnlockStatus.FULL_UNLOCKED
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
          const updatedChar = await apiClient.getCharacter(character.id)

          if (updatedChar.description && updatedChar.description.length > 0) {
            // 更新本地数据，避免页面刷新
            if (onCharacterUpdate) {
              const currentCharacter = characterRef.current
              onCharacterUpdate({
                ...currentCharacter,
                description: updatedChar.description,
                career: updatedChar.career,
                personality: updatedChar.personality,
                meeting_time: updatedChar.meeting_time,
                distance: updatedChar.distance,
                strength: updatedChar.strength,
                weakness: updatedChar.weakness,
              })
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
    if (!character?.id) return
    try {
      await apiClient.retryReport(character.id)
      setIsTimeout(false)
      setIsPolling(true)
      setPollStartTime(Date.now())
    } catch (error) {
      console.error('Failed to retry report:', error)
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

  const handleShare = () => {
    const webApp = (window as any).Telegram?.WebApp
    const shareLink = `https://t.me/laura_tst_bot/app?startapp=char_${character?.id}_${character?.share_code}`

    if (unlockStatus === UnlockStatus.FULL_UNLOCKED) {
      // 1. 完全解锁状态：使用故事分享 (Stories) 展示高清图片
      const text = `OMG, my ${rawTitle} looks like this! You should try it too! 🔥`
      const imageUrl = getFullImageUrl(character?.clear_image_url || '')

      if (webApp?.shareToStory) {
        // 使用 shareToStory API 分享到故事
        webApp.shareToStory(imageUrl, {
          text: text,
          widget_link: {
            url: shareLink,
            name: "Create Your Own"
          }
        })
      } else {
        // Fallback: 普通分享
        webApp?.openTelegramLink?.(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`)
      }
    } else {
      // 2. 未解锁状态：使用普通分享链接
      const text = `Help me see what my ${rawTitle} looks like! I need your help 🥺`
      
      const url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`
      if (webApp?.openTelegramLink) {
        webApp.openTelegramLink(url)
      } else {
        window.open(url, '_blank')
      }
    }
  }

  // 拉起支付弹窗前获取最新的解锁状态和价格（价格由后端决定）
  const handleOpenPayment = async () => {
    setIsLoadingPrice(true)
    if (character?.id) {
      try {
        const priceInfo = await apiClient.getUnlockPrice(character.id.toString()) as { unlock_status: number, price_stars: number, price_ton: number }
        setUnlockStatus(priceInfo.unlock_status)
        setPriceStars(priceInfo.price_stars)
        setPriceTON(priceInfo.price_ton)
      } catch (error) {
        console.error('获取解锁价格失败:', error)
      }
    }
    setIsLoadingPrice(false)
    setIsPaymentOpen(true)
  }

  const handlePaymentSuccess = () => {
    setUnlockStatus(UnlockStatus.FULL_UNLOCKED)
    setIsPaymentOpen(false)
    onUnlockSuccess?.()
  }

  const handlePay = async (method: 'stars' | 'ton') => {
    if (!character?.id) return
    
    const result = await apiClient.unlockCharacter(character.id.toString(), method)
    
    // 更新本地 character 数据（如果有需要）
    if (character) {
      character.unlock_status = result.unlock_status
      character.clear_image_url = result.image_url
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-8 scrollbar-hide">
        {/* Portrait Card */}
        <div className="flex flex-col items-center space-y-4 pt-0">
          {/* Title above image */}
          <h2 className="text-title-lg text-balance text-center px-2 flex-shrink-0">{title}</h2>
          
          {/* Image with lock overlay */}
          <div className="w-full max-w-[280px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="w-full h-full bg-amber-200 flex items-center justify-center relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFullImageUrl(image)}
                alt={title}
                className="w-full h-full object-cover"
              />
              {/* Lock overlay for locked states */}
              {unlockStatus !== UnlockStatus.FULL_UNLOCKED && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                  <div className="bg-black/60 rounded-full p-4">
                    <CloudFog className="w-10 h-10 text-white" />
                  </div>
                  {/* 100% 模糊状态下的提示文字 */}
                  {unlockStatus === UnlockStatus.LOCKED && (
                    <p className="text-white/90 text-sm text-center mt-4 px-6 leading-relaxed">
                      {t('blurMessage')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons below image */}
          <div className="flex gap-3">
            {/* 只在 LOCKED 状态下显示邀请好友按钮 */}
            {unlockStatus === UnlockStatus.LOCKED && character?.share_code && (
              <button 
                onClick={handleShare}
                className="p-3 rounded-full border border-white/30 hover:border-white/50 transition-colors flex items-center gap-2 px-4"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-sm">{t('askFriendHelp')}</span>
              </button>
            )}
          </div>

          {/* Unlock status badge */}
          {unlockStatus === UnlockStatus.HALF_UNLOCKED && (
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-2 flex items-center gap-2">
              <Unlock className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-500">{t('friendHelped')}</span>
            </div>
          )}
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
            <div className="mb-4 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
                style={{ width: `${progressWidth}%` }}
              />
            </div>

            <p className="text-center text-5xl font-bold mb-6">{score}%</p>

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
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Lock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-400 font-medium">{t('unlockDescription')} 🔒</span>
                  </div>
                  <p className="text-center text-body-sm text-gray-500">
                    {t('unlockDescriptionHint')}
                  </p>
                </div>
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
                  className={`w-5 h-5 transition-transform ${
                    expandedSection === 'career' ? 'rotate-180' : ''
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
                  className={`w-5 h-5 transition-transform ${
                    expandedSection === 'personality' ? 'rotate-180' : ''
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
                  className={`w-5 h-5 transition-transform ${
                    expandedSection === 'meetingTime' ? 'rotate-180' : ''
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
                  className={`w-5 h-5 transition-transform ${
                    expandedSection === 'distance' ? 'rotate-180' : ''
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
                  className={`w-5 h-5 transition-transform ${
                    expandedSection === 'strength' ? 'rotate-180' : ''
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
                  className={`w-5 h-5 transition-transform ${
                    expandedSection === 'challenge' ? 'rotate-180' : ''
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

        {/* Bottom spacer for fixed button */}
        <div className="h-32" />
      </div>

      {/* Footer Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-transparent z-50">
        <div className="max-w-md mx-auto">
          {unlockStatus === UnlockStatus.FULL_UNLOCKED ? (
            <div className="flex gap-3">
              <Button
                onClick={onNext}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                {t('startChat')}
              </Button>
              <Button
                onClick={handleShare}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                {t('share')}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleOpenPayment}
              disabled={isLoadingPrice}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {isLoadingPrice ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {tCommon('loading')}
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5" />
                  {isMiniMe ? t('unlock') : t('unlockFull')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Payment Drawer */}
      <PaymentDrawer
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        characterName={title}
        characterType={unlockStatus === UnlockStatus.LOCKED ? t('locked') : unlockStatus === UnlockStatus.HALF_UNLOCKED ? t('halfUnlocked') : t('fullUnlocked')}
        characterImage={unlockStatus === UnlockStatus.HALF_UNLOCKED ? character?.half_blur_image_url : character?.full_blur_image_url}
        priceStars={priceStars}
        priceTON={priceTON}
        isDiscounted={unlockStatus === UnlockStatus.HALF_UNLOCKED}
        onPaymentSuccess={handlePaymentSuccess}
        onPay={handlePay}
      />
    </div>
  )
}
