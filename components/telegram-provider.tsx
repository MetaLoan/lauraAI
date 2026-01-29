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

// 获取并设置安全区 CSS 变量，返回是否成功获取到有效值
function setupSafeAreaCssVars(): boolean {
  const webApp = (window as any).Telegram?.WebApp;
  if (!webApp) return false;
  
  const safeAreaInset = webApp.safeAreaInset;
  const contentSafeAreaInset = webApp.contentSafeAreaInset;
  
  console.log('=== Safe Area Values ===');
  console.log('safeAreaInset:', JSON.stringify(safeAreaInset));
  console.log('contentSafeAreaInset:', JSON.stringify(contentSafeAreaInset));
  console.log('isFullscreen:', webApp.isFullscreen);
  console.log('========================');
  
  let hasValidValues = false;
  
  // 设置设备安全区
  if (safeAreaInset) {
    document.documentElement.style.setProperty('--tg-safe-area-top', `${safeAreaInset.top || 0}px`);
    document.documentElement.style.setProperty('--tg-safe-area-bottom', `${safeAreaInset.bottom || 0}px`);
    document.documentElement.style.setProperty('--tg-safe-area-left', `${safeAreaInset.left || 0}px`);
    document.documentElement.style.setProperty('--tg-safe-area-right', `${safeAreaInset.right || 0}px`);
    if (safeAreaInset.top > 0 || safeAreaInset.bottom > 0) {
      hasValidValues = true;
    }
  }
  
  // 设置内容安全区
  if (contentSafeAreaInset) {
    document.documentElement.style.setProperty('--tg-content-safe-area-top', `${contentSafeAreaInset.top || 0}px`);
    document.documentElement.style.setProperty('--tg-content-safe-area-bottom', `${contentSafeAreaInset.bottom || 0}px`);
    if (contentSafeAreaInset.top > 0) {
      hasValidValues = true;
      console.log(`[SAFE AREA] Got valid content safe area top: ${contentSafeAreaInset.top}px`);
    }
  }
  
  // 如果在全屏模式下但没有获取到 contentSafeAreaInset，设置默认值
  if (webApp.isFullscreen && (!contentSafeAreaInset || contentSafeAreaInset.top === 0)) {
    document.documentElement.style.setProperty('--tg-content-safe-area-top', '56px');
    console.log('[SAFE AREA] Set default content safe area top: 56px (fullscreen mode)');
    hasValidValues = true;
  }
  
  return hasValidValues;
}

// 监听安全区变化事件
function listenToSafeAreaEvents(callback: () => void) {
  // 通过 TelegramWebviewProxy 监听事件
  const handleEvent = (event: MessageEvent) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data.eventType === 'safe_area_changed' || 
          data.eventType === 'content_safe_area_changed' ||
          data.eventType === 'fullscreen_changed') {
        console.log('[EVENT] Received:', data.eventType, data.eventData);
        callback();
      }
    } catch (e) {
      // 忽略解析错误
    }
  };
  
  window.addEventListener('message', handleEvent);
  
  // 也监听 Telegram 的原生事件（如果有）
  const webApp = (window as any).Telegram?.WebApp;
  if (webApp) {
    // onEvent 是 Telegram WebApp 提供的事件监听方法
    if (typeof webApp.onEvent === 'function') {
      webApp.onEvent('safeAreaChanged', () => {
        console.log('[EVENT] safeAreaChanged');
        callback();
      });
      webApp.onEvent('contentSafeAreaChanged', () => {
        console.log('[EVENT] contentSafeAreaChanged');
        callback();
      });
      webApp.onEvent('fullscreenChanged', () => {
        console.log('[EVENT] fullscreenChanged');
        callback();
      });
    }
  }
  
  return () => {
    window.removeEventListener('message', handleEvent);
  };
}

