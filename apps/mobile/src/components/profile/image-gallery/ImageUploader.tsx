import React, { useState } from 'react'
import { View, Pressable, StyleSheet, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Text } from '../../ui/Text'
import { Icon } from '../../ui/Icon'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { IMAGE_CONSTRAINTS } from '../types'
import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'

interface ImageUploaderProps {
  onUpload: (uri: string) => Promise<void>
  disabled?: boolean
  currentCount?: number
  maxCount?: number
}

export default function ImageUploader({
  onUpload,
  disabled = false,
  currentCount = 0,
  maxCount = IMAGE_CONSTRAINTS.maxCount,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)

  const canUpload = currentCount < maxCount && !disabled

  const handlePress = async () => {
    if (!canUpload || isUploading) return

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult.granted) {
      Alert.alert('權限錯誤', '需要相簿存取權限才能上傳圖片')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setIsUploading(true)
      try {
        await onUpload(result.assets[0].uri)
      } catch (error) {
        console.error('Upload failed:', error)
        Alert.alert('錯誤', '圖片上傳失敗')
      } finally {
        setIsUploading(false)
      }
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={!canUpload || isUploading}
      style={({ pressed }) => [
        styles.container,
        !canUpload && styles.containerDisabled,
        pressed && canUpload && styles.containerPressed,
      ]}
    >
      {isUploading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          <Icon
            name="Plus"
            size="lg"
            color={canUpload ? SEMANTIC_COLORS.textSubtle : COLORS.gray[300]}
          />
          <Text
            variant="body"
            style={{
              color: canUpload ? SEMANTIC_COLORS.textSubtle : COLORS.gray[300],
              marginTop: 8,
            }}
          >
            上傳圖片
          </Text>
          <Text variant="caption" style={{ color: COLORS.gray[400], marginTop: 4 }}>
            {currentCount}/{maxCount}
          </Text>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerDisabled: {
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.gray[100],
  },
  containerPressed: {
    backgroundColor: COLORS.gray[100],
  },
})
