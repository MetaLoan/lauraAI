'use client'

import { useState, useEffect } from 'react'
import { Clock, User, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { getAssetPath } from '@/lib/utils'

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
  compatibility?: number
  astro_sign?: string
}

// 角色类型定义
interface CharacterType {
  type: string
  title: string
  placeholder: string
  requiresUpload?: boolean
}

// 各分类的角色类型（包含占位图路径）
const trendingTypes: CharacterType[] = [
  { type: 'soulmate', title: 'Your Soulmate', placeholder: '/avatars/placeholders/soulmate.png' },
  { type: 'mini_me', title: 'Mini Me', placeholder: '/avatars/placeholders/mini_me.png', requiresUpload: true },
]

const familyTypes: CharacterType[] = [
  { type: 'future_husband', title: 'Future Husband', placeholder: '/avatars/placeholders/future_husband.png' },
  { type: 'future_baby', title: 'Future Baby', placeholder: '/avatars/placeholders/future_baby.png' },
  { type: 'future_wife', title: 'Future Wife', placeholder: '/avatars/placeholders/future_wife.png' },
]

const friendTypes: CharacterType[] = [
  { type: 'boyfriend', title: 'Boyfriend', placeholder: '/avatars/placeholders/boyfriend.png' },
  { type: 'best_friend', title: 'Best Friend', placeholder: '/avatars/placeholders/best_friend.png' },
  { type: 'girlfriend', title: 'Girlfriend', placeholder: '/avatars/placeholders/girlfriend.png' },
]

const companionTypes: CharacterType[] = [
  { type: 'mysterious_stranger', title: 'Mysterious Stranger', placeholder: '/avatars/placeholders/mysterious_stranger.png' },
  { type: 'wise_mentor', title: 'Wise Mentor', placeholder: '/avatars/placeholders/wise_mentor.png' },
  { type: 'dream_guide', title: 'Dream Guide', placeholder: '/avatars/placeholders/dream_guide.png' },
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
  const [language, setLanguage] = useState<'en' | 'ru' | 'zh'>('en') // 语言状态：en=英语, ru=俄语, zh=中文

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
      onCreateCharacter({ type: charType.type, title: charType.title, placeholder: charType.placeholder })
    }
  }

  // 渲染角色卡片或添加按钮
  const renderCharacterSlot = (charType: CharacterType, gradientClass: string) => {
    const existingChar = getCharacterByType(charType.type)
    
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
      const blurLabel = existingChar.unlock_status === 2 ? '0% blur' : existingChar.unlock_status === 1 ? '50% blur' : '100% blur'
      
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
              src={getAssetPath(displayImage)}
              alt={existingChar.title}
              className="w-full h-full object-cover"
            />
            {/* 模糊状态标签 */}
            <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full">
              {blurLabel}
            </div>
          </div>
          <p className="text-xs font-medium text-center">{existingChar.title}</p>
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
              src={getAssetPath(charType.placeholder)}
              alt={charType.title}
              className="w-full h-full object-cover"
            />
            {/* 添加图标覆盖层 */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus className="w-10 h-10 text-white" />
            </div>
          </div>
          <p className="text-xs font-medium text-center text-white/60">{charType.title}</p>
        </button>
      )
    }
  }
  return (
    <div className="flex-1 pb-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
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
        <button 
          onClick={() => {
            if (language === 'en') setLanguage('ru')
            else if (language === 'ru') setLanguage('zh')
            else setLanguage('en')
          }}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
          title={language === 'en' ? 'Switch to Russian' : language === 'ru' ? 'Switch to Chinese' : 'Switch to English'}
        >
          <span className="text-2xl leading-none">
            {language === 'en' ? '🇬🇧' : language === 'ru' ? '🇷🇺' : '🇨🇳'}
          </span>
        </button>
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
              <h2 className="text-title-md font-bold mb-4">Trending</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                {trendingTypes.map((charType) => renderCharacterSlot(charType, 'bg-gradient-to-b from-amber-200 to-amber-400'))}
              </div>
            </div>

            {/* Family Section */}
            <div>
              <h2 className="text-title-md font-bold mb-4">Draw & Chat with Your AI Family</h2>
              <div className="overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                <div className="flex gap-4 min-w-min">
                  {familyTypes.map((charType) => renderCharacterSlot(charType, 'bg-gradient-to-b from-amber-900 to-gray-800'))}
                </div>
              </div>
            </div>

            {/* Friend Section */}
            <div>
              <h2 className="text-title-md font-bold mb-4">Draw & Chat with Your AI Friend</h2>
              <div className="overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                <div className="flex gap-4 min-w-min">
                  {friendTypes.map((charType) => renderCharacterSlot(charType, 'bg-gradient-to-b from-gray-700 to-gray-900'))}
                </div>
              </div>
            </div>

            {/* Companion Section */}
            <div>
              <h2 className="text-title-md font-bold mb-4">Draw & Chat with Your AI Companion</h2>
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
