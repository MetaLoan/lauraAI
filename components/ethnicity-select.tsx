'use client'

import { Button } from '@/components/ui/button'
import { SelectionButton } from '@/components/ui/selection-button'
import { useTranslations, useI18n } from '@/components/i18n-provider'

// 内部值 -> 翻译键映射
const ethnicityOptions = [
  { value: 'East Asian', labelKey: 'eastAsian' },
  { value: 'South Asian', labelKey: 'southAsian' },
  { value: 'Southeast Asian', labelKey: 'southeastAsian' },
  { value: 'White', labelKey: 'white' },
  { value: 'Hispanic / Latino', labelKey: 'hispanicLatino' },
  { value: 'Indigenous', labelKey: 'indigenous' },
  { value: 'Mixed', labelKey: 'mixed' },
  { value: 'Prefer not to say', labelKey: 'preferNotToSay' },
]

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
  const { t } = useTranslations('ethnicity')
  const { t: tCommon } = useTranslations('common')

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
  }

  return (
    <div className="h-full bg-black flex flex-col px-6 pt-6">
      {/* Fixed Header */}
      <div className="flex-shrink-0 w-full max-w-md mx-auto mb-6">
        <h1 className="text-title-lg text-balance text-center">
          {t('title')}
        </h1>
      </div>

      {/* Scrollable Options List */}
      <div className="flex-1 w-full max-w-md mx-auto overflow-y-auto scrollbar-hide -mx-6 px-6 pb-32">
        <div className="w-full space-y-3">
          {ethnicityOptions.map((option) => (
            <SelectionButton
              key={option.value}
              label={t(option.labelKey)}
              isSelected={value === option.value}
              onClick={() => handleSelect(option.value)}
            />
          ))}
        </div>
      </div>

      {/* Fixed Footer Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-10 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <Button
            onClick={() => {
              onChange(value)
              onNext()
            }}
            disabled={!value}
            className="btn-primary disabled:btn-disabled shadow-xl"
          >
            {tCommon('continue')}
          </Button>
        </div>
      </div>
    </div>
  )
}
