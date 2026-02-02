'use client'

import { Button } from '@/components/ui/button'
import { SelectionButton } from '@/components/ui/selection-button'
import { useTranslations } from '@/components/i18n-provider'

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
  const { t: tGender } = useTranslations('gender')
  const { t: tCharacters } = useTranslations('characters')
  const { t: tCommon } = useTranslations('common')

  const options = [
    { value: 'Male', labelKey: 'male' },
    { value: 'Female', labelKey: 'female' },
    { value: 'Other', labelKey: 'other' },
  ]

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
  }

  // 获取翻译后的角色名称
  const getLocalizedCharacterTitle = () => {
    const key = characterTypeToKey[characterTitle]
    return key ? tCharacters(key) : characterTitle
  }

  const localizedTitle = getLocalizedCharacterTitle()

  return (
    <div className="h-full bg-black flex flex-col items-center p-6">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-6">
        <h1 className="text-title-lg text-balance text-center px-2 flex-shrink-0">
          {tGender('soulmateTitle', { character: localizedTitle })}
        </h1>

        <div className="w-full space-y-4 mt-8">
          {options.map((option) => (
            <SelectionButton
              key={option.value}
              label={tGender(option.labelKey)}
              isSelected={value === option.value}
              onClick={() => handleSelect(option.value)}
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
          {tCommon('continue')}
        </Button>
      </div>
    </div>
  )
}
