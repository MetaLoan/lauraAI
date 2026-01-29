'use client';

import { 
  useSignal,
  init,
  miniApp,
  viewport,
  themeParams,
  isTMA
} from '@telegram-apps/sdk-react';
import { type PropsWithChildren, useEffect, useState } from 'react';

function TelegramInitializer({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);

  // 初始化 SDK
  useEffect(() => {
    const initializeSDK = async () => {
      // 检查是否在 Telegram 环境中
      const inTMA = await isTMA();
      if (!inTMA) {
        console.warn('Not in Telegram Mini App environment');
        setIsReady(true);
        return;
      }

      try {
        // init() 会尝试获取启动参数，如果失败会抛出异常
        init();
        setIsReady(true);
      } catch (e) {
        console.error('Telegram SDK init error:', e);
        // 即使失败也标记为就绪，以便在非 TMA 环境下也能运行（或者你可以显示错误 UI）
        setIsReady(true);
      }
    };

    initializeSDK();
  }, []);

  // 使用 signals 获取状态
  const isMiniAppMounted = useSignal(miniApp.isMounted);
  const isViewportMounted = useSignal(viewport.isMounted);
  const isThemeParamsMounted = useSignal(themeParams.isMounted);

  // 挂载组件
  useEffect(() => {
    if (isReady) {
      if (!isMiniAppMounted && miniApp.mount.isAvailable() && !miniApp.isMounting()) {
        miniApp.mount().catch(err => {
          if (err.message.includes('already mounting')) return;
          console.error('miniApp mount error:', err);
        });
      }
      if (!isThemeParamsMounted && themeParams.mount.isAvailable() && !themeParams.isMounting()) {
        themeParams.mount().catch(err => {
          if (err.message.includes('already mounting')) return;
          console.error('themeParams mount error:', err);
        });
      }
    }
  }, [isReady, isMiniAppMounted, isThemeParamsMounted]);

  useEffect(() => {
    if (isReady && !isViewportMounted && viewport.mount.isAvailable() && !viewport.isMounting()) {
      viewport.mount().catch(err => {
        if (err.message.includes('already mounting')) return;
        console.error('viewport mount error:', err);
      });
    }
  }, [isReady, isViewportMounted]);

  // 绑定 CSS 变量
  useEffect(() => {
    if (isMiniAppMounted && miniApp.bindCssVars.isAvailable()) miniApp.bindCssVars();
  }, [isMiniAppMounted]);

  useEffect(() => {
    if (isThemeParamsMounted && themeParams.bindCssVars.isAvailable()) themeParams.bindCssVars();
  }, [isThemeParamsMounted]);

  useEffect(() => {
    if (isViewportMounted) {
      if (viewport && viewport.bindCssVars && viewport.bindCssVars.isAvailable && viewport.bindCssVars.isAvailable()) {
        viewport.bindCssVars();
      }
      
      // 更新安全区 CSS 变量
      const updateSafeAreas = () => {
        try {
          const root = document.documentElement;
          // 使用可选链和 isAvailable 检查
          if (viewport && typeof viewport.safeAreaInsets === 'function' && viewport.safeAreaInsets.isAvailable && viewport.safeAreaInsets.isAvailable()) {
            const sa = viewport.safeAreaInsets();
            root.style.setProperty('--tg-safe-area-top', `${sa.top}px`);
            root.style.setProperty('--tg-safe-area-bottom', `${sa.bottom}px`);
            root.style.setProperty('--tg-safe-area-left', `${sa.left}px`);
            root.style.setProperty('--tg-safe-area-right', `${sa.right}px`);
          }
          
          if (viewport && typeof viewport.contentSafeAreaInsets === 'function' && viewport.contentSafeAreaInsets.isAvailable && viewport.contentSafeAreaInsets.isAvailable()) {
            const csa = viewport.contentSafeAreaInsets();
            root.style.setProperty('--tg-content-safe-area-top', `${csa.top}px`);
            root.style.setProperty('--tg-content-safe-area-bottom', `${csa.bottom}px`);
            root.style.setProperty('--tg-content-safe-area-left', `${csa.left}px`);
            root.style.setProperty('--tg-content-safe-area-right', `${csa.right}px`);
          }
        } catch (e) {
          console.error('Update safe areas error:', e);
        }
      };

      updateSafeAreas();
      
      // 监听视口变化（包括安全区）
      const off = viewport.on('change', updateSafeAreas);

      // 进入全屏模式
      if (viewport && viewport.expand && viewport.expand.isAvailable && viewport.expand.isAvailable() && !viewport.isExpanded()) {
        viewport.expand();
      }

      // 禁止下拉收起手势
      if (viewport && viewport.setSwipeAllowed && viewport.setSwipeAllowed.isAvailable && viewport.setSwipeAllowed.isAvailable()) {
        viewport.setSwipeAllowed(false);
      }

      return off;
    }
  }, [isViewportMounted]);

  return <>{children}</>;
}

export function TelegramProvider({ children }: PropsWithChildren) {
  return (
    <TelegramInitializer>
      {children}
    </TelegramInitializer>
  );
}
