/**
 * 上傳頁面
 *
 * 對應 apps/web/src/app/upload/page.tsx
 * 支援多張照片上傳到攝影集
 */
import React, { useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import {
  ChevronLeft,
  Upload,
  MapPin,
  CheckCircle,
  Image as ImageIcon,
  X,
  AlertCircle,
  Camera,
} from 'lucide-react-native'
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated'

import {
  Text,
  Button,
  IconButton,
  Input,
  TextArea,
  Label,
  Spinner,
  ProgressBar,
} from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS, BRAND_YELLOW } from '@nobodyclimb/constants'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PREVIEW_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.xs * 3) / 4

// 常數配置
const MAX_FILE_SIZE = 500 * 1024 // 500KB
const MAX_FILE_COUNT = 20
const MAX_IMAGE_DIMENSION = 1920

interface FileWithPreview {
  id: string
  uri: string
  originalSize?: number
  compressedSize?: number
  wasCompressed?: boolean
  width?: number
  height?: number
}

interface UploadStatus {
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface LocationInput {
  country: string
  city: string
  spot: string
}

/**
 * 壓縮圖片
 */
async function compressImage(uri: string): Promise<{
  uri: string
  width: number
  height: number
  size?: number
  wasCompressed: boolean
}> {
  // 先取得原始尺寸
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_IMAGE_DIMENSION } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  )

  return {
    uri: manipulated.uri,
    width: manipulated.width,
    height: manipulated.height,
    wasCompressed: true,
  }
}

/**
 * 照片預覽項目
 */
