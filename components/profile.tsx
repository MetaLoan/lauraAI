'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock, ChevronLeft, Trash2, Users, Copy, Share2, CheckCircle2 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useI18n } from '@/components/i18n-provider'

interface ProfileProps {
  name?: string
  birthDate?: { month: string; day: string; year: string }
  birthPlace?: string
  birthTime?: { hour: string; minute: string }
  onBack: () => void
  onDeleteAccount?: () => void
}

interface BackendUser {
  id: number
  name: string
  gender?: string
  birth_date?: string  // YYYY-MM-DD
  birth_time?: string  // HH:MM
  birth_place?: string
  ethnicity?: string
  avatar_url?: string
}

interface Referral {
  id: number
  name: string
  avatar_url?: string
  created_at: string
}

// 月份数字到名称的映射
const monthNumberToName = (monthNum: number): string => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December']
  return months[monthNum - 1] || 'January'
}

export default function Profile({
  name: propName,
  birthDate: propBirthDate,
  birthPlace: propBirthPlace,
  birthTime: propBirthTime,
  onBack,
  onDeleteAccount,
}: ProfileProps) {
  const { t } = useI18n()
  const [name, setName] = useState(propName || '')
  const [birthDate, setBirthDate] = useState(propBirthDate || { month: '', day: '', year: '' })
  const [birthPlace, setBirthPlace] = useState(propBirthPlace || '')
  const [birthTime, setBirthTime] = useState(propBirthTime || { hour: '', minute: '' })
  const [loading, setLoading] = useState(!propName) // 如果 props 有数据就不加载
  const [isDeleting, setIsDeleting] = useState(false)
  const [inviteCode, setInviteCode] = useState<string>('')
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [referralsLoading, setReferralsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // 处理删除账户
  const handleDeleteAccount = async () => {
    if (!window.confirm(t('profile.deleteConfirm'))) {
      return
    }

    setIsDeleting(true)
    try {
      await apiClient.deleteAccount()
      if (onDeleteAccount) {
        onDeleteAccount()
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
      alert(t('profile.deleteFailed'))
    } finally {
      setIsDeleting(false)
    }
  }

  // 从后端加载用户信息
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await apiClient.getMe() as BackendUser
        
        if (data.name) {
          setName(data.name)
        }
        
        if (data.birth_place) {
          setBirthPlace(data.birth_place)
        }

        // 解析日期：YYYY-MM-DD -> { month: "January", day: "1", year: "2000" }
        if (data.birth_date) {
          const [year, month, day] = data.birth_date.split('-')
          setBirthDate({
            month: monthNumberToName(parseInt(month)),
            day: parseInt(day).toString(),
            year: year,
          })
        }

        // 解析时间：HH:MM -> { hour: "19", minute: "15" }
        if (data.birth_time) {
          const [hour, minute] = data.birth_time.split(':')
          setBirthTime({
            hour: hour,
            minute: minute,
          })
        }
      } catch (error) {
        console.error('加载用户信息失败:', error)
        // 如果加载失败，使用 props 中的数据（如果有）
      } finally {
        setLoading(false)
      }
    }

    // 如果 props 没有提供数据，则从后端加载
    if (!propName) {
      loadUserData()
    }
  }, [propName])

  // 加载邀请码和下级好友
  useEffect(() => {
    const loadReferralData = async () => {
      try {
        // 获取邀请码
        const codeData = await apiClient.getInviteCode()
        setInviteCode(codeData.invite_code)

        // 获取下级好友
        const referralsData = await apiClient.getReferrals()
        setReferrals(referralsData.referrals)
      } catch (error) {
        console.error('Failed to load referral data:', error)
      } finally {
        setReferralsLoading(false)
      }
    }
    loadReferralData()
  }, [])

  // 复制邀请链接
  const handleCopyInviteLink = async () => {
    const inviteLink = `https://t.me/laura_tst_bot/app?startapp=invite_${inviteCode}`
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert(t('profile.copyFailed'))
    }
  }

  // 分享邀请链接
  const handleShareInviteLink = () => {
    const inviteLink = `https://t.me/laura_tst_bot/app?startapp=invite_${inviteCode}`
    const webApp = (window as any).Telegram?.WebApp
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('Join Laura AI and discover your AI soulmate!')}`)
    } else {
      handleCopyInviteLink()
    }
  }

  // 格式化日期显示
  const formatDate = () => {
    if (!birthDate.month || !birthDate.day || !birthDate.year) {
      return t('profile.notSet')
    }
    // 月份已经是名称格式（January, February 等）
    return `${birthDate.month} ${birthDate.day}, ${birthDate.year}`
  }

  // 格式化时间显示
  const formatTime = () => {
    if (!birthTime.hour || !birthTime.minute) {
      return t('profile.notSet')
    }
    return `${birthTime.hour}:${birthTime.minute}`
  }

  return (
    <div 
      className="h-full bg-black text-white pb-8 overflow-y-auto"
      style={{
        paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px))'
      }}
    >
      {/* Header */}
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="text-title-md font-bold mb-2">{t('profile.title')}</h1>
        <h2 className="text-title-xl font-bold">{name || 'User'}</h2>
      </div>

      {/* Content */}
      <div className="px-6 pt-6 space-y-6">
        {/* Birth Info Card */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-title-md font-bold mb-6">{t('profile.birthInfo')}</h3>
          
          <div className="space-y-6">
            {/* Birth Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/10">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-white">{t('profile.birthDate')}</span>
              </div>
              <span className="text-white font-medium">{formatDate()}</span>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Birth Place */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/10">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-white">{t('profile.birthPlace')}</span>
              </div>
              <span className="text-white font-medium">{birthPlace || t('profile.notSet')}</span>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Birth Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/10">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-white">{t('profile.birthTime')}</span>
              </div>
              <span className="text-white font-medium">{formatTime()}</span>
            </div>
          </div>
        </div>

        {/* My Friends Card */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-title-md font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('profile.myFriends')}
            </h3>
            <span className="text-sm text-gray-400">{referrals.length} {t('profile.invited')}</span>
          </div>

          {/* Invite Code Section */}
          {inviteCode && (
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-400 mb-2">{t('profile.yourInviteCode')}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-mono font-bold tracking-wider">{inviteCode}</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyInviteLink}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title={t('profile.copyLink')}
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleShareInviteLink}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title={t('profile.share')}
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Referrals List */}
          {referralsLoading ? (
            <div className="py-6 text-center text-gray-400">{t('profile.loading')}</div>
          ) : referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    {referral.avatar_url ? (
                      <img src={referral.avatar_url} alt={referral.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{referral.name?.charAt(0)?.toUpperCase() || '?'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{referral.name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400">
                      {t('profile.joined')} {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-gray-400 mb-3">{t('profile.noFriendsYet')}</p>
              <button
                onClick={handleShareInviteLink}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
              >
                <Share2 className="w-4 h-4" />
                {t('profile.inviteFriends')}
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="pt-4">
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 transition-all font-bold disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            {isDeleting ? t('profile.deleting') : t('profile.deleteAccount')}
          </button>
          <p className="text-center text-caption text-white/40 mt-3 px-4">
            {t('profile.deleteWarning')}
          </p>
        </div>
      </div>
    </div>
  )
}
