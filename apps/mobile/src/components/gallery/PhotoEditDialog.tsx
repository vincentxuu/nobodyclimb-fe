/**
 * PhotoEditDialog 組件
 *
 * 照片編輯對話框，對應 apps/web/src/components/gallery/photo-edit-dialog.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Image } from 'expo-image'
import { X, MapPin, Loader2 } from 'lucide-react-native'
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated'

import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Label } from '@/components/ui/Label'
import { IconButton } from '@/components/ui/IconButton'
import { Dialog } from '@/components/ui/Dialog'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, WB_COLORS } from '@nobodyclimb/constants'
import type { GalleryPhoto } from '@nobodyclimb/types'

export interface PhotoEditDialogProps {
  /** 是否顯示 */
  isOpen: boolean
  /** 照片資料 */
  photo: GalleryPhoto | null
  /** 關閉回調 */
  onClose: () => void
  /** 編輯成功回調 */
  onSuccess: (photo: GalleryPhoto) => void
  /** 更新照片 API */
  onUpdatePhoto?: (id: string, data: {
    caption?: string
    location_country?: string
    location_city?: string
    location_spot?: string
  }) => Promise<{ success: boolean; data?: GalleryPhoto }>
}

/**
 * 照片編輯對話框
 *
 * @example
 * ```tsx
 * <PhotoEditDialog
 *   isOpen={editDialogOpen}
 *   photo={selectedPhoto}
 *   onClose={() => setEditDialogOpen(false)}
 *   onSuccess={handleEditSuccess}
 *   onUpdatePhoto={galleryService.updatePhoto}
 * />
 * ```
 */
export function PhotoEditDialog({
  isOpen,
  photo,
  onClose,
  onSuccess,
  onUpdatePhoto,
}: PhotoEditDialogProps) {
  const [caption, setCaption] = useState('')
  const [locationCountry, setLocationCountry] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [locationSpot, setLocationSpot] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 當 photo 變更時，更新表單資料
  useEffect(() => {
    if (photo) {
      setCaption(photo.caption || '')
      setLocationCountry(photo.location_country || '')
      setLocationCity(photo.location_city || '')
      setLocationSpot(photo.location_spot || '')
      setError(null)
    }
  }, [photo])

  const handleSubmit = useCallback(async () => {
    if (!photo || !onUpdatePhoto) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await onUpdatePhoto(photo.id, {
        caption,
        location_country: locationCountry,
        location_city: locationCity,
        location_spot: locationSpot,
      })

      if (response.success && response.data) {
        onSuccess(response.data)
        onClose()
      } else {
        setError('更新失敗，請稍後再試')
      }
    } catch (err) {
      console.error('Failed to update photo:', err)
      setError('更新失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }, [photo, caption, locationCountry, locationCity, locationSpot, onUpdatePhoto, onSuccess, onClose])

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose()
    }
  }, [isSubmitting, onClose])

  if (!isOpen || !photo) return null

  return (
    <Dialog
      visible={isOpen}
      onClose={handleClose}
      title="編輯照片資訊"
      dismissible={!isSubmitting}
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
          {/* 圖片預覽 */}
          <View style={styles.imagePreview}>
            <Image
              source={{ uri: photo.image_url }}
              style={styles.previewImage}
              contentFit="contain"
            />
          </View>

          {/* 說明 */}
          <View style={styles.formField}>
            <Label style={styles.label}>說明</Label>
            <TextArea
              value={caption}
              onChangeText={setCaption}
              placeholder="為照片添加說明..."
              numberOfLines={3}
              editable={!isSubmitting}
            />
          </View>

          {/* 拍攝地點 */}
          <View style={styles.formField}>
            <View style={styles.labelRow}>
              <MapPin size={14} color={SEMANTIC_COLORS.textMain} />
              <Label style={styles.label}>拍攝地點</Label>
            </View>
            <View style={styles.locationInputs}>
              <Input
                placeholder="國家"
                value={locationCountry}
                onChangeText={setLocationCountry}
                editable={!isSubmitting}
                containerStyle={styles.locationInput}
              />
              <Input
                placeholder="城市"
                value={locationCity}
                onChangeText={setLocationCity}
                editable={!isSubmitting}
                containerStyle={styles.locationInput}
              />
              <Input
                placeholder="地點"
                value={locationSpot}
                onChangeText={setLocationSpot}
                editable={!isSubmitting}
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

          {/* 按鈕 */}
          <View style={styles.buttonRow}>
            <Button
              variant="secondary"
              onPress={handleClose}
              disabled={isSubmitting}
              style={styles.button}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onPress={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              style={styles.button}
            >
              {isSubmitting ? '儲存中...' : '儲存變更'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Dialog>
  )
}

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 400,
    width: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    maxHeight: 500,
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: WB_COLORS[10],
    marginBottom: SPACING.md,
  },
  previewImage: {
    width: '100%',
    height: '100%',
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
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  button: {
    flex: 1,
  },
})

export default PhotoEditDialog
