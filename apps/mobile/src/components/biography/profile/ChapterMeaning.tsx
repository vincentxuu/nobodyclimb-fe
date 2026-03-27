/**
 * ChapterMeaning 組件
 *
 * Chapter 2 - 意義篇，對應 apps/web/src/components/biography/profile/ChapterMeaning.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

import { Text } from '@/components/ui'
import { apiClient } from '@/lib/api'
import { ContentInteractionBar } from '../display/ContentInteractionBar'
import { BRAND_YELLOW, RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

/** 預設的攀岩意義文字 */
const DEFAULT_CLIMBING_MEANING = '這題還在想，等我爬完這條再說'

interface CoreStory {
  id: string
  question_id: string
  content: string
  is_liked?: boolean
  like_count: number
  comment_count: number
}

interface ChapterMeaningProps {
  biographyId: string
  personName?: string
}

/**
 * Chapter 2 - 意義篇
 * 攀岩對你來說是什麼 - 引言式設計
 */
export function ChapterMeaning({ biographyId, personName }: ChapterMeaningProps) {
  const [story, setStory] = useState<CoreStory | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 獲取故事
  const fetchStory = useCallback(async () => {
    try {
      const response = await apiClient.get(`/content/biographies/${biographyId}/core-stories`)
      const stories: CoreStory[] = response.data?.data ?? response.data ?? []
      const meaningStory = stories.find((s) => s.question_id === 'climbing_meaning') ?? null
      setStory(meaningStory)
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
    setStory(prev => prev ? {
      ...prev,
      is_liked: !prev.is_liked,
      like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count + 1,
    } : null)
    try {
      const response = await apiClient.post(`/content/core-stories/${story.id}/like`)
      const data = response.data?.data ?? response.data
      if (data) {
        setStory(prev => prev ? { ...prev, is_liked: data.liked, like_count: data.like_count } : null)
        return data
      }
    } catch (error) {
      // Rollback
      setStory(prev => prev ? {
        ...prev,
        is_liked: !prev.is_liked,
        like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count + 1,
      } : null)
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
      const response = await apiClient.post(`/content/core-stories/${story.id}/comments`, { content })
      const data = response.data?.data ?? response.data
      if (data) {
        setStory(prev => prev ? { ...prev, comment_count: prev.comment_count + 1 } : null)
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

  const displayMeaning = story?.content || DEFAULT_CLIMBING_MEANING
  const isDefault = !story?.content

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <View style={styles.content}>
        {/* 章節標題 */}
        <View style={styles.chapterBadge}>
          <Text variant="small" fontWeight="600">
            Chapter 2
          </Text>
        </View>
        <Text variant="h3" fontWeight="600" style={styles.title}>
          攀岩對你來說是什麼
        </Text>

        {/* 引言框 */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteMarkLeft}>&ldquo;</Text>
          <Text
            variant="body"
            style={[styles.quoteText, isDefault && styles.quoteTextDefault]}
          >
            {displayMeaning}
          </Text>
          <Text style={styles.quoteMarkRight}>&rdquo;</Text>
        </View>

        {/* 簽名 */}
        <Text variant="body" color="textSubtle" style={styles.signature}>
          — {personName}
        </Text>

        {/* 互動按鈕 */}
        {story && !isDefault && (
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
            showBorder={false}
            centered
          />
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.lg,
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 231, 12, 0.1)',
  },
  content: {
    backgroundColor: 'rgba(255, 231, 12, 0.1)',
    paddingVertical: SPACING.xl * 1.5,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  chapterBadge: {
    backgroundColor: BRAND_YELLOW[100],
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginBottom: SPACING.sm,
  },
  title: {
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  quoteContainer: {
    position: 'relative',
    paddingHorizontal: SPACING.lg,
  },
  quoteMarkLeft: {
    position: 'absolute',
    left: -10,
    top: -20,
    fontSize: 48,
    color: 'rgba(255, 231, 12, 0.5)',
    fontWeight: '700',
  },
  quoteMarkRight: {
    position: 'absolute',
    right: -10,
    bottom: -30,
    fontSize: 48,
    color: 'rgba(255, 231, 12, 0.5)',
    fontWeight: '700',
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 28,
    textAlign: 'center',
    color: SEMANTIC_COLORS.textMain,
  },
  quoteTextDefault: {
    color: SEMANTIC_COLORS.textMuted,
  },
  signature: {
    marginTop: SPACING.xl,
  },
})

export default ChapterMeaning
