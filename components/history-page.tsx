'use client'

import { useState, useEffect } from 'react'
import { X, MessageSquare, ChevronRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { getAssetPath } from '@/lib/utils'

interface HistoryCharacter {
  id: string
  title: string
  image_url: string
  last_message?: string
  last_message_time?: string
}

interface HistoryPageProps {
  onClose: () => void
  onSelectCharacter: (character: any) => void
}

export default function HistoryPage({ onClose, onSelectCharacter }: HistoryPageProps) {
  const [characters, setCharacters] = useState<HistoryCharacter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await apiClient.getCharacters() as any[]
        
        // 为每个角色获取最后一条消息
        const charactersWithLastMsg = await Promise.all(
          data.map(async (char) => {
            try {
              const messages = await apiClient.getMessages(char.id.toString(), 1) as any[]
              return {
                id: char.id.toString(),
                title: char.title,
                image_url: char.image_url,
                last_message: messages.length > 0 ? messages[0].content : 'No messages yet',
                last_message_time: messages.length > 0 ? new Date(messages[0].created_at).toLocaleDateString() : ''
              }
            } catch (e) {
              return {
                id: char.id.toString(),
                title: char.title,
                image_url: char.image_url,
                last_message: 'No messages yet',
                last_message_time: ''
              }
            }
          })
        )
        
        setCharacters(charactersWithLastMsg)
      } catch (error) {
        console.error('Failed to load history:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [])

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col overflow-hidden pt-tg-top pb-tg-bottom h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-white" />
          <h1 className="text-title-md font-bold">Chat History</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="loading-spinner" />
          </div>
        ) : characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
            <p>No chat history found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => onSelectCharacter(char)}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                  {char.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getAssetPath(char.image_url)}
                      alt={char.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold truncate">{char.title}</h3>
                    <span className="text-caption text-white/40">{char.last_message_time}</span>
                  </div>
                  <p className="text-body-sm text-white/60 truncate">{char.last_message}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/20" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
