/**
 * FeaturedStoriesSection 組件
 *
 * 精選故事區，對應 apps/web/src/components/home/featured-stories-section.tsx
 * 並行呼叫 3 個 popular API，合併排序後取不重複作者的前 3 筆
 */

import { BORDER_RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { ArrowRightCircle, MessageCircle, Mountain } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Dimensions, FlatList, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeInRight } from 'react-native-reanimated'
import { XStack, YStack } from 'tamagui'
import { FadeIn, SlideUp } from '@/components/animation'
import { Avatar, Button, Card, CardContent, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH * 0.8

// --- API 回傳型別 ---

interface CoreStory {
  id: string
  biography_id: string
  question_id: string
  content: string
  title?: string
  subtitle?: string
  like_count: number
  comment_count: number
  is_liked?: boolean
  created_at: string
  updated_at: string
  author_name: string
  author_avatar?: string
  biography_slug?: string
}

interface OneLiner {
  id: string
  biography_id: string
  question_id: string
  question_text?: string
  answer: string
  question?: string
  format_hint?: string
  like_count: number
  comment_count: number
  is_liked?: boolean
  created_at: string
  updated_at: string
  author_name: string
  author_avatar?: string
  biography_slug?: string
}

interface Story {
  id: string
  biography_id: string
  question_id: string
  question_text?: string
  category_id?: string
  content: string
  title?: string
  subtitle?: string
  difficulty?: string
  category_name?: string
  category_emoji?: string
  word_count: number
  like_count: number
  comment_count: number
  is_liked?: boolean
  created_at: string
  updated_at: string
  author_name: string
  author_avatar?: string
  biography_slug?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
}

// --- 統一顯示型別 ---

type FeaturedContent =
  | (CoreStory & { type: 'core-story' })
  | (OneLiner & { type: 'one-liner' })
  | (Story & { type: 'story' })

/**
 * 選取故事，確保每個作者只出現一次
 * 優先選取讚數最高的，但同作者只取第一個
 */
function selectUniqueAuthors(items: FeaturedContent[], limit: number): FeaturedContent[] {
  const result: FeaturedContent[] = []
  const seenAuthors = new Set<string>()

  for (const item of items) {
    if (result.length >= limit) break
    if (!seenAuthors.has(item.biography_id)) {
      result.push(item)
      seenAuthors.add(item.biography_id)
    }
  }

  return result
}

// --- 子元件 ---

function StoryCard({ content, index }: { content: FeaturedContent; index: number }) {
  const router = useRouter()
  const displayName = content.author_name || '匿名'

  // 根據類型取得標籤和內容文字
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
          text: content.answer,
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
    // 對齊 Web：連結到 /story/{type}/{id}
    const typeMap = {
      'core-story': 'core-stories',
      'one-liner': 'one-liners',
      story: 'stories',
    } as const
    const routeType = typeMap[content.type]
    router.push(`/story/${routeType}/${content.id}` as any)
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
          <View
            style={[styles.skeletonText, { width: '100%', height: 60, marginTop: SPACING[2] }]}
          />
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

// --- 主元件 ---

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
      // 並行獲取三種類型的熱門內容
      const [coreStoriesRes, oneLinersRes, storiesRes] = await Promise.all([
        apiClient.get<ApiResponse<CoreStory[]>>('/content/popular/core-stories', {
          params: { limit: 4 },
        }),
        apiClient.get<ApiResponse<OneLiner[]>>('/content/popular/one-liners', {
          params: { limit: 4 },
        }),
        apiClient.get<ApiResponse<Story[]>>('/content/popular/stories', {
          params: { limit: 4 },
        }),
      ])

      const allContents: FeaturedContent[] = []

      const coreData = coreStoriesRes.data
      if (coreData?.success && coreData.data) {
        allContents.push(...coreData.data.map((item) => ({ ...item, type: 'core-story' as const })))
      }

      const oneLinerData = oneLinersRes.data
      if (oneLinerData?.success && oneLinerData.data) {
        allContents.push(
          ...oneLinerData.data.map((item) => ({ ...item, type: 'one-liner' as const }))
        )
      }

      const storyData = storiesRes.data
      if (storyData?.success && storyData.data) {
        allContents.push(...storyData.data.map((item) => ({ ...item, type: 'story' as const })))
      }

      // 根據 like_count 排序，選取不重複作者的前 3 個
      allContents.sort((a, b) => b.like_count - a.like_count)
      const uniqueAuthors = selectUniqueAuthors(allContents, 3)
      setStories(uniqueAuthors)
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
    router.push('/biography?tab=stories' as any)
  }

  if (!loading && stories.length === 0 && !error) {
    return null
  }

  return (
    <FadeIn>
      <View style={styles.container}>
        {/* 標題區 */}
        <View style={styles.header}>
          <Text style={styles.title}>看故事</Text>
          <Text style={styles.subtitle}>來自社群的真實攀岩故事與感悟</Text>
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
            keyExtractor={(item) => `${item.type}-${item.id}`}
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
            <Button variant="outline" onPress={handleViewMore}>
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
    lineHeight: 38,
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
