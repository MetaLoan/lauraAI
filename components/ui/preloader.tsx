'use client';

export default function Preloader() {
  return (
    <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center overflow-hidden">
      {/* Decorative striped background - same as welcome page */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 800" preserveAspectRatio="none">
          <defs>
            <pattern id="preloader-stripes" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="100" y2="100" stroke="white" strokeWidth="20" />
            </pattern>
          </defs>
          <rect width="400" height="800" fill="url(#preloader-stripes)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-8 px-6">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-balance">Welcome to</h1>
          <h2 className="text-5xl md:text-6xl font-bold text-balance">Laura AI</h2>
        </div>

        {/* Loading Bar */}
        <div className="w-64 md:w-80">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-white rounded-full absolute top-0 animate-loading-slide"
              style={{ width: '30%' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
