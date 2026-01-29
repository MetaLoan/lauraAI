'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, AlertCircle, RefreshCw } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface CharacterCreationFormProps {
  characterName: string
  characterType?: string
  onBack: () => void
  onComplete: () => void
}

export default function CharacterCreationForm({
  characterName,
  characterType = 'companion',
  onBack,
  onComplete,
}: CharacterCreationFormProps) {
  const [gender, setGender] = useState('')
  const [ethnicity, setEthnicity] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ethnicities = [
    'Black / African',
    'Middle Eastern',
    'East Asian',
    'South Asian',
    'Southeast Asian',
    'White',
    'Hispanic / Latino',
    'Indigenous',
    'Mixed',
  ]

  const handleComplete = async () => {
    if (!gender || !ethnicity) return

    setIsLoading(true)
    setError(null)

    try {
      // 创建角色
      const character = await apiClient.createCharacter({
        type: characterType,
        title: characterName,
        gender: gender,
        ethnicity: ethnicity,
      })

      if (!character || !(character as any).id) {
        throw new Error('创建角色失败：未返回有效的角色数据')
      }

      // 生成角色图片
      const imageResult = await apiClient.generateImage((character as any).id.toString())
      if (!imageResult || !(imageResult as any).image_url) {
        throw new Error('生成图片失败：未返回有效的图片数据')
      }

      console.log('角色创建成功:', character)
      onComplete()
    } catch (err) {
      console.error('创建角色失败:', err)
      setError(err instanceof Error ? err.message : '创建失败，请重试')
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        <div className="loading-spinner mb-6" />
        <h1 className="text-title-md font-bold text-center mb-4">Creating {characterName}...</h1>
        <p className="text-body-md text-gray-400 text-center max-w-sm">
          Crafting your perfect {characterName} with personalized traits and generating AI portrait.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-title-md font-bold text-center mb-4 text-red-500">Creation Failed</h1>
        <p className="text-body-md text-gray-400 text-center max-w-sm mb-8">{error}</p>
        <div className="flex gap-4">
          <Button
            onClick={() => setError(null)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Retry
          </Button>
          <Button
            onClick={onBack}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-full font-semibold"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 sticky top-0 bg-black/50 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-title-md font-bold flex-1">Create {characterName}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        {/* Gender Selection */}
        <div className="mb-8">
          <h2 className="text-body-lg font-semibold mb-4">What is their gender?</h2>
          <div className="space-y-3">
            {['Male', 'Female', 'Other'].map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left font-medium ${
                  gender === g
                    ? 'bg-white text-black border-white'
                    : 'bg-gray-900 text-white border-gray-700 hover:border-gray-600'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Ethnicity Selection */}
        <div className="mb-8">
          <h2 className="text-body-lg font-semibold mb-4">What is their ethnic background?</h2>
          <div className="space-y-3">
            {ethnicities.map((e) => (
              <button
                key={e}
                onClick={() => setEthnicity(e)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left font-medium flex items-center justify-between ${
                  ethnicity === e
                    ? 'bg-white text-black border-white'
                    : 'bg-gray-900 text-white border-gray-700 hover:border-gray-600'
                }`}
              >
                {e}
                {ethnicity === e && <span className="text-lg">✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 px-6 py-4 bg-black/50 backdrop-blur-sm border-t border-white/10">
        <Button
          onClick={handleComplete}
          disabled={!gender || !ethnicity}
          className="btn-primary disabled:btn-disabled"
        >
          Create {characterName}
        </Button>
      </div>
    </div>
  )
}
