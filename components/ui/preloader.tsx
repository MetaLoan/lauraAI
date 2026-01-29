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
    if (isViewportMounted && isMiniAppMounted && isThemeParamsMounted) {
      // 额外等待一小段时间确保 CSS 变量生效
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 500);
      return () => clearTimeout(timer);
    }
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
