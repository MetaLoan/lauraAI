import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAssetPath(path: string) {
  const envBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '')
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }
  const runtimeBasePath = (() => {
    if (typeof window === 'undefined') return ''

    const fromWindow = ((window as any).__LAURA_BASE_PATH || '').replace(/\/+$/, '')
    if (fromWindow) return fromWindow

    const scriptWithNext = Array.from(document.scripts).find((script) => script.src.includes('/_next/static/'))
    if (scriptWithNext?.src) {
      try {
        const pathname = new URL(scriptWithNext.src, window.location.origin).pathname
        const nextIndex = pathname.indexOf('/_next/')
        if (nextIndex > 0) return pathname.slice(0, nextIndex).replace(/\/+$/, '')
      } catch {
        // noop
      }
    }

    const { host, pathname } = window.location
    if (host.endsWith('github.io')) {
      const segments = pathname.split('/').filter(Boolean)
      if (segments.length > 0) return `/${segments[0]}`
    }

    return ''
  })()
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const basePath = runtimeBasePath || envBasePath
  return `${basePath}${normalizedPath}`
}

export function getFullImageUrl(path: string) {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }
  
  // 如果是 uploads 目录，说明是后端上传的图片，需要拼接后端地址
  if (path.startsWith('/uploads/') || path.startsWith('uploads/')) {
    // 获取 API Base URL，并去掉末尾的 /api
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://lauraai-backend.fly.dev/api'
    const origin = apiBaseUrl.replace(/\/api\/?$/, '')
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const finalUrl = `${origin}${normalizedPath}`
    return finalUrl
  }
  
  // 其他情况（如 /avatars/），视为前端静态资源，使用 getAssetPath 处理
  const assetPath = getAssetPath(path)
  return assetPath
}
