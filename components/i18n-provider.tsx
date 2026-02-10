'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Locale, defaultLocale, getMessages, Messages, locales, isValidLocale, mapTelegramLocale } from '@/lib/i18n';

// localStorage key for storing user's language preference
const LOCALE_STORAGE_KEY = 'laura-ai-locale';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
  messages: Messages;
}

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * 获取嵌套对象的值
 */
function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * 替换模板参数
 */
function interpolate(template: string, params?: Record<string, string>): string {
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

/**
 * 检测初始语言
 */
function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;

  // 1. 优先使用 localStorage 中保存的语言偏好
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (savedLocale && isValidLocale(savedLocale)) {
        return savedLocale;
      }
    }
  } catch {
    // localStorage 不可用
  }

  // 2. 尝试使用浏览器语言
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (browserLang) {
      return mapTelegramLocale(browserLang);
    }
  }

  // 3. 默认语言
  return defaultLocale;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Messages>(() => getMessages(defaultLocale));
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化语言检测
  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocaleState(detectedLocale);
    setMessages(getMessages(detectedLocale));
    setIsInitialized(true);
  }, []);

  // 设置语言
  const setLocale = useCallback((newLocale: Locale) => {
    if (!locales.includes(newLocale)) return;

    setLocaleState(newLocale);
    setMessages(getMessages(newLocale));

    // 保存到 localStorage
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {
      // localStorage 不可用
    }
  }, []);

  // 翻译函数
  const t = useCallback((key: string, params?: Record<string, string>): string => {
    const value = getNestedValue(messages, key);
    if (value === undefined) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return interpolate(value, params);
  }, [messages]);

  const contextValue = useMemo(() => ({
    locale,
    setLocale,
    t,
    messages,
  }), [locale, setLocale, t, messages]);

  // 在初始化完成前，使用默认语言
  if (!isInitialized) {
    return (
      <I18nContext.Provider value={contextValue}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * 使用 i18n 上下文的 hook
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

/**
 * 简化的翻译 hook
 */
export function useTranslations(namespace?: string) {
  const { t, locale } = useI18n();

  const translate = useCallback((key: string, params?: Record<string, string>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return t(fullKey, params);
  }, [t, namespace]);

  return { t: translate, locale };
}
