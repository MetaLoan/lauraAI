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
        if (webApp) {
          webApp.ready();
          
          // 尝试调用最新的 requestFullscreen 方法 (Bot API 8.0+)
          if (typeof webApp.requestFullscreen === 'function') {
            webApp.requestFullscreen();
            console.log('Called webApp.requestFullscreen()');
          } else {
            // 如果 requestFullscreen 不存在，尝试通过 postEvent 调用
            // 这是针对某些尚未更新 JS 对象的客户端的后备方案
            try {
               // 检查是否支持 postEvent
               if (window.TelegramWebviewProxy && window.TelegramWebviewProxy.postEvent) {
                   window.TelegramWebviewProxy.postEvent('web_app_request_fullscreen', '');
                   console.log('Called web_app_request_fullscreen via postEvent');
               } else if (window.external && (window.external as any).notify) {
                   // Windows Phone
                   (window.external as any).notify(JSON.stringify({ eventType: 'web_app_request_fullscreen', eventData: '' }));
               } else if (window.parent) {
                   // Web
                   window.parent.postMessage(JSON.stringify({ eventType: 'web_app_request_fullscreen', eventData: '' }), '*');
               }
            } catch (err) {
                console.error('Error calling web_app_request_fullscreen via postEvent:', err);
            }
            
            // 同时调用 expand 作为兼容
            if (webApp.expand) {
                webApp.expand();
                console.log('Called webApp.expand()');
            }
          }

          // 禁用垂直滑动
          if (typeof webApp.disableVerticalSwipes === 'function') {
            webApp.disableVerticalSwipes();
            console.log('Called webApp.disableVerticalSwipes()');
          } else if (typeof webApp.disableVerticalSwipe === 'function') {
            // 兼容旧版本名称
            webApp.disableVerticalSwipe();
          }
          
          console.log('Telegram WebApp initialized immediately');
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
      
      // 定时检查全屏状态（兜底方案）
      const expandInterval = setInterval(() => {
        const webApp = (window as any).Telegram?.WebApp;
        if (webApp) {
            // 优先检查是否支持 requestFullscreen
            if (typeof webApp.requestFullscreen === 'function') {
                // 如果支持 requestFullscreen，我们就不重复调用了，除非不在全屏状态
                // 但是目前没有 isFullscreen 属性，所以我们假设初始化时已经调用过了
                // 这里主要关注 expand
            } else {
                 // 尝试通过 postEvent 再次请求全屏（如果支持）
                 // 避免过于频繁调用，仅在检查到未展开时尝试
            }
            
            if (!webApp.isExpanded) {
                webApp.expand();
                // 如果未展开，也尝试请求全屏
                if (typeof webApp.requestFullscreen === 'function') {
                    webApp.requestFullscreen();
                }
            }
            
            // 持续尝试禁用垂直滑动
            if (typeof webApp.disableVerticalSwipes === 'function') {
                webApp.disableVerticalSwipes();
            } else if (typeof webApp.disableVerticalSwipe === 'function') {
                webApp.disableVerticalSwipe();
            }
        }
      }, 1000);
      
      // 只有在 Viewport 挂载并绑定变量后，才认为准备就绪（此时 CSS 变量已生效）
      // 设置一小段延迟确保布局计算完成
      const timer = setTimeout(() => setIsReady(true), 500);
      return () => {
        clearTimeout(timer);
        clearInterval(expandInterval);
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
