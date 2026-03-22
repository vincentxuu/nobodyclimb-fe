/**
 * 媒體分享表單（照片/YouTube/Instagram）
 *
 * 使用 BottomSheet 的媒體分享表單，根據 mediaType 顯示不同欄位
 */
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator } from 'react-native'
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import { X, Camera, Youtube, Instagram } from 'lucide-react-native'

import { Text, IconButton } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// ── Types ──────────────────────────────────────────────

export type MediaType = 'photo' | 'youtube' | 'instagram'

interface RouteMediaFormProps {
  routeId: string
  routeName: string
  mediaType: MediaType
  onSubmit: (data: {
    content?: string
    photos?: string[]
    youtube_url?: string
    instagram_url?: string
  }) => Promise<void>
  isLoading?: boolean
}

export interface RouteMediaFormRef {
  open: () => void
  close: () => void
}

// ── Config ─────────────────────────────────────────────

const MEDIA_CONFIG = {
  photo: {
    title: '分享照片',
    icon: Camera,
    iconColor: SEMANTIC_COLORS.textMain,
    placeholder: '貼上照片 URL...',
    submitLabel: '分享照片',
  },
  youtube: {
    title: '分享影片',
    icon: Youtube,
    iconColor: '#FF0000',
    placeholder: '貼上 YouTube 影片連結...',
    submitLabel: '分享影片',
  },
  instagram: {
    title: '分享貼文',
    icon: Instagram,
    iconColor: '#E4405F',
    placeholder: '貼上 Instagram 貼文連結...',
    submitLabel: '分享貼文',
  },
} as const

// ── Component ──────────────────────────────────────────

export const RouteMediaForm = forwardRef<RouteMediaFormRef, RouteMediaFormProps>(
  ({ routeId, routeName, mediaType, onSubmit, isLoading }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null)
    const [url, setUrl] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')

    const snapPoints = useMemo(() => ['60%'], [])
    const config = MEDIA_CONFIG[mediaType]
    const IconComponent = config.icon

    useImperativeHandle(ref, () => ({
      open: () => {
        bottomSheetRef.current?.expand()
      },
      close: () => {
        bottomSheetRef.current?.close()
      },
    }))

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    )

    const handleClose = useCallback(() => {
      bottomSheetRef.current?.close()
    }, [])

    const validate = useCallback(
      (value: string): boolean => {
        if (!value.trim()) {
          setError('請輸入連結')
          return false
        }

        if (mediaType === 'youtube') {
          if (!value.includes('youtube.com') && !value.includes('youtu.be')) {
            setError('請輸入有效的 YouTube 連結')
            return false
          }
        }

        if (mediaType === 'instagram') {
          if (!value.includes('instagram.com')) {
            setError('請輸入有效的 Instagram 連結')
            return false
          }
        }

        setError('')
        return true
      },
      [mediaType]
    )

    const handleSubmit = useCallback(async () => {
      if (isLoading) return
      if (!validate(url)) return

      const trimmedUrl = url.trim()
      const trimmedDescription = description.trim() || undefined

      if (mediaType === 'photo') {
        // 支援多行 URL，每行一張照片
        const photos = trimmedUrl
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
        await onSubmit({ content: trimmedDescription, photos })
      } else if (mediaType === 'youtube') {
        await onSubmit({ content: trimmedDescription, youtube_url: trimmedUrl })
      } else {
        await onSubmit({ content: trimmedDescription, instagram_url: trimmedUrl })
      }

      // 清空表單並關閉
      setUrl('')
      setDescription('')
      setError('')
      bottomSheetRef.current?.close()
    }, [url, description, isLoading, mediaType, onSubmit, validate])

    const isSubmitDisabled = !url.trim() || isLoading

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.background}
        keyboardBehavior="interactive"
      >
        <BottomSheetScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 標題列 */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerTitleRow}>
                <IconComponent size={20} color={config.iconColor} />
                <Text variant="h4" fontWeight="600">
                  {config.title}
                </Text>
              </View>
              <Text variant="caption" color="textMuted">
                {routeName}
              </Text>
            </View>
            <IconButton
              icon={<X size={20} color={SEMANTIC_COLORS.textMain} />}
              onPress={handleClose}
              variant="ghost"
              size="sm"
            />
          </View>

          {/* 表單 */}
          <View style={styles.form}>
            {/* URL 輸入 */}
            <View style={styles.field}>
              <Text variant="caption" color="textSubtle" style={styles.fieldLabel}>
                {mediaType === 'photo' ? '照片 URL（每行一張）' : '連結'}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  mediaType === 'photo' && styles.multilineInput,
                  error ? styles.inputError : null,
                ]}
                value={url}
                onChangeText={(text) => {
                  setUrl(text)
                  if (error) setError('')
                }}
                placeholder={config.placeholder}
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                multiline={mediaType === 'photo'}
                textAlignVertical={mediaType === 'photo' ? 'top' : 'center'}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {error ? (
                <Text variant="caption" style={styles.errorText}>
                  {error}
                </Text>
              ) : null}
            </View>

            {/* 描述（選填） */}
            <View style={styles.field}>
              <Text variant="caption" color="textSubtle" style={styles.fieldLabel}>
                描述（選填）
              </Text>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="描述（選填）..."
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
            </View>

            {/* 提交按鈕 */}
            <Pressable
              style={[
                styles.submitButton,
                isSubmitDisabled && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  variant="body"
                  fontWeight="600"
                  style={styles.submitButtonText}
                >
                  {config.submitLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    )
  }
)

RouteMediaForm.displayName = 'RouteMediaForm'

// ── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  background: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  indicator: {
    backgroundColor: '#D4D4D4',
    width: 36,
    height: 4,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },

  // Form
  form: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  field: {
    gap: SPACING.xs,
  },
  fieldLabel: {
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    color: SEMANTIC_COLORS.textMain,
  },
  multilineInput: {
    height: 80,
  },
  descriptionInput: {
    height: 80,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    marginLeft: 2,
  },

  // Submit
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitButtonText: {
    color: '#FFFFFF',
  },
})
