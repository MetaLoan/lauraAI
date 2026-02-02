import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAssetPath(path: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
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
