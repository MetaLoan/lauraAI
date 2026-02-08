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
      className="h-full bg-black flex flex-col items-center p-6"
      style={{
        paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px) + 24px)'
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-8">
        <h1 className="text-title-lg text-balance text-center px-2 flex-shrink-0">
          {t('title')}
        </h1>

        <input
          type="text"
          placeholder={t('placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-transparent border-b border-gray-600 text-body-lg placeholder-gray-600 focus:outline-none focus:border-gray-400 pb-2 mb-12 transition-colors"
        />
      </div>

      <div className="w-full max-w-md flex-shrink-0">
        <Button
          onClick={handleNext}
          disabled={!input.trim()}
          className="btn-primary disabled:btn-disabled"
        >
          {tCommon('continue')}
        </Button>
      </div>
    </div>
  )
}
