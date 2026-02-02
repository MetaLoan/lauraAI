'use client'

import React, { useState } from "react"
import Picker from 'react-mobile-picker'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/components/i18n-provider'

const hours = Array.from({ length: 24 }, (_, i) => (i < 10 ? '0' + i : i.toString()))
const minutes = Array.from({ length: 60 }, (_, i) => (i < 10 ? '0' + i : i.toString()))

const selections: Record<string, string[]> = {
  hour: hours,
  minute: minutes,
}

export default function BirthTimePicker({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: { hour: string; minute: string }
  onChange: (val: { hour: string; minute: string }) => void
  onNext: () => void
  onBack: () => void
}) {
  const { t } = useTranslations('birthTime')
  const { t: tCommon } = useTranslations('common')

  const [pickerValue, setPickerValue] = useState({
    hour: value.hour || '12',
    minute: value.minute || '00',
  })

  const displayTime = `${pickerValue.hour}:${pickerValue.minute}`

  return (
    <div className="h-full bg-black flex flex-col items-center p-6">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-6">
        <h1 className="text-title-lg text-balance text-center px-2 flex-shrink-0">
          {t('title')}
        </h1>

        <div className="text-5xl sm:text-6xl font-bold">{displayTime}</div>

        <div className="w-full relative">
          {/* 选中项高亮背景 */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 bg-white/10 rounded-lg pointer-events-none z-0" />
          
          <Picker
            value={pickerValue}
            onChange={setPickerValue}
            wheelMode="natural"
            height={200}
            itemHeight={48}
          >
            {Object.keys(selections).map((name) => (
              <Picker.Column key={name} name={name}>
                {selections[name].map((option) => (
                  <Picker.Item key={option} value={option}>
                    {({ selected }) => (
                      <div
                        className={`text-center py-3 transition-all ${
                          selected
                            ? 'text-white font-bold text-title-md'
                            : 'text-gray-500 text-body-lg'
                        }`}
                      >
                        {option}
                      </div>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
            ))}
          </Picker>
        </div>
      </div>

      <div className="w-full max-w-md space-y-3 flex-shrink-0">
        <Button
          onClick={() => {
            onChange(pickerValue)
            onNext()
          }}
          className="btn-primary"
        >
          {tCommon('continue')}
        </Button>
        <button onClick={onNext} className="w-full text-gray-400 hover:text-gray-200 text-sm">
          {t('unknown')}
        </button>

        <p className="text-gray-500 text-xs text-center px-2">
          {t('hint')}
        </p>
      </div>
    </div>
  )
}
