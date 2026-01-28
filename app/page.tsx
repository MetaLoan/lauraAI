'use client'

import React from "react"
import MiniMeUpload from '@/components/mini-me-upload'

import { useState } from 'react'
import Welcome from '@/components/welcome'
import NameInput from '@/components/name-input'
import GenderSelect from '@/components/gender-select'
import BirthDatePicker from '@/components/birth-date-picker'
import BirthTimePicker from '@/components/birth-time-picker'
import BirthPlaceInput from '@/components/birth-place-input'
import EthnicitySelect from '@/components/ethnicity-select'
import LoadingResults from '@/components/loading-results'
import ResultsCard from '@/components/results-card'
import SoulmateGenderSelect from '@/components/soulmate-gender-select'
import SoulmateEthnicitySelect from '@/components/soulmate-ethnicity-select'
import DrawingLoading from '@/components/drawing-loading'
import SoulmateDetailPage from '@/components/soulmate-detail-page'
import ChatWindow from '@/components/chat-window'
import Dashboard from '@/components/dashboard'

export default function Home() {
  const [step, setStep] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthDate: { month: '', day: '', year: '' },
    birthTime: { hour: '19', minute: '15' },
    birthPlace: '',
    ethnicity: '',
    soulmateGender: '',
    soulmateEthnicity: '',
  })

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNext = () => {
    if (step < 15) {
      if (step === 7) {
        // Loading before results - auto progress after 3 seconds
        setTimeout(() => setStep(8), 3000)
      } else if (step === 11) {
        // Drawing loading - auto progress after 3 seconds
        setTimeout(() => setStep(12), 3000)
      } else {
        setStep(step + 1)
      }
    }
  }

  // Auto-trigger loading states
  React.useEffect(() => {
    if (step === 7 || step === 11) {
      const timer = setTimeout(() => {
        setStep(step + 1)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [step])

  const handleBack = () => {
    if (step > 0 && step !== 8.5 && step !== 10.5) {
      setStep(step - 1)
    }
  }

  const handleOpenChat = () => {
    setShowChat(true)
  }

  const handleCloseChat = () => {
    setShowChat(false)
    setStep(13) // 跳转到 Dashboard (Dashboard 在 steps 数组的索引是 12，step >= steps.length 也会显示 Dashboard)
  }

  const steps = [
    <Welcome key="welcome" onNext={handleNext} />,
    <NameInput key="name" value={formData.name} onChange={(val) => updateFormData('name', val)} onNext={handleNext} />,
    <GenderSelect key="gender" value={formData.gender} onChange={(val) => updateFormData('gender', val)} onNext={handleNext} onBack={handleBack} title="What is your gender?" />,
    <BirthDatePicker key="birthDate" value={formData.birthDate} onChange={(val) => updateFormData('birthDate', val)} onNext={handleNext} onBack={handleBack} />,
    <BirthTimePicker key="birthTime" value={formData.birthTime} onChange={(val) => updateFormData('birthTime', val)} onNext={handleNext} onBack={handleBack} />,
    <BirthPlaceInput key="birthPlace" value={formData.birthPlace} onChange={(val) => updateFormData('birthPlace', val)} onNext={handleNext} onBack={handleBack} />,
    <EthnicitySelect key="ethnicity" value={formData.ethnicity} onChange={(val) => updateFormData('ethnicity', val)} onNext={handleNext} onBack={handleBack} />,
    <LoadingResults key="loading" />,
    <ResultsCard key="results" onNext={handleNext} onBack={handleBack} />,
    <SoulmateGenderSelect key="soulmateGender" value={formData.soulmateGender} onChange={(val) => updateFormData('soulmateGender', val)} onNext={handleNext} onBack={handleBack} />,
    <SoulmateEthnicitySelect key="soulmateEthnicity" value={formData.soulmateEthnicity} onChange={(val) => updateFormData('soulmateEthnicity', val)} onNext={handleNext} onBack={handleBack} />,
    <DrawingLoading key="drawing" />,
    <SoulmateDetailPage key="detail" onNext={handleOpenChat} onBack={handleBack} />,
    <Dashboard key="dashboard" />,
  ]

  if (step >= steps.length) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Dashboard />
        {showChat && <ChatWindow onClose={handleCloseChat} />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div className={showChat ? 'pointer-events-none opacity-50' : ''}>
        {steps[Math.floor(step)]}
      </div>
      {showChat && <ChatWindow onClose={handleCloseChat} />}
    </div>
  )
}
