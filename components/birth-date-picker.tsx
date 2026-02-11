'use client'

import React, { useState } from "react"
import Picker from 'react-mobile-picker'
import { Button } from '@/components/ui/button'
import { useTranslations, useI18n } from '@/components/i18n-provider'

// 英文月份（用于内部存储）
const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// 多语言月份映射
const monthsLocalized: Record<string, string[]> = {
  en: monthsEn,
  zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
}

const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString())
const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString())

export default function BirthDatePicker({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: { month: string; day: string; year: string }
  onChange: (val: { month: string; day: string; year: string }) => void
  onNext: () => void
  onBack: () => void
}) {
  const { t } = useTranslations('birthDate')
  const { t: tCommon } = useTranslations('common')
  const { locale } = useI18n()

  const months = monthsLocalized[locale] || monthsEn
  
  // 获取初始月份索引
  const getInitialMonthIndex = () => {
    if (!value.month) return 0
    const enIndex = monthsEn.indexOf(value.month)
    return enIndex >= 0 ? enIndex : 0
  }

  const [pickerValue, setPickerValue] = useState({
    month: months[getInitialMonthIndex()],
    day: value.day || '1',
    year: value.year || '2000',
  })

  const selections: Record<string, string[]> = {
    month: months,
    day: days,
    year: years,
  }

  const displayDate = `${pickerValue.month}, ${pickerValue.year}`
  const displayDay = pickerValue.day

  const handleContinue = () => {
    // 将本地化月份转换回英文存储
    const localizedIndex = months.indexOf(pickerValue.month)
    const englishMonth = monthsEn[localizedIndex] || pickerValue.month
    
    onChange({
      month: englishMonth,
      day: pickerValue.day,
      year: pickerValue.year,
    })
    onNext()
  }

  return (
    <div 
      className="h-full bg-black flex flex-col items-center p-6"
      style={{
        paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px) + 24px)'
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-6">
        <h1 className="text-title-lg text-balance text-center px-2 flex-shrink-0">
          {t('title')}
        </h1>

        <div className="text-center">
          <p className="text-white text-body-sm mb-2">{displayDate}</p>
          <p className="text-5xl sm:text-6xl font-bold">{displayDay}</p>
        </div>

        <div className="w-full relative">
          {/* 选中项高亮背景 */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-white/10 rounded-lg pointer-events-none z-0" />
          
          <Picker
            value={pickerValue}
            onChange={setPickerValue}
            wheelMode="natural"
            height={180}
            itemHeight={40}
          >
            {Object.keys(selections).map((name) => (
              <Picker.Column key={name} name={name}>
                {selections[name].map((option) => (
                  <Picker.Item key={option} value={option}>
                    {({ selected }) => (
                      <div
                        className={`text-center py-2 transition-all ${
                          selected
                            ? 'text-white font-semibold text-body-lg'
                            : 'text-white text-body-sm'
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
          onClick={handleContinue}
          className="btn-primary"
        >
          {tCommon('continue')}
        </Button>
        <button onClick={onNext} className="w-full text-white hover:text-white text-body-sm">
          {tCommon('skip') || 'Skip'}
        </button>
      </div>
    </div>
  )
}
