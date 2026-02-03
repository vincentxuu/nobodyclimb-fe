import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { Icon } from '../../ui/Icon'
import { ProfileImage } from '../types'
import { COLORS } from '@nobodyclimb/constants'

interface ImagePreviewCardProps {
  image: ProfileImage
  onPress?: () => void
  onDelete?: () => void
  showDeleteButton?: boolean
  aspectRatio?: number
}

export default function ImagePreviewCard({
  image,
  onPress,
  onDelete,
  showDeleteButton = false,
  aspectRatio = 4 / 3,
}: ImagePreviewCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { aspectRatio },
        pressed && onPress && styles.containerPressed,
      ]}
    >
      <Image
        source={{ uri: image.url }}
        style={styles.image}
        contentFit="cover"
      />
      {showDeleteButton && onDelete && (
        <Pressable
          onPress={onDelete}
          style={styles.deleteButton}
          hitSlop={8}
        >
          <Icon name="X" size="sm" color={COLORS.white} />
        </Pressable>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[100],
  },
  containerPressed: {
    opacity: 0.9,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
