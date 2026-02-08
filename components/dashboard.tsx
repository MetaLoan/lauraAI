'use client'

import { useState, useEffect } from 'react'
import { Clock, User, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { getAssetPath, getFullImageUrl } from '@/lib/utils'
import { useTranslations, useI18n } from '@/components/i18n-provider'
import { LanguageSwitcherCompact } from '@/components/language-switcher'

interface CharacterCard {
  id: string
  title: string
  image: string
  image_url?: string
  full_blur_image_url?: string
  half_blur_image_url?: string
  clear_image_url?: string
  unlock_status?: number
  share_code?: string
  type: string
  requiresUpload?: boolean
  description?: string
  strength?: string      // AI 生成的优势分析
  weakness?: string      // AI 生成的挑战分析
  compatibility?: number
  astro_sign?: string
  gender?: string
  ethnicity?: string
}

interface BackendCharacter {
  id: number
  type: string
  title: string
  image_url?: string
  full_blur_image_url?: string
  half_blur_image_url?: string
  clear_image_url?: string
  unlock_status?: number
  share_code?: string
  gender?: string
  ethnicity?: string
  description?: string
  strength?: string      // AI 生成的优势分析
  weakness?: string      // AI 生成的挑战分析
  compatibility?: number
  astro_sign?: string
}

// 角色类型定义
interface CharacterType {
  type: string
  titleKey: string  // 翻译键
  title: string     // 默认英文标题（用于后端）
  placeholder: string
  requiresUpload?: boolean
}

// 各分类的角色类型（包含占位图路径）
const trendingTypes: CharacterType[] = [
  { type: 'soulmate', titleKey: 'soulmate', title: 'Soulmate', placeholder: '/avatars/placeholders/soulmate.png' },
  { type: 'mini_me', titleKey: 'miniMe', title: 'Mini Me', placeholder: '/avatars/placeholders/mini_me.png', requiresUpload: true },
]

const familyTypes: CharacterType[] = [
  { type: 'future_husband', titleKey: 'futureHusband', title: 'Future Husband', placeholder: '/avatars/placeholders/future_husband.png' },
  { type: 'future_baby', titleKey: 'futureBaby', title: 'Future Baby', placeholder: '/avatars/placeholders/future_baby.png' },
  { type: 'future_wife', titleKey: 'futureWife', title: 'Future Wife', placeholder: '/avatars/placeholders/future_wife.png' },
]

const friendTypes: CharacterType[] = [
  { type: 'boyfriend', titleKey: 'boyfriend', title: 'Boyfriend', placeholder: '/avatars/placeholders/boyfriend.png' },
  { type: 'best_friend', titleKey: 'bestFriend', title: 'Best Friend', placeholder: '/avatars/placeholders/best_friend.png' },
  { type: 'girlfriend', titleKey: 'girlfriend', title: 'Girlfriend', placeholder: '/avatars/placeholders/girlfriend.png' },
]

const companionTypes: CharacterType[] = [
  { type: 'mysterious_stranger', titleKey: 'mysteriousStranger', title: 'Mysterious Stranger', placeholder: '/avatars/placeholders/mysterious_stranger.png' },
  { type: 'wise_mentor', titleKey: 'wiseMentor', title: 'Wise Mentor', placeholder: '/avatars/placeholders/wise_mentor.png' },
  { type: 'dream_guide', titleKey: 'dreamGuide', title: 'Dream Guide', placeholder: '/avatars/placeholders/dream_guide.png' },
]

export default function Dashboard({ 
  onSelectCharacter,
  onOpenProfile,
  onCreateCharacter,
  onOpenHistory,
  onOpenMiniMe
}: { 
  onSelectCharacter?: (char: CharacterCard) => void
  onOpenProfile?: () => void
  onCreateCharacter?: (charType: { type: string; title: string; placeholder?: string }) => void
  onOpenHistory?: () => void
  onOpenMiniMe?: () => void
}) {
  const [userCharacters, setUserCharacters] = useState<CharacterCard[]>([])
  const [loading, setLoading] = useState(true)
  
  const { t: tDashboard } = useTranslations('dashboard')
  const { t: tCharacters } = useTranslations('characters')
  const { t: tCommon } = useTranslations('common')

  // 从后端加载用户已创建的角色列表
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const data = await apiClient.getCharacters() as BackendCharacter[]
        
        // 将后端数据转换为 CharacterCard 格式
        const characters: CharacterCard[] = data.map((char) => ({
          id: char.id.toString(),
          title: char.title || 'Untitled',
          image: char.image_url || '',
          image_url: char.image_url || '',
          full_blur_image_url: char.full_blur_image_url,
          half_blur_image_url: char.half_blur_image_url,
          clear_image_url: char.clear_image_url,
          unlock_status: char.unlock_status,
          share_code: char.share_code,
          type: char.type,
          requiresUpload: char.type === 'mini_me',
          description: char.description,
          compatibility: char.compatibility,
          astro_sign: char.astro_sign,
          gender: char.gender,
          ethnicity: char.ethnicity,
        }))

        setUserCharacters(characters)
      } catch (error) {
        console.error('加载角色失败:', error)
        setUserCharacters([])
      } finally {
        setLoading(false)
      }
    }

    loadCharacters()
  }, [])

  // 检查某个类型的角色是否已创建，优先返回有图片的角色
  const getCharacterByType = (type: string): CharacterCard | undefined => {
    const matchingChars = userCharacters.filter(char => char.type === type)
    // 优先返回有图片的角色
    const withImage = matchingChars.find(char => char.image && char.image.length > 0)
    return withImage || matchingChars[0]
  }

  // 点击已创建的角色
  const handleCharacterSelect = (character: CharacterCard) => {
    if (onSelectCharacter) {
      onSelectCharacter(character)
    }
  }

  // 点击添加按钮，创建新角色
  const handleCreateNewCharacter = (charType: CharacterType) => {
    if (charType.requiresUpload) {
      // Mini Me requires upload
      if (onOpenMiniMe) {
        onOpenMiniMe()
      }
    } else if (onCreateCharacter) {
      // 使用父组件的创建流程，包含占位图路径
      // 注意：传递英文标题给后端
      onCreateCharacter({ type: charType.type, title: charType.title, placeholder: charType.placeholder })
    }
  }

  // 获取本地化的角色标题
  const getLocalizedTitle = (charType: CharacterType) => {
    return tCharacters(charType.titleKey)
  }

  // 渲染角色卡片或添加按钮
  const renderCharacterSlot = (charType: CharacterType, gradientClass: string) => {
    const existingChar = getCharacterByType(charType.type)
    const localizedTitle = getLocalizedTitle(charType)
    
    if (existingChar && existingChar.image) {
      // 根据解锁状态选择显示的图片
      const getDisplayImage = () => {
        switch (existingChar.unlock_status) {
          case 2: // FULL_UNLOCKED
            return existingChar.clear_image_url || existingChar.image_url || existingChar.image
          case 1: // HALF_UNLOCKED
            return existingChar.half_blur_image_url || existingChar.image_url || existingChar.image
          default: // LOCKED (0)
            return existingChar.full_blur_image_url || existingChar.image_url || existingChar.image
        }
      }
      const displayImage = getDisplayImage()
      // 如果图片URL为空，使用占位图
      const finalImageUrl = displayImage ? getFullImageUrl(displayImage) : getFullImageUrl(charType.placeholder || '/avatars/placeholders/placeholder.png')
      
      // 已创建的角色 - 显示图片
      return (
        <button
          key={charType.type}
          onClick={() => handleCharacterSelect(existingChar)}
          className="flex flex-col items-center gap-3 group flex-shrink-0"
        >
          <div className={`w-36 h-36 rounded-2xl ${gradientClass} hover:opacity-90 transition-all flex items-center justify-center overflow-hidden relative`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={finalImageUrl}
              alt={localizedTitle}
              className="w-full h-full object-cover"
              onError={(e) => {
                // 如果图片加载失败，使用占位图
                const target = e.target as HTMLImageElement
                target.src = getFullImageUrl(charType.placeholder || '/avatars/placeholders/placeholder.png')
              }}
            />
          </div>
          <p className="text-xs font-medium text-center">{localizedTitle}</p>
        </button>
      )
    } else {
      // 未创建的角色 - 显示占位图
      return (
        <button
          key={charType.type}
          onClick={() => handleCreateNewCharacter(charType)}
          className="flex flex-col items-center gap-3 group flex-shrink-0"
        >
          <div className={`w-36 h-36 rounded-2xl overflow-hidden relative hover:opacity-80 transition-all`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getFullImageUrl(charType.placeholder)}
              alt={localizedTitle}
              className="w-full h-full object-cover"
            />
            {/* 添加图标覆盖层 */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus className="w-10 h-10 text-white" />
            </div>
          </div>
          <p className="text-xs font-medium text-center text-white/60">{localizedTitle}</p>
        </button>
      )
    }
  }
  return (
    <div className="h-full pb-8 overflow-y-auto">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-6 pb-4"
        style={{
          marginTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px))'
        }}
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onOpenHistory?.()}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Clock className="w-6 h-6" />
          </button>
          <button 
            onClick={() => onOpenProfile?.()}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <User className="w-6 h-6" />
          </button>
        </div>
        <LanguageSwitcherCompact />
      </div>

      {/* Content */}
      <div className="px-6 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="loading-spinner" />
          </div>
        ) : (
          <>
            {/* Trending Section */}
            <div>
              <h2 className="text-title-md font-bold mb-4">{tDashboard('trending')}</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                {trendingTypes.map((charType) => renderCharacterSlot(charType, 'bg-gradient-to-b from-amber-200 to-amber-400'))}
              </div>
            </div>

            {/* Family Section */}
            <div>
              <h2 className="text-title-md font-bold mb-4">{tDashboard('family')}</h2>
              <div className="overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                <div className="flex gap-4 min-w-min">
                  {familyTypes.map((charType) => renderCharacterSlot(charType, 'bg-gradient-to-b from-amber-900 to-gray-800'))}
                </div>
              </div>
            </div>

            {/* Friend Section */}
            <div>
              <h2 className="text-title-md font-bold mb-4">{tDashboard('friends')}</h2>
              <div className="overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                <div className="flex gap-4 min-w-min">
                  {friendTypes.map((charType) => renderCharacterSlot(charType, 'bg-gradient-to-b from-gray-700 to-gray-900'))}
                </div>
              </div>
            </div>

            {/* Companion Section */}
            <div>
              <h2 className="text-title-md font-bold mb-4">{tDashboard('companions')}</h2>
              <div className="overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                <div className="flex gap-4 min-w-min">
                  {companionTypes.map((charType) => renderCharacterSlot(charType, 'bg-gradient-to-b from-gray-800 to-black'))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  )
}
