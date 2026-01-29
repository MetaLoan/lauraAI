'use client';

import { useState, useEffect } from 'react';

export default function Preloader() {
  const [debugInfo, setDebugInfo] = useState<any>({
    webAppExists: false,
    version: '',
    platform: '',
    isFullscreen: 'unknown',
    isExpanded: 'unknown',
    viewportHeight: 0,
    viewportStableHeight: 0,
    safeAreaInset: null,
    contentSafeAreaInset: null,
    cssVarTop: '',
    cssVarBottom: '',
    cssContentTop: '',
    pollCount: 0,
    allProps: '',
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      const webApp = (window as any).Telegram?.WebApp;
      
      // 读取 CSS 变量
      const styles = getComputedStyle(document.documentElement);
      const cssVarTop = styles.getPropertyValue('--tg-safe-area-top') || 'not set';
      const cssVarBottom = styles.getPropertyValue('--tg-safe-area-bottom') || 'not set';
      const cssContentTop = styles.getPropertyValue('--tg-content-safe-area-top') || 'not set';
      
      if (webApp) {
        // 列出 webApp 的所有属性
        const allProps = Object.keys(webApp).filter(k => !k.startsWith('_')).join(', ');
        
        setDebugInfo((prev: any) => ({
          webAppExists: true,
          version: webApp.version || 'unknown',
          platform: webApp.platform || 'unknown',
          isFullscreen: String(webApp.isFullscreen),
          isExpanded: String(webApp.isExpanded),
          viewportHeight: webApp.viewportHeight || 0,
          viewportStableHeight: webApp.viewportStableHeight || 0,
          safeAreaInset: JSON.stringify(webApp.safeAreaInset) || 'null',
          contentSafeAreaInset: JSON.stringify(webApp.contentSafeAreaInset) || 'null',
          cssVarTop,
          cssVarBottom,
          cssContentTop,
          pollCount: prev.pollCount + 1,
          allProps: allProps.substring(0, 200),
        }));
      } else {
        setDebugInfo((prev: any) => ({
          ...prev,
          webAppExists: false,
          cssVarTop,
          cssVarBottom,
          cssContentTop,
          pollCount: prev.pollCount + 1,
        }));
      }
    };

    updateDebugInfo(); // 立即执行一次
    const interval = setInterval(updateDebugInfo, 1000);
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
      <div className="absolute bottom-16 left-2 right-2 bg-black/90 border border-white/20 rounded-lg p-3 text-[10px] text-white/80 font-mono overflow-auto max-h-[50vh]">
        <p className="text-yellow-400 mb-2 text-xs">🔍 DEBUG MODE #{debugInfo.pollCount}</p>
        
        <p className="text-blue-400 mt-1">--- WebApp Info ---</p>
        <p>webApp exists: {debugInfo.webAppExists ? '✅' : '❌'}</p>
        <p>version: {debugInfo.version}</p>
        <p>platform: {debugInfo.platform}</p>
        
        <p className="text-blue-400 mt-2">--- Fullscreen Status ---</p>
        <p>isFullscreen: {debugInfo.isFullscreen}</p>
        <p>isExpanded: {debugInfo.isExpanded}</p>
        <p>viewportHeight: {debugInfo.viewportHeight}px</p>
        <p>viewportStableHeight: {debugInfo.viewportStableHeight}px</p>
        
        <p className="text-blue-400 mt-2">--- Safe Area (from JS) ---</p>
        <p>safeAreaInset: {debugInfo.safeAreaInset}</p>
        <p>contentSafeAreaInset: {debugInfo.contentSafeAreaInset}</p>
        
        <p className="text-blue-400 mt-2">--- CSS Variables ---</p>
        <p>--tg-safe-area-top: {debugInfo.cssVarTop}</p>
        <p>--tg-safe-area-bottom: {debugInfo.cssVarBottom}</p>
        <p>--tg-content-safe-area-top: {debugInfo.cssContentTop}</p>
        
        <p className="text-blue-400 mt-2">--- All Props ---</p>
        <p className="break-all text-[8px]">{debugInfo.allProps}</p>
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
