'use client'

import { Button } from '@/components/ui/button'
import { SelectionButton } from '@/components/ui/selection-button'
import { useTranslations } from '@/components/i18n-provider'

interface SoulmateEthnicitySelectProps {
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
  characterTitle?: string
}

// 内部值 -> 翻译键映射
const ethnicityOptions = [
  { value: 'Black / African', labelKey: 'blackAfrican' },
  { value: 'Middle Eastern', labelKey: 'middleEastern' },
  { value: 'East Asian', labelKey: 'eastAsian' },
  { value: 'South Asian', labelKey: 'southAsian' },
  { value: 'Southeast Asian', labelKey: 'southeastAsian' },
  { value: 'White', labelKey: 'white' },
  { value: 'Hispanic / Latino', labelKey: 'hispanicLatino' },
  { value: 'Indigenous', labelKey: 'indigenous' },
  { value: 'Mixed', labelKey: 'mixed' },
  { value: 'Prefer not to say', labelKey: 'preferNotToSay' },
]

// 角色类型映射到翻译键
const characterTypeToKey: Record<string, string> = {
  'Soulmate': 'soulmate',
  'Mini Me': 'miniMe',
  'Future Husband': 'futureHusband',
  'Future Baby': 'futureBaby',
  'Future Wife': 'futureWife',
  'Boyfriend': 'boyfriend',
  'Best Friend': 'bestFriend',
  'Girlfriend': 'girlfriend',
  'Mysterious Stranger': 'mysteriousStranger',
  'Wise Mentor': 'wiseMentor',
  'Dream Guide': 'dreamGuide',
}

export default function SoulmateEthnicitySelect({
  value,
  onChange,
  onNext,
  onBack,
  characterTitle = 'Soulmate',
}: SoulmateEthnicitySelectProps) {
  const { t } = useTranslations('ethnicity')
  const { t: tCommon } = useTranslations('common')
  const { t: tCharacters } = useTranslations('characters')

  // 获取翻译后的角色名称
  const getLocalizedCharacterTitle = () => {
    const key = characterTypeToKey[characterTitle]
    return key ? tCharacters(key) : characterTitle
  }

  const localizedTitle = getLocalizedCharacterTitle()

  return (
    <div className="h-full flex flex-col px-6 pt-6">
      {/* Fixed Header */}
      <div className="flex-shrink-0 w-full max-w-md mx-auto mb-6">
        <h1 className="text-title-lg text-balance text-center">
          {t('soulmateTitle', { character: localizedTitle })}
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
              onClick={() => onChange(option.value)}
            />
          ))}
        </div>
      </div>

      {/* Fixed Footer Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-10 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <Button
            onClick={onNext}
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
