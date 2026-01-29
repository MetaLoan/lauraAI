'use client'

import { Button } from '@/components/ui/button'
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
    <div className="h-full flex flex-col p-6">
      {/* Fixed Header */}
      <div className="flex-shrink-0 w-full max-w-md mx-auto mb-6">
        <h1 className="text-title-lg text-balance text-center">
          What ethnic background for your {characterTitle}?
        </h1>
      </div>

      {/* Scrollable Options List */}
      <div className="flex-1 w-full max-w-md mx-auto overflow-y-auto scrollbar-hide mb-6 pb-20">
        <div className="w-full space-y-3">
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

      {/* Fixed Footer Button - transparent background with gradient */}
      <div className="fixed bottom-0 left-0 right-0 h-32 z-10 pointer-events-none bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="max-w-md mx-auto h-full flex items-center px-6 pointer-events-auto">
          <Button
            onClick={onNext}
            disabled={!value}
            className="btn-primary disabled:btn-disabled"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
