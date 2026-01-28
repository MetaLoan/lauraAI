'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, X, Share2 } from 'lucide-react'
import Image from 'next/image'

interface SoulmateDetailPageProps {
  onNext: () => void
  onBack: () => void
}

export default function SoulmateDetailPage({
  onNext,
  onBack,
}: SoulmateDetailPageProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="min-h-screen flex flex-col pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
        <button
          onClick={onBack}
          className="p-3 rounded-full border border-white/30 hover:border-white/50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold">Your Soulmate</h2>
        <button className="p-3 rounded-full border border-white/30 hover:border-white/50 transition-colors">
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 space-y-8 scrollbar-hide">
        {/* Portrait Card */}
        <div className="flex justify-center">
          <div className="w-full max-w-[280px] aspect-[3/4] rounded-3xl border-4 border-amber-700 p-2 bg-gradient-to-br from-amber-100 to-amber-50 shadow-2xl">
            <div className="w-full h-full bg-amber-200 rounded-2xl flex items-center justify-center overflow-hidden relative">
              <Image
                src="/avatars/soulmate-female.jpg"
                alt="Your Soulmate"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Compatibility Score */}
        <div className="mb-8">
          <h3 className="text-center text-2xl font-bold mb-6">Compatibility Score</h3>

          {/* Progress Bar */}
          <div className="mb-4 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
              style={{ width: '92%' }}
            />
          </div>

          <p className="text-center text-5xl font-bold mb-6">92%</p>

          <p className="text-center text-sm text-gray-300 leading-relaxed mb-8">
            A harmonious partner who values balance and partnership (Libra Sun), brings emotional
            depth and nurturing (Cancer Moon), and offers dreamy empathy with intuitive sensitivity
            (Pisces Rising). They help soften boundaries, encourage diplomatic communication, and
            create a safe emotional haven where your intellectual curiosity and humanitarian ideals
            can flourish.
          </p>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-3">
          {/* Strength */}
          <button
            onClick={() => toggleSection('strength')}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold">Strength</h4>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  expandedSection === 'strength' ? 'rotate-180' : ''
                }`}
              />
            </div>
            {expandedSection === 'strength' && (
              <p className="mt-4 text-sm text-gray-300 leading-relaxed">
                Together you radiate loyalty, passion, and determination. Your bond thrives on
                honesty, shared goals, and the ability to support each other's dreams.
              </p>
            )}
          </button>

          {/* Weakness */}
          <button
            onClick={() => toggleSection('weakness')}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold">Weakness</h4>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  expandedSection === 'weakness' ? 'rotate-180' : ''
                }`}
              />
            </div>
            {expandedSection === 'weakness' && (
              <p className="mt-4 text-sm text-gray-300 leading-relaxed">
                At times, stubbornness and emotional intensity may create friction. Misunderstandings
                can arise if space and patience are not given, but awareness helps transform these
                into growth.
              </p>
            )}
          </button>
        </div>
      </div>

      {/* Footer Button */}
      <div className="px-6 pt-8 border-t border-white/10">
        <Button
          onClick={onNext}
          className="w-full bg-white text-black hover:bg-gray-100 py-6 rounded-xl text-lg font-semibold"
        >
          Say "Hello" to Your Soulmate..
        </Button>
      </div>
    </div>
  )
}