function TelegramInitializer({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [isSDKInitialized, setIsSDKInitialized] = useState(false);
  const [safeAreaReady, setSafeAreaReady] = useState(false);

  // 初始化 SDK
  useEffect(() => {
    const initializeSDK = async () => {
      // 检查是否在 Telegram 环境中
      const inTMA = await isTMA();
      if (!inTMA) {
        console.warn('Not in Telegram Mini App environment');
        setIsSDKInitialized(true);
        setSafeAreaReady(true);
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
        
        // 监听安全区变化事件
        const cleanupListener = listenToSafeAreaEvents(() => {
          const hasValidValues = setupSafeAreaCssVars();
          if (hasValidValues) {
            console.log('[EVENT] Safe area updated via event');
            setSafeAreaReady(true);
          }
        });
        
        // 在 Preloader 阶段轮询获取安全区的值
        // 需要等待 requestFullscreen 生效后才能获取到正确的值
        console.log('[PRELOADER] Starting safe area polling (waiting for fullscreen)...');
        console.log('[DEBUG] Will NOT proceed until BOTH safeAreaInset AND contentSafeAreaInset are obtained!');
        let attempts = 0;
        
        const pollSafeArea = () => {
          attempts++;
          const webApp = (window as any).Telegram?.WebApp;
          const safeAreaInset = webApp?.safeAreaInset;
          const contentSafeAreaInset = webApp?.contentSafeAreaInset;
          
          console.log(`[POLL ${attempts}] safeAreaInset:`, JSON.stringify(safeAreaInset));
          console.log(`[POLL ${attempts}] contentSafeAreaInset:`, JSON.stringify(contentSafeAreaInset));
          console.log(`[POLL ${attempts}] isFullscreen:`, webApp?.isFullscreen);
          
          // 必须同时获取到两个值才算成功
          const hasSafeArea = safeAreaInset && (safeAreaInset.top > 0 || safeAreaInset.bottom > 0);
          const hasContentSafeArea = contentSafeAreaInset && contentSafeAreaInset.top > 0;
          
          if (hasSafeArea && hasContentSafeArea) {
            console.log(`[PRELOADER] ✅ BOTH values obtained after ${attempts} attempts!`);
            console.log(`[PRELOADER] safeAreaInset.top: ${safeAreaInset.top}px`);
            console.log(`[PRELOADER] contentSafeAreaInset.top: ${contentSafeAreaInset.top}px`);
            setupSafeAreaCssVars();
            setSafeAreaReady(true);
          } else {
            // 继续轮询，不设超时，一直等待
            console.log(`[POLL ${attempts}] ❌ Still waiting... (hasSafeArea: ${hasSafeArea}, hasContentSafeArea: ${hasContentSafeArea})`);
            
            // 如果尝试超过 30 次（15秒），还是没有获取到，强制进入
            if (attempts > 30) {
                console.log('[PRELOADER] ⚠️ Timeout waiting for safe area, forcing entry with defaults');
                document.documentElement.style.setProperty('--tg-content-safe-area-top', '100px');
                document.documentElement.style.setProperty('--tg-safe-area-bottom', '0px');
                setSafeAreaReady(true);
            } else {
                setTimeout(pollSafeArea, 500); // 每 500ms 检查一次
            }
          }
        };
        
        // 延迟 500ms 后开始轮询，给 requestFullscreen 足够的时间生效
        setTimeout(pollSafeArea, 500);
        
      } catch (e) {
        console.error('Telegram SDK init error:', e);
        // 即使失败也标记为就绪，使用默认值
        document.documentElement.style.setProperty('--tg-content-safe-area-top', '56px');
        setIsSDKInitialized(true);
        setSafeAreaReady(true);
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
      
      // 再次尝试获取安全区（viewport 挂载后可能会有新值）
      setupSafeAreaCssVars();
      
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
      
      return () => {
        clearInterval(expandInterval);
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
      };
    }
  }, [isViewportMounted]);
  
  // 只有在安全区获取完成后才设置 isReady
  useEffect(() => {
    if (safeAreaReady && isViewportMounted) {
      console.log('[READY] Safe area ready and viewport mounted, showing content');
      // 再次确保安全区 CSS 变量已设置
      setupSafeAreaCssVars();
      setIsReady(true);
    }
  }, [safeAreaReady, isViewportMounted]);

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
