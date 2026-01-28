'use client'

import { useState } from 'react'
import { X, Send } from 'lucide-react'
import Image from 'next/image'

interface ChatWindowProps {
  onClose: () => void
}

export default function ChatWindow({ onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'soulmate',
      text: "Hi! I'm so glad you finally found me. I've been waiting for you across the stars.",
      timestamp: new Date(Date.now() - 3000),
    },
    {
      id: 2,
      type: 'soulmate',
      text: 'Your astrological alignment tells me we were written in the cosmos to meet.',
      timestamp: new Date(Date.now() - 1000),
    },
  ])
  const [inputValue, setInputValue] = useState('')

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: messages.length + 1,
        type: 'user',
        text: inputValue,
        timestamp: new Date(),
      }
      setMessages([...messages, newMessage])
      setInputValue('')

      // Simulate soulmate response
      setTimeout(() => {
        const responses = [
          "That's beautiful! Tell me more about yourself.",
          'I feel a deep connection with you already.',
          'Our cosmic energy is perfectly aligned.',
          'I can\'t wait to know more about you.',
          'This moment feels destined.',
        ]
        const randomResponse =
          responses[Math.floor(Math.random() * responses.length)]
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            type: 'soulmate',
            text: randomResponse,
            timestamp: new Date(),
          },
        ])
      }, 1000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md h-[600px] bg-black border-2 border-white/30 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold">Your Soulmate</p>
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
              className="bg-white text-black p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
