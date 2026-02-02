'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useTranslations, useI18n } from '@/components/i18n-provider'

interface DrawingLoadingProps {
  onBack?: () => void
  error?: string | null
  onRetry?: () => void
  characterTitle?: string
}

// 多语言步骤映射
const getCalculationSteps = (locale: string) => {
  const steps: Record<string, Array<{ text: string; duration: number }>> = {
    en: [
      { text: "Initializing quantum astrology engine...", duration: 2000 },
      { text: "Analyzing birth chart coordinates...", duration: 2500 },
      { text: "Retrieving planetary data from NASA JPL...", duration: 3000 },
      { text: "Calculating compatibility vectors...", duration: 2500 },
      { text: "Synthesizing facial features...", duration: 3000 },
      { text: "Rendering high-resolution portrait...", duration: 4000 },
    ],
    zh: [
      { text: "正在初始化量子占星引擎...", duration: 2000 },
      { text: "正在分析星盘坐标...", duration: 2500 },
      { text: "正在从 NASA JPL 获取行星数据...", duration: 3000 },
      { text: "正在计算兼容性向量...", duration: 2500 },
      { text: "正在合成面部特征...", duration: 3000 },
      { text: "正在渲染高清肖像...", duration: 4000 },
    ],
    ru: [
      { text: "Инициализация квантового астрологического движка...", duration: 2000 },
      { text: "Анализ координат натальной карты...", duration: 2500 },
      { text: "Получение планетарных данных от NASA JPL...", duration: 3000 },
      { text: "Расчёт векторов совместимости...", duration: 2500 },
      { text: "Синтез черт лица...", duration: 3000 },
      { text: "Рендеринг портрета высокого разрешения...", duration: 4000 },
    ],
  }
  return steps[locale] || steps.en
}

// Random coordinates for the data overlay effect
const generateCoordinates = () => {
  const lat = (Math.random() * 180 - 90).toFixed(4)
  const lng = (Math.random() * 360 - 180).toFixed(4)
  return `${lat}° ${Number(lat) >= 0 ? 'N' : 'S'}, ${lng}° ${Number(lng) >= 0 ? 'E' : 'W'}`
}

const generateBinaryString = () => {
  return Array.from({ length: 8 }, () => Math.round(Math.random())).join('')
}

