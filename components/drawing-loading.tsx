'use client'

import { Loader, ChevronLeft, AlertCircle, RefreshCw } from 'lucide-react'

interface DrawingLoadingProps {
  onBack?: () => void
  error?: string | null
  onRetry?: () => void
}

export default function DrawingLoading({ onBack, error, onRetry }: DrawingLoadingProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-between p-6">
      {/* Back button */}
      <div className="w-full flex justify-start mb-4">
        {onBack && (
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-full border border-gray-600 flex items-center justify-center hover:border-gray-400 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      {error ? (
        // 错误状态
        <>
          <div className="w-full text-center">
            <h1 className="text-4xl font-bold mb-4 text-red-500">Generation Failed</h1>
            <p className="text-lg text-gray-400 max-w-md mx-auto">
              {error}
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>

          <div className="w-full mb-8 flex flex-col items-center gap-4">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Retry
              </button>
            )}
            <p className="text-sm text-gray-400">Please try again or go back to adjust your preferences.</p>
          </div>
        </>
      ) : (
        // 加载状态
        <>
          <div className="w-full text-center">
            <h1 className="text-4xl font-bold mb-4">Drawing your Soulmate...</h1>
            <p className="text-lg text-gray-400 max-w-md mx-auto">
              Uncovering the perfect match written in the universe.
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin">
              <Loader className="w-12 h-12 text-white/60" />
            </div>
          </div>

          <div className="w-full mb-8 flex items-center justify-center gap-2 text-sm text-gray-400">
            <div className="w-5 h-5 rounded-full border border-yellow-600 flex-shrink-0 flex items-center justify-center">
              <span className="text-xs">⚠</span>
            </div>
            <p>Preparing your results... Please do not leave this screen until it's complete.</p>
          </div>
        </>
      )}
    </div>
  )
}
