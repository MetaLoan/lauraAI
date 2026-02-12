'use client'

import { useState, useEffect, useMemo } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface DrawingLoadingProps {
  onBack?: () => void
  error?: string | null
  onRetry?: () => void
  characterTitle?: string
}

// Calculation steps (English only for consistency)
const getCalculationSteps = (locale: string) => {
  return [
    { text: "Initializing quantum astrology engine...", duration: 2000 },
    { text: "Analyzing birth chart coordinates...", duration: 2500 },
    { text: "Retrieving planetary data from NASA JPL...", duration: 3000 },
    { text: "Calculating compatibility vectors...", duration: 2500 },
    { text: "Synthesizing facial features...", duration: 3000 },
    { text: "Rendering high-resolution portrait...", duration: 4000 },
  ]
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
  
  // Always use English calculation steps
  const calculationSteps = useMemo(() => getCalculationSteps('en'), [])

  // Use the character title directly (already in English from create page)
  const localizedTitle = characterTitle

  // Step progression logic
  useEffect(() => {
    if (error) return

    const step = calculationSteps[stepIndex]
    if (!step) return

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
        setStepIndex(prev => prev + 1)
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
    <div 
      className="h-full flex flex-col items-center justify-center"
      style={{
        paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px) + 24px)'
      }}
    >
          <div className="w-full max-w-md text-center px-4">
            <h1 className="text-3xl font-bold mb-4 text-red-500">Generation Failed</h1>
            <p className="text-lg text-white max-w-md mx-auto">
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
                Retry
              </button>
            )}
          </div>
      </div>
    )
  }

  return (
    <div 
      className="h-full flex flex-col items-center justify-center overflow-hidden"
      style={{
        paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px) + 24px)'
      }}
    >
      {/* Header */}
      <div className="w-full text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Creating Your {localizedTitle}</h1>
        <p className="text-sm text-white/90 uppercase tracking-[0.25em]">AI Generation in Progress</p>
      </div>

      {/* Central Animation Container */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="relative w-72 h-72">
          {/* Ambient halo */}
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,175,80,0.26)_0%,rgba(168,85,247,0.12)_38%,rgba(59,130,246,0.04)_66%,transparent_72%)]" />

          {/* Rings */}
          <div className="absolute inset-2 rounded-full border border-white/28 animate-spin" style={{ animationDuration: '16s' }} />
          <div className="absolute inset-7 rounded-full border border-white/20 animate-spin" style={{ animationDuration: '11s', animationDirection: 'reverse' }} />
          <div className="absolute inset-12 rounded-full border border-white/14 animate-spin" style={{ animationDuration: '7s' }} />

          {/* Sweep scanner */}
          <div
            className="absolute inset-2 rounded-full animate-spin opacity-60"
            style={{
              animationDuration: '5s',
              background: 'conic-gradient(from 0deg, transparent 0deg, transparent 312deg, rgba(255,255,255,0.65) 350deg, transparent 360deg)',
              WebkitMask: 'radial-gradient(circle, transparent 54%, black 56%)',
              mask: 'radial-gradient(circle, transparent 54%, black 56%)',
            }}
          />

          {/* Core */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-10 rounded-full bg-amber-400/20 blur-2xl animate-pulse" style={{ animationDuration: '2.1s' }} />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 via-orange-500 to-red-500 shadow-[0_0_40px_rgba(251,146,60,0.45)] animate-pulse" style={{ animationDuration: '1.6s' }} />
              <div className="absolute top-3 left-4 w-5 h-5 rounded-full bg-white/35 blur-sm" />
            </div>
          </div>

          {/* Orbit particles */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3.4s' }}>
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-cyan-300" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4.2s', animationDirection: 'reverse' }}>
            <div className="absolute bottom-10 right-8 w-2 h-2 rounded-full bg-amber-300" />
          </div>
        </div>

        {/* Data overlay (minimal) */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/15 border border-white/15 backdrop-blur-md font-mono text-[10px] text-white/85 tracking-wider">
          LAT {dataOverlay.coords.split(',')[0]} · BIN {dataOverlay.binary}
        </div>
      </div>

      {/* Progress Section */}
      <div className="w-full max-w-xl mb-4">
        <div className="h-1.5 rounded-full overflow-hidden mb-5 bg-white/22">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 95)}%` }}
          />
        </div>

        <div className="text-center">
          <p className="font-mono text-base text-amber-300 mb-2 min-h-[2.2rem] flex items-center justify-center">
            {calculationSteps[stepIndex]?.text}
          </p>
          <p className="text-sm text-white/85">
            {stepIndex + 1} / {calculationSteps.length}
          </p>
        </div>
      </div>

    </div>
  )
}
