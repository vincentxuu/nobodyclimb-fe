/**
 * VideoCard 組件
 *
 * 影片卡片，對應 apps/web/src/components/videos/video-card.tsx
 */
import React from 'react'
import { StyleSheet, View, Pressable, Image, Dimensions } from 'react-native'
import { Play, Eye } from 'lucide-react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '@nobodyclimb/constants'
import { Text } from '@/components/ui/Text'
import { springConfigLight } from '@/theme/animations'
import type { Video } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const { width: SCREEN_WIDTH } = Dimensions.get('window')
// 兩欄佈局時的卡片寬度 (考慮間距)
const CARD_WIDTH = (SCREEN_WIDTH - SPACING[4] * 3) / 2

export interface VideoCardProps {
  /** 影片資料 */
  video: Video
  /** 點擊時的回調 */
  onClick: (video: Video) => void
  /** 寬度模式 */
  fullWidth?: boolean
}

/**
 * 影片卡片
 *
 * @example
 * ```tsx
 * <VideoCard
 *   video={videoData}
 *   onClick={(video) => handleVideoClick(video)}
 * />
 * ```
 */
export function VideoCard({ video, onClick, fullWidth = false }: VideoCardProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springConfigLight)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigLight)
  }

  const cardWidth = fullWidth ? '100%' : CARD_WIDTH

  return (
    <AnimatedPressable
      style={[styles.card, animatedStyle, { width: cardWidth }]}
      onPress={() => onClick(video)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* 縮圖容器 */}
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />

        {/* 播放按鈕覆蓋層 */}
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Play
              size={24}
              color="#FFFFFF"
              fill="#FFFFFF"
            />
          </View>
        </View>

        {/* 影片時長標籤 */}
        <View style={styles.durationBadge}>
          <Text variant="small" style={styles.durationText}>
            {video.duration}
          </Text>
        </View>

        {/* 精選標籤 */}
        {video.featured && (
          <View style={styles.featuredBadge}>
            <Text variant="small" style={styles.featuredText}>
              精選
            </Text>
          </View>
        )}
      </View>

      {/* 影片資訊 */}
      <View style={styles.info}>
        <Text
          variant="body"
          numberOfLines={2}
          style={styles.title}
        >
          {video.title}
        </Text>

        <Text variant="caption" color="textSubtle" style={styles.channel}>
          {video.channel}
        </Text>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Eye size={12} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="small" color="textMuted" style={styles.statText}>
              {video.viewCount}
            </Text>
          </View>
        </View>

        {/* 分類標籤 */}
        <View style={styles.categoryContainer}>
          <View style={styles.categoryBadge}>
            <Text variant="small" color="textSubtle">
              {video.category}
            </Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  thumbnailContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  durationBadge: {
    position: 'absolute',
    bottom: SPACING[2],
    right: SPACING[2],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING[1.5],
    paddingVertical: 2,
  },
  durationText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  featuredBadge: {
    position: 'absolute',
    top: SPACING[2],
    left: SPACING[2],
    backgroundColor: '#DC2626',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
  },
  featuredText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  info: {
    padding: SPACING[3],
  },
  title: {
    fontWeight: '500',
    marginBottom: SPACING[1],
  },
  channel: {
    marginBottom: SPACING[2],
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    marginBottom: SPACING[2],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  statText: {
    marginLeft: 2,
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryBadge: {
    backgroundColor: '#F5F5F5',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
  },
})

export default VideoCard
