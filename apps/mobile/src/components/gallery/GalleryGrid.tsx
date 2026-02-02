/**
 * GalleryGrid 組件
 *
 * 圖庫網格展示組件，對應 apps/web/src/components/gallery/gallery-grid.tsx
 */
import React, { useCallback } from 'react'
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  FlatList,
  type ListRenderItem,
} from 'react-native'
import { Image } from 'expo-image'
import { MapPin } from 'lucide-react-native'
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'

import { Text } from '@/components/ui/Text'
import { Avatar } from '@/components/ui/Avatar'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, WB_COLORS } from '@nobodyclimb/constants'
import type { GalleryPhoto } from '@nobodyclimb/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const NUM_COLUMNS = 2
const ITEM_GAP = SPACING.xs
const ITEM_WIDTH = (SCREEN_WIDTH - SPACING.md * 2 - ITEM_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS
const ITEM_HEIGHT = ITEM_WIDTH * 1.5 // 2:3 aspect ratio

/**
 * 照片資料介面（適配前端顯示）
 */
export interface GalleryGridPhoto {
  id: string
  src: string
  alt: string
  location?: {
    country?: string
    city?: string
    spot?: string
  }
  author?: {
    id: string
    username: string
    displayName?: string
    avatar?: string
  }
}

export interface GalleryGridProps {
  /** 照片列表 */
  photos: GalleryGridPhoto[]
  /** 照片點擊回調 */
  onPhotoClick: (photo: GalleryGridPhoto, index: number) => void
  /** 列數 */
  numColumns?: number
  /** 是否顯示 Header */
  ListHeaderComponent?: React.ComponentType<unknown> | React.ReactElement | null
  /** 是否顯示 Footer */
  ListFooterComponent?: React.ComponentType<unknown> | React.ReactElement | null
  /** 空狀態組件 */
  ListEmptyComponent?: React.ComponentType<unknown> | React.ReactElement | null
  /** 刷新中 */
  refreshing?: boolean
  /** 下拉刷新回調 */
  onRefresh?: () => void
}

/**
 * 單張照片卡片
 */
interface PhotoCardProps {
  photo: GalleryGridPhoto
  index: number
  onPress: () => void
}

function PhotoCard({ photo, index, onPress }: PhotoCardProps) {
  const overlayOpacity = useSharedValue(0)

  const handlePressIn = () => {
    overlayOpacity.value = withTiming(1, { duration: 150 })
  }

  const handlePressOut = () => {
    overlayOpacity.value = withTiming(0, { duration: 150 })
  }

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }))

  const hasLocation = photo.location && (
    photo.location.country ||
    photo.location.city ||
    photo.location.spot
  )

  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(Math.min(index * 50, 300))}
      style={styles.photoCard}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.photoCardPressable}
      >
        <Image
          source={{ uri: photo.src }}
          style={styles.photoImage}
          contentFit="cover"
          transition={300}
          placeholder={{ blurhash: 'L5H2EC=PM+yV0g-mq.wG9c010J}I' }}
        />

        {/* Hover/Press Overlay */}
        <Animated.View style={[styles.photoOverlay, overlayStyle]}>
          {/* Author info at top */}
          {photo.author && (
            <View style={styles.authorInfo}>
              <Avatar
                size="xs"
                imageUrl={photo.author.avatar}
                fallbackText={photo.author.displayName || photo.author.username}
              />
              <Text
                variant="caption"
                style={styles.authorName}
                numberOfLines={1}
              >
                {photo.author.displayName || photo.author.username}
              </Text>
            </View>
          )}

          {/* Location info at bottom */}
          {hasLocation && (
            <View style={styles.locationInfo}>
              <MapPin size={12} color="#FFFFFF" />
              <Text
                variant="small"
                style={styles.locationText}
                numberOfLines={1}
              >
                {[
                  photo.location?.country,
                  photo.location?.city,
                ].filter(Boolean).join(' ')}
                {photo.location?.spot && (
                  <>
                    <View style={styles.locationDot} />
                    <Text variant="small" style={styles.locationSpot}>
                      {photo.location.spot}
                    </Text>
                  </>
                )}
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}

/**
 * 圖庫網格組件
 *
 * @example
 * ```tsx
 * <GalleryGrid
 *   photos={photos}
 *   onPhotoClick={(photo, index) => openViewer(photo, index)}
 * />
 * ```
 */
export function GalleryGrid({
  photos,
  onPhotoClick,
  numColumns = NUM_COLUMNS,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  refreshing,
  onRefresh,
}: GalleryGridProps) {
  const renderItem: ListRenderItem<GalleryGridPhoto> = useCallback(
    ({ item, index }) => (
      <PhotoCard
        photo={item}
        index={index}
        onPress={() => onPhotoClick(item, index)}
      />
    ),
    [onPhotoClick]
  )

  const keyExtractor = useCallback((item: GalleryGridPhoto) => item.id, [])

  return (
    <FlatList
      data={photos}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      contentContainerStyle={styles.gridContent}
      columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  )
}

const styles = StyleSheet.create({
  gridContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  gridRow: {
    gap: ITEM_GAP,
    marginBottom: ITEM_GAP,
  },
  photoCard: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: WB_COLORS[10],
  },
  photoCardPressable: {
    flex: 1,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    padding: SPACING.xs,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  authorName: {
    color: '#FFFFFF',
    flex: 1,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#FFFFFF',
    flex: 1,
  },
  locationDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  locationSpot: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
})

export default GalleryGrid
