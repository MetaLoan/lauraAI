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

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md pb-32">
        <h1 className="text-3xl font-bold mb-8 text-balance">
          Last question, could you share your ethnic background?
        </h1>

        <div className="w-full space-y-3 mb-8">
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

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/60 backdrop-blur-md z-50">
        <div className="max-w-md mx-auto">
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
    </div>
  )
}
