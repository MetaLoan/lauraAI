'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { SelectionButton } from '@/components/ui/selection-button'

export default function SoulmateGenderSelect({
  value,
  onChange,
  onNext,
  onBack,
  characterTitle = 'Soulmate',
}: {
  value: string
  onChange: (val: string) => void
  onNext: () => void
  onBack: () => void
  characterTitle?: string
}) {
  const options = ['Male', 'Female', 'Other']

  const handleSelect = (option: string) => {
    onChange(option)
  }

  return (
    <div className="h-full bg-black flex flex-col items-center p-6">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-6">
        <h1 className="text-title-lg text-balance text-center px-2 flex-shrink-0">
          Let's bring your {characterTitle} to life 🔮 What is their gender?
        </h1>

        <div className="w-full space-y-4 mt-8">
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

      <div className="w-full max-w-md flex-shrink-0">
        <Button
          onClick={() => {
            onChange(value)
            onNext()
          }}
          disabled={!value}
          className="btn-primary disabled:btn-disabled"
        >
          Create {characterTitle}
        </Button>
      </div>
    </div>
  )
}
