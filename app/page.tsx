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
import HelpUnlockPage from '@/components/help-unlock-page'
import Preloader from '@/components/ui/preloader'
import { PaymentDrawer } from '@/components/payment-drawer'
import { apiClient } from '@/lib/api'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true) // 初始加载状态
  const [step, setStep] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showMiniMe, setShowMiniMe] = useState(false)
  const [showHelpUnlock, setShowHelpUnlock] = useState(false)
  const [helpUnlockShareCode, setHelpUnlockShareCode] = useState<string | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
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
  const [creatingCharacterType, setCreatingCharacterType] = useState<{ type: string; title: string; placeholder?: string } | null>(null)

  // 在 preloader 阶段检查用户状态并决定跳转
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // 解析 Telegram startapp 参数
        const webApp = (window as any).Telegram?.WebApp
        const startParam = webApp?.initDataUnsafe?.start_param
        
        // 检查是否是分享链接 (格式: char_{characterId}_{shareCode})
        if (startParam && startParam.startsWith('char_')) {
          const parts = startParam.split('_')
          if (parts.length >= 3) {
            const shareCode = parts.slice(2).join('_') // 支持分享码中包含下划线
            setHelpUnlockShareCode(shareCode)
            setShowHelpUnlock(true)
            setIsLoading(false)
            return
          }
        }
        
        const user = await apiClient.getMe() as any

        if (user && user.name && user.gender && user.birth_date) {
          // 用户已完成引导，直接跳转到 Dashboard
          setStep(13)
        } else {
          // 用户未完成引导，显示 Welcome 页面
          setStep(0)
        }
      } catch (error) {
        // 出错时也显示 Welcome 页面
        setStep(0)
      } finally {
        // 立即隐藏 preloader（TelegramProvider 已经处理了最小显示时间）
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
  const handleStartCreateCharacter = (charType: { type: string; title: string; placeholder?: string }) => {
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
      } else if (step === 10) {
        // 选择族裔后，直接进入 Drawing 页面（支付移到结果页）
        setStep(11)
      } else {
        // step 11 (DrawingLoading) 由 createCharacter 完成后自动跳转到 step 12
        setStep(step + 1)
      }
    }
  }

  const [generationError, setGenerationError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)

  // 支付成功后的回调
  const handlePaymentSuccess = () => {
    // 标记支付完成，关闭弹窗，进入 Drawing 页面
    setPaymentCompleted(true)
    setIsPaymentOpen(false)
    setStep(11)
  }

  // 创建角色并生成图片（在 step 11 时触发，支付移到结果页）
  useEffect(() => {
    if (step === 11 && !isGenerating) {
      setIsGenerating(true)
      setGenerationError(null)
      
      const createCharacter = async () => {
        try {
          // 确定角色类型和标题
          const charType = creatingCharacterType?.type || 'soulmate'
          const charTitle = creatingCharacterType?.title || 'Soulmate'

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

          // 生成角色图片（后端只返回授权的图片URL）
          const imageResult = await apiClient.generateImage((character as any).id.toString()) as any
          if (imageResult && imageResult.image_url) {
            // 只保存后端安全返回的字段
            ;(character as any).image_url = imageResult.image_url
            ;(character as any).full_blur_image_url = imageResult.full_blur_image_url
            ;(character as any).unlock_status = imageResult.unlock_status
            ;(character as any).share_code = imageResult.share_code
            // 注意：half_blur_image_url 和 clear_image_url 只有在相应解锁状态下才会返回
          } else {
            throw new Error('生成图片失败：未返回有效的图片数据')
          }

          // 保存角色数据并跳转到下一步
          // 确保 id 是字符串格式，与 Dashboard 传递的格式一致
          const characterData = {
            ...(character as any),
            id: (character as any).id.toString(),
          }
          setSelectedCharacterData(characterData)
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
  }, [step, isGenerating, creatingCharacterType, formData.soulmateGender, formData.soulmateEthnicity])

  // Auto-trigger loading states (只针对 step 7)
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

  const handleOpenMiniMe = () => {
    setShowMiniMe(true)
  }

  const handleCloseMiniMe = () => {
    setShowMiniMe(false)
  }

  const handleOpenPayment = () => {
    setIsPaymentOpen(true)
  }

  // Handle Telegram Back Button
  useEffect(() => {
    const webApp = (window as any).Telegram?.WebApp
    if (!webApp) return

    const backButton = webApp.BackButton

    const handleTelegramBack = () => {
      if (showChat) {
        // 聊天页面返回时，直接回到 Dashboard (step 13)
        setShowChat(false)
        setStep(13)
        setDashboardKey(prev => prev + 1) // 刷新 Dashboard
      } else if (showProfile) {
        handleCloseProfile()
      } else if (showHistory) {
        handleCloseHistory()
      } else if (showMiniMe) {
        handleCloseMiniMe()
      } else if (step === 12) {
        // 在角色详情页（生成图片后）返回时，直接回到 Dashboard
        handleGoToDashboard()
      } else if (creatingCharacterType && step === 9) {
        // 如果正在创建角色且在第一步（性别选择），点击返回回到 Dashboard
        handleGoToDashboard()
      } else if (step > 0 && step !== 8.5 && step !== 10.5 && step !== 13) {
        handleBack()
      }
    }

    // Determine visibility
    // Show back button if:
    // 1. Chat is open
    // 2. Profile is open
    // 3. History is open
    // 4. Mini Me is open
    // 5. Step > 0 (except specific intermediate steps and Dashboard)
    const shouldShowBack = showChat || showProfile || showHistory || showMiniMe || (step > 0 && step !== 8.5 && step !== 10.5 && step !== 13)

    if (shouldShowBack) {
      backButton.show()
      backButton.onClick(handleTelegramBack)
    } else {
      backButton.hide()
    }

    // Settings Button / Close behavior for Dashboard
    // Telegram doesn't have a native "Close" button toggle for the BackButton, 
    // but we can hide the BackButton on Dashboard so the native "Close" or "X" 
    // of the Mini App is the only option.
    
    return () => {
      backButton.offClick(handleTelegramBack)
    }
  }, [step, showChat, showProfile, showHistory, showMiniMe, creatingCharacterType])

  const steps = [
    <Welcome 
      key="welcome" 
      onNext={handleNext} 
      onUserFound={() => {
        setStep(13) // Directly jump to Dashboard
      }}
    />,
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
    <SoulmateDetailPage 
      key="detail" 
      character={selectedCharacterData} 
      onNext={handleOpenChat} 
      onBack={handleGoToDashboard}
      onCharacterUpdate={(updatedChar) => {
        setSelectedCharacterData(updatedChar)
      }}
      onUnlockSuccess={() => {
        // 解锁成功后，更新角色数据以显示清晰图片
        if (selectedCharacterData) {
          setSelectedCharacterData({
            ...selectedCharacterData,
            unlock_status: 2, // FullUnlocked
            image_url: selectedCharacterData.clear_image_url || selectedCharacterData.image_url
          })
        }
      }}
    />,
    <Dashboard 
      key={`dashboard-${dashboardKey}`} 
      onSelectCharacter={handleOpenDetail} 
      onOpenProfile={handleOpenProfile} 
      onCreateCharacter={handleStartCreateCharacter}
      onOpenHistory={handleOpenHistory}
      onOpenMiniMe={handleOpenMiniMe}
    />,
  ]

  // 显示 preloader 时，只显示 preloader
  if (isLoading) {
    return <Preloader />
  }

  // 帮助解锁完成后的处理
  const handleHelpUnlockComplete = async () => {
    setShowHelpUnlock(false)
    setHelpUnlockShareCode(null)
    // 检查用户状态，决定显示欢迎页还是 Dashboard
    try {
      const user = await apiClient.getMe() as any
      if (user && user.name && user.gender && user.birth_date) {
        setStep(13)
      } else {
        setStep(0)
      }
    } catch {
      setStep(0)
    }
  }

  // 如果是帮助解锁流程，显示帮助解锁页面
  if (showHelpUnlock && helpUnlockShareCode) {
    return (
      <HelpUnlockPage
        shareCode={helpUnlockShareCode}
        onComplete={handleHelpUnlockComplete}
        onSkip={handleHelpUnlockComplete}
      />
    )
  }

  return (
    <div 
      className="h-full flex flex-col bg-black text-white"
      style={{
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
            // 设置选中的角色数据，然后直接进入聊天页面
            setSelectedCharacterData(char)
            setShowChat(true)
            handleCloseHistory()
          }}
        />
      ) : showMiniMe ? (
        <MiniMeUpload
          onNext={(character) => {
            // 处理 Mini Me 上传后的逻辑
            handleCloseMiniMe()
            // 跳转到详情页展示生成的 Mini Me
            handleOpenDetail(character)
          }}
          onBack={handleCloseMiniMe}
        />
      ) : (
        <>
          <div className={`flex-1 overflow-hidden ${showChat ? 'pointer-events-none opacity-50' : ''}`}>
            {steps[Math.min(Math.floor(step), steps.length - 1)]}
          </div>
          {showChat && (
            <>
              <ChatWindow 
                characterId={selectedCharacterData?.id?.toString()} 
                characterTitle={selectedCharacterData?.title || 'Soulmate'}
                characterImage={selectedCharacterData?.image_url || selectedCharacterData?.image}
                onClose={handleCloseChat} 
              />
            </>
          )}
          <PaymentDrawer
            isOpen={isPaymentOpen}
            onClose={() => setIsPaymentOpen(false)}
            characterName={creatingCharacterType?.title || selectedCharacterData?.title || 'AI Companion'}
            characterType={creatingCharacterType?.type || 'Soulmate'}
            characterImage={selectedCharacterData?.image_url || selectedCharacterData?.image || creatingCharacterType?.placeholder}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </>
      )}
    </div>
  )
}
