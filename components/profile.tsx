'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock, ChevronLeft } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface ProfileProps {
  name?: string
  birthDate?: { month: string; day: string; year: string }
  birthPlace?: string
  birthTime?: { hour: string; minute: string }
  onBack: () => void
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
}: ProfileProps) {
  const [name, setName] = useState(propName || '')
  const [birthDate, setBirthDate] = useState(propBirthDate || { month: '', day: '', year: '' })
  const [birthPlace, setBirthPlace] = useState(propBirthPlace || '')
  const [birthTime, setBirthTime] = useState(propBirthTime || { hour: '', minute: '' })
  const [loading, setLoading] = useState(!propName) // 如果 props 有数据就不加载

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

  // 格式化日期显示
  const formatDate = () => {
    if (!birthDate.month || !birthDate.day || !birthDate.year) {
      return 'Not set'
    }
    // 月份已经是名称格式（January, February 等）
    return `${birthDate.month} ${birthDate.day}, ${birthDate.year}`
  }

  // 格式化时间显示
  const formatTime = () => {
    if (!birthTime.hour || !birthTime.minute) {
      return 'Not set'
    }
    return `${birthTime.hour}:${birthTime.minute}`
  }

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      {/* Header */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        <h1 className="text-2xl font-bold mb-2">Profile</h1>
        <h2 className="text-4xl font-bold">{name || 'User'}</h2>
      </div>

      {/* Content */}
      <div className="px-6 pt-6 space-y-6">
        {/* Birth Info Card */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-6">Birth Info</h3>
          
          <div className="space-y-6">
            {/* Birth Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/10">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-white">Birth Date</span>
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
                <span className="text-white">Birth Place</span>
              </div>
              <span className="text-white font-medium">{birthPlace || 'Not set'}</span>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Birth Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/10">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-white">Birth Time</span>
              </div>
              <span className="text-white font-medium">{formatTime()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
