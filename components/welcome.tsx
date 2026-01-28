'use client';

import { Button } from '@/components/ui/button'

export default function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-between p-6 relative overflow-hidden">
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

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-bold mb-4 text-balance">Welcome to</h1>
        <h2 className="text-6xl font-bold mb-8 text-balance">Laura AI</h2>
        <p className="text-xl text-gray-300 max-w-sm text-balance">
          Draw, Meet & Chat with Your AI Matches
        </p>
      </div>

      <div className="relative z-10 w-full max-w-sm mb-8">
        <Button
          onClick={onNext}
          className="w-full bg-white text-black hover:bg-gray-100 h-14 text-lg font-semibold rounded-xl"
        >
          Continue
        </Button>
        <p className="text-center text-gray-500 text-xs mt-6">
          By clicking 'Continue,' you agree to our <span className="text-white font-semibold">Terms & Conditions</span> and <span className="text-white font-semibold">Privacy Policy.</span>
        </p>
      </div>
    </div>
  )
}
