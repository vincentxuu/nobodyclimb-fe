/**
 * GallerySection 組件
 *
 * 攝影集精選區，對應 apps/web/src/components/home/gallery-section.tsx
 */
import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Pressable, Dimensions, Image } from 'react-native'
import { YStack, XStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { MapPin } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, Button, Skeleton } from '@/components/ui'
import { FadeIn } from '@/components/animation'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, WB_COLORS } from '@nobodyclimb/constants'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const COLUMN_GAP = SPACING[3]
const NUM_COLUMNS = 2
const CARD_WIDTH = (SCREEN_WIDTH - SPACING[4] * 2 - COLUMN_GAP) / NUM_COLUMNS

interface GalleryPhoto {
  id: string
  image_url: string
  thumbnail_url?: string
  caption?: string
  location_city?: string
  location_spot?: string
}

interface DisplayPhoto {
  id: string
  image: string
  alt: string
  location: {
    city?: string
    spot?: string
  }
  height: number
}

// 根據索引決定高度實現瀑布流效果
function getHeight(index: number): number {
  const heights = [220, 160, 180, 140, 200, 150, 190, 170]
  return heights[index % heights.length]
}

function transformPhoto(photo: GalleryPhoto, index: number): DisplayPhoto {
  return {
    id: photo.id,
    image: photo.thumbnail_url || photo.image_url,
    alt: photo.caption || `攝影集精選照片 ${index + 1}`,
    location: {
      city: photo.location_city,
      spot: photo.location_spot,
    },
    height: getHeight(index),
  }
}

function PhotoCard({ photo, index }: { photo: DisplayPhoto; index: number }) {
  const router = useRouter()

  const handlePress = () => {
    router.push('/gallery')
  }

  const locationText = [photo.location.city, photo.location.spot]
    .filter(Boolean)
    .join(' · ')

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400)}
      style={[styles.photoCard, { height: photo.height }]}
    >
      <Pressable onPress={handlePress} style={styles.photoCardPressable}>
        <Image
          source={{ uri: photo.image }}
          style={styles.photoImage}
          resizeMode="cover"
        />

        {/* 漸層遮罩 */}
        <View style={styles.photoOverlay} />

        {/* 位置資訊 */}
        {locationText && (
          <View style={styles.locationContainer}>
            <MapPin size={12} color="#FFFFFF" />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationText}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  )
}

function PhotoSkeleton({ index }: { index: number }) {
  return (
    <View style={[styles.photoCard, { height: getHeight(index) }]}>
      <Skeleton style={styles.photoSkeleton} />
    </View>
  )
}

export function GallerySection() {
  const router = useRouter()
  const [photos, setPhotos] = useState<DisplayPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPhotos() {
      try {
        // TODO: 替換為實際的 API 端點
        const response = await fetch('https://api.nobodyclimb.cc/api/v1/gallery?page=1&limit=8')
        const result = await response.json()
        if (result.success && result.data) {
          const transformedPhotos = result.data.map(
            (photo: GalleryPhoto, index: number) => transformPhoto(photo, index)
          )
          setPhotos(transformedPhotos)
        }
      } catch (error) {
        console.error('Failed to fetch gallery photos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPhotos()
  }, [])

  const handleViewMore = () => {
    router.push('/gallery')
  }

  // 將照片分成兩列
  const leftColumn = photos.filter((_, i) => i % 2 === 0)
  const rightColumn = photos.filter((_, i) => i % 2 === 1)

  return (
    <FadeIn>
      <View style={styles.container}>
        {/* 標題區 */}
        <View style={styles.header}>
          <YStack>
            <Text style={styles.title}>攝影集精選</Text>
            <Text style={styles.subtitle}>看看小人物們攀岩的英姿吧</Text>
          </YStack>
        </View>

        {/* Masonry Grid */}
        <XStack gap={COLUMN_GAP}>
          {/* 左列 */}
          <YStack gap={COLUMN_GAP} flex={1}>
            {isLoading
              ? [0, 2, 4, 6].map((index) => <PhotoSkeleton key={index} index={index} />)
              : leftColumn.map((photo, i) => (
                  <PhotoCard key={photo.id} photo={photo} index={i * 2} />
                ))}
          </YStack>

          {/* 右列 */}
          <YStack gap={COLUMN_GAP} flex={1}>
            {isLoading
              ? [1, 3, 5, 7].map((index) => <PhotoSkeleton key={index} index={index} />)
              : rightColumn.map((photo, i) => (
                  <PhotoCard key={photo.id} photo={photo} index={i * 2 + 1} />
                ))}
          </YStack>
        </XStack>

        {/* 查看全部按鈕 */}
        <View style={styles.ctaContainer}>
          <Button variant="secondary" onPress={handleViewMore}>
            看更多影像
          </Button>
        </View>
      </View>
    </FadeIn>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING[8],
    paddingHorizontal: SPACING[4],
    borderTopWidth: 1,
    borderTopColor: WB_COLORS[30],
  },
  header: {
    marginBottom: SPACING[6],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: SEMANTIC_COLORS.textMain,
  },
  subtitle: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textSubtle,
    marginTop: SPACING[1],
  },
  photoCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  photoCardPressable: {
    flex: 1,
  },
  photoImage: {
    flex: 1,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  locationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: SPACING[2],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  locationText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  photoSkeleton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
  },
  ctaContainer: {
    marginTop: SPACING[8],
    alignItems: 'center',
  },
})

export default GallerySection
