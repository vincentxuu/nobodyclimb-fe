import { useState, useCallback } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { biographyService } from '@/lib/biographyService'
import { useToast } from '@/components/ui/Toast'

interface UseImageCropperOptions {
  avatarUrl?: string | null
  coverUrl?: string | null
  onAvatarChange: (url: string) => void
  onCoverChange: (url: string) => void
  onFlushSave?: () => void
}

/**
 * 圖片裁切器 Hook (React Native 版本)
 *
 * 處理頭像和封面圖片的選擇、裁切和上傳邏輯
 * 使用 expo-image-picker 和 expo-image-manipulator
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
  const [cropperImageUri, setCropperImageUri] = useState<string>('')
  const [cropType, setCropType] = useState<'avatar' | 'cover'>('avatar')
  const [isUploading, setIsUploading] = useState(false)

  // 請求權限
  const requestPermission = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      toast({
        title: '需要權限',
        description: '請允許存取相簿以選擇圖片',
        variant: 'destructive',
      })
      return false
    }
    return true
  }, [toast])

  // 選擇並處理圖片
  const pickAndProcessImage = useCallback(
    async (type: 'avatar' | 'cover') => {
      const hasPermission = await requestPermission()
      if (!hasPermission) return

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [3, 1],
        quality: 0.8,
      })

      if (result.canceled || !result.assets?.[0]) return

      const imageUri = result.assets[0].uri
      setCropperImageUri(imageUri)
      setCropType(type)

      // 直接處理上傳，expo-image-picker 的 allowsEditing 已經提供裁切功能
      await handleUpload(imageUri, type)
    },
    [requestPermission]
  )

  // 處理頭像選擇
  const handleAvatarSelect = useCallback(() => {
    pickAndProcessImage('avatar')
  }, [pickAndProcessImage])

  // 處理封面選擇
  const handleCoverSelect = useCallback(() => {
    pickAndProcessImage('cover')
  }, [pickAndProcessImage])

  // 處理上傳
  const handleUpload = useCallback(
    async (imageUri: string, type: 'avatar' | 'cover') => {
      setIsUploading(true)
      try {
        // 處理圖片尺寸
        const targetWidth = type === 'avatar' ? 400 : 1200
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: targetWidth } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        )

        // 建立 FormData
        const formData = new FormData()
        const filename = `${type}_${Date.now()}.jpg`
        formData.append('file', {
          uri: manipResult.uri,
          type: 'image/jpeg',
          name: filename,
        } as unknown as Blob)

        // 如果有舊圖片 URL，傳送給後端做刪除處理
        const oldUrl = type === 'avatar' ? avatarUrl : coverUrl
        if (oldUrl) {
          formData.append('oldUrl', oldUrl)
        }

        const response = await biographyService.uploadImage(formData)

        if (response.success && response.data) {
          const permanentUrl = response.data.url
          if (type === 'avatar') {
            onAvatarChange(permanentUrl)
          } else {
            onCoverChange(permanentUrl)
          }
          // 立即執行儲存，避免使用者重新整理時遺失圖片
          onFlushSave?.()
          toast({
            title: '上傳成功',
            description: type === 'avatar' ? '頭像已更新' : '封面圖片已更新',
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
        setCropperImageUri('')
      }
    },
    [avatarUrl, coverUrl, onAvatarChange, onCoverChange, onFlushSave, toast]
  )

  // 裁切器關閉
  const handleCropperClose = useCallback(() => {
    setShowCropper(false)
    setCropperImageUri('')
  }, [])

  // 處理裁切完成（如果使用自定義裁切器）
  const handleCropComplete = useCallback(
    async (croppedUri: string) => {
      await handleUpload(croppedUri, cropType)
    },
    [cropType, handleUpload]
  )

  return {
    // 狀態
    showCropper,
    cropperImageUri,
    cropType,
    isUploading,
    // 方法
    handleAvatarSelect,
    handleCoverSelect,
    handleCropperClose,
    handleCropComplete,
  }
}
