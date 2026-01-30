// API URL: 优先使用环境变量，否则使用默认值
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lauraai-backend.fly.dev/api'

// 请求超时时间（毫秒）
const REQUEST_TIMEOUT = 15000

interface ApiResponse<T> {
  code: number
  message: string
  error_code?: string
  data?: T
}

// 自定义错误类，包含 error_code
class ApiError extends Error {
  error_code?: string
  
  constructor(message: string, error_code?: string) {
    super(message)
    this.name = 'ApiError'
    this.error_code = error_code
  }
}

class ApiClient {
  public readonly baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = REQUEST_TIMEOUT
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    // 从 Telegram Mini App 获取 initData
    const webApp = (window as any).Telegram?.WebApp
    let initData = webApp?.initData
    
    // 获取邀请码 (支持 invite_CODE 和 char_ID_CODE 两种格式)
    let inviterCode = ''
    const startParam = webApp?.initDataUnsafe?.start_param
    if (startParam) {
      if (startParam.startsWith('invite_')) {
        inviterCode = startParam.replace('invite_', '')
      } else if (startParam.startsWith('char_')) {
        // 分享链接格式: char_ID_SHARECODE，我们需要通过后端获取该角色的所有者邀请码
        // 但为了简化，我们可以在这里先尝试解析，或者由后端根据 character_id 自动处理
        // 目前先处理明确的 invite_ 格式
      }
    }
    
    // 备用方案：尝试从 URL 获取 initData (有些环境可能需要)
    if (!initData && typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1)
      const params = new URLSearchParams(hash)
      initData = params.get('tgWebAppData')
    }

    // 开发模式：如果未获取到 initData，使用伪造数据（仅开发环境）
    if (!initData && process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      initData = 'query_id=AAGLk...&user=%7B%22id%22%3A999999999%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22test_user%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1700000000&hash=fake_hash'
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (initData) {
      headers['X-Telegram-Init-Data'] = initData
    }

    if (inviterCode) {
      headers['X-Inviter-Code'] = inviterCode
    }

    // 添加超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const data: ApiResponse<T> = await response.json()

      if (data.code !== 0) {
        throw new ApiError(data.message || '请求失败', data.error_code)
      }

      return data.data as T
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接')
      }
      throw error
    }
  }

  // 认证
  async telegramAuth(initData: string) {
    return this.request('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    })
  }

  // 用户
  async getMe() {
    return this.request('/users/me')
  }

  async updateMe(data: {
    name?: string
    gender?: string
    birth_date?: string
    birth_time?: string
    birth_place?: string
    ethnicity?: string
  }) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAccount() {
    return this.request('/users/me', {
      method: 'DELETE',
    })
  }

  // 角色
  async createCharacter(data: {
    type: string
    title?: string
    gender: string
    ethnicity: string
  }) {
    return this.request('/characters', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCharacters() {
    return this.request('/characters')
  }

  async getCharacter(id: string) {
    return this.request(`/characters/${id}`)
  }

  // 聊天
  async sendMessage(characterId: string, message: string) {
    const url = `${this.baseURL}/characters/${characterId}/chat`
    const initData = (window as any).Telegram?.WebApp?.initData
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (initData) {
      headers['X-Telegram-Init-Data'] = initData
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      throw new Error('发送消息失败')
    }

    // 返回 EventSource 用于 SSE
    return new EventSource(url.replace('/chat', '/chat?message=' + encodeURIComponent(message)))
  }

  async getMessages(characterId: string, limit: number = 50) {
    return this.request(`/characters/${characterId}/messages?limit=${limit}`)
  }

  // 图片生成（使用更长的超时时间，因为生成需要时间）
  async generateImage(characterId: string) {
    return this.request(`/characters/${characterId}/generate-image`, {
      method: 'POST',
    }, 60000) // 60秒超时
  }

  // Mini Me 生成
  async generateMiniMe(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const url = `${this.baseURL}/minime/generate`
    let initData = (window as any).Telegram?.WebApp?.initData

    if (!initData && process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      initData = 'query_id=AAGLk...&user=%7B%22id%22%3A999999999%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22test_user%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1700000000&hash=fake_hash'
    }

    const headers: HeadersInit = {}
    if (initData) {
      headers['X-Telegram-Init-Data'] = initData
    }

    // 上传和生成可能需要较长时间
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 90000) // 90秒超时

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const data = await response.json()
      if (data.code !== 0) {
        throw new Error(data.message || '生成失败')
      }
      return data.data
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接')
      }
      throw error
    }
  }

  // ========== 邀请相关 ==========

  // 获取邀请码
  async getInviteCode(): Promise<{ invite_code: string }> {
    return this.request('/invite/code')
  }

  // 获取下级好友列表
  async getReferrals(): Promise<{ referrals: Array<{ id: number; name: string; avatar_url: string; created_at: string }>; count: number }> {
    return this.request('/invite/referrals')
  }

  // 绑定邀请人
  async bindInviter(inviteCode: string): Promise<{ message: string; inviter_name: string }> {
    return this.request('/invite/bind', {
      method: 'POST',
      body: JSON.stringify({ invite_code: inviteCode }),
    })
  }

  // ========== 解锁相关 ==========

  // 获取分享链接信息（公开接口）
  async getShareInfo(shareCode: string): Promise<{
    character: {
      id: number
      title: string
      type: string
      full_blur_image_url: string
      half_blur_image_url: string
      unlock_status: number
      share_code: string
    }
    owner: {
      id: number
      name: string
    }
  }> {
    return this.request(`/share/${shareCode}`)
  }

  // 帮助解锁
  async helpUnlock(characterId: string): Promise<{ message: string; unlock_status: number; image_url: string }> {
    return this.request(`/characters/${characterId}/help-unlock`, {
      method: 'POST',
    })
  }

  // 付费解锁
  async unlockCharacter(characterId: string, paymentMethod: 'stars' | 'ton', transactionId?: string): Promise<{
    message: string
    unlock_status: number
    image_url: string
    description: string
    price_paid: number
    currency: string
  }> {
    return this.request(`/characters/${characterId}/unlock`, {
      method: 'POST',
      body: JSON.stringify({
        payment_method: paymentMethod,
        transaction_id: transactionId || '',
      }),
    })
  }

  // 获取解锁价格
  async getUnlockPrice(characterId: string): Promise<{
    unlock_status: number
    price_type: 'free' | 'discounted' | 'full'
    price_stars: number
    price_ton: number
    price_display: string
  }> {
    return this.request(`/characters/${characterId}/unlock-price`)
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
