import React, { useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { Text } from '../../ui/Text'
import { ProfileImage, ImageLayout } from '../types'
import SortableImageGrid from './SortableImageGrid'
import ImageGalleryDisplay from './ImageGalleryDisplay'
import LayoutSelector from './LayoutSelector'
import ImageCropDialog from './ImageCropDialog'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'

interface ProfileImageSectionProps {
  images: ProfileImage[]
  isEditing: boolean
  onImagesChange: (images: ProfileImage[]) => void
  onUpload: (uri: string) => Promise<void>
}

export default function ProfileImageSection({
  images,
  isEditing,
  onImagesChange,
  onUpload,
}: ProfileImageSectionProps) {
  const [layout, setLayout] = useState<ImageLayout>('double')
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<ProfileImage | null>(null)

  const handleReorder = (newImages: ProfileImage[]) => {
    // Update order values
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      order: index,
    }))
    onImagesChange(reorderedImages)
  }

  const handleDelete = (image: ProfileImage) => {
    Alert.alert(
      '確認刪除',
      '確定要刪除這張圖片嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: () => {
            const newImages = images
              .filter((img) => img.id !== image.id)
              .map((img, index) => ({ ...img, order: index }))
            onImagesChange(newImages)
          },
        },
      ]
    )
  }

  const handleUpload = async (uri: string) => {
    // Show crop dialog or upload directly
    setCropImage(uri)
  }

  const handleCropConfirm = async (croppedUri: string) => {
    setCropImage(null)
    try {
      await onUpload(croppedUri)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleImagePress = (image: ProfileImage) => {
    setSelectedImage(image)
  }

  return (
    <View style={styles.container}>
      <Text variant="bodyBold" style={{ color: SEMANTIC_COLORS.textMain, marginBottom: 8 }}>
        照片集
      </Text>
      <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted, marginBottom: 16 }}>
        上傳你的攀岩照片（最多 5 張）
      </Text>

      {!isEditing && images.length > 0 && (
        <LayoutSelector value={layout} onChange={setLayout} />
      )}

      {isEditing ? (
        <SortableImageGrid
          images={images}
          onReorder={handleReorder}
          onDelete={handleDelete}
          onUpload={handleUpload}
          onImagePress={handleImagePress}
        />
      ) : (
        <ImageGalleryDisplay
          images={images}
          layout={layout}
          onImagePress={handleImagePress}
        />
      )}

      <ImageCropDialog
        visible={cropImage !== null}
        imageUri={cropImage}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropImage(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
})
