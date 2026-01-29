'use client'

export default function LoadingResults({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-between p-6">
      {/* Back button */}
      <div className="w-full flex justify-start mb-4">
        {onBack && (
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-full border border-gray-600 flex items-center justify-center hover:border-gray-400 transition-colors"
          >
            <span className="text-2xl">&lt;</span>
          </button>
        )}
      </div>

      <div className="w-full text-center">
        <h1 className="text-4xl font-bold mb-6">Preparing your results...</h1>
        <p className="text-xl text-gray-400 max-w-md mx-auto text-balance">
          We're matching your details to draw and bring your unique connection to life. Please wait...
        </p>
      </div>

      {/* Loading spinner */}
      <div className="flex-1 flex items-center justify-center">
        <svg className="w-16 h-16 animate-spin" viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="80"
            strokeDashoffset="0"
            opacity="0.3"
          />
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="20"
            strokeDashoffset="0"
          />
        </svg>
      </div>

      {/* Bottom spacer to maintain layout consistency */}
      <div className="w-full h-20" />
    </div>
  )
}
