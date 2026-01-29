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
      if (!isMiniAppMounted && miniApp.mount.isAvailable()) miniApp.mount();
      if (!isThemeParamsMounted && themeParams.mount.isAvailable()) themeParams.mount();
    }
  }, [isReady, isMiniAppMounted, isThemeParamsMounted]);

  useEffect(() => {
    if (isReady && !isViewportMounted && viewport.mount.isAvailable()) {
      viewport.mount().catch(console.error);
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
      if (viewport.bindCssVars.isAvailable()) viewport.bindCssVars();
      // 进入全屏模式
      if (viewport.expand.isAvailable() && !viewport.isExpanded()) {
        viewport.expand();
      }
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
