'use client'

import React from "react"
import MiniMeUpload from '@/components/mini-me-upload'

import { useState, useEffect } from 'react'
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
import Profile from '@/components/profile'
import HistoryPage from '@/components/history-page'
import { apiClient } from '@/lib/api'

export default function Home() {
  const [step, setStep] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
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

  const [selectedCharacterData, setSelectedCharacterData] = useState<any>(null)
  const [dashboardKey, setDashboardKey] = useState(0) // 用于强制刷新 Dashboard
  const [creatingCharacterType, setCreatingCharacterType] = useState<{ type: string; title: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true) // 初始加载状态

  // 检查用户是否已完成引导流程
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const user = await apiClient.getMe() as any
        if (user && user.name && user.gender && user.birth_date) {
          // 用户已完成引导，直接跳转到 Dashboard
          setStep(13)
        }
      } catch (error) {
        console.log('用户未登录或未完成引导')
      } finally {
        setIsLoading(false)
      }
    }
    checkUserStatus()
  }, [])

  // 月份名称到数字的映射
  const monthNameToNumber = (monthName: string): string => {
    const months: Record<string, string> = {
      'January': '01',
      'February': '02',
      'March': '03',
      'April': '04',
      'May': '05',
      'June': '06',
      'July': '07',
      'August': '08',
      'September': '09',
      'October': '10',
      'November': '11',
      'December': '12',
    }
    return months[monthName] || '01'
  }

  // 保存用户信息到后端（在 step 8 时触发）
  useEffect(() => {
    if (step === 8) {
      const saveUserInfo = async () => {
        try {
          // 格式化日期：YYYY-MM-DD
          let birthDate: string | undefined
          if (formData.birthDate.month && formData.birthDate.day && formData.birthDate.year) {
            const monthNum = monthNameToNumber(formData.birthDate.month)
            const day = formData.birthDate.day.padStart(2, '0')
            birthDate = `${formData.birthDate.year}-${monthNum}-${day}`
          }

          // 格式化时间：HH:mm
          let birthTime: string | undefined
          if (formData.birthTime.hour && formData.birthTime.minute) {
            const hour = formData.birthTime.hour.padStart(2, '0')
            const minute = formData.birthTime.minute.padStart(2, '0')
            birthTime = `${hour}:${minute}`
          }

          await apiClient.updateMe({
            name: formData.name || undefined,
            gender: formData.gender || undefined,
            birth_date: birthDate,
            birth_time: birthTime,
            birth_place: formData.birthPlace || undefined,
            ethnicity: formData.ethnicity || undefined,
          })
          console.log('用户信息保存成功')
        } catch (error) {
          console.error('保存用户信息失败:', error)
          // 不阻断流程，继续执行
        }
      }
      saveUserInfo()
    }
  }, [step, formData])

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleOpenDetail = (character: any) => {
    setSelectedCharacterData(character)
    setStep(12) // 跳转到 SoulmateDetailPage
  }

  // 从 Dashboard 点击未创建的角色，开始创建流程
  const handleStartCreateCharacter = (charType: { type: string; title: string }) => {
    setCreatingCharacterType(charType)
    // 清空之前的角色数据
    updateFormData('soulmateGender', '')
    updateFormData('soulmateEthnicity', '')
    setStep(9) // 跳转到性别选择步骤
  }

  const handleNext = () => {
    if (step < 15) {
      if (step === 7) {
        // Loading before results - auto progress after 3 seconds
        setTimeout(() => setStep(8), 3000)
      } else {
        // step 11 (DrawingLoading) 由 createCharacter 完成后自动跳转到 step 12
        setStep(step + 1)
      }
    }
  }

  const [generationError, setGenerationError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // 创建角色并生成图片（在 step 11 时触发）
  useEffect(() => {
    if (step === 11 && !isGenerating) {
      setIsGenerating(true)
      setGenerationError(null)
      
      const createCharacter = async () => {
        try {
          // 确定角色类型和标题
          const charType = creatingCharacterType?.type || 'soulmate'
          const charTitle = creatingCharacterType?.title || 'Your Soulmate'

          // 创建角色
          const character = await apiClient.createCharacter({
            type: charType,
            title: charTitle,
            gender: formData.soulmateGender,
            ethnicity: formData.soulmateEthnicity,
          })

          if (!character || !(character as any).id) {
            throw new Error('创建角色失败：未返回有效的角色数据')
          }

          // 生成角色图片
          const imageResult = await apiClient.generateImage((character as any).id.toString())
          if (imageResult && (imageResult as any).image_url) {
            character.image_url = (imageResult as any).image_url
          } else {
            throw new Error('生成图片失败：未返回有效的图片数据')
          }

          // 保存角色数据并跳转到下一步
          // 确保 id 是字符串格式，与 Dashboard 传递的格式一致
          const characterData = {
            ...character,
            id: (character as any).id.toString(),
          }
          setSelectedCharacterData(characterData)
          console.log('角色创建成功:', characterData)
          setIsGenerating(false)
          setStep(12) // 跳转到详情页
        } catch (error) {
          console.error('创建角色失败:', error)
          setGenerationError(error instanceof Error ? error.message : '生成失败，请重试')
          setIsGenerating(false)
        }
      }
      createCharacter()
    }
  }, [step, formData.soulmateGender, formData.soulmateEthnicity, isGenerating, creatingCharacterType])

  // Auto-trigger loading states (只针对 step 7，step 11 由 createCharacter 控制)
  React.useEffect(() => {
    if (step === 7) {
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
    setStep(13) // 跳转到 Dashboard
    setDashboardKey(prev => prev + 1) // 强制刷新 Dashboard
  }

  const handleGoToDashboard = () => {
    setStep(13)
    setShowProfile(false)
    setDashboardKey(prev => prev + 1) // 强制刷新 Dashboard
    setCreatingCharacterType(null) // 清除创建状态
  }

  const handleOpenProfile = () => {
    setStep(14) // 明确设置一个大于 steps.length 的步数
    setShowProfile(true)
  }

  const handleCloseProfile = () => {
    setShowProfile(false)
    setStep(13) // 回到 Dashboard 步数
  }

  const handleDeleteAccount = () => {
    // 重置所有前端状态
    setStep(0)
    setShowProfile(false)
    setShowChat(false)
    setShowHistory(false)
    setFormData({
      name: '',
      gender: '',
      birthDate: { month: '', day: '', year: '' },
      birthTime: { hour: '19', minute: '15' },
      birthPlace: '',
      ethnicity: '',
      soulmateGender: '',
      soulmateEthnicity: '',
    })
    setSelectedCharacterData(null)
    setCreatingCharacterType(null)
    setDashboardKey(prev => prev + 1)
  }

  const handleOpenHistory = () => {
    setShowHistory(true)
  }

  const handleCloseHistory = () => {
    setShowHistory(false)
  }

  const steps = [
    <Welcome key="welcome" onNext={handleNext} />,
    <NameInput key="name" value={formData.name} onChange={(val) => updateFormData('name', val)} onNext={handleNext} onBack={handleBack} />,
    <GenderSelect key="gender" value={formData.gender} onChange={(val) => updateFormData('gender', val)} onNext={handleNext} onBack={handleBack} title="What is your gender?" />,
    <BirthDatePicker key="birthDate" value={formData.birthDate} onChange={(val) => updateFormData('birthDate', val)} onNext={handleNext} onBack={handleBack} />,
    <BirthTimePicker key="birthTime" value={formData.birthTime} onChange={(val) => updateFormData('birthTime', val)} onNext={handleNext} onBack={handleBack} />,
    <BirthPlaceInput key="birthPlace" value={formData.birthPlace} onChange={(val) => updateFormData('birthPlace', val)} onNext={handleNext} onBack={handleBack} />,
    <EthnicitySelect key="ethnicity" value={formData.ethnicity} onChange={(val) => updateFormData('ethnicity', val)} onNext={handleNext} onBack={handleBack} />,
    <LoadingResults key="loading" onBack={handleBack} />,
    <ResultsCard key="results" onNext={handleNext} onBack={handleBack} />,
    <SoulmateGenderSelect key="soulmateGender" value={formData.soulmateGender} onChange={(val) => updateFormData('soulmateGender', val)} onNext={handleNext} onBack={creatingCharacterType ? handleGoToDashboard : handleBack} characterTitle={creatingCharacterType?.title || 'Soulmate'} />,
    <SoulmateEthnicitySelect key="soulmateEthnicity" value={formData.soulmateEthnicity} onChange={(val) => updateFormData('soulmateEthnicity', val)} onNext={handleNext} onBack={handleBack} characterTitle={creatingCharacterType?.title || 'Soulmate'} />,
    <DrawingLoading key="drawing" onBack={handleBack} error={generationError} onRetry={() => { setIsGenerating(false); setGenerationError(null); }} />,
    <SoulmateDetailPage key="detail" character={selectedCharacterData} onNext={handleOpenChat} onBack={handleGoToDashboard} />,
    <Dashboard 
      key={`dashboard-${dashboardKey}`} 
      onSelectCharacter={handleOpenDetail} 
      onOpenProfile={handleOpenProfile} 
      onCreateCharacter={handleStartCreateCharacter}
      onOpenHistory={handleOpenHistory}
    />,
  ]

  // 初始加载时显示加载状态
  if (isLoading) {
    return (
      <div 
        className="min-h-screen bg-black text-white flex items-center justify-center"
        style={{
          paddingTop: 'max(56px, calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px)))',
          paddingBottom: 'max(20px, calc(var(--tg-safe-area-bottom, 0px) + var(--tg-content-safe-area-bottom, 0px)))',
        }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="h-full flex flex-col bg-black text-white overflow-hidden"
      style={{
        paddingTop: 'max(100px, calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px)))',
        paddingBottom: '0px', // 彻底移除底部 padding，解决黑条问题
        paddingLeft: 'var(--tg-safe-area-left, 0px)',
        paddingRight: 'var(--tg-safe-area-right, 0px)',
      }}
    >
      {showProfile ? (
        <Profile
          onBack={handleCloseProfile}
          onDeleteAccount={handleDeleteAccount}
        />
      ) : showHistory ? (
        <HistoryPage
          onClose={handleCloseHistory}
          onSelectCharacter={(char) => {
            handleOpenDetail(char)
            handleCloseHistory()
          }}
        />
      ) : (
        <>
          <div className={`flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch ${showChat ? 'pointer-events-none opacity-50' : ''}`}>
            {steps[Math.min(Math.floor(step), steps.length - 1)]}
          </div>
          {showChat && (
            <>
              {console.log('ChatWindow 打开，selectedCharacterData:', selectedCharacterData)}
              <ChatWindow 
                characterId={selectedCharacterData?.id?.toString()} 
                characterTitle={selectedCharacterData?.title || 'Your Soulmate'}
                characterImage={selectedCharacterData?.image_url || selectedCharacterData?.image}
                onClose={handleCloseChat} 
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
