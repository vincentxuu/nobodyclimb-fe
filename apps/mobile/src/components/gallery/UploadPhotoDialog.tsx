/**
 * UploadPhotoDialog 組件
 *
 * 上傳照片對話框，對應 apps/web/src/components/gallery/upload-photo-dialog.tsx
 */
import React, { useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { X, Upload, MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Label } from '@/components/ui/Label'
import { IconButton } from '@/components/ui/IconButton'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Dialog } from '@/components/ui/Dialog'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, WB_COLORS } from '@nobodyclimb/constants'
import type { GalleryPhoto } from '@nobodyclimb/types'

// 檔案驗證常數
const MAX_FILE_SIZE = 500 * 1024 // 500KB
const MAX_FILE_COUNT = 20
const MAX_IMAGE_DIMENSION = 1920

interface FileWithPreview {
  uri: string
  id: string
  originalSize?: number
  finalSize?: number
  wasCompressed?: boolean
}

interface UploadStatus {
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export interface UploadPhotoDialogProps {
  /** 是否顯示 */
  isOpen: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 上傳成功回調 */
  onSuccess: (photo: GalleryPhoto) => void
  /** 上傳圖片 API */
  onUploadImage?: (uri: string) => Promise<{ success: boolean; data?: { url: string } }>
  /** 建立照片記錄 API */
  onUploadPhoto?: (data: {
    image_url: string
    caption?: string
    location_country?: string
    location_city?: string
    location_spot?: string
  }) => Promise<{ success: boolean; data?: GalleryPhoto }>
}

/**
 * 壓縮圖片
 */
async function compressImage(uri: string): Promise<{ uri: string; wasCompressed: boolean }> {
  try {
    // 取得圖片資訊
    const info = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    )

    // 壓縮圖片
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_IMAGE_DIMENSION } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    )

    return { uri: result.uri, wasCompressed: true }
  } catch (error) {
    console.error('Image compression failed:', error)
    return { uri, wasCompressed: false }
  }
}

/**
 * 上傳照片對話框
 *
 * @example
 * ```tsx
 * <UploadPhotoDialog
 *   isOpen={uploadDialogOpen}
 *   onClose={() => setUploadDialogOpen(false)}
 *   onSuccess={handleUploadSuccess}
 *   onUploadImage={galleryService.uploadImage}
 *   onUploadPhoto={galleryService.uploadPhoto}
 * />
 * ```
 */
