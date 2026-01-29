'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, X, Share2 } from 'lucide-react'
import { getAssetPath } from '@/lib/utils'

interface SoulmateDetailPageProps {
  character?: {
    id?: string | number
    title?: string
    image?: string
    image_url?: string
    gender?: string
    ethnicity?: string
    description?: string
    compatibility?: number
    astro_sign?: string
  }
  onNext: () => void
  onBack: () => void
}

export default function SoulmateDetailPage({
  character,
  onNext,
  onBack,
}: SoulmateDetailPageProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [progressWidth, setProgressWidth] = useState(0)

  const title = character?.title || "Your Soulmate"
  // 优先使用 image_url（后端返回），其次是 image（旧格式）
  const image = character?.image_url || character?.image || "/avatars/soulmate-female.jpg"
  const description = character?.description || `A harmonious partner who values balance and partnership (Libra Sun), brings emotional depth and nurturing (Cancer Moon), and offers dreamy empathy with intuitive sensitivity (Pisces Rising). They help soften boundaries, encourage diplomatic communication, and create a safe emotional haven where your intellectual curiosity and humanitarian ideals can flourish.`
  const targetScore = character?.compatibility || 92

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
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="min-h-screen flex flex-col pb-32">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
        <button
          onClick={onBack}
          className="p-3 rounded-full border border-white/30 hover:border-white/50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold">{title}</h2>
        <button className="p-3 rounded-full border border-white/30 hover:border-white/50 transition-colors">
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 space-y-8 scrollbar-hide">
        {/* Portrait Card */}
        <div className="flex justify-center">
          <div className="w-full max-w-[280px] aspect-[3/4] rounded-3xl border-4 border-amber-700 p-2 bg-gradient-to-br from-amber-100 to-amber-50 shadow-2xl">
            <div className="w-full h-full bg-amber-200 rounded-2xl flex items-center justify-center overflow-hidden relative">
              {/* 使用原生 img 标签以支持 base64 图片 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getAssetPath(image)}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Compatibility Score */}
        <div className="mb-8">
          <h3 className="text-center text-2xl font-bold mb-6">Compatibility Score</h3>

          {/* Progress Bar */}
          <div className="mb-4 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
              style={{ width: `${progressWidth}%` }}
            />
          </div>

          <p className="text-center text-5xl font-bold mb-6">{score}%</p>

          <p className="text-center text-sm text-gray-300 leading-relaxed mb-8">
            {description}
          </p>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-3">
          {/* Strength */}
          <button
            onClick={() => toggleSection('strength')}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold">Strength</h4>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  expandedSection === 'strength' ? 'rotate-180' : ''
                }`}
              />
            </div>
            {expandedSection === 'strength' && (
              <p className="mt-4 text-sm text-gray-300 leading-relaxed">
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
              <h4 className="text-xl font-bold">Weakness</h4>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  expandedSection === 'weakness' ? 'rotate-180' : ''
                }`}
              />
            </div>
            {expandedSection === 'weakness' && (
              <p className="mt-4 text-sm text-gray-300 leading-relaxed">
                At times, stubbornness and emotional intensity may create friction. Misunderstandings
                can arise if space and patience are not given, but awareness helps transform these
                into growth.
              </p>
            )}
          </button>
        </div>
      </div>

      {/* Footer Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/60 backdrop-blur-md z-50">
        <div className="max-w-md mx-auto">
          <Button
            onClick={onNext}
            className="w-full bg-white text-black hover:bg-gray-100 py-6 rounded-xl text-lg font-semibold"
          >
            Say "Hello" to {title}..
          </Button>
        </div>
      </div>
    </div>
  )
}
