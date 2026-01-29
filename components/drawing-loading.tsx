'use client'

import { Loader, ChevronLeft, AlertCircle, RefreshCw } from 'lucide-react'

interface DrawingLoadingProps {
  onBack?: () => void
  error?: string | null
  onRetry?: () => void
}

export default function DrawingLoading({ onBack, error, onRetry }: DrawingLoadingProps) {
  return (
    <div className="h-full bg-black flex flex-col items-center justify-center p-6">
      {error ? (
        // 错误状态
        <>
          <div className="w-full max-w-md text-center px-4">
            <h1 className="text-title-lg mb-4 text-red-500 text-balance flex-shrink-0">Generation Failed</h1>
            <p className="text-body-lg text-gray-400 max-w-md mx-auto">
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
            <p className="text-body-sm text-gray-400">Please try again or go back to adjust your preferences.</p>
          </div>
        </>
      ) : (
        // 加载状态
        <>
          <div className="w-full max-w-md text-center px-4">
            <h1 className="text-title-lg mb-4 text-balance flex-shrink-0">Drawing your Soulmate...</h1>
            <p className="text-body-lg text-gray-400 max-w-md mx-auto">
              Uncovering the perfect match written in the universe.
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="loading-spinner"></div>
          </div>

          <div className="w-full mb-8 flex items-center justify-center gap-2 text-body-sm text-gray-400">
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
