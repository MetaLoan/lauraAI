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
    <div className="min-h-screen bg-black flex flex-col items-center justify-between p-6">
      {/* Back button */}
      <div className="w-full flex justify-start mb-4">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-full border border-gray-600 flex items-center justify-center hover:border-gray-400 transition-colors"
        >
          <span className="text-2xl">&lt;</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-balance">
          To align with the universe, could you share your birth date?
        </h1>

        <div className="mb-8 text-center">
          <p className="text-gray-400 text-sm mb-2">{displayDate}</p>
          <p className="text-6xl font-bold">{displayDay}</p>
        </div>

        <div className="w-full mb-12 relative">
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
                            ? 'text-white font-semibold text-lg'
                            : 'text-gray-500 text-sm'
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

        <Button
          onClick={() => {
            onChange(pickerValue)
            onNext()
          }}
          className="w-full bg-white text-black hover:bg-gray-100 h-14 text-lg font-semibold rounded-xl"
        >
          Continue
        </Button>
        <button onClick={onNext} className="mt-4 text-gray-400 hover:text-gray-200">
          Skip
        </button>
      </div>
    </div>
  )
}
