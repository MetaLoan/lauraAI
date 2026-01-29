'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { SelectionButton } from '@/components/ui/selection-button'

export default function EthnicitySelect({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: string
  onChange: (val: string) => void
  onNext: () => void
  onBack: () => void
}) {
  const options = [
    'East Asian',
    'South Asian',
    'Southeast Asian',
    'White',
    'Hispanic / Latino',
    'Indigenous',
    'Mixed',
    'Prefer not to say',
  ]

  const handleSelect = (option: string) => {
    onChange(option)
  }

  return (
    <div className="h-full bg-black flex flex-col p-6">
      {/* Fixed Header */}
      <div className="flex-shrink-0 w-full max-w-md mx-auto mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-balance text-center">
          Last question, could you share your ethnic background?
        </h1>
      </div>

      {/* Scrollable Options List */}
      <div className="flex-1 w-full max-w-md mx-auto overflow-y-auto scrollbar-hide mb-6">
        <div className="w-full space-y-3">
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

      {/* Fixed Footer Button */}
      <div className="flex-shrink-0 w-full max-w-md mx-auto">
          <Button
            onClick={() => {
              onChange(value)
              onNext()
            }}
            disabled={!value}
            className="w-full bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed h-14 text-lg font-semibold rounded-xl"
          >
            Continue
          </Button>
      </div>
    </div>
  )
}
