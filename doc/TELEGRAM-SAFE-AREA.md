# Telegram 安全区域计算文档

## 概述

本文档详细说明了 Freya V2 项目中如何计算和应用 Telegram WebApp 的安全区域（Safe Area），以实现沉浸式全屏体验。

## 核心原理

### 1. Telegram SDK 8.0+ 规范

Telegram 提供了两个关键的安全区域值：

- **`safeAreaInset.top`**：系统级安全区域（如 iOS 刘海屏、Android 状态栏）
- **`contentSafeAreaInset.top`**：内容级安全区域（Telegram 悬浮按钮占用的空间）

**关键公式：**
```javascript
总安全区域高度 = safeAreaInset.top + contentSafeAreaInset.top
```

### 2. 为什么需要叠加两者？

在 Telegram 全屏模式（`requestFullscreen()`）下：
- **Android**：系统状态栏被隐藏（`safeAreaInset.top` → 0），但 Telegram 会显示悬浮返回按钮（`contentSafeAreaInset.top` 有值）
- **iOS**：刘海屏安全区域依然存在（`safeAreaInset.top` 有值），同时也有悬浮按钮（`contentSafeAreaInset.top` 有值）

因此，**必须叠加**两者才能获得真正的"内容可用区域"顶部偏移。

---

## 代码实现

### 1. 获取安全区域高度（`utils/telegram.ts`）

```typescript
export const getSafeAreaTop = (): number => {
  if (!isTelegram()) {
    return 0;
  }
  
  const webApp = window.Telegram?.WebApp;
  if (!webApp) {
    return 0;
  }
  
  // 严格从 SDK 获取最新的 inset 值
  const systemTop = webApp.safeAreaInset?.top || 0;
  const contentTop = webApp.contentSafeAreaInset?.top || 0;
  const platform = webApp.platform || 'unknown';
  const isFullscreen = !!webApp.isFullscreen;

  // 叠加两者是获取"绝对安全区域"的官方唯一准则
  const totalTop = systemTop + contentTop;

  // 调试日志
  console.log(`📱 [${platform}] SDK Insets (FS:${isFullscreen}): system=${systemTop}px, content=${contentTop}px, total=${totalTop}px`);

  return totalTop;
};
```

**关键点：**
- ✅ 不使用任何硬编码的保底值（如 44px）
- ✅ 完全依赖 Telegram SDK 的实时数据
- ✅ 适配 iOS 和 Android 的差异

---

### 2. 应用安全区域到页面（`components/TelegramWebAppInit.tsx`）

```typescript
const updateSafeArea = () => {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  // 动态获取安全区域高度（包含 Telegram 顶部按钮区域）
  const systemTop = webApp.safeAreaInset?.top || 0;
  const contentTop = webApp.contentSafeAreaInset?.top || 0;
  const totalTop = systemTop + contentTop;
  
  // 1. 同步到自定义变量（这是应用主要依赖的变量）
  document.documentElement.style.setProperty('--telegram-safe-area-top', `${totalTop}px`);
  
  // 2. 显式同步 SDK 原始变量（防止安卓客户端注入失效）
  document.documentElement.style.setProperty('--tg-safe-area-inset-top', `${systemTop}px`);
  document.documentElement.style.setProperty('--tg-content-safe-area-inset-top', `${contentTop}px`);
  
  // 3. 清除最外层容器的 padding-top（避免 min-h-screen + padding 导致过度滚动）
  const appContainer = document.querySelector('.max-w-md.mx-auto.min-h-screen');
  if (appContainer instanceof HTMLElement) {
    appContainer.style.paddingTop = '0px';
  }
  
  // 4. 为所有页面的 main 元素添加 padding-top
  const mainElements = document.querySelectorAll('main');
  mainElements.forEach((main) => {
    if (main instanceof HTMLElement) {
      main.style.paddingTop = `${totalTop}px`;
    }
  });
};
```

**应用策略：**
1. 将计算结果注入到 CSS 变量 `--telegram-safe-area-top`
2. 同时更新 Telegram SDK 的原生变量（防止客户端注入失效）
3. 清除外层容器的 `padding-top`，避免双重偏移
4. 仅对 `<main>` 元素应用 `padding-top`，让内容避开顶部遮挡区域

---

### 3. CSS 变量定义（`index.css`）

