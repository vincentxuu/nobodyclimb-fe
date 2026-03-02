import React from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { ProfileImage, ImageLayout } from '../types'
import ImagePreviewCard from './ImagePreviewCard'
import { COLORS } from '@nobodyclimb/constants'

interface ImageGalleryDisplayProps {
  images: ProfileImage[]
  layout: ImageLayout
  onImagePress?: (image: ProfileImage) => void
  onImageDelete?: (image: ProfileImage) => void
  isEditing?: boolean
}

export default function ImageGalleryDisplay({
  images,
  layout,
  onImagePress,
  onImageDelete,
  isEditing = false,
}: ImageGalleryDisplayProps) {
  const { width: screenWidth } = useWindowDimensions()
  const padding = 32
  const gap = 8

  // 根據 layout 計算列數和比例
  const getLayoutConfig = () => {
    switch (layout) {
      case 'single':
        return { columns: 1, aspectRatio: 16 / 9 }
      case 'double':
        return { columns: 2, aspectRatio: 4 / 3 }
      case 'grid':
        return { columns: 3, aspectRatio: 1 }
      default:
        return { columns: 2, aspectRatio: 4 / 3 }
    }
  }

  const { columns, aspectRatio } = getLayoutConfig()
  const itemWidth = (screenWidth - padding - gap * (columns - 1)) / columns

  if (images.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {/* Empty state */}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={[styles.grid, { gap }]}>
        {images.map((image) => (
          <View
            key={image.id}
            style={{ width: itemWidth }}
          >
            <ImagePreviewCard
              image={image}
              onPress={() => onImagePress?.(image)}
              onDelete={() => onImageDelete?.(image)}
              showDeleteButton={isEditing}
              aspectRatio={aspectRatio}
            />
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
})
