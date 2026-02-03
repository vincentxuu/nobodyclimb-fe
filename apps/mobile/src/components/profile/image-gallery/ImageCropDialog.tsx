import React, { useState } from 'react'
import { View, StyleSheet, Modal, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { Text } from '../../ui/Text'
import { Button } from '../../ui/Button'
import { Icon } from '../../ui/Icon'
import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'

interface ImageCropDialogProps {
  visible: boolean
  imageUri: string | null
  aspectRatio?: number
  onConfirm: (croppedUri: string) => void
  onCancel: () => void
}

export default function ImageCropDialog({
  visible,
  imageUri,
  aspectRatio = 1,
  onConfirm,
  onCancel,
}: ImageCropDialogProps) {
  // Note: React Native 沒有內建的裁切功能
  // 實際實作需要使用 expo-image-manipulator 或第三方庫
  // 這裡提供基本的預覽和確認功能

  const handleConfirm = () => {
    if (imageUri) {
      onConfirm(imageUri)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text variant="h3">裁切圖片</Text>
            <Pressable onPress={onCancel} hitSlop={8}>
              <Icon name="X" size="md" color={SEMANTIC_COLORS.textMain} />
            </Pressable>
          </View>

          <View style={styles.imageContainer}>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={[styles.image, { aspectRatio }]}
                contentFit="contain"
              />
            )}
          </View>

          <Text variant="caption" style={styles.hint}>
            拖曳調整裁切區域（功能開發中）
          </Text>

          <View style={styles.footer}>
            <Button variant="secondary" onPress={onCancel} style={styles.button}>
              取消
            </Button>
            <Button variant="primary" onPress={handleConfirm} style={styles.button}>
              確認
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  imageContainer: {
    padding: 16,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    maxHeight: 300,
    borderRadius: 8,
  },
  hint: {
    textAlign: 'center',
    color: SEMANTIC_COLORS.textMuted,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  button: {
    flex: 1,
  },
})
