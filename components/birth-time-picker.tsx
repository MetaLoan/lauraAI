'use client'

import React, { useState } from "react"
import Picker from 'react-mobile-picker'
import { Button } from '@/components/ui/button'

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
  const [pickerValue, setPickerValue] = useState({
    hour: value.hour || '12',
    minute: value.minute || '00',
  })

  const displayTime = `${pickerValue.hour}:${pickerValue.minute}`

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
        <h1 className="text-3xl font-bold mb-12 text-balance">
          Could you share the exact time you were born?
        </h1>

        <div className="text-6xl font-bold mb-12">{displayTime}</div>

        <div className="w-full mb-12 relative">
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
                            ? 'text-white font-bold text-2xl'
                            : 'text-gray-500 text-lg'
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

        <p className="text-gray-500 text-xs mt-6 text-center">
          Your birth time is essential for accurate calculations and personalized guidance. Your privacy is our priority, and this
          information will never be shared with third parties.
        </p>
      </div>
    </div>
  )
}
