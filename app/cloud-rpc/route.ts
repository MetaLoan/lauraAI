/**
 * 云端 RPC 代理：同源 POST 请求转发到 NEXT_PUBLIC_RPC_URL，避免浏览器 CORS。
 * 仅处理 JSON-RPC POST，超时 15s，失败时返回 502。
 */
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://data-seed-prebsc-1-s1.bnbchain.org:8545'
const TIMEOUT_MS = 15000

export async function POST(request: Request) {
  const url = RPC_URL.replace(/\/$/, '')
  let body: string
  try {
    body = await request.text()
  } catch {
    return new Response(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const maxAttempts = 3
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const text = await res.text()
      return new Response(text, {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (e) {
      clearTimeout(timeoutId)
      lastError = e
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 400 * attempt))
      }
    }
  }
  const message = lastError instanceof Error ? lastError.message : 'Proxy error'
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32603, message: `RPC proxy error (after ${maxAttempts} tries): ${message}` },
      id: null,
    }),
    { status: 502, headers: { 'Content-Type': 'application/json' } }
  )
}
