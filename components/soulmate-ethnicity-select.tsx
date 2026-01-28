'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { SelectionButton } from '@/components/ui/selection-button'

interface SoulmateEthnicitySelectProps {
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
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
}: SoulmateEthnicitySelectProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-8">
      <div className="w-full">
        <button
          onClick={onBack}
          className="mb-12 p-3 rounded-full border border-white/20 hover:border-white/40 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <h1 className="text-4xl font-bold mb-6">
          Could you share their ethnic background?
        </h1>

        <div className="space-y-3 mb-8">
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

      <Button
        onClick={onNext}
        disabled={!value}
        className="w-full bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed py-6 rounded-xl text-lg font-semibold"
      >
        Continue
      </Button>
    </div>
  )
}
