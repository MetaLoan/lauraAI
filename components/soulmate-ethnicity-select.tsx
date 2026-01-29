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
    <div className="h-full flex flex-col px-6 pt-6">
      {/* Fixed Header */}
      <div className="flex-shrink-0 w-full max-w-md mx-auto mb-6">
        <h1 className="text-title-lg text-balance text-center">
          What ethnic background for your {characterTitle}?
        </h1>
      </div>

      {/* Scrollable Options List */}
      <div className="flex-1 w-full max-w-md mx-auto overflow-y-auto scrollbar-hide -mx-6 px-6 pb-32">
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

      {/* Fixed Footer Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-10 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <Button
            onClick={onNext}
            disabled={!value}
            className="btn-primary disabled:btn-disabled shadow-xl"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
