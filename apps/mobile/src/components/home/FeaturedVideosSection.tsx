/**
 * FeaturedVideosSection 組件
 *
 * 精選影片區，對應 apps/web/src/components/home/featured-videos-section.tsx
 */
import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Pressable, FlatList, Dimensions, Linking, Image } from 'react-native'
import { YStack, XStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { Play, Eye } from 'lucide-react-native'
import Animated, { FadeInRight } from 'react-native-reanimated'

import { Text, Button, Skeleton } from '@/components/ui'
import { FadeIn, SlideUp } from '@/components/animation'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, WB_COLORS } from '@nobodyclimb/constants'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH * 0.7

interface Video {
  id: string
  youtubeId: string
  title: string
  thumbnailUrl: string
  channel: string
  duration: string
  viewCount: string
  category: string
}

function VideoCard({ video, index }: { video: Video; index: number }) {
  const handlePress = async () => {
    // 開啟 YouTube App 或網頁
    const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`
    if (await Linking.canOpenURL(youtubeUrl)) {
      await Linking.openURL(youtubeUrl)
    }
  }

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400)}
      style={styles.cardWrapper}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.videoCard,
          pressed && styles.videoCardPressed,
        ]}
      >
        {/* 縮圖 */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          {/* 播放按鈕 */}
          <View style={styles.playButtonOverlay}>
            <View style={styles.playButton}>
              <Play size={24} color={SEMANTIC_COLORS.textMain} fill={SEMANTIC_COLORS.textMain} />
            </View>
          </View>
          {/* 時長標籤 */}
          <View style={styles.durationLabel}>
            <Text style={styles.durationText}>{video.duration}</Text>
          </View>
        </View>

        {/* 影片資訊 */}
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={styles.channelName}>{video.channel}</Text>
          <XStack alignItems="center" gap={SPACING[2]} marginTop={SPACING[1]}>
            <XStack alignItems="center" gap={4}>
              <Eye size={12} color={SEMANTIC_COLORS.textMuted} />
              <Text style={styles.viewCount}>{video.viewCount}</Text>
            </XStack>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{video.category}</Text>
            </View>
          </XStack>
        </View>
      </Pressable>
    </Animated.View>
  )
}

function VideoSkeleton() {
  return (
    <View style={styles.cardWrapper}>
      <View style={styles.videoCard}>
        <Skeleton style={styles.thumbnailSkeleton} />
        <View style={styles.videoInfo}>
          <Skeleton style={{ width: '100%', height: 16 }} />
          <Skeleton style={{ width: '60%', height: 12, marginTop: SPACING[2] }} />
          <Skeleton style={{ width: '40%', height: 12, marginTop: SPACING[1] }} />
        </View>
      </View>
    </View>
  )
}

export function FeaturedVideosSection() {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVideos() {
      try {
        // 載入影片資料
        const response = await fetch('https://nobodyclimb.cc/data/videos-chunks/videos-0.json')
        if (response.ok) {
          const data: Video[] = await response.json()

          // 篩選長片 (>20分鐘) 並取前4個
          const longVideos = data
            .filter((video) => parseDuration(video.duration) >= 20)
            .sort((a, b) => parseViewCount(b.viewCount) - parseViewCount(a.viewCount))
            .slice(0, 4)

          setVideos(longVideos)
        }
      } catch (error) {
        console.error('Failed to fetch videos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  const handleViewMore = () => {
    router.push('/videos')
  }

  // 解析時長 (格式: "1:23:45" 或 "23:45")
  function parseDuration(duration: string): number {
    const parts = duration.split(':').map(Number)
    if (parts.length === 3) {
      return parts[0] * 60 + parts[1]
    }
    return parts[0]
  }

  // 解析觀看次數 (格式: "1.2萬" 或 "123")
  function parseViewCount(viewCount: string): number {
    if (viewCount.includes('萬')) {
      return parseFloat(viewCount.replace('萬', '')) * 10000
    }
    return parseInt(viewCount.replace(/,/g, ''), 10) || 0
  }

  if (!loading && videos.length === 0) {
    return null
  }

  return (
    <FadeIn>
      <View style={styles.container}>
        {/* 標題區 */}
        <View style={styles.header}>
          <Text style={styles.title}>精選影片</Text>
          <Text style={styles.subtitle}>長篇攀岩紀錄與教學影片</Text>
        </View>

        {/* 影片列表 */}
        <FlatList<number | Video>
          data={loading ? [1, 2, 3, 4] : videos}
          keyExtractor={(item) => (typeof item === 'number' ? `skeleton-${item}` : item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) =>
            typeof item === 'number' ? (
              <VideoSkeleton />
            ) : (
              <VideoCard video={item} index={index} />
            )
          }
          ItemSeparatorComponent={() => <View style={{ width: SPACING[4] }} />}
        />

        {/* 查看全部按鈕 */}
        <SlideUp delay={200}>
          <View style={styles.ctaContainer}>
            <Button variant="secondary" onPress={handleViewMore}>
              瀏覽更多影片
            </Button>
          </View>
        </SlideUp>
      </View>
    </FadeIn>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING[8],
    borderTopWidth: 1,
    borderTopColor: WB_COLORS[30],
  },
  header: {
    paddingHorizontal: SPACING[4],
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
  listContent: {
    paddingHorizontal: SPACING[4],
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  videoCardPressed: {
    opacity: 0.9,
  },
  thumbnailContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
    backgroundColor: WB_COLORS[20],
  },
  thumbnail: {
    flex: 1,
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  durationLabel: {
    position: 'absolute',
    bottom: SPACING[2],
    right: SPACING[2],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  videoInfo: {
    padding: SPACING[4],
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
    lineHeight: 20,
  },
  channelName: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textSubtle,
    marginTop: SPACING[2],
  },
  viewCount: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textMuted,
  },
  categoryBadge: {
    backgroundColor: WB_COLORS[10],
    paddingHorizontal: SPACING[1.5],
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryText: {
    fontSize: 10,
    color: SEMANTIC_COLORS.textSubtle,
  },
  thumbnailSkeleton: {
    aspectRatio: 16 / 9,
  },
  ctaContainer: {
    marginTop: SPACING[8],
    alignItems: 'center',
  },
})

export default FeaturedVideosSection
