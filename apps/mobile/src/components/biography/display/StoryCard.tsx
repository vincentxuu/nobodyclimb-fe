/**
 * StoryCard 組件
 *
 * 故事卡片，對應 apps/web/src/components/biography/display/StoryCard.tsx
 */
import React from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { ChevronRight, ImageIcon } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, Card } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface Story {
  id: string
  title: string
  content?: string
  cover_url?: string | null
  created_at?: string
}

interface StoryCardProps {
  /** 故事資料 */
  story: Story
  /** 點擊回調 */
  onPress?: () => void
  /** 動畫延遲索引 */
  index?: number
  /** 是否為精簡模式 */
  compact?: boolean
}

export function StoryCard({
  story,
  onPress,
  index = 0,
  compact = false,
}: StoryCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 100)}>
      <Pressable onPress={onPress} disabled={!onPress}>
        <Card style={compact ? styles.cardCompact : styles.card}>
          <View style={styles.content}>
            {/* 封面圖 */}
            {story.cover_url ? (
              <View style={compact ? styles.imageContainerCompact : styles.imageContainer}>
                <Image
                  source={{ uri: story.cover_url }}
                  style={styles.image}
                  contentFit="cover"
                  transition={300}
                />
              </View>
            ) : (
              <View style={[
                compact ? styles.imageContainerCompact : styles.imageContainer,
                styles.placeholderContainer,
              ]}>
                <ImageIcon size={24} color={SEMANTIC_COLORS.textMuted} />
              </View>
            )}

            {/* 文字區 */}
            <View style={styles.textSection}>
              <Text
                variant="body"
                fontWeight="500"
                numberOfLines={compact ? 1 : 2}
              >
                {story.title}
              </Text>
              {!compact && story.content && (
                <Text
                  variant="small"
                  color="textSubtle"
                  numberOfLines={2}
                  style={styles.excerpt}
                >
                  {story.content}
                </Text>
              )}
            </View>

            {/* 箭頭 */}
            {onPress && (
              <ChevronRight size={20} color={SEMANTIC_COLORS.textMuted} />
            )}
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
  },
  cardCompact: {
    padding: SPACING.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  imageContainer: {
    width: 80,
    height: 60,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  imageContainerCompact: {
    width: 56,
    height: 42,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    flex: 1,
  },
  excerpt: {
    marginTop: 4,
    lineHeight: 18,
  },
})

export default StoryCard
