'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Unlock, Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { getAssetPath } from '@/lib/utils'
import { apiClient } from '@/lib/api'

interface HelpUnlockPageProps {
  shareCode: string
  onComplete: () => void
  onSkip: () => void
}

type PageStatus = 'loading' | 'ready' | 'helping' | 'success' | 'error'

export default function HelpUnlockPage({
  shareCode,
  onComplete,
  onSkip,
}: HelpUnlockPageProps) {
  const [status, setStatus] = useState<PageStatus>('loading')
  const [characterData, setCharacterData] = useState<{
    id: number
    title: string
    type: string
    full_blur_image_url: string
    half_blur_image_url: string
  } | null>(null)
  const [ownerName, setOwnerName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [showHalfBlur, setShowHalfBlur] = useState(false)

  // Load share info on mount
  useEffect(() => {
    const loadShareInfo = async () => {
      try {
        const data = await apiClient.getShareInfo(shareCode)
        setCharacterData(data.character)
        setOwnerName(data.owner.name || 'your friend')
        setStatus('ready')
      } catch (err) {
        console.error('Failed to load share info:', err)
        setError('This link is invalid or has expired.')
        setStatus('error')
      }
    }
    loadShareInfo()
  }, [shareCode])

  const handleHelpUnlock = async () => {
    if (!characterData) return
    
    setStatus('helping')
    
    try {
      // #region agent log
      const webApp = (window as any).Telegram?.WebApp
      const initData = webApp?.initData
      fetch('http://127.0.0.1:7242/ingest/91080ee1-2ffe-4745-8552-767fa721acb6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'help-unlock-page.tsx:handleHelpUnlock',message:'调用helpUnlock前',data:{characterId:characterData.id,hasInitData:!!initData,initDataLen:initData?.length||0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      await apiClient.helpUnlock(characterData.id.toString())
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/91080ee1-2ffe-4745-8552-767fa721acb6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'help-unlock-page.tsx:handleHelpUnlock',message:'helpUnlock成功',data:{characterId:characterData.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'success'})}).catch(()=>{});
      // #endregion
      
      // Animate the blur transition
      setShowHalfBlur(true)
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setStatus('success')
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/91080ee1-2ffe-4745-8552-767fa721acb6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'help-unlock-page.tsx:handleHelpUnlock',message:'helpUnlock失败',data:{characterId:characterData.id,error:err?.message||String(err)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'error'})}).catch(()=>{});
      // #endregion
      console.error('Failed to help unlock:', err)
      setError('Failed to help unlock. You may have already helped or need to sign up first.')
      setStatus('error')
    }
  }

  if (status === 'loading') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white p-6">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white p-6">
        <div className="text-center space-y-6 max-w-sm">
          <h1 className="text-2xl font-bold">Oops!</h1>
          <p className="text-gray-400">{error}</p>
          <Button onClick={onSkip} className="btn-primary">
            Continue to App
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white p-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="relative w-48 h-64 mx-auto rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={getAssetPath(characterData?.half_blur_image_url || '')}
              alt={characterData?.title || 'Character'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-green-500/20 backdrop-blur-sm rounded-full p-4">
                <Sparkles className="w-10 h-10 text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">You helped {ownerName}!</h1>
            <p className="text-gray-400">
              Their photo is now 50% clearer. They'll be so happy!
            </p>
          </div>

          <Button onClick={onComplete} className="btn-primary flex items-center justify-center gap-2">
            Continue to App
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    )
  }

  // Ready state - show the help unlock UI
  const displayImage = showHalfBlur 
    ? characterData?.half_blur_image_url 
    : characterData?.full_blur_image_url

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <p className="text-gray-400 text-sm uppercase tracking-wider">Help your friend</p>
          <h1 className="text-2xl font-bold">
            Help {ownerName} see their
          </h1>
          <h2 className="text-3xl font-bold text-white">
            {characterData?.title || 'AI Match'}
          </h2>
        </div>

        {/* Blurred Image */}
        <div className="relative">
          <div 
            className={`w-56 h-72 rounded-3xl overflow-hidden shadow-2xl transition-all duration-1000 ${
              showHalfBlur ? 'scale-105' : ''
            }`}
          >
            <img
              src={getAssetPath(displayImage || '')}
              alt={characterData?.title || 'Character'}
              className={`w-full h-full object-cover transition-all duration-1000 ${
                showHalfBlur ? 'brightness-110' : ''
              }`}
            />
          </div>
          
          {/* Lock overlay */}
          {!showHalfBlur && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/40 backdrop-blur-sm rounded-full p-5 animate-pulse">
                <Unlock className="w-12 h-12 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-center text-gray-400 max-w-xs">
          Tap the button below to help {ownerName} reveal 50% of their {characterData?.title?.toLowerCase() || 'AI match'} photo!
        </p>
      </div>

      {/* Footer */}
      <div className="p-6 space-y-4">
        <Button 
          onClick={handleHelpUnlock}
          disabled={status === 'helping'}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {status === 'helping' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Unlocking...
            </>
          ) : (
            <>
              <Unlock className="w-5 h-5" />
              Help {ownerName} Unlock
            </>
          )}
        </Button>
        
        <button 
          onClick={onSkip}
          className="w-full text-center text-gray-500 text-sm py-2"
        >
          Skip and continue
        </button>
      </div>
    </div>
  )
}