export default function DrawingLoading({ onBack, error, onRetry, characterTitle = 'Soulmate' }: DrawingLoadingProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [dataOverlay, setDataOverlay] = useState({ coords: '', binary: '' })
  
  const { t } = useTranslations('loading')
  const { t: tCommon } = useTranslations('common')
  const { t: tErrors } = useTranslations('errors')
  const { t: tCharacters } = useTranslations('characters')
  const { locale } = useI18n()

  const calculationSteps = getCalculationSteps(locale)

  // 获取本地化的角色名称
  const getLocalizedCharacterTitle = () => {
    const characterTypeToKey: Record<string, string> = {
      'Soulmate': 'soulmate',
      'Mini Me': 'miniMe',
      'Future Husband': 'futureHusband',
      'Future Baby': 'futureBaby',
      'Future Wife': 'futureWife',
      'Boyfriend': 'boyfriend',
      'Best Friend': 'bestFriend',
      'Girlfriend': 'girlfriend',
      'Mysterious Stranger': 'mysteriousStranger',
      'Wise Mentor': 'wiseMentor',
      'Dream Guide': 'dreamGuide',
    }
    const key = characterTypeToKey[characterTitle]
    return key ? tCharacters(key) : characterTitle
  }

  const localizedTitle = getLocalizedCharacterTitle()

  // Step progression logic
  useEffect(() => {
    if (error) return

    const step = calculationSteps[stepIndex]
    const startTime = Date.now()
    const stepProgress = (stepIndex / calculationSteps.length) * 100

    // Update progress smoothly within each step
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const stepProgressPortion = (elapsed / step.duration) * (100 / calculationSteps.length)
      const newProgress = Math.min(stepProgress + stepProgressPortion, ((stepIndex + 1) / calculationSteps.length) * 100)
      setProgress(newProgress)
    }, 50)

    // Move to next step after duration
    const timer = setTimeout(() => {
      if (stepIndex < calculationSteps.length - 1) {
        setStepIndex(stepIndex + 1)
      }
      // If on last step, just loop the progress bar at 95% to indicate ongoing work
    }, step.duration)

    return () => {
      clearTimeout(timer)
      clearInterval(progressInterval)
    }
  }, [stepIndex, error, calculationSteps])

  // Data overlay animation
  useEffect(() => {
    if (error) return

    const interval = setInterval(() => {
      setDataOverlay({
        coords: generateCoordinates(),
        binary: generateBinaryString(),
      })
    }, 500)

    return () => clearInterval(interval)
  }, [error])

  if (error) {
  return (
    <div className="h-full bg-black flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md text-center px-4">
            <h1 className="text-title-lg mb-4 text-red-500 text-balance flex-shrink-0">{tErrors('generationFailed')}</h1>
            <p className="text-body-lg text-gray-400 max-w-md mx-auto">
              {error}
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>

          <div className="w-full mb-8 flex flex-col items-center gap-4">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                {tCommon('retry')}
              </button>
            )}
          </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-black flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-md text-center px-4 mb-8">
            <h1 className="text-title-lg mb-4 text-balance flex-shrink-0">{t('drawing', { character: localizedTitle })}</h1>
            <p className="text-body-lg text-gray-400 max-w-md mx-auto">
              {t('generating')}
            </p>
          </div>

      {/* Central Animation Container */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Orbiting Rings */}
        <div className="relative w-64 h-64">
          {/* Outer ring */}
          <div 
            className="absolute inset-0 rounded-full border border-amber-500/30 animate-spin"
            style={{ animationDuration: '8s' }}
          />
          
          {/* Middle ring - tilted */}
          <div 
            className="absolute inset-4 rounded-full border border-cyan-400/40 animate-spin"
            style={{ 
              animationDuration: '6s', 
              animationDirection: 'reverse',
              transform: 'rotateX(60deg)'
            }}
          />
          
          {/* Inner ring */}
          <div 
            className="absolute inset-8 rounded-full border border-purple-400/50 animate-spin"
            style={{ animationDuration: '4s' }}
          />
          
          {/* Third ring - different tilt */}
          <div 
            className="absolute inset-12 rounded-full border border-pink-400/40 animate-spin"
            style={{ 
              animationDuration: '5s', 
              animationDirection: 'reverse',
              transform: 'rotateY(60deg)'
            }}
          />

          {/* Pulsing Core */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Outer glow */}
              <div 
                className="absolute -inset-8 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20 blur-xl animate-pulse"
                style={{ animationDuration: '2s' }}
              />
              
              {/* Inner core */}
              <div 
                className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 animate-pulse shadow-lg shadow-amber-500/50"
                style={{ animationDuration: '1.5s' }}
              />
              
              {/* Core highlight */}
              <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white/40 blur-sm" />
            </div>
          </div>

          {/* Orbiting dots */}
          <div 
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: '3s' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
          </div>
          <div 
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: '4s', animationDirection: 'reverse' }}
          >
            <div className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
          </div>
          <div 
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: '5s' }}
          >
            <div className="absolute top-8 left-4 w-1 h-1 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50" />
          </div>
        </div>

        {/* Data Overlay - Floating coordinates */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top left data */}
          <div className="absolute top-4 left-4 font-mono text-[10px] text-cyan-400/60 animate-pulse">
            <div>LAT: {dataOverlay.coords.split(',')[0]}</div>
            <div>LNG: {dataOverlay.coords.split(',')[1]}</div>
          </div>
          
          {/* Top right data */}
          <div className="absolute top-4 right-4 font-mono text-[10px] text-amber-400/60 animate-pulse text-right">
            <div>BIN: {dataOverlay.binary}</div>
            <div>VEC: {(Math.random() * 100).toFixed(2)}%</div>
          </div>
          
          {/* Bottom left data */}
          <div className="absolute bottom-4 left-4 font-mono text-[10px] text-purple-400/60 animate-pulse">
            <div>NODE: ACTIVE</div>
            <div>SYNC: {Math.floor(Math.random() * 1000)}ms</div>
          </div>

          {/* Bottom right data */}
          <div className="absolute bottom-4 right-4 font-mono text-[10px] text-green-400/60 animate-pulse text-right">
            <div>NASA_JPL: OK</div>
            <div>EPHEMERIS: LOADED</div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="w-full max-w-md px-4 mb-4">
        {/* Progress Bar */}
        <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 95)}%` }}
          />
        </div>
        
        {/* Current Step Text */}
        <div className="text-center">
          <p className="font-mono text-sm text-amber-400 mb-2 animate-pulse">
            {calculationSteps[stepIndex].text}
          </p>
          <p className="text-xs text-gray-500">
            {stepIndex + 1} / {calculationSteps.length}
          </p>
        </div>
      </div>

      {/* Warning */}
          <div className="w-full mb-8 flex items-center justify-center gap-2 text-body-sm text-gray-400">
            <div className="w-5 h-5 rounded-full border border-yellow-600 flex-shrink-0 flex items-center justify-center">
              <span className="text-xs">⚠</span>
            </div>
        <p>{t('pleaseWait')}</p>
          </div>
    </div>
  )
}
