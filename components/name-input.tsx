'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useTranslations } from '@/components/i18n-provider'

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
  const { t } = useTranslations('name')
  const { t: tCommon } = useTranslations('common')

  const handleNext = () => {
    onChange(input)
    onNext()
  }

  return (
    <div
      className="h-full flex flex-col items-center p-8 relative overflow-hidden"
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-white font-mono text-xs uppercase tracking-[0.2em]">
            Sovereign Identity Registration
          </p>
        </div>

        <div className="w-full relative group">
          <input
            type="text"
            placeholder={t('placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-white/5 border-b-2 border-purple-500/30 text-2xl placeholder-white/20 focus:outline-none focus:border-purple-500 pb-4 transition-all duration-300 text-center font-bold"
          />
          <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-purple-500 to-pink-500 group-focus-within:w-full transition-all duration-500" />
        </div>
      </div>

      <div className="w-full max-w-md flex-shrink-0 mt-12 relative z-10">
        <Button
          onClick={handleNext}
          disabled={!input.trim()}
          className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all"
        >
          {tCommon('continue')}
        </Button>
      </div>
    </div>
  )
}
