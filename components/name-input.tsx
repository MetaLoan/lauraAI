'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function NameInput({
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
  const [input, setInput] = useState(value)

  const handleNext = () => {
    onChange(input)
    onNext()
  }

  return (
    <div className="h-full bg-black flex flex-col items-center p-6">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-balance text-center px-2 flex-shrink-0">
          Let's begin your journey. What's your name?
        </h1>

        <input
          type="text"
          placeholder="Name"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-transparent border-b border-gray-600 text-2xl placeholder-gray-600 focus:outline-none focus:border-gray-400 pb-2 mb-12 transition-colors"
        />
      </div>

      <div className="w-full max-w-md flex-shrink-0">
        <Button
          onClick={handleNext}
          disabled={!input.trim()}
          className="w-full bg-white text-black hover:bg-gray-100 disabled:bg-gray-600 disabled:text-gray-400 disabled:opacity-100 disabled:cursor-not-allowed h-14 text-lg font-semibold rounded-xl"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
