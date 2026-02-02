/**
 * PhotoPopup 組件
 *
 * 全螢幕照片檢視器，對應 apps/web/src/components/gallery/photo-popup.tsx
 */
import React, { useCallback } from 'react'
import {
  StyleSheet,
  View,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { X, ChevronLeft, ChevronRight, MapPin, User } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'

import { Text } from '@/components/ui/Text'
import { Avatar } from '@/components/ui/Avatar'
import { IconButton } from '@/components/ui/IconButton'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, WB_COLORS } from '@nobodyclimb/constants'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

/**
 * 照片資料介面
 */
export interface PhotoPopupPhoto {
  id: string
  src: string
  alt: string
  location?: {
    country?: string
    city?: string
    spot?: string
  }
  uploadDate?: string
  author?: {
    id: string
    username: string
    displayName?: string
    avatar?: string
  }
}

export interface PhotoPopupProps {
  /** 當前照片 */
  photo: PhotoPopupPhoto | null
  /** 是否顯示 */
  visible: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 下一張回調 */
  onNext?: () => void
  /** 上一張回調 */
  onPrev?: () => void
  /** 是否有下一張 */
  hasNext?: boolean
  /** 是否有上一張 */
  hasPrev?: boolean
}

/**
 * 全螢幕照片檢視器
 *
 * @example
 * ```tsx
 * <PhotoPopup
 *   photo={selectedPhoto}
 *   visible={viewerVisible}
 *   onClose={handleClose}
 *   onNext={handleNext}
 *   onPrev={handlePrev}
 *   hasNext={currentIndex < photos.length - 1}
 *   hasPrev={currentIndex > 0}
 * />
 * ```
 */
export function PhotoPopup({
  photo,
  visible,
  onClose,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}: PhotoPopupProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  // 滑動手勢
  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      const { translationX, velocityX } = event
      const threshold = 50
      const velocityThreshold = 500

      if (translationX < -threshold || velocityX < -velocityThreshold) {
        // 向左滑 -> 下一張
        if (hasNext && onNext) {
          onNext()
        }
      } else if (translationX > threshold || velocityX > velocityThreshold) {
        // 向右滑 -> 上一張
        if (hasPrev && onPrev) {
          onPrev()
        }
      }
    })

  const handleAuthorPress = useCallback(() => {
    if (photo?.author?.username) {
      onClose()
      router.push(`/biography/${photo.author.username}`)
    }
  }, [photo, onClose, router])

  if (!photo) return null

  const hasLocation = photo.location && (
    photo.location.country ||
    photo.location.city ||
    photo.location.spot
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.container}
      >
        {/* 背景 */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* 主內容 */}
        <Animated.View
          entering={ZoomIn.duration(250)}
          exiting={ZoomOut.duration(200)}
          style={styles.content}
        >
          {/* 圖片區域 */}
          <GestureDetector gesture={swipeGesture}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: photo.src }}
                style={styles.image}
                contentFit="contain"
                transition={200}
              />
            </View>
          </GestureDetector>

          {/* 資訊面板 */}
          <View style={[styles.infoPanel, { paddingBottom: insets.bottom + SPACING.md }]}>
            {/* 作者資訊 */}
            {photo.author && (
              <Pressable onPress={handleAuthorPress} style={styles.authorSection}>
                <Avatar
                  size="md"
                  imageUrl={photo.author.avatar}
                  fallbackText={photo.author.displayName || photo.author.username}
                />
                <View style={styles.authorText}>
                  <Text variant="body" fontWeight="500" style={styles.whiteText}>
                    {photo.author.displayName || photo.author.username}
                  </Text>
                  <Text variant="caption" style={styles.usernameText}>
                    @{photo.author.username}
                  </Text>
                </View>
              </Pressable>
            )}

            {/* 地點資訊 */}
            {hasLocation && (
              <View style={styles.locationSection}>
                <MapPin size={16} color={WB_COLORS[50]} />
                <Text variant="body" style={styles.locationText}>
                  {[
                    photo.location?.country,
                    photo.location?.city,
                  ].filter(Boolean).join(' ')}
                  {photo.location?.spot && (
                    <Text variant="body" fontWeight="600" style={styles.whiteText}>
                      {' '}{photo.location.spot}
                    </Text>
                  )}
                </Text>
              </View>
            )}

            {/* 上傳日期 */}
            {photo.uploadDate && (
              <View style={styles.dateSection}>
                <Text variant="caption" style={styles.dateLabel}>上傳日期:</Text>
                <Text variant="caption" style={styles.dateText}>{photo.uploadDate}</Text>
              </View>
            )}

            {/* 描述 */}
            {photo.alt && (
              <Text variant="body" style={styles.description} numberOfLines={3}>
                {photo.alt}
              </Text>
            )}
          </View>

          {/* 關閉按鈕 */}
          <View style={[styles.closeButton, { top: insets.top + SPACING.sm }]}>
            <IconButton
              icon={<X size={20} color="#FFFFFF" />}
              onPress={onClose}
              variant="ghost"
              style={styles.navButton}
            />
          </View>

          {/* 上一張按鈕 */}
          {hasPrev && onPrev && (
            <View style={styles.prevButton}>
              <IconButton
                icon={<ChevronLeft size={24} color="#FFFFFF" />}
                onPress={onPrev}
                variant="ghost"
                style={styles.navButton}
              />
            </View>
          )}

          {/* 下一張按鈕 */}
          {hasNext && onNext && (
            <View style={styles.nextButton}>
              <IconButton
                icon={<ChevronRight size={24} color="#FFFFFF" />}
                onPress={onNext}
                variant="ghost"
                style={styles.navButton}
              />
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
  },
  infoPanel: {
    backgroundColor: WB_COLORS[90],
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  authorText: {
    flex: 1,
  },
  whiteText: {
    color: '#FFFFFF',
  },
  usernameText: {
    color: WB_COLORS[50],
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  locationText: {
    color: WB_COLORS[30],
    flex: 1,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  dateLabel: {
    color: WB_COLORS[40],
    fontWeight: '500',
  },
  dateText: {
    color: WB_COLORS[50],
  },
  description: {
    color: WB_COLORS[30],
    marginTop: SPACING.sm,
  },
  closeButton: {
    position: 'absolute',
    right: SPACING.md,
    zIndex: 10,
  },
  prevButton: {
    position: 'absolute',
    left: SPACING.sm,
    top: '40%',
    zIndex: 10,
  },
  nextButton: {
    position: 'absolute',
    right: SPACING.sm,
    top: '40%',
    zIndex: 10,
  },
  navButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
})

export default PhotoPopup
