'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, Star, Sparkles } from 'lucide-react'
import { cn, getAssetPath, getFullImageUrl } from '@/lib/utils'
import { useI18n } from '@/components/i18n-provider'

interface PaymentDrawerProps {
  isOpen: boolean
  onClose: () => void
  characterName: string
  characterType?: string
  characterImage?: string
  priceStars?: number
  priceTON?: number
  isDiscounted?: boolean
  onPaymentSuccess?: () => void
  onPay?: (method: 'stars' | 'ton') => Promise<void>
}

type PaymentStatus = 'idle' | 'processing' | 'success'

export function PaymentDrawer({
  isOpen,
  onClose,
  characterName,
  characterType = 'AI Companion',
  characterImage,
  priceStars = 300,
  priceTON = 3,
  isDiscounted = false,
  onPaymentSuccess,
  onPay,
}: PaymentDrawerProps) {
  const { t } = useI18n()
  const [status, setStatus] = useState<PaymentStatus>('idle')

  // Reset status when drawer opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to avoid flickering during close animation
      const timer = setTimeout(() => setStatus('idle'), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handlePayment = async (method: 'stars' | 'ton') => {
    setStatus('processing')
    
    try {
      if (onPay) {
        await onPay(method)
      } else {
        // Simulate payment processing if no handler provided
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
      
      setStatus('success')
      
      // Auto close after success
      setTimeout(() => {
        onPaymentSuccess?.()
      }, 1500)
    } catch (error) {
      console.error('Payment failed:', error)
      setStatus('idle')
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-black border-t border-white/10 text-white">
        <div className="w-full">
          {status === 'idle' && (
            <>
              <DrawerHeader className="pt-8 px-6">
                <DrawerTitle className="text-2xl font-bold text-center tracking-tight">
                  {t('payment.unlockTitle', { name: characterName })}
                </DrawerTitle>
                <DrawerDescription className="text-white text-center mt-2">
                  {isDiscounted 
                    ? t('payment.discountApplied')
                    : t('payment.chooseMethod', { name: characterName })}
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-6 py-6 space-y-6">
                <div className="liquid-glass-card rounded-2xl p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-white font-medium">{characterName}</p>
                    <p className="text-xl font-bold">{characterType}</p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                    {characterImage ? (
                      <img src={getFullImageUrl(characterImage)} alt={characterName} className="w-full h-full object-cover" />
                    ) : (
                      <Star className="text-white w-7 h-7" />
                    )}
                  </div>
                </div>

                {/* Discount badge */}
                {isDiscounted && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400 font-medium">{t('payment.friendDiscount')}</span>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <Button
                    onClick={() => handlePayment('stars')}
                    className="w-full h-14 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500 font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] border-none"
                  >
                    <Star className="w-5 h-5" />
                    {isDiscounted && <span className="line-through text-black/40 text-sm mr-1">300</span>}
                    {priceStars} LRA Points
                  </Button>

                  <Button
                    onClick={() => handlePayment('ton')}
                    variant="outline"
                    className="w-full h-14 rounded-xl border-white/20 bg-transparent hover:bg-white/5 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    {isDiscounted && <span className="line-through text-white text-sm mr-1">0.01</span>}
                    {priceTON} BNB
                  </Button>
                </div>
              </div>

              <DrawerFooter className="pb-10 px-6">
                <p className="text-[10px] text-center text-white leading-relaxed uppercase tracking-tighter">
                  {t('payment.termsAgreement')}
                </p>
              </DrawerFooter>
            </>
          )}

          {status === 'processing' && (
            <div className="py-24 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-white animate-spin relative z-10" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold tracking-widest uppercase">{t('payment.processing')}</h3>
                <p className="text-white text-sm">{t('payment.validating')}</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="py-24 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500">
              <CheckCircle2 className="w-16 h-16 text-white" />
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">{t('payment.unlocked')}</h3>
                <p className="text-white">{t('payment.welcomeMessage', { name: characterName })}</p>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
