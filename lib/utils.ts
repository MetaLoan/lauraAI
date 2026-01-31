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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/91080ee1-2ffe-4745-8552-767fa721acb6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/utils.ts:getFullImageUrl',message:'Input path',data:{path, hasHttp: path?.startsWith('http'), hasData: path?.startsWith('data:'), hasBlob: path?.startsWith('blob:'), hasUploads: path?.startsWith('/uploads/') || path?.startsWith('uploads/'), envApiUrl: process.env.NEXT_PUBLIC_API_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/91080ee1-2ffe-4745-8552-767fa721acb6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/utils.ts:getFullImageUrl',message:'Returning full URL as-is',data:{path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return path
  }
  
  // 如果是 uploads 目录，说明是后端上传的图片，需要拼接后端地址
  if (path.startsWith('/uploads/') || path.startsWith('uploads/')) {
    // 获取 API Base URL，并去掉末尾的 /api
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://lauraai-backend.fly.dev/api'
    const origin = apiBaseUrl.replace(/\/api\/?$/, '')
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const finalUrl = `${origin}${normalizedPath}`
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/91080ee1-2ffe-4745-8552-767fa721acb6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/utils.ts:getFullImageUrl',message:'Constructing uploads URL',data:{path, apiBaseUrl, origin, normalizedPath, finalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return finalUrl
  }
  
  // 其他情况（如 /avatars/），视为前端静态资源，使用 getAssetPath 处理
  const assetPath = getAssetPath(path)
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/91080ee1-2ffe-4745-8552-767fa721acb6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/utils.ts:getFullImageUrl',message:'Using asset path',data:{path, assetPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  return assetPath
}
