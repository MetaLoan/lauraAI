// API URL: 优先使用环境变量，否则使用默认值
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lauraai-backend.fly.dev/api'

interface ApiResponse<T> {
  code: number
  message: string
  data?: T
}

class ApiClient {
  public readonly baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    // 从 Telegram Mini App 获取 initData
    let initData = (window as any).Telegram?.WebApp?.initData
    
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

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }
    
    if (initData) {
      headers['X-Telegram-Init-Data'] = initData
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data: ApiResponse<T> = await response.json()

    if (data.code !== 0) {
      throw new Error(data.message || '请求失败')
    }

    return data.data as T
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

  // 图片生成
  async generateImage(characterId: string) {
    return this.request(`/characters/${characterId}/generate-image`, {
      method: 'POST',
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