```css
:root {
  /* ===== 沉浸式顶栏安全区域 ===== */
  /* 严格遵循 Telegram SDK 8.0+ 规范：系统安全区 + 内容安全区叠加 */
  /* 不再使用任何硬编码的 44px 保底值，确保所有偏移均来自 SDK */
  --telegram-safe-area-top: calc(
    var(--tg-safe-area-inset-top, 0px) + 
    var(--tg-content-safe-area-inset-top, 0px)
  );
  
  /* 定义按钮区域偏移量 */
  --telegram-button-height: var(--tg-content-safe-area-inset-top, 0px);
}
```

**CSS 策略：**
- 使用 `calc()` 动态计算总安全区域
- 提供默认值 `0px`，确保在非 Telegram 环境下不出错
- 单独定义 `--telegram-button-height` 用于特殊场景（如浮动按钮定位）

---

## 实际应用场景

### 场景 1：页面顶部内容避开遮挡

```tsx
// 在 App.tsx 的 Layout 组件中
<main className="flex-1 relative z-0 min-h-0 pb-24">
  {children}
</main>
```

JavaScript 会动态为 `<main>` 添加 `padding-top: ${totalTop}px`，让页面内容从安全区域下方开始渲染。

### 场景 2：固定定位元素（如聊天输入框）

```tsx
// 在 Chat 页面中
<div 
  className="fixed top-0 left-0 right-0 z-10"
  style={{ paddingTop: 'var(--telegram-safe-area-top)' }}
>
  {/* 聊天输入框等固定元素 */}
</div>
```

---

## 调试方法

### 1. 查看控制台日志

每次安全区域更新时，会输出如下日志：

```
📱 [android] SDK Insets (FS:true): system=0px, content=44px, total=44px
📱 [ios] SDK Insets (FS:true): system=47px, content=44px, total=91px
```

### 2. 检查 CSS 变量

在浏览器开发者工具中，检查 `<html>` 元素的 computed styles：

```
--telegram-safe-area-top: 91px
--tg-safe-area-inset-top: 47px
--tg-content-safe-area-inset-top: 44px
```

### 3. 视觉调试

临时添加一个可视化元素来验证安全区域：

```tsx
<div 
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 'var(--telegram-safe-area-top)',
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    zIndex: 9999,
    pointerEvents: 'none',
  }}
/>
```

---

## 注意事项

### ⚠️ 常见错误

1. **不要使用硬编码值**
   ```javascript
   // ❌ 错误
   const safeAreaTop = 44; // 在不同设备/平台上会出错
   
   // ✅ 正确
   const safeAreaTop = getSafeAreaTop();
   ```

2. **不要只取 `safeAreaInset.top`**
   ```javascript
   // ❌ 错误（会导致内容被悬浮按钮遮挡）
   const top = webApp.safeAreaInset?.top || 0;
   
   // ✅ 正确（必须叠加两者）
   const top = (webApp.safeAreaInset?.top || 0) + (webApp.contentSafeAreaInset?.top || 0);
   ```

3. **不要在 CSS 中单独使用 `--tg-safe-area-inset-top`**
   ```css
   /* ❌ 错误 */
   padding-top: var(--tg-safe-area-inset-top);
   
   /* ✅ 正确 */
   padding-top: var(--telegram-safe-area-top);
   ```

### 🎯 最佳实践

1. **统一使用 `--telegram-safe-area-top` 变量**
2. **在组件挂载时监听安全区域变化**（Telegram 可能在运行时动态调整）
3. **在路由切换时重新应用安全区域**（确保新页面正确适配）

---

## 平台差异总结

| 平台 | `safeAreaInset.top` | `contentSafeAreaInset.top` | 总计 |
|------|---------------------|----------------------------|------|
| **Android（全屏）** | 0px（状态栏隐藏） | 44px（悬浮按钮） | 44px |
| **iOS（全屏）** | 47px（刘海屏） | 44px（悬浮按钮） | 91px |
| **Android（非全屏）** | 24-32px（状态栏） | 0px（无悬浮按钮） | 24-32px |
| **iOS（非全屏）** | 47px（刘海屏） | 0px（无悬浮按钮） | 47px |

---

## 参考资料

- [Telegram WebApp API 官方文档](https://core.telegram.org/bots/webapps)
- [Telegram SDK 8.0+ 安全区域规范](https://core.telegram.org/bots/webapps#initializing-mini-apps)
- Freya V2 项目源码：
  - `utils/telegram.ts` - 安全区域计算逻辑
  - `components/TelegramWebAppInit.tsx` - 初始化和应用逻辑
  - `index.css` - CSS 变量定义

---

**最后更新：** 2026-02-08  
**维护者：** Freya V2 开发团队
