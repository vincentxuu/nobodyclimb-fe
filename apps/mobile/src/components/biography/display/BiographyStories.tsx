/**
 * BiographyStories 組件
 *
 * 故事列表展示，對應 apps/web/src/components/biography/display/BiographyStories.tsx
 */

import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { BookOpen } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, { FadeInRight } from 'react-native-reanimated'
import { Card, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'
import { ContentInteractionBar } from './ContentInteractionBar'

// 類型定義
interface Story {
  id: string
  biography_id?: string
  category_id?: string
  category_name?: string
  category_emoji?: string
  title?: string
  subtitle?: string
  question_id?: string
  question_text?: string
  content: string
  difficulty?: string
  word_count?: number
  like_count: number
  comment_count: number
  is_liked?: boolean
  created_at?: string
  updated_at?: string
}

interface BiographyStoriesProps {
  biographyId: string
}

// 分類顏色映射
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  growth: { bg: 'rgba(255, 231, 12, 0.2)', text: WB_COLORS[100] },
  psychology: { bg: '#FFF9E6', text: WB_COLORS[100] },
  community: { bg: 'rgba(255, 231, 12, 0.2)', text: WB_COLORS[100] },
  practical: { bg: '#FFF9E6', text: WB_COLORS[100] },
  dreams: { bg: 'rgba(255, 231, 12, 0.2)', text: WB_COLORS[100] },
  life: { bg: '#FFF9E6', text: WB_COLORS[100] },
}

/**
 * 故事列表展示組件
 */
export function BiographyStories({ biographyId }: BiographyStoriesProps) {
  const { width: screenWidth } = useWindowDimensions()
  const cardWidth = screenWidth * 0.8
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 獲取故事列表
  const fetchStories = useCallback(async () => {
    try {
      const response = await apiClient.get(`/content/biographies/${biographyId}/stories`)
      const data: Story[] = response.data?.data ?? response.data ?? []
      setStories(data)
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    } finally {
      setIsLoading(false)
    }
  }, [biographyId])

  useEffect(() => {
    fetchStories()
  }, [fetchStories])

  // 按讚切換（呼叫後端 API）
  const handleToggleLike = async (storyId: string) => {
    // 先做 optimistic update
    setStories((prev) =>
      prev.map((item) =>
        item.id === storyId
          ? {
              ...item,
              is_liked: !item.is_liked,
              like_count: item.is_liked ? item.like_count - 1 : item.like_count + 1,
            }
          : item
      )
    )
    try {
      const response = await apiClient.post(`/content/stories/${storyId}/like`)
      const data = response.data?.data ?? response.data
      if (data) {
        // 用後端回傳的真實值覆蓋
        setStories((prev) =>
          prev.map((item) =>
            item.id === storyId
              ? { ...item, is_liked: data.liked, like_count: data.like_count }
              : item
          )
        )
        return data
      }
    } catch (error) {
      // rollback
      setStories((prev) =>
        prev.map((item) =>
          item.id === storyId
            ? {
                ...item,
                is_liked: !item.is_liked,
                like_count: item.is_liked ? item.like_count - 1 : item.like_count + 1,
              }
            : item
        )
      )
      console.error('Failed to toggle like:', error)
    }
    const item = stories.find((i) => i.id === storyId)
    return {
      liked: item?.is_liked ?? false,
      like_count: item?.like_count ?? 0,
    }
  }

  // 獲取留言（呼叫後端 API）
  const handleFetchComments = async (storyId: string) => {
    try {
      const response = await apiClient.get(`/content/stories/${storyId}/comments`)
      return response.data?.data ?? response.data ?? []
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      return []
    }
  }

  // 新增留言（呼叫後端 API）
  const handleAddComment = async (storyId: string, content: string) => {
    try {
      const response = await apiClient.post(`/content/stories/${storyId}/comments`, { content })
      const data = response.data?.data ?? response.data
      if (data) {
        setStories((prev) =>
          prev.map((item) =>
            item.id === storyId ? { ...item, comment_count: item.comment_count + 1 } : item
          )
        )
        return data
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
    return { id: Date.now().toString(), content, created_at: new Date().toISOString() }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMuted} />
        </View>
      </View>
    )
  }

  if (stories.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BookOpen size={20} color={SEMANTIC_COLORS.textSubtle} />
          <Text variant="h4" fontWeight="700">
            小故事
          </Text>
        </View>
        <Text variant="small" color="textMuted">
          已分享 {stories.length} 則故事
        </Text>
      </View>

      {/* 故事橫向滾動 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={cardWidth + SPACING.md}
        decelerationRate="fast"
      >
        {stories.map((story, index) => {
          const categoryId = story.category_id || 'growth'
          const colors = CATEGORY_COLORS[categoryId] || { bg: WB_COLORS[10], text: WB_COLORS[70] }
          const title = story.title || story.question_text || story.question_id
          const categoryName = story.category_name || '故事'

          return (
            <Animated.View
              key={story.id}
              entering={FadeInRight.delay(index * 100).duration(400)}
              style={[styles.cardWrapper, { width: cardWidth }]}
            >
              <Card style={styles.card}>
                {/* 分類標籤 */}
                <View style={[styles.categoryTag, { backgroundColor: colors.bg }]}>
                  <Text variant="small" style={{ color: colors.text }}>
                    {story.category_emoji && `${story.category_emoji} `}
                    {categoryName}
                  </Text>
                </View>

                {/* 標題 */}
                <Text variant="body" fontWeight="600" style={styles.title}>
                  {title}
                </Text>

                {/* 內容 */}
                <Text variant="body" color="textSubtle" style={styles.content}>
                  {story.content}
                </Text>

                {/* 互動按鈕 */}
                <ContentInteractionBar
                  contentType="stories"
                  contentId={story.id}
                  isLiked={story.is_liked || false}
                  likeCount={story.like_count}
                  commentCount={story.comment_count}
                  onToggleLike={() => handleToggleLike(story.id)}
                  onFetchComments={() => handleFetchComments(story.id)}
                  onAddComment={(content) => handleAddComment(story.id, content)}
                />
              </Card>
            </Animated.View>
          )
        })}
      </ScrollView>
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
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  scrollContent: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.xl,
    gap: SPACING.md,
  },
  cardWrapper: {
    flexShrink: 0,
  },
  card: {
    padding: SPACING.md,
    backgroundColor: WB_COLORS[0],
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    minHeight: 200,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  title: {
    marginBottom: SPACING.sm,
  },
  content: {
    flex: 1,
    lineHeight: 22,
  },
})

export default BiographyStories
