// 支持的语言列表
export const locales = ['en', 'zh', 'ru'] as const;
export type Locale = (typeof locales)[number];

// 默认语言
export const defaultLocale: Locale = 'en';

// 语言名称映射（用于语言切换器显示）
export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ru: 'Русский',
};

// Map browser language code to app locale
export function mapBrowserLocale(browserLang: string | undefined): Locale {
  if (!browserLang) return defaultLocale;
  
  const lang = browserLang.toLowerCase();
  
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('ru')) return 'ru';
  
  return 'en';
}

// 验证语言是否支持
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// 翻译消息类型
export type Messages = typeof import('../messages/en.json');

// 加载翻译消息
export async function loadMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case 'zh':
      return (await import('../messages/zh.json')).default;
    case 'ru':
      return (await import('../messages/ru.json')).default;
    case 'en':
    default:
      return (await import('../messages/en.json')).default;
  }
}

// 同步加载翻译消息（用于客户端）
export function getMessages(locale: Locale): Messages {
  // 这些会被 webpack 静态分析并打包
  const messages: Record<Locale, Messages> = {
    en: require('../messages/en.json'),
    zh: require('../messages/zh.json'),
    ru: require('../messages/ru.json'),
  };
  return messages[locale];
}
