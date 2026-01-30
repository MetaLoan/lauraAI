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
                  Unlock {characterName}
                </DrawerTitle>
                <DrawerDescription className="text-gray-400 text-center mt-2">
                  {isDiscounted 
                    ? 'Your friend helped! Enjoy the discounted price.'
                    : `Choose your preferred payment method to unlock ${characterName}.`}
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-6 py-6 space-y-6">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">{characterName}</p>
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
                    <span className="text-sm text-green-400 font-medium">Friend discount applied! Save 67%</span>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <Button
                    onClick={() => handlePayment('stars')}
                    className="w-full h-14 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] border-none"
                  >
                    <img 
                      src={getAssetPath('/TelegramStars@3x.png')} 
                      alt="Telegram Stars" 
                      className="w-6 h-6 object-contain"
                    />
                    {isDiscounted && <span className="line-through text-gray-400 text-sm mr-1">300</span>}
                    {priceStars} Stars
                  </Button>

                  <Button
                    onClick={() => handlePayment('ton')}
                    variant="outline"
                    className="w-full h-14 rounded-xl border-white/20 bg-transparent hover:bg-white/5 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <img 
                      src={getAssetPath('/toncoin-ton-logo.png')} 
                      alt="TON" 
                      className="w-6 h-6 object-contain"
                    />
                    {isDiscounted && <span className="line-through text-gray-500 text-sm mr-1">3</span>}
                    {priceTON} TON
                  </Button>
                </div>
              </div>

              <DrawerFooter className="pb-10 px-6">
                <p className="text-[10px] text-center text-gray-600 leading-relaxed uppercase tracking-tighter">
                  By completing the payment, you agree to our <br/> Terms of Service and Privacy Policy.
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
                <h3 className="text-lg font-bold tracking-widest uppercase">Processing</h3>
                <p className="text-gray-500 text-sm">Validating transaction...</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="py-24 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500">
              <CheckCircle2 className="w-16 h-16 text-white" />
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">UNLOCKED!</h3>
                <p className="text-gray-500">Welcome to the world of {characterName}.</p>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