function PhotoPreview({
  item,
  status,
  onRemove,
  isUploading,
  index,
}: {
  item: FileWithPreview
  status?: UploadStatus
  onRemove: () => void
  isUploading: boolean
  index: number
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(200).delay(index * 30)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
      style={styles.previewItem}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.previewImage}
        contentFit="cover"
      />

      {/* 上傳狀態覆蓋層 */}
      {status && (
        <View
          style={[
            styles.statusOverlay,
            status.status === 'uploading' && styles.statusUploading,
            status.status === 'success' && styles.statusSuccess,
            status.status === 'error' && styles.statusError,
          ]}
        >
          {status.status === 'uploading' && (
            <Spinner size="sm" color="#FFFFFF" />
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
      {!isUploading && (
        <Pressable style={styles.removeButton} onPress={onRemove}>
          <X size={12} color="#FFFFFF" />
        </Pressable>
      )}

      {/* 壓縮資訊 */}
      {item.wasCompressed && item.originalSize && item.compressedSize && (
        <View style={styles.sizeInfo}>
          <Text style={styles.sizeText}>
            {Math.round(item.originalSize / 1024)}-{Math.round(item.compressedSize / 1024)}KB
          </Text>
        </View>
      )}
    </Animated.View>
  )
}

export default function UploadScreen() {
  const router = useRouter()
  const { status: authStatus, isLoading: authLoading } = useAuthStore()

  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState<LocationInput>({
    country: '',
    city: '',
    spot: '',
  })
  const [isCompressing, setIsCompressing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [compressProgress, setCompressProgress] = useState<{
    current: number
    total: number
  } | null>(null)
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([])
  const [error, setError] = useState<string | null>(null)

  // 計算成功數量
  const successCount = uploadStatuses.filter((s) => s.status === 'success').length
  const uploadingCount = uploadStatuses.filter((s) => s.status === 'uploading').length

  /**
   * 從圖庫選擇圖片
   */
  const handlePickFromLibrary = useCallback(async () => {
    if (files.length >= MAX_FILE_COUNT) {
      Alert.alert('已達上限', `最多只能上傳 ${MAX_FILE_COUNT} 張照片`)
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_FILE_COUNT - files.length,
      quality: 1,
    })

    if (result.canceled || result.assets.length === 0) return

    setIsCompressing(true)
    setCompressProgress({ current: 0, total: result.assets.length })
    setError(null)

    const newFiles: FileWithPreview[] = []
    const errors: string[] = []

    for (let i = 0; i < result.assets.length; i++) {
      const asset = result.assets[i]
      setCompressProgress({ current: i + 1, total: result.assets.length })

      try {
        const compressed = await compressImage(asset.uri)
        newFiles.push({
          id: `file-${Date.now()}-${i}`,
          uri: compressed.uri,
          width: compressed.width,
          height: compressed.height,
          wasCompressed: compressed.wasCompressed,
        })
      } catch (err) {
        errors.push(`處理第 ${i + 1} 張圖片失敗`)
      }
    }

    setIsCompressing(false)
    setCompressProgress(null)

    if (errors.length > 0) {
      setError(errors.join('\n'))
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles])
    }
  }, [files.length])

  /**
   * 從相機拍照
   */
  const handleTakePhoto = useCallback(async () => {
    if (files.length >= MAX_FILE_COUNT) {
      Alert.alert('已達上限', `最多只能上傳 ${MAX_FILE_COUNT} 張照片`)
      return
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('權限不足', '請在設定中允許存取相機')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    })

    if (result.canceled || !result.assets[0]) return

    setIsCompressing(true)
    setError(null)

    try {
      const compressed = await compressImage(result.assets[0].uri)
      setFiles((prev) => [
        ...prev,
        {
          id: `file-${Date.now()}`,
          uri: compressed.uri,
          width: compressed.width,
          height: compressed.height,
          wasCompressed: compressed.wasCompressed,
        },
      ])
    } catch (err) {
      setError('處理圖片失敗')
    }

    setIsCompressing(false)
  }, [files.length])

  /**
   * 移除單張照片
   */
  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    setUploadStatuses((prev) => prev.filter((s) => s.id !== id))
  }, [])

  /**
   * 清除所有照片
   */
  const handleClearAll = useCallback(() => {
    Alert.alert('清除所有照片', '確定要移除所有已選照片嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '確定',
        style: 'destructive',
        onPress: () => {
          setFiles([])
          setUploadStatuses([])
          setError(null)
        },
      },
    ])
  }, [])

  /**
   * 重設表單
   */
  const handleReset = useCallback(() => {
    setFiles([])
    setCaption('')
    setLocation({ country: '', city: '', spot: '' })
    setError(null)
    setUploadStatuses([])
  }, [])

  /**
   * 提交上傳
   */
  const handleSubmit = useCallback(async () => {
    if (files.length === 0) {
      setError('請選擇要上傳的圖片')
      return
    }

    setIsUploading(true)
    setError(null)

    // 初始化所有狀態為上傳中
    const initialStatuses: UploadStatus[] = files.map((f) => ({
      id: f.id,
      status: 'uploading',
    }))
    setUploadStatuses(initialStatuses)

    // 並行上傳
    const uploadPromises = files.map(async (fileItem) => {
      try {
        // 建立 FormData 上傳圖片
        const formData = new FormData()
        formData.append('image', {
          uri: fileItem.uri,
          type: 'image/jpeg',
          name: `photo-${fileItem.id}.jpg`,
        } as unknown as Blob)

        const uploadResponse = await api.post<{ success: boolean; data?: { url: string } }>(
          '/media/upload?type=gallery',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )

        if (!uploadResponse.data.success || !uploadResponse.data.data?.url) {
          throw new Error('圖片上傳失敗')
        }

        // 建立照片記錄
        const photoResponse = await api.post('/galleries/photos', {
          image_url: uploadResponse.data.data.url,
          caption: caption || undefined,
          location_country: location.country || undefined,
          location_city: location.city || undefined,
          location_spot: location.spot || undefined,
        })

        if (!photoResponse.data.success) {
          throw new Error('照片資料儲存失敗')
        }

        setUploadStatuses((prev) =>
          prev.map((s) =>
            s.id === fileItem.id ? { ...s, status: 'success' } : s
          )
        )
        return { status: 'success' as const }
      } catch (err) {
        setUploadStatuses((prev) =>
          prev.map((s) =>
            s.id === fileItem.id
              ? {
                  ...s,
                  status: 'error',
                  error: err instanceof Error ? err.message : '上傳失敗',
                }
              : s
          )
        )
        return { status: 'error' as const }
      }
    })

    const results = await Promise.all(uploadPromises)
    const successfulUploads = results.filter((r) => r.status === 'success').length

    setIsUploading(false)

    if (successfulUploads > 0 && successfulUploads < files.length) {
      setError(
        `${successfulUploads} 張照片上傳成功，${files.length - successfulUploads} 張失敗`
      )
    } else if (successfulUploads === 0 && files.length > 0) {
      setError('所有照片上傳失敗，請稍後再試')
    }
  }, [files, caption, location])

  // 載入中
  if (authLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Spinner size="lg" label="載入中..." />
      </SafeAreaView>
    )
  }

  // 未登入
  if (authStatus !== 'signIn') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.authPrompt}>
          <ImageIcon size={64} color={SEMANTIC_COLORS.textMuted} />
          <Text variant="h4" fontWeight="600" style={styles.authTitle}>
            請先登入
          </Text>
          <Text color="textSubtle" style={styles.authSubtitle}>
            登入後即可上傳照片到攝影集
          </Text>
          <Button onPress={() => router.push('/auth/login')}>前往登入</Button>
        </View>
      </SafeAreaView>
    )
  }

  // 上傳成功
  const allSuccess = successCount > 0 && successCount === files.length && !isUploading
  if (allSuccess) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.successContainer}
        >
          <CheckCircle size={64} color="#22C55E" />
          <Text variant="h4" fontWeight="600" style={styles.successTitle}>
            上傳成功！
          </Text>
          <Text color="textSubtle" style={styles.successSubtitle}>
            {successCount} 張照片已成功上傳到攝影集
          </Text>
          <View style={styles.successActions}>
            <Button variant="outline" onPress={handleReset}>
              繼續上傳
            </Button>
            <Button onPress={() => router.push('/gallery')}>前往攝影集</Button>
          </View>
        </Animated.View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 標題列 */}
      <View style={styles.header}>
        <IconButton
          icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
          onPress={() => router.back()}
          variant="ghost"
        />
        <Text variant="h4" fontWeight="600">
          上傳照片
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 圖片選擇區 */}
        <View style={styles.uploadSection}>
          <Text variant="small" color="textSubtle" style={styles.hintText}>
            支援 JPG、PNG、WebP，超過 500KB 自動壓縮，最多 {MAX_FILE_COUNT} 張
          </Text>

          <View style={styles.uploadButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.uploadButton,
                pressed && styles.uploadButtonPressed,
              ]}
              onPress={handlePickFromLibrary}
              disabled={isCompressing || isUploading}
            >
              <Upload size={28} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="small" color="textMuted">
                從圖庫選擇
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.uploadButton,
                pressed && styles.uploadButtonPressed,
              ]}
              onPress={handleTakePhoto}
              disabled={isCompressing || isUploading}
            >
              <Camera size={28} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="small" color="textMuted">
                拍攝照片
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 壓縮進度 */}
        {isCompressing && compressProgress && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Spinner size="sm" />
              <Text variant="small" color="textSubtle">
                正在處理圖片... ({compressProgress.current}/{compressProgress.total})
              </Text>
            </View>
            <ProgressBar
              progress={(compressProgress.current / compressProgress.total) * 100}
              color={BRAND_YELLOW[100]}
            />
          </View>
        )}

        {/* 已選照片預覽 */}
        {files.length > 0 && (
          <View style={styles.previewSection}>
            <View style={styles.previewHeader}>
              <Label>已選擇 {files.length} 張照片</Label>
              {!isUploading && !isCompressing && (
                <Pressable onPress={handleClearAll}>
                  <Text variant="small" color="textMuted" style={styles.clearText}>
                    清除全部
                  </Text>
                </Pressable>
              )}
            </View>
            <View style={styles.previewGrid}>
              {files.map((item, index) => (
                <PhotoPreview
                  key={item.id}
                  item={item}
                  status={uploadStatuses.find((s) => s.id === item.id)}
                  onRemove={() => handleRemoveFile(item.id)}
                  isUploading={isUploading}
                  index={index}
                />
              ))}
            </View>
          </View>
        )}

        {/* 上傳進度 */}
        {isUploading && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Spinner size="sm" />
              <Text variant="small" color="textSubtle">
                正在上傳 {uploadingCount} 張照片...（已完成 {successCount}/{files.length}）
              </Text>
            </View>
            <ProgressBar
              progress={(successCount / files.length) * 100}
              color="#3B82F6"
            />
          </View>
        )}

        {/* 說明輸入 */}
        <View style={styles.fieldSection}>
          <Label style={styles.fieldLabel}>說明（選填，套用至所有照片）</Label>
          <TextArea
            value={caption}
            onChangeText={setCaption}
            placeholder="為照片添加說明..."
            minRows={3}
            disabled={isUploading || isCompressing}
          />
        </View>

        {/* 地點輸入 */}
        <View style={styles.fieldSection}>
          <View style={styles.locationLabel}>
            <MapPin size={14} color={SEMANTIC_COLORS.textMain} />
            <Label>拍攝地點（選填，套用至所有照片）</Label>
          </View>
          <View style={styles.locationInputs}>
            <Input
              placeholder="國家"
              value={location.country}
              onChangeText={(text) =>
                setLocation((prev) => ({ ...prev, country: text }))
              }
              disabled={isUploading || isCompressing}
              containerStyle={styles.locationInput}
            />
            <Input
              placeholder="城市"
              value={location.city}
              onChangeText={(text) =>
                setLocation((prev) => ({ ...prev, city: text }))
              }
              disabled={isUploading || isCompressing}
              containerStyle={styles.locationInput}
            />
            <Input
              placeholder="地點"
              value={location.spot}
              onChangeText={(text) =>
                setLocation((prev) => ({ ...prev, spot: text }))
              }
              disabled={isUploading || isCompressing}
              containerStyle={styles.locationInput}
            />
          </View>
        </View>

        {/* 錯誤訊息 */}
        {error && (
          <View style={styles.errorSection}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* 底部提交按鈕 */}
      <View style={styles.footer}>
        <Button
          fullWidth
          size="lg"
          onPress={handleSubmit}
          disabled={files.length === 0 || isUploading || isCompressing}
          loading={isUploading}
        >
          {isCompressing
            ? '處理中...'
            : isUploading
              ? '上傳中...'
              : files.length > 0
                ? `上傳 ${files.length} 張照片`
                : '上傳照片'}
        </Button>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  uploadSection: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  hintText: {
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  uploadButton: {
    width: 120,
    height: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  uploadButtonPressed: {
    backgroundColor: '#E0E0E0',
  },
  progressSection: {
    backgroundColor: '#FFF7E6',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  previewSection: {
    marginTop: SPACING.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  clearText: {
    textDecorationLine: 'underline',
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  previewItem: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusUploading: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  statusSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.5)',
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.5)',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 2,
  },
  sizeText: {
    color: '#FFFFFF',
    fontSize: 9,
    textAlign: 'center',
  },
  fieldSection: {
    marginTop: SPACING.lg,
  },
  fieldLabel: {
    marginBottom: SPACING.sm,
  },
  locationLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  locationInputs: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  locationInput: {
    flex: 1,
  },
  errorSection: {
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  authPrompt: {
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  authTitle: {
    marginTop: SPACING.md,
  },
  authSubtitle: {
    marginBottom: SPACING.md,
  },
  successContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  successTitle: {
    marginTop: SPACING.md,
  },
  successSubtitle: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  successActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
})
