'use client'

export default function LoadingResults() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">Preparing your results...</h1>
        <p className="text-xl text-gray-400 mb-12 max-w-md text-balance">
          We're matching your details to draw and bring your unique connection to life. Please wait...
        </p>

        {/* Loading spinner */}
        <div className="flex justify-center mb-12">
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
      </div>
    </div>
  )
}
