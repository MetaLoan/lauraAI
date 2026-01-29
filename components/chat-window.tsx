'use client'

import { useState, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import Image from 'next/image'
import { apiClient } from '@/lib/api'
import { getAssetPath } from '@/lib/utils'

interface ChatWindowProps {
  characterId?: string
  characterTitle?: string
  characterImage?: string
  onClose: () => void
}

export default function ChatWindow({ characterId, characterTitle = 'Your Soulmate', characterImage, onClose }: ChatWindowProps) {
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
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'
      const url = `${API_BASE_URL}/characters/${characterId}/chat`
      console.log('聊天请求 URL:', url, 'characterId:', characterId)
      
      if (!characterId) {
        throw new Error('角色 ID 为空')
      }
      
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
      // 重新加载消息以同步数据库
      loadMessages()
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col overflow-hidden pt-tg-top pb-tg-bottom">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0 relative">
              {characterImage ? (
                <Image
                  src={getAssetPath(characterImage)}
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
              <p className="text-sm font-semibold">{characterTitle}</p>
              <p className="text-xs text-gray-400">Online</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
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
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') handleSendMessage()
              }}
              placeholder="Say something..."
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-white/40"
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
