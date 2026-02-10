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
function getCurrentLocaleForApi(): string {
  if (typeof window === 'undefined') return 'en'

  // 1. 优先使用 localStorage 中保存的语言偏好
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
      if (savedLocale && ['en', 'zh', 'ru'].includes(savedLocale)) {
        return savedLocale
      }
    }
  } catch {
    // localStorage 不可用
  }

  // 2. 尝试使用浏览器语言
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language || (navigator as any).userLanguage
    if (browserLang) {
      const lang = browserLang.toLowerCase()
      if (lang.startsWith('zh')) return 'zh'
      if (lang.startsWith('ru')) return 'ru'
    }
  }

  // 3. 默认英语
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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = REQUEST_TIMEOUT
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    // 仅在 Telegram Mini App 内时附带 initData；网页版 dApp 不传，由后端 WEB_APP_MODE 使用默认用户
    const webApp = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined
    let initData = webApp?.initData
    if (!initData && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.hash.slice(1))
      initData = params.get('tgWebAppData') ?? undefined
    }

    let inviterCode = ''
    const startParam = webApp?.initDataUnsafe?.start_param
    if (startParam?.startsWith('invite_')) {
      inviterCode = startParam.replace('invite_', '')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // 添加语言头
    const locale = getCurrentLocaleForApi()
    if (locale) {
      headers['Accept-Language'] = locale
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
        const msg = data.message || '请求失败'
        const hint = msg.includes('Missing Telegram initData')
          ? ' 网页版请确认后端已设置 WEB_APP_MODE=true（Fly: fly secrets set WEB_APP_MODE=true）'
          : ''
        throw new ApiError(msg + hint, data.error_code)
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

  // ========== Market ==========
  async getMarketCharacters(params: { page?: number; limit?: number; sort?: string } = {}) {
    // Return mock data for now if dev mode or error
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      return this.getMockMarketData();
    }
    return this.request('/market/characters', {
      method: 'GET',
      // Add query params logic here if needed
    }).catch(() => this.getMockMarketData()); // Fallback to mock for demo
  }

  async purchaseCharacter(characterId: string) {
    return this.request(`/market/purchase`, {
      method: 'POST',
      body: JSON.stringify({ characterId }),
    });
  }

  // ========== Enhanced User Profile ==========
  async getUserProfile() {
    const [profile, stakingInfo, referrals] = await Promise.all([
      this.getMe(),
      this.getStakingInfo().catch(() => null),
      this.getReferrals().catch(() => ({ count: 0 }))
    ]) as [any, any, any];

    // Calculate rank based on staking and LRA balance
    const totalAssets = (profile.staking_balance || 0) + (profile.lra_balance || 0);
    let rank = 'Newcomer';
    if (totalAssets >= 100000) rank = 'Diamond Soul';
    else if (totalAssets >= 50000) rank = 'Platinum Soul';
    else if (totalAssets >= 20000) rank = 'Gold Soul';
    else if (totalAssets >= 5000) rank = 'Silver Soul';
    else if (totalAssets >= 1000) rank = 'Soul Seeker';
    else if (totalAssets >= 100) rank = 'Soul Initiate';

    // Calculate total earnings (LRA balance as proxy)
    const lraBalance = profile.lra_balance || 0;
    const totalEarnings = lraBalance > 0 ? `${(lraBalance * 0.001).toFixed(4)} BNB` : '0 BNB';

    // Format joined date
    const joinedDate = profile.created_at 
      ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Just now';

    return {
      ...profile,
      // Real staking data from backend
      staking_balance: stakingInfo?.staking_balance ?? profile.staking_balance ?? 0,
      staking_multiplier: stakingInfo?.staking_multiplier ?? profile.staking_multiplier ?? 1.0,
      is_locked: stakingInfo?.is_locked ?? false,
      lock_expiry: stakingInfo?.lock_expiry ?? 0,
      effective_apy: stakingInfo?.effective_apy ?? 12.5,
      // Computed fields
      rank,
      referral_count: referrals?.count || 0,
      total_earnings: totalEarnings,
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

  // Harvest points to LRA
  async claimLRA() {
    return this.request('/users/me/points/harvest', {
      method: 'POST'
    });
  }

  // ========== Staking ==========
  async stakeLRA(amount: number): Promise<{
    staking_balance: number;
    staking_multiplier: number;
    staked_at: number;
    lock_expiry: number;
    message: string;
  }> {
    return this.request('/staking/stake', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  async unstakeLRA(amount: number): Promise<{
    staking_balance: number;
    staking_multiplier: number;
    unstaked_amount: number;
    message: string;
  }> {
    return this.request('/staking/unstake', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  async getStakingInfo(): Promise<{
    staking_balance: number;
    staking_multiplier: number;
    is_locked: boolean;
    lock_expiry: number;
    remaining_seconds: number;
    base_apy: number;
    effective_apy: number;
    points: number;
    lra_balance: number;
  }> {
    return this.request('/staking/info');
  }

  // ========== Intelligence & Automation ==========
  async getMarketIntelligence() {
    return this.request('/market/intelligence');
  }

  async getPools() {
    return this.request('/market/pools');
  }

  async executeStrategy(strategy: string, poolName: string, amount: number) {
    return this.request('/market/execute-strategy', {
      method: 'POST',
      body: JSON.stringify({ strategy, pool_name: poolName, amount })
    });
  }

  // Mock Helpers
  private getMockMarketData() {
    return [
      {
        id: 'm1',
        title: 'Cyber Ninja',
        image_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800',
        type: 'protector',
        price: '0.5 BNB',
        rarity: 'Rare',
        likes: 128
      },
      {
        id: 'm2',
        title: 'Ethereal Muse',
        image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
        type: 'companion',
        price: '0.8 BNB',
        rarity: 'Legendary',
        likes: 342
      },
      {
        id: 'm3',
        title: 'Quantum Scholar',
        image_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800',
        type: 'mentor',
        price: '0.3 BNB',
        rarity: 'Common',
        likes: 89
      },
      {
        id: 'm4',
        title: 'Neon Drifter',
        image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800',
        type: 'adventurer',
        price: '0.45 BNB',
        rarity: 'Uncommon',
        likes: 156
      }
    ];
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
