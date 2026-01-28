'use client'

import { Button } from '@/components/ui/button'
import { SelectionButton } from '@/components/ui/selection-button'

export default function GenderSelect({
  value,
  onChange,
  onNext,
  onBack,
  title,
}: {
  value: string
  onChange: (val: string) => void
  onNext: () => void
  onBack: () => void
  title: string
}) {
  const options = ['Male', 'Female', 'Other']

  const handleSelect = (option: string) => {
    onChange(option)
    setTimeout(onNext, 300)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-between p-6">
      {/* Back button */}
      <div className="w-full flex justify-start mb-4">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-full border border-gray-600 flex items-center justify-center hover:border-gray-400 transition-colors"
        >
          <span className="text-2xl">&lt;</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        <h1 className="text-4xl font-bold mb-12 text-balance">{title}</h1>

        <div className="w-full space-y-4">
          {options.map((option) => (
            <SelectionButton
              key={option}
              label={option}
              isSelected={value === option}
              onClick={() => handleSelect(option)}
            />
          ))}
        </div>
      </div>

      <div className="w-full" />
    </div>
  )
}
