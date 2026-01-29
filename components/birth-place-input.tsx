'use client'

import React, { useState, useEffect } from "react"
import { Button } from '@/components/ui/button'

export default function BirthPlaceInput({
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
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (input.length > 2) {
        setLoading(true)
        try {
          // 使用 OpenStreetMap 的 Nominatim API (免费且无需 Key)
          // 添加 &accept-language=en 确保返回英文结果
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&addressdetails=1&limit=5&featuretype=city&accept-language=en`
          )
          const data = await response.json()
          setSuggestions(data)
        } catch (error) {
          console.error('Error fetching locations:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setSuggestions([])
      }
    }, 500) // 防抖处理

    return () => clearTimeout(timer)
  }, [input])

  const handleSelect = (place: any) => {
    const displayName = place.display_name
    setInput(displayName)
    setSuggestions([])
    onChange(displayName)
  }

  const handleNext = () => {
    onChange(input)
    onNext()
  }

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
          Could you tell me where you were born?
        </h1>

        <div className="w-full mb-8 relative">
          <input
            type="text"
            placeholder="Search city..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent border-b border-gray-600 text-2xl placeholder-gray-600 focus:outline-none focus:border-gray-400 pb-2 transition-colors"
          />
          
          {loading && (
            <div className="absolute right-0 top-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="absolute w-full mt-2 z-10 bg-black border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
              {suggestions.map((place) => (
                <button
                  key={place.place_id}
                  onClick={() => handleSelect(place)}
                  className="w-full text-left p-4 bg-black hover:bg-gray-900 transition-colors border-b border-gray-800 last:border-none text-white"
                >
                  <p className="text-white text-sm font-medium truncate">
                    {place.display_name.split(',')[0]}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {place.display_name.split(',').slice(1).join(',').trim()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-md space-y-3">
        <Button
          onClick={handleNext}
          disabled={!input.trim()}
          className="w-full bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed h-14 text-lg font-semibold rounded-xl"
        >
          Continue
        </Button>
        <button onClick={onNext} className="w-full text-gray-400 hover:text-gray-200 text-sm">
          Skip
        </button>
      </div>

      <p className="text-gray-500 text-xs mt-6 text-center max-w-md">
        Your birth place is essential for accurate calculations and personalized guidance. Your privacy is our priority, and this
        information will never be shared with third parties.
      </p>
    </div>
  )
}
