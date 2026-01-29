'use client'

import { Button } from '@/components/ui/button'
import { Camera, ImageIcon } from 'lucide-react'

interface MiniMeUploadProps {
  onNext: () => void
  onBack: () => void
}

export default function MiniMeUpload({ onNext, onBack }: MiniMeUploadProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 scrollbar-hide">
        <div className="flex flex-col items-center justify-center min-h-full py-8">
          {/* Title */}
          <h1 className="text-title-lg text-balance text-center mb-2">
            Let's bring your Mini Me to life ✨
          </h1>
          <h2 className="text-title-lg text-balance text-center mb-6">
            Upload Your Selfie
          </h2>

          {/* Description */}
          <p className="text-body-md text-gray-400 text-center max-w-sm mb-8">
            For the best results, upload a clear close-up selfie where your face is fully visible.
          </p>

          {/* Phone Illustration */}
          <div className="relative mb-8">
            <div className="w-40 h-64 bg-gradient-to-b from-white/10 to-white/5 rounded-3xl border-2 border-white/20 flex items-center justify-center p-2">
              <div className="w-full h-full rounded-2xl bg-gradient-to-b from-gray-400 to-gray-600 flex items-center justify-center">
                <div className="text-7xl">👤</div>
              </div>
            </div>
            {/* Camera Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-black rounded-b-3xl border border-white/10" />
          </div>
        </div>
      </div>

      {/* Footer Buttons - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-transparent z-50">
        <div className="max-w-md mx-auto space-y-3">
          <Button
            onClick={onNext}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Take a Selfie
          </Button>
          <Button
            onClick={onNext}
            className="btn-primary flex items-center justify-center gap-2 !bg-white/10 !text-white hover:!bg-white/20"
          >
            <ImageIcon className="w-5 h-5" />
            Choose from Gallery
          </Button>
        </div>
      </div>

      {/* Bottom spacer for fixed buttons */}
      <div className="h-40 flex-shrink-0" />
    </div>
  )
}
