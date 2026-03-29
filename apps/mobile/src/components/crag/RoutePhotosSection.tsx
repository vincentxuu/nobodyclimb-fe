/**
 * 路線照片區塊
 *
 * 對應 apps/web/src/components/crag/RoutePhotosSection.tsx
 * 以 grid 方式顯示路線照片，點擊可全螢幕檢視
 */

import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Image } from 'expo-image'
import { Camera, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react-native'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui'
import type { PhotoItem } from '@/lib/hooks/useRoutePhotos'
import { useRoutePhotos } from '@/lib/hooks/useRoutePhotos'
import { useCreateRouteStory } from '@/lib/hooks/useRouteStories'
import { useAuthStore } from '@/store/authStore'
import { RouteMediaForm, type RouteMediaFormRef } from './RouteMediaForm'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const NUM_COLUMNS = 3
const GRID_GAP = SPACING.xs
const PHOTO_SIZE = (SCREEN_WIDTH - SPACING.md * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS

interface RoutePhotosSectionProps {
  routeId: string
  routeName?: string
  staticPhotos?: string[]
}

export function RoutePhotosSection({
  routeId,
  routeName,
  staticPhotos = [],
}: RoutePhotosSectionProps) {
  const { data: photos = [], isLoading } = useRoutePhotos(routeId, staticPhotos)
  const [lightboxVisible, setLightboxVisible] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const mediaFormRef = React.useRef<RouteMediaFormRef>(null)
  const createStory = useCreateRouteStory()
  const { status } = useAuthStore()
  const isLoggedIn = status === 'signIn'

  const handleSharePhoto = async (data: { content?: string; photos?: string[] }) => {
    await createStory.mutateAsync({
      route_id: routeId,
      content: data.content || '分享照片',
      photos: data.photos,
      visibility: 'public',
    })
  }

  const MAX_VISIBLE = 9

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setLightboxVisible(true)
  }

  const closeLightbox = () => {
    setLightboxVisible(false)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
  }

  const currentPhoto: PhotoItem | undefined = photos[currentIndex]

  return (
    <>
      <View style={styles.section}>
        {/* Section Header - yellow bar style */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flex: 1 }}>
            <View style={styles.sectionBar} />
            <Camera size={18} color={SEMANTIC_COLORS.textMain} />
            <Text variant="body" fontWeight="600">
              路線照片
            </Text>
            {photos.length > 0 && (
              <Text variant="small" color="textMuted" style={styles.photoCount}>
                {photos.length} 張
              </Text>
            )}
          </View>
          {isLoggedIn && (
            <Pressable style={styles.addButton} onPress={() => mediaFormRef.current?.open()}>
              <Plus size={16} color="#2563EB" />
              <Text variant="caption" style={{ color: '#2563EB' }}>
                分享
              </Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMuted} />
            <Text variant="small" color="textMuted" style={styles.loadingText}>
              載入中...
            </Text>
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Camera size={36} color="#D1D5DB" />
            <Text variant="small" color="textMuted" style={styles.emptyText}>
              目前沒有照片
            </Text>
            <Text variant="caption" color="textMuted">
              成為第一個分享此路線照片的人
            </Text>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {photos.slice(0, MAX_VISIBLE).map((photo, index) => (
              <Pressable
                key={`${photo.source}-${photo.storyId || index}`}
                style={styles.photoItem}
                onPress={() => openLightbox(index)}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={styles.photoImage}
                  contentFit="cover"
                  transition={200}
                />
                {/* Overlay for "+N more" on last visible photo */}
                {index === MAX_VISIBLE - 1 && photos.length > MAX_VISIBLE && (
                  <View style={styles.moreOverlay}>
                    <Text style={styles.moreText}>+{photos.length - MAX_VISIBLE}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* 媒體分享表單 */}
      {isLoggedIn && (
        <RouteMediaForm
          ref={mediaFormRef}
          routeId={routeId}
          routeName={routeName || ''}
          mediaType="photo"
          onSubmit={handleSharePhoto}
          isLoading={createStory.isPending}
        />
      )}

      {/* Full-screen Lightbox Modal */}
      <Modal
        visible={lightboxVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeLightbox}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.lightboxContainer}>
          {/* Close button */}
          <SafeAreaView edges={['top']} style={styles.lightboxTopBar}>
            <Pressable onPress={closeLightbox} style={styles.lightboxCloseBtn}>
              <X size={24} color="#FFFFFF" />
            </Pressable>
          </SafeAreaView>

          {/* Main photo area */}
          <Pressable style={styles.lightboxContent} onPress={closeLightbox}>
            {currentPhoto && (
              <Image
                source={{ uri: currentPhoto.url }}
                style={styles.lightboxImage}
                contentFit="contain"
                transition={150}
              />
            )}
          </Pressable>

          {/* Photo info */}
          {currentPhoto && (
            <SafeAreaView edges={['bottom']} style={styles.lightboxBottomBar}>
              {currentPhoto.source === 'user' && (
                <View style={styles.lightboxInfo}>
                  {currentPhoto.caption && (
                    <Text style={styles.lightboxCaption} numberOfLines={2}>
                      {currentPhoto.caption}
                    </Text>
                  )}
                  <Text style={styles.lightboxAuthor}>
                    by {currentPhoto.displayName || currentPhoto.username}
                  </Text>
                </View>
              )}
              <Text style={styles.lightboxCounter}>
                {currentIndex + 1} / {photos.length}
              </Text>
            </SafeAreaView>
          )}

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <Pressable style={[styles.navButton, styles.navButtonLeft]} onPress={goToPrevious}>
                <ChevronLeft size={28} color="#FFFFFF" />
              </Pressable>
              <Pressable style={[styles.navButton, styles.navButtonRight]} onPress={goToNext}>
                <ChevronRight size={28} color="#FFFFFF" />
              </Pressable>
            </>
          )}
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionBar: {
    width: 4,
    height: 18,
    backgroundColor: '#FFE70C',
    borderRadius: 2,
  },
  photoCount: {
    marginLeft: 'auto',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.xs,
  },
  loadingText: {
    marginLeft: SPACING.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.xs,
  },
  emptyText: {
    marginTop: SPACING.xs,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  // Lightbox styles
  lightboxContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  lightboxTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  lightboxCloseBtn: {
    alignSelf: 'flex-end',
    padding: SPACING.md,
    marginRight: SPACING.xs,
  },
  lightboxContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
  },
  lightboxBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    zIndex: 10,
  },
  lightboxInfo: {
    marginBottom: SPACING.xs,
  },
  lightboxCaption: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  lightboxAuthor: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  lightboxCounter: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navButtonLeft: {
    left: SPACING.sm,
  },
  navButtonRight: {
    right: SPACING.sm,
  },

  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
})
