'use client';

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useTranslations } from '@/components/i18n-provider'
import { LanguageSwitcherCompact } from '@/components/language-switcher'

export default function Welcome({ 
  onNext,
  onUserFound 
}: { 
  onNext: () => void
  onUserFound?: () => void 
}) {
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslations('welcome')
  const { t: tCommon } = useTranslations('common')

  const handleContinue = async () => {
    setIsChecking(true)
    setError(null)
    
    try {
      const user = await apiClient.getMe() as any
      
      if (user && user.name && user.gender && user.birth_date) {
        // User exists and has completed profile -> Go to Dashboard
        if (onUserFound) {
          onUserFound()
        } else {
          // Fallback if no callback provided (shouldn't happen with updated parent)
          onNext()
        }
      } else {
        // User incomplete or new -> Continue registration
        onNext()
      }
    } catch (err) {
      console.error('Failed to check user status:', err)
      
      // If it's a network error, stop and show error as requested
      setError(t('networkError'))
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="h-full bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Language Switcher */}
      <div className="absolute top-[calc(var(--tg-content-safe-area-top,var(--tg-safe-area-top,0px))+16px)] right-4 z-20">
        <LanguageSwitcherCompact />
      </div>
      
      {/* Decorative striped background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 800" preserveAspectRatio="none">
          <defs>
            <pattern id="stripes" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="100" y2="100" stroke="white" strokeWidth="20" />
            </pattern>
          </defs>
          <rect width="400" height="800" fill="url(#stripes)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 flex-1 max-w-sm">
        <div className="space-y-3">
          <h1 className="text-title-xl text-balance">{t('title')}</h1>
          <h2 className="text-title-xl text-balance">{t('subtitle')}</h2>
        </div>
        <p className="text-body-lg text-gray-300 text-balance px-4">
          {t('description')}
        </p>
      </div>

      <div className="relative z-10 w-full max-w-sm pb-4">
        {error && (
          <p className="text-red-400 text-sm text-center mb-4 bg-red-500/10 px-4 py-2 rounded-lg">
            {error}
          </p>
        )}
        
        <Button
          onClick={handleContinue}
          className="btn-primary w-full flex items-center justify-center gap-2"
          disabled={isChecking}
        >
          {isChecking ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {tCommon('checking')}
            </>
          ) : (
            tCommon('continue')
          )}
        </Button>
        <p className="text-center text-gray-500 text-caption mt-4">
          {t('terms')}
        </p>
      </div>
    </div>
  )
}
