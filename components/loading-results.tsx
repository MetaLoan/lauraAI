'use client'

export default function LoadingResults({ onBack }: { onBack?: () => void }) {
  return (
    <div className="h-full bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center px-4">
        <h1 className="text-title-lg mb-6 text-balance flex-shrink-0">Preparing your results...</h1>
        <p className="text-body-lg text-gray-400 max-w-md mx-auto text-balance">
          We're matching your details to draw and bring your unique connection to life. Please wait...
        </p>
      </div>

      {/* Loading spinner */}
      <div className="flex-1 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>

      {/* Bottom spacer to maintain layout consistency */}
      <div className="w-full h-20" />
    </div>
  )
}
