'use client';

import { useState, useEffect } from 'react';

export default function Preloader() {
  const [debugInfo, setDebugInfo] = useState({
    safeAreaTop: 0,
    safeAreaBottom: 0,
    contentSafeAreaTop: 0,
    contentSafeAreaBottom: 0,
    isFullscreen: false,
    pollCount: 0,
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      const webApp = (window as any).Telegram?.WebApp;
      if (webApp) {
        setDebugInfo(prev => ({
          safeAreaTop: webApp.safeAreaInset?.top || 0,
          safeAreaBottom: webApp.safeAreaInset?.bottom || 0,
          contentSafeAreaTop: webApp.contentSafeAreaInset?.top || 0,
          contentSafeAreaBottom: webApp.contentSafeAreaInset?.bottom || 0,
          isFullscreen: webApp.isFullscreen || false,
          pollCount: prev.pollCount + 1,
        }));
      }
    };

    const interval = setInterval(updateDebugInfo, 500);
    return () => clearInterval(interval);
  }, []);

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
          Waiting for safe area values...
        </p>
      </div>

      {/* 调试信息 */}
      <div className="absolute bottom-20 left-4 right-4 bg-white/10 rounded-lg p-4 text-xs text-white/80 font-mono">
        <p className="text-yellow-400 mb-2">🔍 DEBUG MODE - Waiting for both values</p>
        <p>Poll #{debugInfo.pollCount}</p>
        <p>isFullscreen: {debugInfo.isFullscreen ? '✅ true' : '❌ false'}</p>
        <p className={debugInfo.safeAreaTop > 0 ? 'text-green-400' : 'text-red-400'}>
          safeAreaInset.top: {debugInfo.safeAreaTop}px {debugInfo.safeAreaTop > 0 ? '✅' : '❌'}
        </p>
        <p className={debugInfo.safeAreaBottom > 0 ? 'text-green-400' : 'text-red-400'}>
          safeAreaInset.bottom: {debugInfo.safeAreaBottom}px {debugInfo.safeAreaBottom > 0 ? '✅' : '❌'}
        </p>
        <p className={debugInfo.contentSafeAreaTop > 0 ? 'text-green-400' : 'text-red-400'}>
          contentSafeAreaInset.top: {debugInfo.contentSafeAreaTop}px {debugInfo.contentSafeAreaTop > 0 ? '✅' : '❌'}
        </p>
        <p className={debugInfo.contentSafeAreaBottom > 0 ? 'text-green-400' : 'text-yellow-400'}>
          contentSafeAreaInset.bottom: {debugInfo.contentSafeAreaBottom}px
        </p>
      </div>

      {/* 底部装饰 */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-white/20 rounded-full"></div>
          <div className="w-1 h-1 bg-white/40 rounded-full"></div>
          <div className="w-1 h-1 bg-white/20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
