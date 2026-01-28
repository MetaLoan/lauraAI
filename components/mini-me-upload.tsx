'use client'

import { Button } from '@/components/ui/button'
import { Camera, ImageIcon, X } from 'lucide-react'

interface MiniMeUploadProps {
  onNext: () => void
  onBack: () => void
}

export default function MiniMeUpload({ onNext, onBack }: MiniMeUploadProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-8">
      <button
        onClick={onBack}
        className="self-start p-3 rounded-full border border-white/30 hover:border-white/50 transition-colors mb-8"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold mb-4">
          Let's bring your Mini Me to life <span className="text-2xl">✨</span>
        </h1>
        <h2 className="text-4xl font-bold mb-8">Upload Your Selfie</h2>

        <p className="text-gray-400 mb-12 max-w-md text-lg">
          For the best results, upload a clear close-up selfie where your face is fully visible.
        </p>

        {/* Phone Illustration */}
        <div className="mb-12 relative">
          <div className="w-32 h-56 bg-gradient-to-b from-white/10 to-white/5 rounded-3xl border-2 border-white/20 flex items-center justify-center p-2">
            <div className="w-full h-full rounded-2xl bg-gradient-to-b from-gray-400 to-gray-600 flex items-center justify-center">
              <div className="text-6xl">👤</div>
            </div>
          </div>
          {/* Camera Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-black rounded-b-3xl border border-white/10" />
        </div>
      </div>

      <div className="w-full space-y-3">
        <Button
          onClick={onNext}
          className="w-full bg-white text-black hover:bg-gray-100 py-6 rounded-xl text-lg font-semibold flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          Take a Selfie
        </Button>
        <Button
          onClick={onNext}
          className="w-full bg-white text-black hover:bg-gray-100 py-6 rounded-xl text-lg font-semibold flex items-center justify-center gap-2"
        >
          <ImageIcon className="w-5 h-5" />
          Choose from Gallery
        </Button>
      </div>
    </div>
  )
}
