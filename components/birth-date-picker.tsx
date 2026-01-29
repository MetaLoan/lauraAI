'use client'

import React, { useState } from "react"
import Picker from 'react-mobile-picker'
import { Button } from '@/components/ui/button'

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString())
const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString())

const selections: Record<string, string[]> = {
  month: months,
  day: days,
  year: years,
}

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
  const [pickerValue, setPickerValue] = useState({
    month: value.month || 'January',
    day: value.day || '1',
    year: value.year || '2000',
  })

  const displayDate = `${pickerValue.month}, ${pickerValue.year}`
  const displayDay = pickerValue.day

  return (
    <div className="h-full bg-black flex flex-col items-center p-6">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-6">
        <h1 className="text-title-lg text-balance text-center px-2 flex-shrink-0">
          To align with the universe, could you share your birth date?
        </h1>

        <div className="text-center">
          <p className="text-gray-400 text-body-sm mb-2">{displayDate}</p>
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
                            : 'text-gray-500 text-body-sm'
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
          Continue
        </Button>
        <button onClick={onNext} className="w-full text-gray-400 hover:text-gray-200 text-body-sm">
          Skip
        </button>
      </div>
    </div>
  )
}
