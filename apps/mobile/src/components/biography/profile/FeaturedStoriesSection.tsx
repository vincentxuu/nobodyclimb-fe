/**
 * FeaturedStoriesSection 組件
 *
 * 精選故事區塊，對應 apps/web/src/components/biography/profile/FeaturedStoriesSection.tsx
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { StyleSheet, View, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native'
import Animated, { FadeInRight } from 'react-native-reanimated'

import { Text, Card } from '@/components/ui'
import { apiClient } from '@/lib/api'
import { ContentInteractionBar } from '../display/ContentInteractionBar'
import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'

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

interface Biography {
  id: string
  name: string
}

interface FeaturedStoriesSectionProps {
  person: Biography
}

// 分類顏色映射
const STORY_CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  sys_cat_growth: { bg: 'rgba(255, 231, 12, 0.2)', text: WB_COLORS[100] },
  sys_cat_psychology: { bg: '#FFF9E6', text: WB_COLORS[100] },
  sys_cat_community: { bg: 'rgba(255, 231, 12, 0.2)', text: WB_COLORS[100] },
  sys_cat_practical: { bg: '#FFF9E6', text: WB_COLORS[100] },
  sys_cat_dreams: { bg: 'rgba(255, 231, 12, 0.2)', text: WB_COLORS[100] },
  sys_cat_life: { bg: '#FFF9E6', text: WB_COLORS[100] },
}

/**
 * 精選故事區塊
 * 從 biography_stories 表取得資料，挑選 3-5 個最精彩的故事展示
 */
export function FeaturedStoriesSection({ person }: FeaturedStoriesSectionProps) {
  const { width: screenWidth } = useWindowDimensions()
  const cardWidth = screenWidth * 0.75
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 從 API 獲取所有小故事（與 Web 一致，取全部後做智能選擇）
  const fetchStories = useCallback(async () => {
    try {
      const response = await apiClient.get(`/content/biographies/${person.id}/stories`)
      const data: Story[] = response.data?.data ?? response.data ?? []
      setStories(data)
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    } finally {
      setIsLoading(false)
    }
  }, [person.id])

  useEffect(() => {
    fetchStories()
  }, [fetchStories])

  // 按讚切換（呼叫後端 API）
  const handleToggleLike = useCallback(async (storyId: string) => {
    // Optimistic update
    setStories(prev =>
      prev.map(item =>
        item.id === storyId
          ? { ...item, is_liked: !item.is_liked, like_count: item.is_liked ? item.like_count - 1 : item.like_count + 1 }
          : item
      )
    )
    try {
      const response = await apiClient.post(`/content/stories/${storyId}/like`)
      const data = response.data?.data ?? response.data
      if (data) {
        setStories(prev =>
          prev.map(item =>
            item.id === storyId
              ? { ...item, is_liked: data.liked, like_count: data.like_count }
              : item
          )
        )
        return data
      }
    } catch (error) {
      // Rollback
      setStories(prev =>
        prev.map(item =>
          item.id === storyId
            ? { ...item, is_liked: !item.is_liked, like_count: item.is_liked ? item.like_count - 1 : item.like_count + 1 }
            : item
        )
      )
      console.error('Failed to toggle like:', error)
    }
    const item = stories.find(i => i.id === storyId)
    return { liked: item?.is_liked ?? false, like_count: item?.like_count ?? 0 }
  }, [stories])

  // 獲取留言（呼叫後端 API）
  const handleFetchComments = useCallback(async (storyId: string) => {
    try {
      const response = await apiClient.get(`/content/stories/${storyId}/comments`)
      return response.data?.data ?? response.data ?? []
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      return []
    }
  }, [])

  // 新增留言（呼叫後端 API）
  const handleAddComment = useCallback(async (storyId: string, content: string) => {
    try {
      const response = await apiClient.post(`/content/stories/${storyId}/comments`, { content })
      const data = response.data?.data ?? response.data
      if (data) {
        setStories(prev =>
          prev.map(item =>
            item.id === storyId
              ? { ...item, comment_count: item.comment_count + 1 }
              : item
          )
        )
        return data
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
    return { id: Date.now().toString(), content, created_at: new Date().toISOString() }
  }, [])

  // 智能選擇精選故事：優先選擇不同類別（與 Web 一致）
  const featuredStories = useMemo(() => {
    if (stories.length === 0) return []

    // 按類別分組
    const storiesByCategory = stories.reduce((acc, story) => {
      const categoryId = story.category_id || 'uncategorized'
      if (!acc[categoryId]) {
        acc[categoryId] = []
      }
      acc[categoryId].push(story)
      return acc
    }, {} as Record<string, Story[]>)

    const selected: Story[] = []
    const categories = Object.keys(storiesByCategory)
    let categoryIndex = 0

    // 輪流從每個類別選一個故事，直到選滿 5 個
    while (selected.length < 5 && selected.length < stories.length) {
      const category = categories[categoryIndex % categories.length]
      const categoryStories = storiesByCategory[category]

      if (categoryStories && categoryStories.length > 0) {
        selected.push(categoryStories.shift()!)
      }

      // 如果該類別沒故事了，移除該類別
      if (!categoryStories || categoryStories.length === 0) {
        categories.splice(categoryIndex % categories.length, 1)
        if (categories.length === 0) break
      } else {
        categoryIndex++
      }
    }

    return selected
  }, [stories])

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMuted} />
        </View>
      </View>
    )
  }

  if (featuredStories.length === 0) return null

  return (
    <View style={styles.container}>
      <Text variant="h3" fontWeight="700" style={styles.sectionTitle}>
        精選小故事
      </Text>

      {/* 橫向滾動故事卡片 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={cardWidth + SPACING.md}
        decelerationRate="fast"
      >
        {featuredStories.map((story, index) => {
          const categoryId = story.category_id || 'sys_cat_growth'
          const colors = STORY_CATEGORY_COLORS[categoryId] || { bg: WB_COLORS[10], text: WB_COLORS[100] }

          return (
            <Animated.View
              key={story.id}
              entering={FadeInRight.delay(index * 50).duration(300)}
              style={[styles.cardWrapper, { width: cardWidth }]}
            >
              <Card style={styles.card}>
                {/* 分類標籤 */}
                {(story.category_id || story.category_name) && (
                  <View style={[styles.categoryTag, { backgroundColor: colors.bg }]}>
                    <Text variant="small" style={{ color: colors.text }}>
                      {story.category_emoji && `${story.category_emoji} `}
                      {story.category_name || '故事'}
                    </Text>
                  </View>
                )}

                {/* 標題 */}
                <Text variant="body" fontWeight="600" style={styles.title}>
                  {story.title}
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
                  showBorder={false}
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
    backgroundColor: '#F9F9F9',
    paddingVertical: SPACING.xl,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  sectionTitle: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
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
    minHeight: 220,
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
    marginBottom: SPACING.sm,
  },
})

export default FeaturedStoriesSection
