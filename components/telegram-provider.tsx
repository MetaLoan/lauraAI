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

// 强制发送 web_app_request_fullscreen 事件，绕过 JS 封装层
function forceRequestFullscreen() {
  try {
    // 方法1: 通过 TelegramWebviewProxy（移动端/桌面端）
    if ((window as any).TelegramWebviewProxy?.postEvent) {
      (window as any).TelegramWebviewProxy.postEvent('web_app_request_fullscreen', '');
      console.log('[FORCE] Sent web_app_request_fullscreen via TelegramWebviewProxy');
    }
    
    // 方法2: 通过 postMessage（Web iframe）
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(JSON.stringify({ eventType: 'web_app_request_fullscreen' }), '*');
      console.log('[FORCE] Sent web_app_request_fullscreen via postMessage');
    }
    
    // 方法3: 通过 external.notify（Windows Phone）
    if ((window as any).external?.notify) {
      (window as any).external.notify(JSON.stringify({ eventType: 'web_app_request_fullscreen' }));
      console.log('[FORCE] Sent web_app_request_fullscreen via external.notify');
    }
  } catch (err) {
    console.error('[FORCE] Error sending web_app_request_fullscreen:', err);
  }
}

// 强制发送禁用垂直滑动事件
function forceDisableVerticalSwipes() {
  try {
    if ((window as any).TelegramWebviewProxy?.postEvent) {
      (window as any).TelegramWebviewProxy.postEvent('web_app_setup_swipe_behavior', JSON.stringify({ allow_vertical_swipe: false }));
      console.log('[FORCE] Sent web_app_setup_swipe_behavior via TelegramWebviewProxy');
    }
    
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(JSON.stringify({ eventType: 'web_app_setup_swipe_behavior', eventData: { allow_vertical_swipe: false } }), '*');
      console.log('[FORCE] Sent web_app_setup_swipe_behavior via postMessage');
    }
  } catch (err) {
    console.error('[FORCE] Error sending web_app_setup_swipe_behavior:', err);
  }
}

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
          
          // 强制调用 web_app_request_fullscreen - 不检查方法是否存在，直接通过底层 API 发送
          forceRequestFullscreen();
          
          // 同时也尝试通过 JS 方法调用（如果存在）
          if (typeof webApp.requestFullscreen === 'function') {
            try {
              webApp.requestFullscreen();
              console.log('Called webApp.requestFullscreen() successfully');
            } catch (err) {
              console.error('requestFullscreen error:', err);
            }
          }

          // 禁用垂直滑动
          if (typeof webApp.disableVerticalSwipes === 'function') {
            webApp.disableVerticalSwipes();
            console.log('Called webApp.disableVerticalSwipes()');
          } else if (typeof webApp.disableVerticalSwipe === 'function') {
            webApp.disableVerticalSwipe();
            console.log('Called webApp.disableVerticalSwipe()');
          }
          
          // 强制禁用垂直滑动
          forceDisableVerticalSwipes();
          
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
          
          // 手动读取并设置安全区 CSS 变量（确保生效）
          const safeAreaInset = webApp.safeAreaInset;
          const contentSafeAreaInset = webApp.contentSafeAreaInset;
          
          console.log('=== Safe Area Debug ===');
          console.log('safeAreaInset:', safeAreaInset);
          console.log('contentSafeAreaInset:', contentSafeAreaInset);
          console.log('isFullscreen:', webApp.isFullscreen);
          console.log('========================');
          
          // 手动设置 CSS 变量
          if (safeAreaInset) {
            document.documentElement.style.setProperty('--tg-safe-area-top', `${safeAreaInset.top || 0}px`);
            document.documentElement.style.setProperty('--tg-safe-area-bottom', `${safeAreaInset.bottom || 0}px`);
            document.documentElement.style.setProperty('--tg-safe-area-left', `${safeAreaInset.left || 0}px`);
            document.documentElement.style.setProperty('--tg-safe-area-right', `${safeAreaInset.right || 0}px`);
          }
          
          if (contentSafeAreaInset) {
            document.documentElement.style.setProperty('--tg-content-safe-area-top', `${contentSafeAreaInset.top || 0}px`);
            document.documentElement.style.setProperty('--tg-content-safe-area-bottom', `${contentSafeAreaInset.bottom || 0}px`);
          }
          
          // 如果在全屏模式下但没有获取到 contentSafeAreaInset，设置一个默认值
          if (webApp.isFullscreen && (!contentSafeAreaInset || contentSafeAreaInset.top === 0)) {
            // 全屏模式下，Telegram 头部大约 56px
            document.documentElement.style.setProperty('--tg-content-safe-area-top', '56px');
            console.log('Set default content safe area top: 56px');
          }
        }
      } catch (err) {
        console.warn('Failed to setup safe area:', err);
      }
      
      // 添加一次性点击监听器，用户首次交互后尝试全屏（某些平台需要用户交互）
      const handleFirstInteraction = () => {
        const webApp = (window as any).Telegram?.WebApp;
        console.log('User interaction detected, attempting fullscreen...');
        
        // 强制调用全屏
        forceRequestFullscreen();
        
        if (webApp) {
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
      
      // 定时检查全屏状态（兜底方案）- 前几次更频繁地尝试
      let checkCount = 0;
      const expandInterval = setInterval(() => {
        checkCount++;
        const webApp = (window as any).Telegram?.WebApp;
        
        // 前 5 次检查时强制调用全屏
        if (checkCount <= 5) {
          console.log(`[CHECK ${checkCount}] Force requesting fullscreen...`);
          forceRequestFullscreen();
          forceDisableVerticalSwipes();
        }
        
        if (webApp) {            
            if (!webApp.isExpanded) {
                console.log('Not expanded, calling expand()');
                webApp.expand();
            }
            
            // 检查全屏状态（如果属性存在）
            if (webApp.isFullscreen === false) {
                console.log('Not fullscreen, calling requestFullscreen()');
                if (typeof webApp.requestFullscreen === 'function') {
                    webApp.requestFullscreen();
                }
                forceRequestFullscreen();
            }
            
            // 持续尝试禁用垂直滑动
            if (typeof webApp.disableVerticalSwipes === 'function') {
                webApp.disableVerticalSwipes();
            } else if (typeof webApp.disableVerticalSwipe === 'function') {
                webApp.disableVerticalSwipe();
            }
            
            // 更新安全区 CSS 变量（全屏模式可能在稍后生效）
            if (checkCount <= 10) {
              const contentSafeAreaInset = webApp.contentSafeAreaInset;
              if (contentSafeAreaInset && contentSafeAreaInset.top > 0) {
                document.documentElement.style.setProperty('--tg-content-safe-area-top', `${contentSafeAreaInset.top}px`);
                document.documentElement.style.setProperty('--tg-content-safe-area-bottom', `${contentSafeAreaInset.bottom || 0}px`);
                console.log(`[CHECK ${checkCount}] Updated content safe area top: ${contentSafeAreaInset.top}px`);
              } else if (webApp.isFullscreen) {
                // 全屏模式下设置默认值
                document.documentElement.style.setProperty('--tg-content-safe-area-top', '56px');
              }
            }
        }
      }, 1000); // 每秒检查一次
      
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
