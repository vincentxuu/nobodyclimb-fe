/**
 * BiographyGallery 組件
 *
 * 相簿展示，對應 apps/web/src/components/biography/display/BiographyGallery.tsx
 */
import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Modal,
  useWindowDimensions,
  Image,
} from 'react-native'
import { Camera, X, ChevronLeft, ChevronRight } from 'lucide-react-native'
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated'

import { Text } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 類型定義
interface GalleryImage {
  id: string
  url: string
  caption?: string
}

interface BiographyV2 {
  id: string
  gallery_images?: GalleryImage[]
  [key: string]: any
}

interface BiographyGalleryProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 初始顯示的圖片數量 */
  initialCount?: number
  /** 自訂樣式 */
  style?: any
}

/**
 * 相簿展示組件
 *
 * 顯示用戶上傳的攀岩照片
 */
export function BiographyGallery({
  biography,
  initialCount = 6,
  style,
}: BiographyGalleryProps) {
  const { width: screenWidth } = useWindowDimensions()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // 確保 images 是陣列
  const images: GalleryImage[] = Array.isArray(biography.gallery_images)
    ? biography.gallery_images
    : []

  if (images.length === 0) {
    return null
  }

  const imageSize = (screenWidth - SPACING.md * 2 - SPACING.sm * 2) / 3
  const selectedImage = selectedIndex !== null ? images[selectedIndex] : null

  const handlePrev = () => {
    if (selectedIndex === null) return
    const prevIndex = selectedIndex === 0 ? images.length - 1 : selectedIndex - 1
    setSelectedIndex(prevIndex)
  }

  const handleNext = () => {
    if (selectedIndex === null) return
    const nextIndex = selectedIndex === images.length - 1 ? 0 : selectedIndex + 1
    setSelectedIndex(nextIndex)
  }

  return (
    <View style={[styles.container, style]}>
      {/* 標題 */}
      <View style={styles.header}>
        <Camera size={18} color={SEMANTIC_COLORS.textSubtle} />
        <Text variant="body" fontWeight="600">
          攀岩日常
        </Text>
      </View>

      {/* 橫向滾動相簿 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {images.map((image, index) => (
          <Animated.View
            key={image.id}
            entering={FadeInRight.delay(index * 50).duration(300)}
          >
            <Pressable
              style={[styles.imageWrapper, { width: imageSize, height: imageSize }]}
              onPress={() => setSelectedIndex(index)}
            >
              <Image
                source={{ uri: image.url }}
                style={styles.image}
                resizeMode="cover"
              />
            </Pressable>
          </Animated.View>
        ))}

        {/* 查看全部按鈕 */}
        {images.length > initialCount && (
          <Pressable
            style={[styles.viewAllButton, { width: imageSize, height: imageSize }]}
            onPress={() => setSelectedIndex(0)}
          >
            <Text variant="small" fontWeight="600">
              查看全部
            </Text>
            <Text variant="small" color="textMuted">
              ({images.length})
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Lightbox Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedIndex(null)}
      >
        <View style={styles.modalContainer}>
          {/* 關閉按鈕 */}
          <Pressable
            style={styles.closeButton}
            onPress={() => setSelectedIndex(null)}
          >
            <X size={28} color="#fff" />
          </Pressable>

          {/* 圖片 */}
          {selectedImage && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.modalImageContainer}>
              <Image
                source={{ uri: selectedImage.url }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              {selectedImage.caption && (
                <View style={styles.captionContainer}>
                  <Text variant="small" style={styles.captionText}>
                    {selectedImage.caption}
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* 導航按鈕 */}
          {images.length > 1 && (
            <>
              <Pressable style={styles.navButtonLeft} onPress={handlePrev}>
                <ChevronLeft size={32} color="rgba(255,255,255,0.8)" />
              </Pressable>
              <Pressable style={styles.navButtonRight} onPress={handleNext}>
                <ChevronRight size={32} color="rgba(255,255,255,0.8)" />
              </Pressable>
            </>
          )}

          {/* 頁碼 */}
          <View style={styles.pageIndicator}>
            <Text variant="small" style={styles.pageText}>
              {(selectedIndex ?? 0) + 1} / {images.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  scrollContent: {
    gap: SPACING.sm,
  },
  imageWrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  viewAllButton: {
    backgroundColor: '#EBEAEA',
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: SPACING.sm,
  },
  modalImageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 60,
    left: SPACING.lg,
    right: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: RADIUS.md,
  },
  captionText: {
    color: '#fff',
    textAlign: 'center',
  },
  navButtonLeft: {
    position: 'absolute',
    left: 10,
    padding: SPACING.md,
  },
  navButtonRight: {
    position: 'absolute',
    right: 10,
    padding: SPACING.md,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  pageText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
})

export default BiographyGallery
