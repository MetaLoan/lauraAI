'use client'

import { Button } from '@/components/ui/button'
import { SelectionButton } from '@/components/ui/selection-button'
import { useTranslations } from '@/components/i18n-provider'

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
  const { t } = useTranslations('gender')

  // 内部值到翻译键的映射
  const options = [
    { value: 'Male', labelKey: 'male' },
    { value: 'Female', labelKey: 'female' },
    { value: 'Other', labelKey: 'other' },
  ]

  const handleSelect = (option: string) => {
    onChange(option)
    setTimeout(onNext, 300)
  }

  // 使用传入的 title 或默认翻译
  const displayTitle = title === 'What is your gender?' ? t('title') : title

  return (
    <div className="h-full bg-black flex flex-col items-center p-6">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-8">
        <h1 className="text-title-lg text-balance text-center px-2 flex-shrink-0">{displayTitle}</h1>

        <div className="w-full space-y-4">
          {options.map((option) => (
            <SelectionButton
              key={option.value}
              label={t(option.labelKey)}
              isSelected={value === option.value}
              onClick={() => handleSelect(option.value)}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-md h-14" />
    </div>
  )
}
