'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
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
      className="h-full flex flex-col items-center justify-center p-6 sm:p-8 relative overflow-hidden"
    >
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-8 relative z-10">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">
            {t(slides[currentSlide].titleKey)}
          </h1>
          <p className="text-sm text-white font-mono tracking-widest uppercase">
            {t(slides[currentSlide].descriptionKey)}
          </p>
        </div>

        {/* Modern Cyber Frame */}
        <div className="relative w-full aspect-[4/5] max-w-[280px] group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-50" />
          <div className="absolute -inset-[2px] bg-gradient-to-br from-purple-500/30 via-white/10 to-blue-500/30 rounded-3xl" />

          <div className="relative h-full w-full liquid-glass-card rounded-[22px]">
            <Image
              src={getFullImageUrl(slides[currentSlide].image || "/placeholder.svg")}
              alt={t(slides[currentSlide].titleKey)}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Data Overlays */}
            <div className="absolute top-4 left-4 font-mono text-[10px] text-white flex flex-col gap-1">
              <div className="flex items-center gap-1.5"><div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" /> SCANNING...</div>
              <div>COORD: 34.0522 N</div>
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all ${index === currentSlide ? 'bg-purple-500 w-10' : 'bg-white/10 w-4 hover:bg-white/20'
                }`}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-md mt-10 relative z-10">
        <Button
          onClick={handleNext}
          className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 font-bold text-lg shadow-[0_0_25px_rgba(255,255,255,0.1)] group flex items-center justify-center"
        >
          {currentSlide === slides.length - 1 ? 'Reveal Soulmate' : tCommon('next')}
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  )
}
