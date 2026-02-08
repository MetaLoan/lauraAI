'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import Image from 'next/image'
import { getAssetPath, getFullImageUrl } from '@/lib/utils'
import { useTranslations } from '@/components/i18n-provider'

export default function ResultsCard({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const { t } = useTranslations('results')
  const { t: tCommon } = useTranslations('common')

  const slides = [
    {
      titleKey: 'meetSoulmate',
      descriptionKey: 'compatibility',
      image: '/avatars/soulmate-female.jpg',
    },
    {
      titleKey: 'title',
      descriptionKey: 'astroSign',
      image: '/avatars/soulmate-female.jpg',
    },
    {
      titleKey: 'viewDetails',
      descriptionKey: 'compatibility',
      image: '/avatars/soulmate-female.jpg',
    },
    {
      titleKey: 'meetSoulmate',
      descriptionKey: 'astroSign',
      image: '/avatars/soulmate-female.jpg',
    },
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      onNext()
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  return (
    <div 
      className="h-full bg-black flex flex-col items-center justify-center p-4"
      style={{
        paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px) + 16px)'
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-4 md:space-y-6">
        <h1 className="text-title-lg text-balance text-center px-2">{t(slides[currentSlide].titleKey)}</h1>
        <p className="text-body-md text-gray-400 text-balance text-center px-2">{t(slides[currentSlide].descriptionKey)}</p>

        {/* Polaroid card */}
        <div className="transform transition-all w-full max-w-[220px] sm:max-w-[260px] md:max-w-[300px]">
          <div className="bg-amber-100 p-3 sm:p-4 rounded-sm shadow-2xl" style={{ aspectRatio: '3/4' }}>
            <div className="w-full h-full bg-amber-200 rounded-sm flex items-center justify-center border-2 border-amber-300 overflow-hidden relative">
              <Image
                src={getFullImageUrl(slides[currentSlide].image || "/placeholder.svg")}
                alt={t(slides[currentSlide].titleKey)}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-white w-6' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-md pb-4">
        <Button
          onClick={handleNext}
          className="btn-primary"
        >
          {tCommon('next')}
        </Button>
      </div>
    </div>
  )
}
