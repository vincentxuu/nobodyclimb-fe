/**
 * 圖片上傳器
 *
 * 對應 apps/web/src/components/editor/ImageUploader.tsx
 */
import React, { useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { ImagePlus, X, Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native'
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated'

import { Text, IconButton, Button } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface ImageItem {
  id: string
  uri: string
  width?: number
  height?: number
}

interface ImageUploaderProps {
  images: ImageItem[]
  onChange: (images: ImageItem[]) => void
  maxImages?: number
  aspectRatio?: [number, number]
  quality?: number
  allowMultiple?: boolean
  showCamera?: boolean
  uploadHandler?: (uri: string) => Promise<string>
}

interface ImagePreviewProps {
  image: ImageItem
  onRemove: () => void
  index: number
}

function ImagePreview({ image, onRemove, index }: ImagePreviewProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(200).delay(index * 50)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
      style={styles.imagePreview}
    >
      <Image
        source={{ uri: image.uri }}
        style={styles.previewImage}
        contentFit="cover"
      />
      <Pressable style={styles.removeButton} onPress={onRemove}>
        <X size={16} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  )
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 10,
  aspectRatio,
  quality = 0.8,
  allowMultiple = true,
  showCamera = true,
  uploadHandler,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)

  // 從圖庫選擇圖片
  const handlePickFromLibrary = useCallback(async () => {
    if (images.length >= maxImages) {
      Alert.alert('已達上限', `最多只能上傳 ${maxImages} 張圖片`)
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: allowMultiple && images.length < maxImages,
      selectionLimit: maxImages - images.length,
      allowsEditing: !allowMultiple && aspectRatio !== undefined,
      aspect: aspectRatio,
      quality,
    })

    if (!result.canceled && result.assets.length > 0) {
      setIsUploading(true)
      try {
        const newImages = await Promise.all(
          result.assets.map(async (asset, index) => {
            let uri = asset.uri

            // 如果有上傳處理器，先上傳到伺服器
            if (uploadHandler) {
              uri = await uploadHandler(asset.uri)
            }

            return {
              id: `img-${Date.now()}-${index}`,
              uri,
              width: asset.width,
              height: asset.height,
            }
          })
        )

        onChange([...images, ...newImages])
      } catch (error) {
        Alert.alert('上傳失敗', '圖片上傳失敗，請稍後再試')
      } finally {
        setIsUploading(false)
      }
    }
  }, [images, onChange, maxImages, allowMultiple, aspectRatio, quality, uploadHandler])

  // 從相機拍照
  const handleTakePhoto = useCallback(async () => {
    if (images.length >= maxImages) {
      Alert.alert('已達上限', `最多只能上傳 ${maxImages} 張圖片`)
      return
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('權限不足', '請允許存取相機以拍攝照片')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: aspectRatio !== undefined,
      aspect: aspectRatio,
      quality,
    })

    if (!result.canceled && result.assets[0]) {
      setIsUploading(true)
      try {
        let uri = result.assets[0].uri

        if (uploadHandler) {
          uri = await uploadHandler(result.assets[0].uri)
        }

        const newImage: ImageItem = {
          id: `img-${Date.now()}`,
          uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
        }

        onChange([...images, newImage])
      } catch (error) {
        Alert.alert('上傳失敗', '圖片上傳失敗，請稍後再試')
      } finally {
        setIsUploading(false)
      }
    }
  }, [images, onChange, maxImages, aspectRatio, quality, uploadHandler])

  // 移除圖片
  const handleRemoveImage = useCallback(
    (imageId: string) => {
      onChange(images.filter((img) => img.id !== imageId))
    },
    [images, onChange]
  )

  // 清除所有圖片
  const handleClearAll = useCallback(() => {
    Alert.alert('清除所有圖片', '確定要移除所有已選圖片嗎？', [
      { text: '取消', style: 'cancel' },
      { text: '確定', style: 'destructive', onPress: () => onChange([]) },
    ])
  }, [onChange])

  const remainingSlots = maxImages - images.length

  return (
    <View style={styles.container}>
      {/* 已選圖片列表 */}
      {images.length > 0 && (
        <View style={styles.imagesSection}>
          <View style={styles.sectionHeader}>
            <Text variant="small" color="textMuted">
              已選圖片 ({images.length}/{maxImages})
            </Text>
            {images.length > 1 && (
              <Pressable onPress={handleClearAll}>
                <Text variant="small" color="textMuted" style={styles.clearAllText}>
                  清除全部
                </Text>
              </Pressable>
            )}
          </View>
          <View style={styles.imagesGrid}>
            {images.map((image, index) => (
              <ImagePreview
                key={image.id}
                image={image}
                onRemove={() => handleRemoveImage(image.id)}
                index={index}
              />
            ))}
          </View>
        </View>
      )}

      {/* 上傳區域 */}
      {remainingSlots > 0 && (
        <View style={styles.uploadSection}>
          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
              <Text variant="body" color="textMuted" style={styles.uploadingText}>
                上傳中...
              </Text>
            </View>
          ) : (
            <View style={styles.uploadButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.uploadButton,
                  pressed && styles.uploadButtonPressed,
                ]}
                onPress={handlePickFromLibrary}
              >
                <ImageIcon size={28} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="body" color="textMuted">
                  從圖庫選擇
                </Text>
              </Pressable>

              {showCamera && (
                <Pressable
                  style={({ pressed }) => [
                    styles.uploadButton,
                    pressed && styles.uploadButtonPressed,
                  ]}
                  onPress={handleTakePhoto}
                >
                  <Camera size={28} color={SEMANTIC_COLORS.textMuted} />
                  <Text variant="body" color="textMuted">
                    拍攝照片
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <Text variant="small" color="textMuted" style={styles.hintText}>
            {allowMultiple
              ? `還可以選擇 ${remainingSlots} 張圖片`
              : '點擊選擇圖片'}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  imagesSection: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  clearAllText: {
    textDecorationLine: 'underline',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadSection: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  uploadingContainer: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  uploadingText: {
    marginTop: SPACING.sm,
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
  hintText: {
    marginTop: SPACING.md,
  },
})
