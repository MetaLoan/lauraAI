'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useTranslations } from '@/components/i18n-provider'

export default function ReportLoading() {
  const { t } = useTranslations('loading')
  const [textIndex, setTextIndex] = useState(0)

  const loadingTexts = [
    t('analyzingStars'),
    t('connectingSouls'),
    t('interpretingDestiny'),
    t('generatingReport')
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [loadingTexts.length])

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center min-h-[200px]">
      <div className="relative mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-2 border-amber-500/30 border-t-amber-500"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sparkles className="w-6 h-6 text-amber-400" />
        </motion.div>
      </div>
      
      <motion.p
        key={textIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-center text-amber-200/80 font-medium text-lg"
      >
        {loadingTexts[textIndex]}
      </motion.p>
    </div>
  )
}
