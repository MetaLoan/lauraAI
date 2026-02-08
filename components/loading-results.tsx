'use client'

import { useTranslations } from '@/components/i18n-provider'

export default function LoadingResults({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslations('loading')

  return (
    <div 
      className="h-full bg-black flex flex-col items-center justify-center p-6"
      style={{
        paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px) + 24px)'
      }}
    >
      <div className="w-full max-w-md text-center px-4">
        <h1 className="text-title-lg mb-6 text-balance flex-shrink-0">{t('analyzing')}</h1>
        <p className="text-body-lg text-gray-400 max-w-md mx-auto text-balance">
          {t('pleaseWait')}
        </p>
      </div>

      {/* Loading spinner */}
      <div className="flex-1 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>

      {/* Bottom spacer to maintain layout consistency */}
      <div className="w-full h-20" />
    </div>
  )
}
