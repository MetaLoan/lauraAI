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
