'use client'

import { useState, useCallback } from 'react'
import { biographyService } from '@/lib/api/services'
import { useToast } from '@/components/ui/use-toast'

interface UseImageCropperOptions {
  avatarUrl?: string | null
  coverUrl?: string | null
  onAvatarChange: (url: string) => void
  onCoverChange: (url: string) => void
  onFlushSave?: () => void
}

/**
 * 圖片裁切器 Hook
 *
 * 處理頭像和封面圖片的選擇、裁切和上傳邏輯
 */
export function useImageCropper({
  avatarUrl,
  coverUrl,
  onAvatarChange,
  onCoverChange,
  onFlushSave,
}: UseImageCropperOptions) {
  const { toast } = useToast()

  const [showCropper, setShowCropper] = useState(false)
  const [cropperImageSrc, setCropperImageSrc] = useState<string>('')
  const [cropType, setCropType] = useState<'avatar' | 'cover'>('avatar')
  const [isUploading, setIsUploading] = useState(false)

  // 處理頭像選擇 - 開啟裁切器
  const handleAvatarSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setCropperImageSrc(url)
    setCropType('avatar')
    setShowCropper(true)
  }, [])

  // 處理封面選擇 - 開啟裁切器
  const handleCoverSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setCropperImageSrc(url)
    setCropType('cover')
    setShowCropper(true)
  }, [])

  // 裁切器關閉時清理 blob URL
  const handleCropperClose = useCallback(() => {
    setShowCropper(false)
    if (cropperImageSrc && cropperImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(cropperImageSrc)
      setCropperImageSrc('')
    }
  }, [cropperImageSrc])

  // 處理裁切完成 - 上傳圖片
  const handleCropComplete = useCallback(
    async (croppedFile: File) => {
      setIsUploading(true)
      try {
        const response = await biographyService.uploadImage(
          croppedFile,
          cropType === 'avatar' ? avatarUrl || undefined : coverUrl || undefined
        )

        if (response.success && response.data) {
          const permanentUrl = response.data.url
          if (cropType === 'avatar') {
            onAvatarChange(permanentUrl)
          } else {
            onCoverChange(permanentUrl)
          }
          // 立即執行儲存，避免使用者重新整理時遺失圖片
          onFlushSave?.()
          toast({
            title: '上傳成功',
            description: cropType === 'avatar' ? '頭像已更新' : '封面圖片已更新',
          })
        } else {
          throw new Error('上傳失敗')
        }
      } catch (err) {
        console.error('圖片上傳失敗:', err)
        toast({
          title: '上傳失敗',
          description: err instanceof Error ? err.message : '請稍後再試',
          variant: 'destructive',
        })
      } finally {
        setIsUploading(false)
        // 清理 blob URL
        if (cropperImageSrc && cropperImageSrc.startsWith('blob:')) {
          URL.revokeObjectURL(cropperImageSrc)
          setCropperImageSrc('')
        }
      }
    },
    [cropType, avatarUrl, coverUrl, onAvatarChange, onCoverChange, toast, cropperImageSrc, onFlushSave]
  )

  return {
    // 狀態
    showCropper,
    cropperImageSrc,
    cropType,
    isUploading,
    // 方法
    handleAvatarSelect,
    handleCoverSelect,
    handleCropperClose,
    handleCropComplete,
  }
}
