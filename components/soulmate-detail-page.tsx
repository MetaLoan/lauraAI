'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, Share2, Lock, Unlock, Loader2, CloudFog } from 'lucide-react'
import { getFullImageUrl } from '@/lib/utils'
import { PaymentDrawer } from '@/components/payment-drawer'
import { apiClient } from '@/lib/api'

// 解锁状态枚举
const UnlockStatus = {
  LOCKED: 0,
  HALF_UNLOCKED: 1,
  FULL_UNLOCKED: 2,
} as const

interface SoulmateDetailPageProps {
  character?: {
    id?: string | number
    title?: string
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
    compatibility?: number
    astro_sign?: string
  }
  onNext: () => void
  onBack: () => void
  onShare?: (shareCode: string) => void
  onUnlockSuccess?: () => void
}

export default function SoulmateDetailPage({
  character,
  onNext,
  onBack,
  onShare,
  onUnlockSuccess,
}: SoulmateDetailPageProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [progressWidth, setProgressWidth] = useState(0)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [unlockStatus, setUnlockStatus] = useState(character?.unlock_status ?? UnlockStatus.LOCKED)
  const [priceStars, setPriceStars] = useState(300)
  const [priceTON, setPriceTON] = useState(3)
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)

  const title = character?.title || "Soulmate"
  const targetScore = character?.compatibility || 92

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
  const description = character?.description || `A harmonious partner who values balance and partnership (Libra Sun), brings emotional depth and nurturing (Cancer Moon), and offers dreamy empathy with intuitive sensitivity (Pisces Rising). They help soften boundaries, encourage diplomatic communication, and create a safe emotional haven where your intellectual curiosity and humanitarian ideals can flourish.`

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
      const text = `OMG, my ${title} looks like this! You should try it too! 🔥`
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
      const text = `Help me see what my ${title} looks like! I need your help 🥺`
      
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
      <div className="flex-1 overflow-y-auto px-6 pt-4 space-y-8 scrollbar-hide">
        {/* Portrait Card */}
        <div className="flex flex-col items-center space-y-4">
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
              {/* 模糊状态标签 */}
              <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                {unlockStatus === UnlockStatus.FULL_UNLOCKED ? '0% blur' : unlockStatus === UnlockStatus.HALF_UNLOCKED ? '20% blur' : '100% blur'}
              </div>
              {/* Lock overlay for locked states */}
              {unlockStatus !== UnlockStatus.FULL_UNLOCKED && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                  <div className="bg-black/60 rounded-full p-4">
                    <CloudFog className="w-10 h-10 text-white" />
                  </div>
                  {/* 100% 模糊状态下的提示文字 */}
                  {unlockStatus === UnlockStatus.LOCKED && (
                    <p className="text-white/90 text-sm text-center mt-4 px-6 leading-relaxed">
                      This photo is shrouded in mist.<br/>
                      Maybe a friend can help clear it.
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
                <span className="text-sm">Ask Friend to Help</span>
              </button>
            )}
          </div>

          {/* Unlock status badge */}
          {unlockStatus === UnlockStatus.HALF_UNLOCKED && (
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-2 flex items-center gap-2">
              <Unlock className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-500">Friend helped! 50% unlocked</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Compatibility Score */}
        <div className="mb-8">
          <h3 className="text-center text-title-md font-bold mb-6">Compatibility Score</h3>

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
              <p className="text-center text-body-sm text-gray-300 leading-relaxed mb-8">
                {description}
              </p>
            ) : (
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400 font-medium">Personality Report Locked</span>
                </div>
                <p className="text-center text-body-sm text-gray-500">
                  {unlockStatus === UnlockStatus.HALF_UNLOCKED 
                    ? `Pay ${priceStars} Stars or ${priceTON} TON to unlock the full report`
                    : 'Share with friends or pay to unlock the personality report'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Sections - Only visible when unlocked */}
        {isDescriptionVisible && (
          <div className="space-y-3">
            {/* Strength */}
            <button
              onClick={() => toggleSection('strength')}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-title-md font-bold">Strength</h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    expandedSection === 'strength' ? 'rotate-180' : ''
                  }`}
                />
              </div>
              {expandedSection === 'strength' && (
                <p className="mt-4 text-body-sm text-gray-300 leading-relaxed">
                  Together you radiate loyalty, passion, and determination. Your bond thrives on
                  honesty, shared goals, and the ability to support each other's dreams.
                </p>
              )}
            </button>

            {/* Weakness */}
            <button
              onClick={() => toggleSection('weakness')}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-title-md font-bold">Weakness</h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    expandedSection === 'weakness' ? 'rotate-180' : ''
                  }`}
                />
              </div>
              {expandedSection === 'weakness' && (
                <p className="mt-4 text-body-sm text-gray-300 leading-relaxed">
                  At times, stubbornness and emotional intensity may create friction. Misunderstandings
                  can arise if space and patience are not given, but awareness helps transform these
                  into growth.
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
            <Button
              onClick={handleShare}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share with Friends
            </Button>
          ) : (
            <Button
              onClick={handleOpenPayment}
              disabled={isLoadingPrice}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {isLoadingPrice ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5" />
                  Unlock Photo and Report
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
        characterType={character?.astro_sign || 'Soulmate'}
        characterImage={character?.half_blur_image_url || character?.full_blur_image_url}
        priceStars={priceStars}
        priceTON={priceTON}
        isDiscounted={unlockStatus === UnlockStatus.HALF_UNLOCKED}
        onPaymentSuccess={handlePaymentSuccess}
        onPay={handlePay}
      />
    </div>
  )
}