export function UploadPhotoDialog({
  isOpen,
  onClose,
  onSuccess,
  onUploadImage,
  onUploadPhoto,
}: UploadPhotoDialogProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [caption, setCaption] = useState('')
  const [locationCountry, setLocationCountry] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [locationSpot, setLocationSpot] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressProgress, setCompressProgress] = useState<{ current: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([])

  const successCount = uploadStatuses.filter((s) => s.status === 'success').length
  const uploadingCount = uploadStatuses.filter((s) => s.status === 'uploading').length

  // 選擇圖片
  const handlePickImages = useCallback(async () => {
    try {
      // 檢查權限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('權限不足', '需要相簿存取權限才能選擇照片')
        return
      }

      // 選擇圖片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: MAX_FILE_COUNT - files.length,
      })

      if (result.canceled || !result.assets.length) return

      // 檢查總數量
      if (files.length + result.assets.length > MAX_FILE_COUNT) {
        setError(`最多只能上傳 ${MAX_FILE_COUNT} 張照片`)
        return
      }

      setError(null)
      setIsCompressing(true)
      setCompressProgress({ current: 0, total: result.assets.length })

      const newFiles: FileWithPreview[] = []

      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i]
        setCompressProgress({ current: i + 1, total: result.assets.length })

        const { uri, wasCompressed } = await compressImage(asset.uri)
        const id = `${Date.now()}-${i}`

        newFiles.push({
          uri,
          id,
          originalSize: asset.fileSize,
          wasCompressed,
        })
      }

      setIsCompressing(false)
      setCompressProgress(null)
      setFiles((prev) => [...prev, ...newFiles])
    } catch (err) {
      console.error('Failed to pick images:', err)
      setError('選擇圖片失敗，請重試')
      setIsCompressing(false)
      setCompressProgress(null)
    }
  }, [files.length])

  // 移除檔案
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  // 清除所有
  const clearAll = useCallback(() => {
    setFiles([])
    setUploadStatuses([])
  }, [])

  // 重設表單
  const resetForm = useCallback(() => {
    setFiles([])
    setCaption('')
    setLocationCountry('')
    setLocationCity('')
    setLocationSpot('')
    setError(null)
    setUploadStatuses([])
  }, [])

  // 提交上傳
  const handleSubmit = useCallback(async () => {
    if (files.length === 0) {
      setError('請選擇要上傳的圖片')
      return
    }

    if (!onUploadImage || !onUploadPhoto) {
      setError('上傳功能未設定')
      return
    }

    setIsUploading(true)
    setError(null)

    // 初始化上傳狀態
    const initialStatuses: UploadStatus[] = files.map((f) => ({
      id: f.id,
      status: 'uploading',
    }))
    setUploadStatuses(initialStatuses)

    // 並行上傳
    const uploadPromises = files.map(async (fileItem) => {
      try {
        // Step 1: 上傳圖片到 storage
        const uploadResult = await onUploadImage(fileItem.uri)
        if (!uploadResult.success || !uploadResult.data?.url) {
          throw new Error('圖片上傳失敗')
        }

        // Step 2: 建立照片記錄
        const photoResult = await onUploadPhoto({
          image_url: uploadResult.data.url,
          caption: caption || undefined,
          location_country: locationCountry || undefined,
          location_city: locationCity || undefined,
          location_spot: locationSpot || undefined,
        })

        if (!photoResult.success || !photoResult.data) {
          throw new Error('照片資料儲存失敗')
        }

        // 更新狀態為成功
        setUploadStatuses((prev) =>
          prev.map((s) =>
            s.id === fileItem.id ? { ...s, status: 'success' } : s
          )
        )

        // 回調成功
        onSuccess(photoResult.data)

        return { status: 'success' as const, photo: photoResult.data }
      } catch (err) {
        // 更新狀態為錯誤
        setUploadStatuses((prev) =>
          prev.map((s) =>
            s.id === fileItem.id
              ? { ...s, status: 'error', error: err instanceof Error ? err.message : '上傳失敗' }
              : s
          )
        )
        return { status: 'error' as const }
      }
    })

    const results = await Promise.all(uploadPromises)
    const successfulUploads = results.filter((r) => r.status === 'success').length

    setIsUploading(false)

    // 如果全部成功，關閉對話框
    if (successfulUploads === files.length) {
      resetForm()
      onClose()
    } else if (successfulUploads > 0) {
      setError(`${successfulUploads} 張照片上傳成功，${files.length - successfulUploads} 張失敗`)
    } else {
      setError('所有照片上傳失敗，請稍後再試')
    }
  }, [files, caption, locationCountry, locationCity, locationSpot, onUploadImage, onUploadPhoto, onSuccess, resetForm, onClose])

  // 關閉
  const handleClose = useCallback(() => {
    if (!isUploading && !isCompressing) {
      resetForm()
      onClose()
    }
  }, [isUploading, isCompressing, resetForm, onClose])

  if (!isOpen) return null

  return (
    <Dialog
      visible={isOpen}
      onClose={handleClose}
      title="上傳照片"
      dismissible={!isUploading && !isCompressing}
      style={styles.dialog}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 上傳區域 */}
          <Pressable
            onPress={handlePickImages}
            disabled={isUploading || isCompressing}
            style={[
              styles.uploadArea,
              files.length > 0 && styles.uploadAreaWithFiles,
            ]}
          >
            <Upload size={32} color={WB_COLORS[50]} />
            <Text variant="body" color="textSubtle" style={styles.uploadText}>
              點擊選擇照片
            </Text>
            <Text variant="caption" color="textMuted">
              支援 JPG、PNG（自動壓縮，最多 {MAX_FILE_COUNT} 張）
            </Text>
          </Pressable>

          {/* 壓縮進度 */}
          {isCompressing && compressProgress && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Loader2 size={16} color="#D97706" />
                <Text variant="body" style={styles.progressText}>
                  正在處理圖片... ({compressProgress.current}/{compressProgress.total})
                </Text>
              </View>
              <ProgressBar
                progress={(compressProgress.current / compressProgress.total) * 100}
                color="#D97706"
                backgroundColor="#FEF3C7"
              />
            </Animated.View>
          )}

          {/* 已選擇的檔案 */}
          {files.length > 0 && (
            <View style={styles.filesSection}>
              <View style={styles.filesHeader}>
                <Text variant="body" fontWeight="500">
                  已選擇 {files.length} 張照片
                  {files.some((f) => f.wasCompressed) && (
                    <Text variant="caption" style={styles.compressedText}>
                      {' '}(已壓縮 {files.filter((f) => f.wasCompressed).length} 張)
                    </Text>
                  )}
                </Text>
                {!isUploading && !isCompressing && (
                  <Pressable onPress={clearAll}>
                    <Text variant="caption" style={styles.clearAllText}>清除全部</Text>
                  </Pressable>
                )}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filesPreview}
                contentContainerStyle={styles.filesPreviewContent}
              >
                {files.map((fileItem) => {
                  const status = uploadStatuses.find((s) => s.id === fileItem.id)
                  return (
                    <View key={fileItem.id} style={styles.fileItem}>
                      <Image
                        source={{ uri: fileItem.uri }}
                        style={styles.fileImage}
                        contentFit="cover"
                      />
                      {/* 上傳狀態覆蓋層 */}
                      {status && (
                        <View style={[
                          styles.fileStatusOverlay,
                          status.status === 'uploading' && styles.uploadingOverlay,
                          status.status === 'success' && styles.successOverlay,
                          status.status === 'error' && styles.errorOverlay,
                        ]}>
                          {status.status === 'uploading' && (
                            <Loader2 size={20} color="#FFFFFF" />
                          )}
                          {status.status === 'success' && (
                            <CheckCircle size={20} color="#FFFFFF" />
                          )}
                          {status.status === 'error' && (
                            <AlertCircle size={20} color="#FFFFFF" />
                          )}
                        </View>
                      )}
                      {/* 移除按鈕 */}
                      {!isUploading && !isCompressing && (
                        <Pressable
                          onPress={() => removeFile(fileItem.id)}
                          style={styles.removeButton}
                        >
                          <X size={12} color="#FFFFFF" />
                        </Pressable>
                      )}
                    </View>
                  )
                })}
              </ScrollView>
            </View>
          )}

          {/* 上傳進度 */}
          {isUploading && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.uploadProgressContainer}>
              <View style={styles.progressHeader}>
                <Loader2 size={16} color="#2563EB" />
                <Text variant="body" style={styles.uploadProgressText}>
                  正在上傳 {uploadingCount} 張照片...（已完成 {successCount}/{files.length}）
                </Text>
              </View>
              <ProgressBar
                progress={(successCount / files.length) * 100}
                color="#2563EB"
                backgroundColor="#DBEAFE"
              />
            </Animated.View>
          )}

          {/* 說明 */}
          <View style={styles.formField}>
            <Label style={styles.label}>說明（選填，套用至所有照片）</Label>
            <TextArea
              value={caption}
              onChangeText={setCaption}
              placeholder="為照片添加說明..."
              numberOfLines={2}
              editable={!isUploading}
            />
          </View>

          {/* 拍攝地點 */}
          <View style={styles.formField}>
            <View style={styles.labelRow}>
              <MapPin size={14} color={SEMANTIC_COLORS.textMain} />
              <Label style={styles.label}>拍攝地點（選填，套用至所有照片）</Label>
            </View>
            <View style={styles.locationInputs}>
              <Input
                placeholder="國家"
                value={locationCountry}
                onChangeText={setLocationCountry}
                editable={!isUploading}
                containerStyle={styles.locationInput}
              />
              <Input
                placeholder="城市"
                value={locationCity}
                onChangeText={setLocationCity}
                editable={!isUploading}
                containerStyle={styles.locationInput}
              />
              <Input
                placeholder="地點"
                value={locationSpot}
                onChangeText={setLocationSpot}
                editable={!isUploading}
                containerStyle={styles.locationInput}
              />
            </View>
          </View>

          {/* 錯誤訊息 */}
          {error && (
            <View style={styles.errorContainer}>
              <Text variant="body" style={styles.errorText}>
                {error}
              </Text>
            </View>
          )}

          {/* 提交按鈕 */}
          <Button
            variant="primary"
            onPress={handleSubmit}
            disabled={files.length === 0 || isUploading || isCompressing}
            loading={isUploading || isCompressing}
            style={styles.submitButton}
          >
            {isCompressing
              ? '處理中...'
              : isUploading
              ? '上傳中...'
              : files.length > 0
              ? `上傳 ${files.length} 張照片`
              : '上傳照片'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Dialog>
  )
}

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 450,
    width: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    maxHeight: 550,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: WB_COLORS[30],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    backgroundColor: WB_COLORS[5],
  },
  uploadAreaWithFiles: {
    borderColor: WB_COLORS[20],
    backgroundColor: WB_COLORS[5],
  },
  uploadText: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.xxs,
  },
  progressContainer: {
    backgroundColor: '#FFFBEB',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  progressText: {
    color: '#D97706',
  },
  filesSection: {
    marginBottom: SPACING.md,
  },
  filesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  compressedText: {
    color: '#D97706',
  },
  clearAllText: {
    color: '#DC2626',
  },
  filesPreview: {
    marginHorizontal: -SPACING.md,
  },
  filesPreviewContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  fileItem: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  fileImage: {
    width: '100%',
    height: '100%',
  },
  fileStatusOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  successOverlay: {
    backgroundColor: 'rgba(34, 197, 94, 0.5)',
  },
  errorOverlay: {
    backgroundColor: 'rgba(239, 68, 68, 0.5)',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadProgressContainer: {
    backgroundColor: '#EFF6FF',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  uploadProgressText: {
    color: '#2563EB',
  },
  formField: {
    marginBottom: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  label: {
    marginBottom: SPACING.xs,
  },
  locationInputs: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  locationInput: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#DC2626',
  },
  submitButton: {
    marginTop: SPACING.xs,
  },
})

export default UploadPhotoDialog
