'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import Image from 'next/image'
import { getAssetPath } from '@/lib/utils'

export default function ResultsCard({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: 'Find Your Soulmate',
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
        <h1 className="text-3xl font-bold mb-4 text-balance">{slides[currentSlide].title}</h1>
        <p className="text-gray-400 mb-12 text-balance text-center">{slides[currentSlide].description}</p>

        {/* Polaroid card */}
        <div className="mb-8 transform transition-all w-full max-w-[280px]">
          <div className="bg-amber-100 p-4 rounded-sm shadow-2xl" style={{ aspectRatio: '3/4' }}>
            <div className="w-full h-full bg-amber-200 rounded-sm flex items-center justify-center border-2 border-amber-300 overflow-hidden relative">
              <Image
                src={getAssetPath(slides[currentSlide].image || "/placeholder.svg")}
                alt={slides[currentSlide].title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="flex gap-2 mb-8">
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

      <div className="w-full max-w-md">
        <Button
          onClick={handleNext}
          className="w-full bg-white text-black hover:bg-gray-100 h-14 text-lg font-semibold rounded-xl"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
