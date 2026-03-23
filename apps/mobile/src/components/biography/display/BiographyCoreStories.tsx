/**
 * BiographyCoreStories 組件
 *
 * 核心故事展示，對應 apps/web/src/components/biography/display/BiographyCoreStories.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { Feather } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { apiClient } from '@/lib/api'
import { Text, Card } from '@/components/ui'
import { ContentInteractionBar } from './ContentInteractionBar'
import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'

// 類型定義
interface CoreStory {
  id: string
  question_id: string
  content: string
  title?: string
  subtitle?: string
  is_liked?: boolean
  like_count: number
  comment_count: number
}

interface BiographyCoreStoriesProps {
  /** 人物誌 ID */
  biographyId: string
  /** 自訂樣式 */
  style?: any
}

// 核心故事顯示順序
const CORE_STORY_ORDER = ['climbing_origin', 'climbing_meaning', 'advice_to_self']

/**
 * 核心故事卡片組件
 */
function CoreStoryCard({
  story,
  index,
  onToggleLike,
  onFetchComments,
  onAddComment,
}: {
  story: CoreStory
  index: number
  onToggleLike: () => Promise<{ liked: boolean; like_count: number }>
  onFetchComments: () => Promise<any[]>
  onAddComment: (content: string) => Promise<any>
}) {
  const displayTitle = story.title || story.question_id
  const displaySubtitle = story.subtitle || ''

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
      <Card style={styles.card}>
        {/* 標題區 */}
        <View style={styles.titleContainer}>
          <Text variant="body" fontWeight="600">
            {displayTitle}
          </Text>
          {displaySubtitle && (
            <Text variant="small" color="textMuted" style={styles.subtitle}>
              {displaySubtitle}
            </Text>
          )}
        </View>

        {/* 內容 */}
        <Text variant="body" color="textSubtle" style={styles.content}>
          {story.content}
        </Text>

        {/* 互動按鈕 */}
        <ContentInteractionBar
          contentType="core-stories"
          contentId={story.id}
          isLiked={story.is_liked || false}
          likeCount={story.like_count}
          commentCount={story.comment_count}
          onToggleLike={onToggleLike}
          onFetchComments={onFetchComments}
          onAddComment={onAddComment}
          size="md"
        />
      </Card>
    </Animated.View>
  )
}

/**
 * 核心故事展示組件
 *
 * 顯示用戶填寫的三個核心故事，支援按讚和留言
 */
export function BiographyCoreStories({
  biographyId,
  style,
}: BiographyCoreStoriesProps) {
  const [coreStories, setCoreStories] = useState<CoreStory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 獲取核心故事
  const fetchCoreStories = useCallback(async () => {
    try {
      const response = await apiClient.get(`/content/biographies/${biographyId}/core-stories`)
      const data: CoreStory[] = response.data?.data ?? response.data ?? []

      // 按照預定順序排序
      const sorted = [...data].sort((a, b) => {
        const aIndex = CORE_STORY_ORDER.indexOf(a.question_id)
        const bIndex = CORE_STORY_ORDER.indexOf(b.question_id)
        return aIndex - bIndex
      })

      setCoreStories(sorted)
    } catch (error) {
      console.error('Failed to fetch core stories:', error)
    } finally {
      setIsLoading(false)
    }
  }, [biographyId])

  useEffect(() => {
    fetchCoreStories()
  }, [fetchCoreStories])

  // 按讚切換
  const handleToggleLike = async (storyId: string) => {
    setCoreStories((prev) =>
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
    const item = coreStories.find((i) => i.id === storyId)
    return {
      liked: !item?.is_liked,
      like_count: item?.is_liked ? (item?.like_count || 1) - 1 : (item?.like_count || 0) + 1,
    }
  }

  // 獲取留言
  const handleFetchComments = async (storyId: string) => {
    try {
      const response = await apiClient.get(`/content/core-stories/${storyId}/comments`)
      return response.data?.data ?? response.data ?? []
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      return []
    }
  }

  // 新增留言
  const handleAddComment = async (storyId: string, content: string) => {
    setCoreStories((prev) =>
      prev.map((item) =>
        item.id === storyId
          ? { ...item, comment_count: item.comment_count + 1 }
          : item
      )
    )
    try {
      const response = await apiClient.post(`/content/core-stories/${storyId}/comments`, { content })
      return response.data?.data ?? response.data ?? { id: Date.now().toString(), content, created_at: new Date().toISOString() }
    } catch (error) {
      console.error('Failed to add comment:', error)
      // 回滾
      setCoreStories((prev) =>
        prev.map((item) =>
          item.id === storyId
            ? { ...item, comment_count: item.comment_count - 1 }
            : item
        )
      )
      return { id: Date.now().toString(), content, created_at: new Date().toISOString() }
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMuted} />
        </View>
      </View>
    )
  }

  if (coreStories.length === 0) {
    return null
  }

  return (
    <View style={[styles.container, style]}>
      {/* 標題 */}
      <View style={styles.header}>
        <Feather size={20} color={SEMANTIC_COLORS.textSubtle} />
        <Text variant="h4" fontWeight="700">
          我的故事
        </Text>
      </View>

      {/* 故事列表 */}
      <View style={styles.list}>
        {coreStories.map((story, index) => (
          <CoreStoryCard
            key={story.id}
            story={story}
            index={index}
            onToggleLike={() => handleToggleLike(story.id)}
            onFetchComments={() => handleFetchComments(story.id)}
            onAddComment={(content) => handleAddComment(story.id, content)}
          />
        ))}
      </View>
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
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  list: {
    gap: SPACING.md,
  },
  card: {
    padding: SPACING.md,
    backgroundColor: WB_COLORS[0],
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  titleContainer: {
    marginBottom: SPACING.md,
  },
  subtitle: {
    marginTop: 4,
  },
  content: {
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
})

export default BiographyCoreStories
