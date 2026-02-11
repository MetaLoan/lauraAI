'use client'

import React, { useState, useEffect } from "react"
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/components/i18n-provider'

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
  const { t } = useTranslations('birthPlace')
  const { t: tCommon } = useTranslations('common')

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

        <div className="w-full mb-8 relative">
          <input
            type="text"
            placeholder={t('placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent border-b border-gray-600 text-body-lg placeholder-gray-600 focus:outline-none focus:border-gray-400 pb-2 transition-colors"
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
                  <p className="text-white text-body-sm font-medium truncate">
                    {place.display_name.split(',')[0]}
                  </p>
                  <p className="text-white text-caption truncate">
                    {place.display_name.split(',').slice(1).join(',').trim()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-md space-y-3 flex-shrink-0">
        <Button
          onClick={handleNext}
          disabled={!input.trim()}
          className="btn-primary disabled:btn-disabled"
        >
          {tCommon('continue')}
        </Button>
        <button onClick={onNext} className="w-full text-white hover:text-white text-body-sm">
          {tCommon('skip')}
        </button>
        <p className="text-white text-caption text-center px-2">
          {t('hint')}
        </p>
      </div>
    </div>
  )
}
