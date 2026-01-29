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
        
        // 尝试尽早调用 expand，不等待 React 状态更新
        const webApp = (window as any).Telegram?.WebApp;
        
        // 详细调试信息
        console.log('=== Telegram WebApp Debug Info ===');
        console.log('WebApp available:', !!webApp);
        console.log('WebApp version:', webApp?.version);
        console.log('WebApp platform:', webApp?.platform);
        console.log('isExpanded:', webApp?.isExpanded);
        console.log('isFullscreen:', webApp?.isFullscreen);
        console.log('requestFullscreen available:', typeof webApp?.requestFullscreen);
        console.log('expand available:', typeof webApp?.expand);
        console.log('disableVerticalSwipes available:', typeof webApp?.disableVerticalSwipes);
        console.log('TelegramWebviewProxy available:', !!(window as any).TelegramWebviewProxy);
        console.log('================================');
        
        if (webApp) {
          webApp.ready();
          
          // 首先调用 expand（这个是基础方法，应该总是可用的）
          if (webApp.expand) {
            webApp.expand();
            console.log('Called webApp.expand()');
          }
          
          // 尝试调用最新的 requestFullscreen 方法 (Bot API 8.0+)
          if (typeof webApp.requestFullscreen === 'function') {
            try {
              webApp.requestFullscreen();
              console.log('Called webApp.requestFullscreen() successfully');
            } catch (err) {
              console.error('requestFullscreen error:', err);
            }
          } else {
            console.log('requestFullscreen not available on this client');
            // 如果 requestFullscreen 不存在，尝试通过 postEvent 调用
            try {
               // 检查是否支持 postEvent
               if ((window as any).TelegramWebviewProxy && (window as any).TelegramWebviewProxy.postEvent) {
                   (window as any).TelegramWebviewProxy.postEvent('web_app_request_fullscreen', '');
                   console.log('Called web_app_request_fullscreen via TelegramWebviewProxy.postEvent');
               } else if (window.parent && window.parent !== window) {
                   // Web iframe
                   window.parent.postMessage(JSON.stringify({ eventType: 'web_app_request_fullscreen' }), '*');
                   console.log('Called web_app_request_fullscreen via postMessage');
               }
            } catch (err) {
                console.error('Error calling web_app_request_fullscreen via postEvent:', err);
            }
          }

          // 禁用垂直滑动
          if (typeof webApp.disableVerticalSwipes === 'function') {
            webApp.disableVerticalSwipes();
            console.log('Called webApp.disableVerticalSwipes()');
          } else if (typeof webApp.disableVerticalSwipe === 'function') {
            // 兼容旧版本名称
            webApp.disableVerticalSwipe();
            console.log('Called webApp.disableVerticalSwipe()');
          }
          
          console.log('Telegram WebApp initialized, isExpanded:', webApp.isExpanded);
        }
        
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
    if (isMiniAppMounted) {
      if (miniApp.bindCssVars.isAvailable()) miniApp.bindCssVars();
      
      // 设置头部和背景颜色，使其与应用主题一致
      if (miniApp.setHeaderColor.isAvailable()) {
        miniApp.setHeaderColor('#000000');
      }
      if (miniApp.setBackgroundColor.isAvailable()) {
        miniApp.setBackgroundColor('#000000');
      }
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
      
      // 尝试调用 requestFullscreen (如果通过 SDK 暴露)
      // 目前 @telegram-apps/sdk-react 可能还没完全封装 requestFullscreen，
      // 所以主要依赖上面的原生调用。
      
      // 禁用垂直下拉关闭 Mini App 的行为（仅使用原生 API，避免 SDK 兼容性问题）
      try {
        const webApp = (window as any).Telegram?.WebApp;
        if (webApp) {
          webApp.expand(); // 再次尝试 expand
          if (typeof webApp.disableVerticalSwipe === 'function') {
            webApp.disableVerticalSwipe();
          }
          webApp.isVerticalSwipeAllowed = false; // 尝试旧属性
        }
      } catch (err) {
        console.warn('Failed to disable vertical swipe:', err);
      }
      
      // 添加一次性点击监听器，用户首次交互后尝试全屏（某些平台需要用户交互）
      const handleFirstInteraction = () => {
        const webApp = (window as any).Telegram?.WebApp;
        if (webApp) {
          console.log('User interaction detected, attempting fullscreen...');
          if (typeof webApp.requestFullscreen === 'function') {
            try {
              webApp.requestFullscreen();
              console.log('requestFullscreen called after user interaction');
            } catch (err) {
              console.error('requestFullscreen error after interaction:', err);
            }
          }
          webApp.expand();
        }
        // 移除监听器，只触发一次
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
      };
      
      document.addEventListener('click', handleFirstInteraction, { once: true });
      document.addEventListener('touchstart', handleFirstInteraction, { once: true });
      
      // 定时检查全屏状态（兜底方案）
      const expandInterval = setInterval(() => {
        const webApp = (window as any).Telegram?.WebApp;
        if (webApp) {            
            if (!webApp.isExpanded) {
                console.log('Not expanded, calling expand()');
                webApp.expand();
            }
            
            // 检查全屏状态（如果属性存在）
            if (webApp.isFullscreen === false && typeof webApp.requestFullscreen === 'function') {
                console.log('Not fullscreen, calling requestFullscreen()');
                webApp.requestFullscreen();
            }
            
            // 持续尝试禁用垂直滑动
            if (typeof webApp.disableVerticalSwipes === 'function') {
                webApp.disableVerticalSwipes();
            } else if (typeof webApp.disableVerticalSwipe === 'function') {
                webApp.disableVerticalSwipe();
            }
        }
      }, 2000); // 降低频率到 2 秒
      
      // 只有在 Viewport 挂载并绑定变量后，才认为准备就绪（此时 CSS 变量已生效）
      // 设置一小段延迟确保布局计算完成
      const timer = setTimeout(() => setIsReady(true), 500);
      return () => {
        clearTimeout(timer);
        clearInterval(expandInterval);
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
      };
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
