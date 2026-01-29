# Telegram Mini App 全屏模式与安全区适配指南

> 本文档总结了在 Telegram Mini App 中实现真正全屏模式和安全区适配的最佳实践与避坑指南。

## 目录

1. [问题背景](#问题背景)
2. [核心解决方案](#核心解决方案)
3. [常见错误与避坑指南](#常见错误与避坑指南)
4. [完整代码示例](#完整代码示例)
5. [调试技巧](#调试技巧)

---

## 问题背景

### 全屏模式的误区

很多开发者认为调用 `webApp.expand()` 就能实现全屏，但这是**错误的**！

- `expand()` 只是让 Mini App 占满可用高度，但**不是真正的全屏模式**
- 真正的全屏模式需要调用 `web_app_request_fullscreen` 事件（Bot API 8.0+）
- 全屏模式会隐藏 Telegram 的原生头部，显示一个浮动的 "Close" 按钮

### 安全区的挑战

进入全屏模式后，需要处理两类安全区：

1. **`safeAreaInset`**：设备物理安全区（刘海、底部手势条等）
2. **`contentSafeAreaInset`**：Telegram UI 占用的区域（全屏模式下的 Close 按钮等）

---

## 核心解决方案

### 1. 引入官方 SDK 脚本

**关键！** 必须在 HTML 中引入官方的 `telegram-web-app.js` 脚本：

```html
<!-- 在 layout.tsx 或 index.html 中 -->
<head>
  <script src="https://telegram.org/js/telegram-web-app.js" async></script>
</head>
```

如果不引入这个脚本，`window.Telegram.WebApp` 对象将不存在！

### 2. 强制调用全屏方法（不要依赖 JS 封装）

**避坑要点**：不要检查 `webApp.requestFullscreen` 是否存在后再调用！

因为某些 Telegram 客户端的 JS 对象可能没有暴露这个方法，但底层事件是支持的。

**正确做法**：直接通过底层 API 发送事件：

```typescript
// ✅ 正确：强制发送 web_app_request_fullscreen 事件
function forceRequestFullscreen() {
  try {
    // 方法1: 通过 TelegramWebviewProxy（移动端/桌面端）
    if ((window as any).TelegramWebviewProxy?.postEvent) {
      (window as any).TelegramWebviewProxy.postEvent('web_app_request_fullscreen', '');
      console.log('Sent web_app_request_fullscreen via TelegramWebviewProxy');
    }
    
    // 方法2: 通过 postMessage（Web iframe）
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        JSON.stringify({ eventType: 'web_app_request_fullscreen' }), 
        '*'
      );
      console.log('Sent web_app_request_fullscreen via postMessage');
    }
  } catch (err) {
    console.error('Error sending web_app_request_fullscreen:', err);
  }
}
```

**错误做法**：

```typescript
// ❌ 错误：这样可能永远不会调用全屏
if (typeof webApp.requestFullscreen === 'function') {
  webApp.requestFullscreen();
} else {
  webApp.expand(); // expand 不是全屏！
}
```

### 3. 安全区 CSS 变量的正确使用

Telegram SDK 会自动设置以下 CSS 变量（如果正确初始化）：

```css
:root {
  --tg-safe-area-top: 47px;      /* 设备顶部安全区 */
  --tg-safe-area-bottom: 34px;   /* 设备底部安全区 */
  --tg-safe-area-left: 0px;
  --tg-safe-area-right: 0px;
  --tg-content-safe-area-top: 56px;   /* Telegram UI 占用的顶部区域 */
  --tg-content-safe-area-bottom: 0px;
}
```

在容器中使用：

```tsx
<div
  style={{
    paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px))',
    paddingBottom: 'var(--tg-safe-area-bottom, 0px)',
  }}
>
  {/* 内容 */}
</div>
```

### 4. 手动获取并设置安全区变量

如果 SDK 的自动绑定不生效，需要手动获取并设置：

```typescript
function setupSafeAreaCssVars() {
  const webApp = (window as any).Telegram?.WebApp;
  if (!webApp) return false;
  
  const safeAreaInset = webApp.safeAreaInset;
  const contentSafeAreaInset = webApp.contentSafeAreaInset;
  
  // 设置设备安全区
  if (safeAreaInset) {
    document.documentElement.style.setProperty(
      '--tg-safe-area-top', 
      `${safeAreaInset.top || 0}px`
    );
    document.documentElement.style.setProperty(
      '--tg-safe-area-bottom', 
      `${safeAreaInset.bottom || 0}px`
    );
  }
  
  // 设置内容安全区
  if (contentSafeAreaInset) {
    document.documentElement.style.setProperty(
      '--tg-content-safe-area-top', 
      `${contentSafeAreaInset.top || 0}px`
    );
  }
  
  // 如果在全屏模式下但没有获取到值，使用默认值
  if (webApp.isFullscreen && (!contentSafeAreaInset || contentSafeAreaInset.top === 0)) {
    document.documentElement.style.setProperty('--tg-content-safe-area-top', '56px');
  }
  
  return true;
}
```

---

## 常见错误与避坑指南

### ❌ 错误 1：依赖 `expand()` 实现全屏

```typescript
// 错误！expand() 不是全屏
webApp.expand();
```

**正确做法**：使用 `forceRequestFullscreen()` 强制发送事件。

### ❌ 错误 2：条件判断后再调用全屏方法

```typescript
// 错误！requestFullscreen 可能在 JS 对象中不存在，但底层支持
if (typeof webApp.requestFullscreen === 'function') {
  webApp.requestFullscreen();
}
```

**正确做法**：直接通过 `TelegramWebviewProxy.postEvent` 发送事件。

### ❌ 错误 3：在 Preloader 显示前就获取安全区

安全区的值可能在 `requestFullscreen` 调用后才会更新，需要轮询等待：

```typescript
// 在初始化后开始轮询
let attempts = 0;
const pollSafeArea = () => {
  attempts++;
  const webApp = (window as any).Telegram?.WebApp;
  const contentSafeAreaInset = webApp?.contentSafeAreaInset;
  
  if (contentSafeAreaInset && contentSafeAreaInset.top > 0) {
    // 获取到值了
    setupSafeAreaCssVars();
    setIsReady(true);
  } else if (attempts > 30) {
    // 超时，使用默认值
    document.documentElement.style.setProperty('--tg-content-safe-area-top', '100px');
    setIsReady(true);
  } else {
    setTimeout(pollSafeArea, 500);
  }
};

// 延迟开始轮询，给 requestFullscreen 时间生效
setTimeout(pollSafeArea, 500);
```

### ❌ 错误 4：没有引入官方 SDK 脚本

即使使用了 `@telegram-apps/sdk-react`，也需要引入官方的 JS 脚本：

```html
<script src="https://telegram.org/js/telegram-web-app.js" async></script>
```

否则 `window.Telegram.WebApp` 对象不存在。

### ❌ 错误 5：底部安全区设置过大导致黑条

如果设备没有底部安全区，不要设置固定的底部 padding：

```tsx
// ❌ 错误：可能导致底部出现黑条
paddingBottom: 'max(34px, var(--tg-safe-area-bottom, 0px))'

// ✅ 正确：让其自然适应
paddingBottom: 'var(--tg-safe-area-bottom, 0px)'
```

---

## 完整代码示例

### layout.tsx

```tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { TelegramProvider } from '@/components/telegram-provider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        {/* 关键：引入官方 SDK 脚本 */}
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body className="bg-black text-white h-full overflow-hidden">
        <TelegramProvider>
          {children}
        </TelegramProvider>
      </body>
    </html>
  )
}
```

### telegram-provider.tsx

```tsx
'use client';

import { type PropsWithChildren, useEffect, useState } from 'react';

// 强制发送全屏请求
function forceRequestFullscreen() {
  try {
    if ((window as any).TelegramWebviewProxy?.postEvent) {
      (window as any).TelegramWebviewProxy.postEvent('web_app_request_fullscreen', '');
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        JSON.stringify({ eventType: 'web_app_request_fullscreen' }), 
        '*'
      );
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

// 强制禁用垂直滑动
function forceDisableVerticalSwipes() {
  try {
    if ((window as any).TelegramWebviewProxy?.postEvent) {
      (window as any).TelegramWebviewProxy.postEvent(
        'web_app_setup_swipe_behavior', 
        JSON.stringify({ allow_vertical_swipe: false })
      );
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

// 设置安全区 CSS 变量
function setupSafeAreaCssVars(): boolean {
  const webApp = (window as any).Telegram?.WebApp;
  if (!webApp) return false;
  
  const safeAreaInset = webApp.safeAreaInset;
  const contentSafeAreaInset = webApp.contentSafeAreaInset;
  
  let hasValidValues = false;
  
  if (safeAreaInset) {
    document.documentElement.style.setProperty('--tg-safe-area-top', `${safeAreaInset.top || 0}px`);
    document.documentElement.style.setProperty('--tg-safe-area-bottom', `${safeAreaInset.bottom || 0}px`);
    if (safeAreaInset.top > 0 || safeAreaInset.bottom > 0) hasValidValues = true;
  }
  
  if (contentSafeAreaInset && contentSafeAreaInset.top > 0) {
    document.documentElement.style.setProperty('--tg-content-safe-area-top', `${contentSafeAreaInset.top}px`);
    hasValidValues = true;
  }
  
  // 全屏模式下的默认值
  if (webApp.isFullscreen && (!contentSafeAreaInset || contentSafeAreaInset.top === 0)) {
    document.documentElement.style.setProperty('--tg-content-safe-area-top', '56px');
    hasValidValues = true;
  }
  
  return hasValidValues;
}

export function TelegramProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const webApp = (window as any).Telegram?.WebApp;
      
      if (webApp) {
        webApp.ready();
        webApp.expand();
        
        // 强制请求全屏 - 关键！
        forceRequestFullscreen();
        forceDisableVerticalSwipes();
      }
      
      // 轮询获取安全区值
      let attempts = 0;
      const pollSafeArea = () => {
        attempts++;
        const hasValues = setupSafeAreaCssVars();
        
        if (hasValues) {
          setIsReady(true);
        } else if (attempts > 30) {
          // 15秒超时，使用默认值
          document.documentElement.style.setProperty('--tg-content-safe-area-top', '100px');
          setIsReady(true);
        } else {
          setTimeout(pollSafeArea, 500);
        }
      };
      
      setTimeout(pollSafeArea, 500);
    };
    
    init();
  }, []);

  if (!isReady) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
```

### 主容器样式

```tsx
<div
  style={{
    paddingTop: 'max(100px, calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px)))',
    paddingBottom: 'var(--tg-safe-area-bottom, 0px)',
  }}
>
  {/* 页面内容 */}
</div>
```

---

## 调试技巧

### 1. 在 Preloader 中显示调试信息

```tsx
function PreloaderDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const update = () => {
      const webApp = (window as any).Telegram?.WebApp;
      setDebugInfo({
        webAppExists: !!webApp,
        version: webApp?.version,
        platform: webApp?.platform,
        isFullscreen: webApp?.isFullscreen,
        isExpanded: webApp?.isExpanded,
        safeAreaInset: JSON.stringify(webApp?.safeAreaInset),
        contentSafeAreaInset: JSON.stringify(webApp?.contentSafeAreaInset),
      });
    };
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-black/80 p-4 text-xs font-mono text-white">
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
}
```

### 2. 关键日志点

```typescript
console.log('=== Telegram WebApp Debug ===');
console.log('WebApp available:', !!webApp);
console.log('isFullscreen:', webApp?.isFullscreen);
console.log('safeAreaInset:', JSON.stringify(webApp?.safeAreaInset));
console.log('contentSafeAreaInset:', JSON.stringify(webApp?.contentSafeAreaInset));
console.log('TelegramWebviewProxy:', !!(window as any).TelegramWebviewProxy);
```

### 3. 检查 CSS 变量是否生效

```typescript
const styles = getComputedStyle(document.documentElement);
console.log('--tg-safe-area-top:', styles.getPropertyValue('--tg-safe-area-top'));
console.log('--tg-content-safe-area-top:', styles.getPropertyValue('--tg-content-safe-area-top'));
```

---

## 总结

| 问题 | 解决方案 |
|------|---------|
| 全屏模式不生效 | 使用 `TelegramWebviewProxy.postEvent('web_app_request_fullscreen', '')` 强制发送 |
| 安全区值获取不到 | 轮询等待 + 超时使用默认值 |
| `webApp` 对象不存在 | 在 HTML 中引入 `telegram-web-app.js` 脚本 |
| 底部出现黑条 | 不要设置固定的底部 padding，使用 CSS 变量 |
| 顶部内容被遮挡 | 使用 `max(100px, ...)` 确保有足够的顶部 padding |

---

## 参考链接

- [Telegram Mini Apps 官方文档](https://core.telegram.org/bots/webapps)
- [Telegram Mini Apps 方法列表](https://docs.telegram-mini-apps.com/platform/methods)
- [web_app_request_fullscreen 事件](https://docs.telegram-mini-apps.com/platform/methods#web_app_request_fullscreen)
