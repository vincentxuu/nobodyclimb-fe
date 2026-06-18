import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import { Image } from 'expo-image'
import * as ImageManipulator from 'expo-image-manipulator'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Image as RNImage,
  StyleSheet,
  View,
} from 'react-native'
import { Button } from '../../ui/Button'
import { Icon } from '../../ui/Icon'
import { Text } from '../../ui/Text'

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
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!visible || !imageUri) return

    setImageSize(null)
    setZoom(1)
    setOffsetX(0)
    setOffsetY(0)

    RNImage.getSize(
      imageUri,
      (width, height) => {
        setImageSize({ width, height })
      },
      () => {
        Alert.alert('圖片讀取失敗', '無法取得圖片尺寸，請重新選擇圖片。')
      }
    )
  }, [imageUri, visible])

  const cropRect = useMemo(() => {
    if (!imageSize) return null

    const sourceRatio = imageSize.width / imageSize.height
    let baseWidth = imageSize.width
    let baseHeight = imageSize.height

    if (sourceRatio > aspectRatio) {
      baseWidth = imageSize.height * aspectRatio
    } else {
      baseHeight = imageSize.width / aspectRatio
    }

    const width = Math.max(1, Math.round(baseWidth / zoom))
    const height = Math.max(1, Math.round(baseHeight / zoom))
    const maxX = Math.max(0, imageSize.width - width)
    const maxY = Math.max(0, imageSize.height - height)
    const originX = Math.round((maxX / 2) * (1 + offsetX))
    const originY = Math.round((maxY / 2) * (1 + offsetY))

    return {
      originX: Math.min(Math.max(0, originX), maxX),
      originY: Math.min(Math.max(0, originY), maxY),
      width,
      height,
    }
  }, [aspectRatio, imageSize, offsetX, offsetY, zoom])

  const moveCrop = useCallback((dx: number, dy: number) => {
    setOffsetX((current) => Math.min(1, Math.max(-1, current + dx)))
    setOffsetY((current) => Math.min(1, Math.max(-1, current + dy)))
  }, [])

  const changeZoom = useCallback((delta: number) => {
    setZoom((current) => Math.min(3, Math.max(1, Number((current + delta).toFixed(1)))))
  }, [])

  const handleConfirm = async () => {
    if (!imageUri || !cropRect) return

    setIsProcessing(true)
    try {
      const result = await ImageManipulator.manipulateAsync(imageUri, [{ crop: cropRect }], {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      })
      onConfirm(result.uri)
    } catch (error) {
      const message = error instanceof Error ? error.message : '請稍後再試'
      Alert.alert('裁切失敗', message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text variant="h3">裁切圖片</Text>
            <Pressable onPress={onCancel} hitSlop={8}>
              <Icon name="X" size="md" color={SEMANTIC_COLORS.textMain} />
            </Pressable>
          </View>

          <View style={styles.imageContainer}>
            {imageUri && imageSize ? (
              <Image
                source={{ uri: imageUri }}
                style={[
                  styles.image,
                  {
                    aspectRatio,
                    transform: [
                      { scale: zoom },
                      { translateX: -offsetX * 18 },
                      { translateY: -offsetY * 18 },
                    ],
                  },
                ]}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.image, styles.loadingPreview, { aspectRatio }]}>
                <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMain} />
              </View>
            )}
          </View>

          <Text variant="caption" style={styles.hint}>
            使用縮放與方向控制調整裁切範圍
          </Text>

          <View style={styles.controls}>
            <View style={styles.zoomControls}>
              <Button variant="secondary" size="sm" onPress={() => changeZoom(-0.1)}>
                縮小
              </Button>
              <Text variant="caption" style={styles.zoomText}>
                {Math.round(zoom * 100)}%
              </Text>
              <Button variant="secondary" size="sm" onPress={() => changeZoom(0.1)}>
                放大
              </Button>
            </View>
            <View style={styles.moveGrid}>
              <Button variant="ghost" size="sm" onPress={() => moveCrop(0, -0.1)}>
                上
              </Button>
              <View style={styles.moveGridMiddle}>
                <Button variant="ghost" size="sm" onPress={() => moveCrop(-0.1, 0)}>
                  左
                </Button>
                <Button variant="ghost" size="sm" onPress={() => moveCrop(0.1, 0)}>
                  右
                </Button>
              </View>
              <Button variant="ghost" size="sm" onPress={() => moveCrop(0, 0.1)}>
                下
              </Button>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              variant="secondary"
              onPress={onCancel}
              disabled={isProcessing}
              style={styles.button}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onPress={handleConfirm}
              disabled={!cropRect || isProcessing}
              loading={isProcessing}
              style={styles.button}
            >
              確認裁切
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
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    maxHeight: 300,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
  },
  loadingPreview: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    textAlign: 'center',
    color: SEMANTIC_COLORS.textMuted,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  controls: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  zoomText: {
    minWidth: 42,
    textAlign: 'center',
    color: SEMANTIC_COLORS.textMuted,
  },
  moveGrid: {
    alignItems: 'center',
    gap: 4,
  },
  moveGridMiddle: {
    flexDirection: 'row',
    gap: 48,
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
