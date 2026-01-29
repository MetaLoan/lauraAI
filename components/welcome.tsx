'use client';

import { Button } from '@/components/ui/button'

export default function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="h-full bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative striped background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 800" preserveAspectRatio="none">
          <defs>
            <pattern id="stripes" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="100" y2="100" stroke="white" strokeWidth="20" />
            </pattern>
          </defs>
          <rect width="400" height="800" fill="url(#stripes)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 flex-1 max-w-sm">
        <div className="space-y-3">
          <h1 className="text-title-xl text-balance">Welcome to</h1>
          <h2 className="text-title-xl text-balance">Laura AI</h2>
        </div>
        <p className="text-body-lg text-gray-300 text-balance px-4">
          Draw, Meet & Chat with Your AI Matches
        </p>
      </div>

      <div className="relative z-10 w-full max-w-sm pb-4">
        <Button
          onClick={onNext}
          className="btn-primary"
        >
          Continue
        </Button>
        <p className="text-center text-gray-500 text-caption mt-4">
          By clicking 'Continue,' you agree to our <span className="text-white font-semibold">Terms & Conditions</span> and <span className="text-white font-semibold">Privacy Policy.</span>
        </p>
      </div>
    </div>
  )
}
