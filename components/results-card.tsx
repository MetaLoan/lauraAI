'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import Image from 'next/image'
import { getAssetPath, getFullImageUrl } from '@/lib/utils'

export default function ResultsCard({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: 'Find Soulmate',
      description: 'Your personalized insights are used to design your AI match, drawn just for you and ready to chat.',
      image: '/avatars/soulmate-female.jpg',
    },
    {
      title: 'Discover Connection',
      description: 'Your unique astrological profile has been analyzed to create your perfect AI companion.',
      image: '/avatars/soulmate-female.jpg',
    },
    {
      title: 'Start Your Journey',
      description: 'Meet your soulmate, crafted from the stars just for you. Chat, connect, and explore.',
      image: '/avatars/soulmate-female.jpg',
    },
    {
      title: 'Your Match Awaits',
      description: 'An AI soulmate personalized to your cosmic energy. Ready to reveal your connection?',
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
    <div className="h-full bg-black flex flex-col items-center justify-center p-4">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-4 md:space-y-6">
        <h1 className="text-title-lg text-balance text-center px-2">{slides[currentSlide].title}</h1>
        <p className="text-body-md text-gray-400 text-balance text-center px-2">{slides[currentSlide].description}</p>

        {/* Polaroid card */}
        <div className="transform transition-all w-full max-w-[220px] sm:max-w-[260px] md:max-w-[300px]">
          <div className="bg-amber-100 p-3 sm:p-4 rounded-sm shadow-2xl" style={{ aspectRatio: '3/4' }}>
            <div className="w-full h-full bg-amber-200 rounded-sm flex items-center justify-center border-2 border-amber-300 overflow-hidden relative">
              <Image
                src={getFullImageUrl(slides[currentSlide].image || "/placeholder.svg")}
                alt={slides[currentSlide].title}
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
          Next
        </Button>
      </div>
    </div>
  )
}
