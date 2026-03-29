/**
 * ChapterMeeting 組件
 *
 * Chapter 1 - 相遇篇，對應 apps/web/src/components/biography/profile/ChapterMeeting.tsx
 */

import { BRAND_YELLOW, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Lock } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { Text } from '@/components/ui'
import { apiClient } from '@/lib/api'
import { ContentInteractionBar } from '../display/ContentInteractionBar'

interface CoreStory {
  id: string
  question_id: string
  content: string
  is_liked?: boolean
  like_count: number
  comment_count: number
}

interface ChapterMeetingProps {
  biographyId: string
}

/**
 * Chapter 1 - 相遇篇
 * 你與攀岩的相遇故事
 */
export function ChapterMeeting({ biographyId }: ChapterMeetingProps) {
  const [story, setStory] = useState<CoreStory | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 獲取故事
  const fetchStory = useCallback(async () => {
    try {
      const response = await apiClient.get(`/content/biographies/${biographyId}/core-stories`)
      const stories: CoreStory[] = response.data?.data ?? response.data ?? []
      const originStory = stories.find((s) => s.question_id === 'climbing_origin') ?? null
      setStory(originStory)
    } catch (error) {
      console.error('Failed to fetch story:', error)
    } finally {
      setIsLoading(false)
    }
  }, [biographyId])

  useEffect(() => {
    fetchStory()
  }, [fetchStory])

  // 按讚切換（呼叫後端 API）
  const handleToggleLike = async () => {
    if (!story) throw new Error('No story')
    // Optimistic update
    setStory((prev) =>
      prev
        ? {
            ...prev,
            is_liked: !prev.is_liked,
            like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count + 1,
          }
        : null
    )
    try {
      const response = await apiClient.post(`/content/core-stories/${story.id}/like`)
      const data = response.data?.data ?? response.data
      if (data) {
        setStory((prev) =>
          prev ? { ...prev, is_liked: data.liked, like_count: data.like_count } : null
        )
        return data
      }
    } catch (error) {
      // Rollback
      setStory((prev) =>
        prev
          ? {
              ...prev,
              is_liked: !prev.is_liked,
              like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count + 1,
            }
          : null
      )
      console.error('Failed to toggle like:', error)
    }
    return { liked: story.is_liked ?? false, like_count: story.like_count ?? 0 }
  }

  // 獲取留言（呼叫後端 API）
  const handleFetchComments = async () => {
    if (!story) return []
    try {
      const response = await apiClient.get(`/content/core-stories/${story.id}/comments`)
      return response.data?.data ?? response.data ?? []
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      return []
    }
  }

  // 新增留言（呼叫後端 API）
  const handleAddComment = async (content: string) => {
    if (!story) return { id: Date.now().toString(), content, created_at: new Date().toISOString() }
    try {
      const response = await apiClient.post(`/content/core-stories/${story.id}/comments`, {
        content,
      })
      const data = response.data?.data ?? response.data
      if (data) {
        setStory((prev) => (prev ? { ...prev, comment_count: prev.comment_count + 1 } : null))
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
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMuted} />
        </View>
      </View>
    )
  }

  const isPlaceholder = !story?.content
  const paragraphs = story?.content?.split('\n').filter((p) => p.trim()) || []

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* 章節標題 */}
      <View style={styles.header}>
        <View style={styles.chapterBadge}>
          <Text variant="small" fontWeight="600">
            Chapter 1
          </Text>
        </View>
        <Text variant="h3" fontWeight="700" style={styles.title}>
          你與攀岩的相遇
        </Text>
      </View>

      {/* 內容 */}
      <View style={styles.content}>
        {isPlaceholder ? (
          <View style={styles.placeholderContainer}>
            <Lock size={18} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="body" color="textMuted">
              成為岩友後解鎖相遇故事
            </Text>
          </View>
        ) : (
          <>
            {paragraphs.map((para, index) => (
              <Animated.View key={index} entering={FadeInDown.delay(index * 100).duration(300)}>
                <Text variant="body" color="textSubtle" style={styles.paragraph}>
                  {para}
                </Text>
              </Animated.View>
            ))}

            {story && (
              <ContentInteractionBar
                contentType="core-stories"
                contentId={story.id}
                isLiked={story.is_liked || false}
                likeCount={story.like_count}
                commentCount={story.comment_count}
                onToggleLike={handleToggleLike}
                onFetchComments={handleFetchComments}
                onAddComment={handleAddComment}
                size="md"
              />
            )}
          </>
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  header: {
    marginBottom: SPACING.lg,
  },
  chapterBadge: {
    alignSelf: 'flex-start',
    backgroundColor: BRAND_YELLOW[100],
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginBottom: SPACING.sm,
  },
  title: {
    color: SEMANTIC_COLORS.textMain,
  },
  content: {},
  paragraph: {
    lineHeight: 28,
    marginBottom: SPACING.md,
  },
  placeholderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
  },
})

export default ChapterMeeting
