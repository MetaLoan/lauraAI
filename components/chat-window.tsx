'use client'

import { useState, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import Image from 'next/image'
import { apiClient } from '@/lib/api'
import { getAssetPath, getFullImageUrl } from '@/lib/utils'

interface ChatWindowProps {
  characterId?: string
  characterTitle?: string
  characterImage?: string
  onClose: () => void
}

export default function ChatWindow({ characterId, characterTitle = 'Soulmate', characterImage, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Array<{
    id: number
    type: 'user' | 'character'
    text: string
    timestamp: Date
  }>>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  // 加载历史消息
  useEffect(() => {
    if (characterId) {
      loadMessages()
    }
  }, [characterId])

  const loadMessages = async () => {
    if (!characterId) return
    
    try {
      const history = await apiClient.getMessages(characterId, 50) as any[]
      // 后端返回的是 DESC 顺序（最新在前），需要反转为 ASC（最新在后）
      const reversedHistory = [...history].reverse()
      setMessages(reversedHistory.map((msg, idx) => ({
        id: idx + 1,
        type: msg.sender_type === 'user' ? 'user' : 'character',
        text: msg.content,
        timestamp: new Date(msg.created_at),
      })))
    } catch (error) {
      console.error('加载消息失败:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !characterId || loading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setLoading(true)

    // 预先计算消息 ID
    const userMessageId = Date.now()
    const characterMessageId = userMessageId + 1

    // 添加用户消息到界面
    const newUserMessage = {
      id: userMessageId,
      type: 'user' as const,
      text: userMessage,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      // 发送消息并接收流式响应
      const url = `${apiClient.baseURL}/characters/${characterId}/chat`
      
      if (!characterId) {
        throw new Error('角色 ID 为空')
      }
      
      // 从 Telegram Mini App 获取 initData
      let initData = (window as any).Telegram?.WebApp?.initData
      
      // 备用方案：尝试从 URL 获取 initData
      if (!initData && typeof window !== 'undefined') {
        const hash = window.location.hash.slice(1)
        const params = new URLSearchParams(hash)
        initData = params.get('tgWebAppData')
      }
      
      // 开发模式：如果未获取到 initData，使用伪造数据
      if (!initData && process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
        initData = 'query_id=AAGLk...&user=%7B%22id%22%3A999999999%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22test_user%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1700000000&hash=fake_hash'
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (initData) {
        headers['X-Telegram-Init-Data'] = initData
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMessage }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('聊天请求失败:', response.status, errorText)
        throw new Error(`发送消息失败: ${response.status}`)
      }

      // 读取 SSE 流
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let characterResponse = ''

      // 添加空的角色消息占位符
      setMessages(prev => [...prev, {
        id: characterMessageId,
        type: 'character',
        text: '...',
        timestamp: new Date(),
      }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              
              try {
                const parsed = JSON.parse(data)
                if (parsed.chunk) {
                  characterResponse += parsed.chunk
                  // 更新角色消息
                  setMessages(prev => prev.map(msg => 
                    msg.id === characterMessageId 
                      ? { ...msg, text: characterResponse }
                      : msg
                  ))
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      // 移除失败的角色消息占位符
      setMessages(prev => prev.filter(msg => msg.id !== characterMessageId))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b border-white/10"
        style={{
          paddingTop: 'max(16px, calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px)))'
        }}
      >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0 relative">
              {characterImage ? (
                <Image
                  src={getFullImageUrl(characterImage)}
                  alt={characterTitle}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                  <span className="text-white/20 text-xs font-bold">{characterTitle.charAt(0)}</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-body-sm font-semibold">{characterTitle}</p>
              <p className="text-caption text-gray-400">Online</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-white text-black rounded-br-none'
                    : 'bg-white/10 text-white rounded-bl-none'
                }`}
              >
                <p className="text-body-sm">{message.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div 
          className="border-t border-white/10 p-4"
          style={{
            paddingBottom: 'max(16px, var(--tg-safe-area-bottom, 0px))'
          }}
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') handleSendMessage()
              }}
              placeholder="Say something..."
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-body-sm placeholder-gray-500 focus:outline-none focus:border-white/40"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
              className="bg-white text-black p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
    </div>
  )
}
