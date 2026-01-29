'use client';

export default function Preloader() {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black">
      <div className="relative w-24 h-24">
        {/* 外圈旋转 */}
        <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        
        {/* 中心 Logo 占位 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-2xl rotate-45 animate-pulse"></div>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-2">
        <h1 className="text-xl font-bold tracking-wider text-white">LauraAI</h1>
        <p className="text-sm text-gray-500 animate-pulse text-center px-6">
          Initializing your soulmate experience...
        </p>
      </div>

      {/* 底部装饰 */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-white/20 rounded-full"></div>
          <div className="w-1 h-1 bg-white/40 rounded-full"></div>
          <div className="w-1 h-1 bg-white/20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
