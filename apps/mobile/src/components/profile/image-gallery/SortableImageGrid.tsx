import React, { useState } from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { ProfileImage } from '../types'
import SortableImageCard from './SortableImageCard'
import ImageUploader from './ImageUploader'
import { COLORS } from '@nobodyclimb/constants'

interface SortableImageGridProps {
  images: ProfileImage[]
  onReorder: (images: ProfileImage[]) => void
  onDelete: (image: ProfileImage) => void
  onUpload: (uri: string) => Promise<void>
  onImagePress?: (image: ProfileImage) => void
  maxCount?: number
}

export default function SortableImageGrid({
  images,
  onReorder,
  onDelete,
  onUpload,
  onImagePress,
  maxCount = 5,
}: SortableImageGridProps) {
  const { width: screenWidth } = useWindowDimensions()
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const columns = 3
  const padding = 32
  const gap = 8
  const itemWidth = (screenWidth - padding - gap * (columns - 1)) / columns

  // Note: 完整的拖曳排序功能需要使用 react-native-draggable-flatlist
  // 這裡提供基本的網格顯示功能

  return (
    <View style={styles.container}>
      <View style={[styles.grid, { gap }]}>
        {images.map((image) => (
          <View key={image.id} style={{ width: itemWidth }}>
            <SortableImageCard
              image={image}
              onDelete={() => onDelete(image)}
              onPress={() => onImagePress?.(image)}
              isDragging={draggingId === image.id}
            />
          </View>
        ))}

        {/* Upload Button */}
        {images.length < maxCount && (
          <View style={{ width: itemWidth }}>
            <ImageUploader
              onUpload={onUpload}
              currentCount={images.length}
              maxCount={maxCount}
            />
          </View>
        )}
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
})
