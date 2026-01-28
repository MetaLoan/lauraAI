'use client'

import { Loader } from 'lucide-react'

export default function DrawingLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 animate-spin">
        <Loader className="w-8 h-8 text-white/60" />
      </div>

      <h1 className="text-4xl font-bold mb-4">Drawing your Soulmate...</h1>

      <p className="text-lg text-gray-400 mb-16 max-w-md">
        Uncovering the perfect match written in the universe.
      </p>

      <div className="mt-auto mb-8 flex items-center gap-2 text-sm text-gray-400">
        <div className="w-5 h-5 rounded-full border border-yellow-600 flex items-center justify-center">
          <span className="text-xs">⚠</span>
        </div>
        <p>Preparing your results... Please do not leave this screen until it's complete.</p>
      </div>
    </div>
  )
}
