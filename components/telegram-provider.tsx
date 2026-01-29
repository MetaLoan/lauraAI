'use client';

import { 
  useSignal,
  init,
  miniApp,
  viewport,
  themeParams,
  swipeBehavior,
  isTMA
} from '@telegram-apps/sdk-react';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { Preloader } from './preloader';

function TelegramInitializer({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [isSDKInitialized, setIsSDKInitialized] = useState(false);

  // 初始化 SDK
  useEffect(() => {
    const initializeSDK = async () => {
      // 检查是否在 Telegram 环境中
      const inTMA = await isTMA();
      if (!inTMA) {
        console.warn('Not in Telegram Mini App environment');
        setIsReady(true);
        setIsSDKInitialized(true);
        return;
      }

      try {
        // init() 会尝试获取启动参数，如果失败会抛出异常
        init();
        setIsSDKInitialized(true);
      } catch (e) {
        console.error('Telegram SDK init error:', e);
        // 即使失败也标记为就绪，以便在非 TMA 环境下也能运行（或者你可以显示错误 UI）
        setIsReady(true);
        setIsSDKInitialized(true);
      }
    };

    initializeSDK();
  }, []);

  // 使用 signals 获取状态
  const isMiniAppMounted = useSignal(miniApp.isMounted);
  const isViewportMounted = useSignal(viewport.isMounted);
  const isThemeParamsMounted = useSignal(themeParams.isMounted);
  const isSwipeBehaviorMounted = useSignal(swipeBehavior.isMounted);

  // 挂载组件
  useEffect(() => {
    if (isSDKInitialized) {
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
      if (!isSwipeBehaviorMounted && swipeBehavior.mount.isAvailable() && !swipeBehavior.isMounting()) {
        swipeBehavior.mount().catch(err => {
          if (err.message.includes('already mounting')) return;
          console.error('swipeBehavior mount error:', err);
        });
      }
    }
  }, [isSDKInitialized, isMiniAppMounted, isThemeParamsMounted, isSwipeBehaviorMounted]);

  useEffect(() => {
    if (isSDKInitialized && !isViewportMounted && viewport.mount.isAvailable() && !viewport.isMounting()) {
      viewport.mount().catch(err => {
        if (err.message.includes('already mounting')) return;
        console.error('viewport mount error:', err);
      });
    }
  }, [isSDKInitialized, isViewportMounted]);

  // 绑定 CSS 变量
  useEffect(() => {
    if (isMiniAppMounted && miniApp.bindCssVars.isAvailable()) {
      miniApp.bindCssVars();
      if (miniApp.ready.isAvailable()) miniApp.ready();
    }
  }, [isMiniAppMounted]);

  useEffect(() => {
    if (isThemeParamsMounted && themeParams.bindCssVars.isAvailable()) themeParams.bindCssVars();
  }, [isThemeParamsMounted]);

  useEffect(() => {
    if (isViewportMounted) {
      if (viewport.bindCssVars.isAvailable()) viewport.bindCssVars();
      // 进入全屏模式
      if (viewport.expand.isAvailable() && !viewport.isExpanded()) {
        viewport.expand();
      }
      // 标记为准备就绪（等待 Viewport 挂载以获取安全区高度）
      setIsReady(true);
    }
  }, [isViewportMounted]);

  // 禁用下拉关闭手势
  useEffect(() => {
    if (isSwipeBehaviorMounted && swipeBehavior.disableVerticalSwipe.isAvailable()) {
      swipeBehavior.disableVerticalSwipe();
    }
  }, [isSwipeBehaviorMounted]);

  if (!isReady) {
    return <Preloader />;
  }

  return <>{children}</>;
}

export function TelegramProvider({ children }: PropsWithChildren) {
  return (
    <TelegramInitializer>
      {children}
    </TelegramInitializer>
  );
}
