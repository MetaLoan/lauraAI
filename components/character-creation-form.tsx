'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

interface CharacterCreationFormProps {
  characterName: string
  onBack: () => void
  onComplete: () => void
}

export default function CharacterCreationForm({
  characterName,
  onBack,
  onComplete,
}: CharacterCreationFormProps) {
  const [gender, setGender] = useState('')
  const [ethnicity, setEthnicity] = useState('')
  const [loadingComplete, setLoadingComplete] = useState(false)

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

  const handleComplete = () => {
    if (gender && ethnicity) {
      setLoadingComplete(true)
      setTimeout(() => {
        onComplete()
      }, 2000)
    }
  }

  if (loadingComplete) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-6" />
        <h1 className="text-2xl font-bold text-center mb-4">Creating {characterName}...</h1>
        <p className="text-gray-400 text-center max-w-sm">
          Crafting your perfect {characterName} with personalized traits.
        </p>
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
        <h1 className="text-xl font-bold flex-1">Create {characterName}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        {/* Gender Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">What is their gender?</h2>
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
          <h2 className="text-lg font-semibold mb-4">What is their ethnic background?</h2>
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
          className="w-full bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl text-lg font-semibold"
        >
          Create {characterName}
        </Button>
      </div>
    </div>
  )
}
