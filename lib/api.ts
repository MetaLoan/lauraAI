// API URL: 浏览器通过局域网 IP 访问时用同机 8081，否则用环境变量或默认值
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8081/api`
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://lauraai-backend.fly.dev/api'
}
const API_BASE_URL = getApiBaseUrl()

// 请求超时时间（毫秒）
const REQUEST_TIMEOUT = 15000

// localStorage key for storing user's language preference
const LOCALE_STORAGE_KEY = 'laura-ai-locale'

// 获取当前语言（用于 API 请求）
// FIXED: Always return 'en' to ensure consistent English UI and API responses
function getCurrentLocaleForApi(): string {
  return 'en'
}

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

  // Get wallet auth headers from sessionStorage (set by useWalletAuth hook)
  private getWalletAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {}
    try {
      const address = sessionStorage.getItem('wallet_address') || ''
      const signature = sessionStorage.getItem('wallet_signature') || ''
      const headers: Record<string, string> = {}
      if (address) headers['X-Wallet-Address'] = address
      if (signature) headers['X-Wallet-Signature'] = signature

      // Check for invite code in URL
      const urlParams = new URLSearchParams(window.location.search)
      const inviterCode = urlParams.get('invite') || ''
      if (inviterCode) headers['X-Inviter-Code'] = inviterCode

      return headers
    } catch {
      return {}
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = REQUEST_TIMEOUT
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add language header
    const locale = getCurrentLocaleForApi()
    if (locale) {
      headers['Accept-Language'] = locale
    }

    // Add wallet auth headers
    const walletHeaders = this.getWalletAuthHeaders()
    Object.assign(headers, walletHeaders)

    // Timeout control
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
        const msg = data.message || 'Request failed'
        const hint = msg.includes('Missing wallet authentication')
          ? ' Please connect your wallet first.'
          : ''
        throw new ApiError(msg + hint, data.error_code)
      }

      return data.data as T
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your network.')
      }
      throw error
    }
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

  // Chat
  async sendMessage(characterId: string, message: string) {
    const url = `${this.baseURL}/characters/${characterId}/chat`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...this.getWalletAuthHeaders(),
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    return response
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

  // Mini Me generation
  async generateMiniMe(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const url = `${this.baseURL}/minime/generate`
    const headers: HeadersInit = {
      ...this.getWalletAuthHeaders(),
    }

    // Upload and generation may take a long time
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 90000) // 90s timeout

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
        throw new Error(data.message || 'Generation failed')
      }
      return data.data
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your network.')
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

  // ========== Market (deprecated - now "My Soulmate") ==========

  // ========== Enhanced User Profile ==========
  async getUserProfile() {
    const [profile, referrals] = await Promise.all([
      this.getMe(),
      this.getReferrals().catch(() => ({ count: 0 }))
    ]) as [any, any];

    const totalAssets = (profile.points || 0) + (profile.lra_balance || 0);
    let rank = 'Newcomer';
    if (totalAssets >= 100000) rank = 'Diamond Soul';
    else if (totalAssets >= 50000) rank = 'Platinum Soul';
    else if (totalAssets >= 20000) rank = 'Gold Soul';
    else if (totalAssets >= 5000) rank = 'Silver Soul';
    else if (totalAssets >= 1000) rank = 'Soul Seeker';
    else if (totalAssets >= 100) rank = 'Soul Initiate';

    const joinedDate = profile.created_at
      ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Just now';

    return {
      ...profile,
      rank,
      referral_count: referrals?.count || 0,
      joined_date: joinedDate,
    };
  }

  // Record points for chat
  async syncPoints(amount: number) {
    return this.request('/users/me/points/sync', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  // Get daily message limit status (global or per character)
  async getDailyLimit(characterId?: string) {
    const query = characterId ? `?character_id=${characterId}` : '';
    return this.request(`/chat/daily-limit${query}`);
  }

  // Get per-character daily limits for all characters
  async getAllDailyLimits() {
    return this.request('/chat/daily-limits');
  }

}

export const apiClient = new ApiClient(API_BASE_URL)
