/**
 * FeaturedStoriesSection 組件
 *
 * 精選故事區，對應 apps/web/src/components/home/featured-stories-section.tsx
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { StyleSheet, View, Pressable, FlatList, Dimensions } from 'react-native'
import { YStack, XStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { ArrowRightCircle, Mountain, MessageCircle } from 'lucide-react-native'
import Animated, { FadeInRight } from 'react-native-reanimated'

import { Text, Button, Spinner, Avatar, Card, CardContent } from '@/components/ui'
import { FadeIn, SlideUp } from '@/components/animation'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, WB_COLORS } from '@nobodyclimb/constants'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH * 0.8

interface FeaturedContent {
  id: string
  type: 'core-story' | 'one-liner' | 'story'
  title?: string
  question?: string
  content: string
  answer?: string
  category_name?: string
  author_name: string
  author_avatar?: string
  biography_id: string
  biography_slug?: string
  like_count: number
  comment_count: number
}

function StoryCard({ content, index }: { content: FeaturedContent; index: number }) {
  const router = useRouter()
  const displayName = content.author_name || '匿名'

  // 根據類型取得標題和內容
  const getDisplayContent = () => {
    switch (content.type) {
      case 'core-story':
        return {
          label: content.title || '核心故事',
          text: content.content,
        }
      case 'one-liner':
        return {
          label: content.question || '一句話',
          text: content.answer || content.content,
        }
      case 'story':
        return {
          label: content.title || content.category_name || '小故事',
          text: content.content,
        }
    }
  }

  const { label, text } = getDisplayContent()

  const handlePress = () => {
    router.push(`/biography/${content.biography_slug || content.biography_id}`)
  }

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400)}
      style={styles.cardWrapper}
    >
      <Pressable onPress={handlePress}>
        <Card style={styles.storyCard}>
          <CardContent style={styles.storyCardContent}>
            {/* 內容區 */}
            <YStack flex={1} gap={SPACING[2]} marginBottom={SPACING[4]}>
              <Text style={styles.labelText}>{label}</Text>
              <Text style={styles.quoteText} numberOfLines={4}>
                "{text}"
              </Text>
            </YStack>

            {/* 作者資訊 */}
            <View style={styles.authorSection}>
              <XStack alignItems="center" gap={SPACING[3]} flex={1}>
                <Avatar
                  size="sm"
                  source={content.author_avatar ? { uri: content.author_avatar } : undefined}
                />
                <YStack flex={1}>
                  <Text style={styles.authorName}>{displayName}</Text>
                  <XStack alignItems="center" gap={SPACING[3]} marginTop={2}>
                    <XStack alignItems="center" gap={4}>
                      <Mountain size={12} color={SEMANTIC_COLORS.textMuted} />
                      <Text style={styles.statText}>{content.like_count}</Text>
                    </XStack>
                    <XStack alignItems="center" gap={4}>
                      <MessageCircle size={12} color={SEMANTIC_COLORS.textMuted} />
                      <Text style={styles.statText}>{content.comment_count}</Text>
                    </XStack>
                  </XStack>
                </YStack>
              </XStack>
              <ArrowRightCircle size={18} color={SEMANTIC_COLORS.textMuted} />
            </View>
          </CardContent>
        </Card>
      </Pressable>
    </Animated.View>
  )
}

function StorySkeleton() {
  return (
    <View style={styles.cardWrapper}>
      <Card style={styles.storyCard}>
        <CardContent style={styles.storyCardContent}>
          <View style={[styles.skeletonText, { width: 80 }]} />
          <View style={[styles.skeletonText, { width: '100%', height: 60, marginTop: SPACING[2] }]} />
          <View style={styles.authorSection}>
            <XStack alignItems="center" gap={SPACING[3]}>
              <View style={styles.skeletonAvatar} />
              <View style={[styles.skeletonText, { width: 100 }]} />
            </XStack>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export function FeaturedStoriesSection() {
  const router = useRouter()
  const [stories, setStories] = useState<FeaturedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const loadStories = useCallback(async () => {
    if (hasFetched.current) return
    hasFetched.current = true

    try {
      // TODO: 替換為實際的 API 端點
      const response = await fetch('https://api.nobodyclimb.cc/api/v1/content/featured?limit=4')
      const result = await response.json()
      if (result.success && result.data) {
        setStories(result.data)
      }
    } catch (err) {
      console.error('Failed to load featured stories:', err)
      setError('載入故事時發生錯誤')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStories()
  }, [loadStories])

  const handleViewMore = () => {
    router.push('/biography')
  }

  if (!loading && stories.length === 0 && !error) {
    return null
  }

  return (
    <FadeIn>
      <View style={styles.container}>
        {/* 標題區 */}
        <View style={styles.header}>
          <Text style={styles.title}>精選故事</Text>
          <Text style={styles.subtitle}>來自攀岩社群的真實故事</Text>
        </View>

        {loading ? (
          <FlatList
            data={[1, 2, 3]}
            keyExtractor={(item) => `skeleton-${item}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={() => <StorySkeleton />}
            ItemSeparatorComponent={() => <View style={{ width: SPACING[4] }} />}
          />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={stories}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => <StoryCard content={item} index={index} />}
            ItemSeparatorComponent={() => <View style={{ width: SPACING[4] }} />}
          />
        )}

        {/* 查看全部按鈕 */}
        <SlideUp delay={200}>
          <View style={styles.ctaContainer}>
            <Button variant="secondary" onPress={handleViewMore}>
              探索更多故事
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
  storyCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  storyCardContent: {
    padding: SPACING[5],
  },
  labelText: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textMuted,
  },
  quoteText: {
    fontSize: 16,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
    lineHeight: 24,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: WB_COLORS[10],
    paddingTop: SPACING[3],
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
  },
  statText: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textMuted,
  },
  errorContainer: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING[4],
  },
  errorText: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textMuted,
  },
  ctaContainer: {
    marginTop: SPACING[8],
    alignItems: 'center',
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    backgroundColor: WB_COLORS[20],
  },
  skeletonAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: WB_COLORS[20],
  },
})

export default FeaturedStoriesSection
