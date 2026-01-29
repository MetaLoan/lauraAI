'use client';

import { useEffect, useState } from 'react';
import { useSignal, viewport, miniApp, themeParams } from '@telegram-apps/sdk-react';

export default function Preloader({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsReady] = useState(false);
  const isViewportMounted = useSignal(viewport.isMounted);
  const isMiniAppMounted = useSignal(miniApp.isMounted);
  const isThemeParamsMounted = useSignal(themeParams.isMounted);

  useEffect(() => {
    // 检查 SDK 组件是否都已挂载并准备就绪
    // 在非 TMA 环境下，这些 signal 可能是 undefined 或 false
    if (isViewportMounted && isMiniAppMounted && isThemeParamsMounted) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 500);
      return () => clearTimeout(timer);
    }

    // 容错机制：如果 3 秒后还没准备好，强制显示内容（可能是非 TMA 环境）
    const fallbackTimer = setTimeout(() => {
      setIsReady(true);
    }, 3000);
    return () => clearTimeout(fallbackTimer);
  }, [isViewportMounted, isMiniAppMounted, isThemeParamsMounted]);

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="mt-8 text-white/60 text-sm font-medium animate-pulse">
          Loading LauraAI...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
