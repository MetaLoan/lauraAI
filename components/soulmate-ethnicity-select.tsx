'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { SelectionButton } from '@/components/ui/selection-button'

interface SoulmateEthnicitySelectProps {
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
  characterTitle?: string
}

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
  'Prefer not to say',
]

export default function SoulmateEthnicitySelect({
  value,
  onChange,
  onNext,
  onBack,
  characterTitle = 'Soulmate',
}: SoulmateEthnicitySelectProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-8">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md pb-32">
        <div className="w-full flex justify-start mb-4">
          <button
            onClick={onBack}
            className="p-3 rounded-full border border-white/20 hover:border-white/40 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <h1 className="text-4xl font-bold mb-6">
          What ethnic background for your {characterTitle}?
        </h1>

        <div className="w-full space-y-3 mb-8">
          {ethnicities.map((ethnicity) => (
            <SelectionButton
              key={ethnicity}
              label={ethnicity}
              isSelected={value === ethnicity}
              onClick={() => onChange(ethnicity)}
            />
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/60 backdrop-blur-md z-50">
        <div className="max-w-md mx-auto">
          <Button
            onClick={onNext}
            disabled={!value}
            className="w-full bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed h-14 rounded-xl text-lg font-semibold"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
