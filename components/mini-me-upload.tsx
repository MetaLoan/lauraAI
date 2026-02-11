'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, ImageIcon, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import imageCompression from 'browser-image-compression'
import { useTranslations } from '@/components/i18n-provider'

interface MiniMeUploadProps {
  onNext: (character: any) => void
  onBack: () => void
}

export default function MiniMeUpload({ onNext, onBack }: MiniMeUploadProps) {
  const { t } = useTranslations('miniMe')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    setUploadStatus(t('processing'))

    try {
      // 1. 检查文件类型并进行初步处理
      let processingFile = file

      // 处理 iOS 特有的 HEIC 格式
      if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
        setUploadStatus(t('converting'))
        const heic2any = (await import('heic2any')).default
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        })

        // heic2any 可能返回数组或单个 blob
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
        processingFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), {
          type: 'image/jpeg'
        })
      }

      // 2. 统一压缩和格式转换
      // 无论是什么格式（JPG, PNG, WebP 等），都进行统一压缩并强制转换为 JPEG
      setUploadStatus(t('compressing'))
      const options = {
        maxSizeMB: 0.8,          // 目标大小 0.8MB
        maxWidthOrHeight: 1024,  // 适度提高分辨率到 1024px，保证特征清晰
        useWebWorker: true,
        initialQuality: 0.8,     // 初始质量
        fileType: 'image/jpeg' as any // 强制转换为 jpeg
      }

      const compressedFile = await imageCompression(processingFile, options)

      // 检查压缩后的文件大小
      console.log('Original size:', file.size / 1024 / 1024, 'MB')
      console.log('Processed size:', compressedFile.size / 1024 / 1024, 'MB')

      // 3. 直接上传并生成 Mini Me（无需预付费，和其他角色一样后置付费解锁）
      setUploadStatus(t('analyzing'))
      const result = await apiClient.generateMiniMe(compressedFile)
      onNext(result.character)
    } catch (err) {
      console.error('Mini Me generation failed:', err)
      setError(t('tryAgain'))
    } finally {
      setIsUploading(false)
      setUploadStatus(null)
    }
  }

  const handleGalleryClick = () => {
    fileInputRef.current?.click()
  }

  const handleCameraClick = () => {
    // 移动端通常会提示选择相机或文件
    fileInputRef.current?.click()
  }

  return (
    <div className="h-full flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 scrollbar-hide">
        <div
          className="flex flex-col items-center justify-center min-h-full pb-8"
          style={{
            paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px))'
          }}
        >
          {/* Title */}
          <h1 className="text-title-lg text-balance text-center mb-2">
            {t('title')}
          </h1>
          <h2 className="text-title-lg text-balance text-center mb-6">
            {t('uploadSelfie')}
          </h2>

          {/* Description */}
          <p className="text-body-md text-white text-center max-w-sm mb-8">
            {t('uploadHint')}
          </p>

          {/* Phone Illustration */}
          <div className="relative mb-8">
            <div className="w-40 h-64 liquid-glass-card rounded-3xl flex items-center justify-center p-2">
              <div className="w-full h-full rounded-2xl bg-gradient-to-b from-gray-400 to-gray-600 flex items-center justify-center overflow-hidden">
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-10 h-10 animate-spin text-white" />
                    <span className="text-xs text-white px-4 text-center">
                      {uploadStatus || t('analyzing')}
                    </span>
                  </div>
                ) : (
                  <img src="/icons/3d/profile.png" className="w-20 h-20 object-contain opacity-50" alt="Profile" />
                )}
              </div>
            </div>
            {/* Camera Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-black rounded-b-3xl border border-white/10" />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center mb-4 bg-red-500/10 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Footer Buttons - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-transparent z-50">
        <div className="max-w-md mx-auto space-y-3">
          <Button
            onClick={handleCameraClick}
            disabled={isUploading}
            className="btn-primary flex items-center justify-center gap-2 w-full"
          >
            <Camera className="w-5 h-5" />
            {t('takeSelfie')}
          </Button>
          <Button
            onClick={handleGalleryClick}
            disabled={isUploading}
            className="btn-primary flex items-center justify-center gap-2 w-full !bg-white/10 !text-white hover:!bg-white/20"
          >
            <ImageIcon className="w-5 h-5" />
            {t('chooseGallery')}
          </Button>
        </div>
      </div>

      {/* Bottom spacer for fixed buttons */}
      <div className="h-40 flex-shrink-0" />
    </div>
  )
}
