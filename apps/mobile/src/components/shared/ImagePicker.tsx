/**
 * ImagePicker 組件
 *
 * 圖片選擇器，封裝 expo-image-picker
 */
import React, { useCallback } from 'react'
import { StyleSheet, View, Pressable, Alert } from 'react-native'
import * as ExpoImagePicker from 'expo-image-picker'
import { Camera, Image as ImageIcon, X } from 'lucide-react-native'
import { YStack } from 'tamagui'

import { Text, Button, BottomSheet } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface ImagePickerProps {
  /** 當前圖片 URI */
  value?: string | null
  /** 圖片選擇後的回調 */
  onChange: (uri: string | null) => void
  /** 是否允許編輯（裁切） */
  allowsEditing?: boolean
  /** 圖片品質 (0-1) */
  quality?: number
  /** 圖片寬高比 */
  aspect?: [number, number]
  /** 佔位符文字 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
}

export function ImagePicker({
  value,
  onChange,
  allowsEditing = true,
  quality = 0.8,
  aspect = [1, 1],
  placeholder = '選擇圖片',
  disabled = false,
}: ImagePickerProps) {
  // 請求相機權限
  const requestCameraPermission = useCallback(async () => {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        '需要相機權限',
        '請在設定中允許存取相機',
        [{ text: '確定' }]
      )
      return false
    }
    return true
  }, [])

  // 請求相簿權限
  const requestMediaLibraryPermission = useCallback(async () => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        '需要相簿權限',
        '請在設定中允許存取照片',
        [{ text: '確定' }]
      )
      return false
    }
    return true
  }, [])

  // 從相機拍照
  const handleTakePhoto = useCallback(async () => {
    const hasPermission = await requestCameraPermission()
    if (!hasPermission) return

    const result = await ExpoImagePicker.launchCameraAsync({
      allowsEditing,
      quality,
      aspect,
    })

    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri)
    }
  }, [requestCameraPermission, allowsEditing, quality, aspect, onChange])

  // 從相簿選擇
  const handlePickImage = useCallback(async () => {
    const hasPermission = await requestMediaLibraryPermission()
    if (!hasPermission) return

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing,
      quality,
      aspect,
    })

    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri)
    }
  }, [requestMediaLibraryPermission, allowsEditing, quality, aspect, onChange])

  // 移除圖片
  const handleRemove = useCallback(() => {
    onChange(null)
  }, [onChange])

  // 顯示選擇選項
  const handleShowOptions = useCallback(() => {
    Alert.alert(
      '選擇圖片',
      undefined,
      [
        { text: '拍照', onPress: handleTakePhoto },
        { text: '從相簿選擇', onPress: handlePickImage },
        ...(value ? [{ text: '移除圖片', onPress: handleRemove, style: 'destructive' as const }] : []),
        { text: '取消', style: 'cancel' as const },
      ],
      { cancelable: true }
    )
  }, [handleTakePhoto, handlePickImage, handleRemove, value])

  return (
    <Pressable
      onPress={disabled ? undefined : handleShowOptions}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        disabled && styles.containerDisabled,
        pressed && !disabled && styles.containerPressed,
      ]}
    >
      {value ? (
        <>
          <View style={styles.imageContainer}>
            <View style={styles.imagePlaceholder}>
              <ImageIcon size={40} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="small" color="textSubtle">
                已選擇圖片
              </Text>
            </View>
          </View>
          {!disabled && (
            <Pressable
              onPress={handleRemove}
              style={styles.removeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color="#FFFFFF" />
            </Pressable>
          )}
        </>
      ) : (
        <YStack alignItems="center" gap={SPACING.sm}>
          <View style={styles.iconContainer}>
            <Camera size={24} color={SEMANTIC_COLORS.textSubtle} />
          </View>
          <Text variant="small" color="textSubtle">
            {placeholder}
          </Text>
        </YStack>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 150,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D3D3D3',
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  containerPressed: {
    backgroundColor: '#F0F0F0',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default ImagePicker
