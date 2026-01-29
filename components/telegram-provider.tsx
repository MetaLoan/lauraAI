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
import Preloader from './ui/preloader';

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
        setIsSDKInitialized(true);
        setIsReady(true);
        return;
      }

      try {
        // init() 会尝试获取启动参数，如果失败会抛出异常
        init();
        setIsSDKInitialized(true);
      } catch (e) {
        console.error('Telegram SDK init error:', e);
        // 即使失败也标记为就绪
        setIsSDKInitialized(true);
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
    }
  }, [isSDKInitialized, isMiniAppMounted, isThemeParamsMounted]);

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
      
      // 禁用垂直下拉关闭 Mini App 的行为
      try {
        if (viewport.isVerticalSwipeAllowed.isAvailable() && viewport.isVerticalSwipeAllowed()) {
          viewport.allowVerticalSwipe(false);
        }
      } catch (err) {
        console.warn('Failed to disable vertical swipe:', err);
      }
      
      // 只有在 Viewport 挂载并绑定变量后，才认为准备就绪（此时 CSS 变量已生效）
      // 设置一小段延迟确保布局计算完成
      const timer = setTimeout(() => setIsReady(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isViewportMounted]);

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
