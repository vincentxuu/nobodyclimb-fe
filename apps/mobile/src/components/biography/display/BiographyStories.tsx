/**
 * BiographyStories 組件
 *
 * 故事列表展示，對應 apps/web/src/components/biography/display/BiographyStories.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native'
import { BookOpen } from 'lucide-react-native'
import Animated, { FadeInRight } from 'react-native-reanimated'

import { Text, Card } from '@/components/ui'
import { ContentInteractionBar } from './ContentInteractionBar'
import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'

// 類型定義
interface Story {
  id: string
  category_id?: string
  category_name?: string
  category_emoji?: string
  title?: string
  question_id?: string
  question_text?: string
  content: string
  like_count: number
  comment_count: number
  is_liked?: boolean
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
      // TODO: 整合 biographyContentService.getStories(biographyId)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // 模擬資料
      const mockData: Story[] = [
        {
          id: '1',
          category_id: 'growth',
          category_name: '成長故事',
          category_emoji: '🌱',
          title: '從入門到突破 5.10',
          content:
            '記得第一次踏進岩館，完全不知道怎麼開始。看著牆上五顏六色的點，手腳並用地往上爬，才發現原來攀岩是這麼有趣的運動。經過半年的練習，終於完成了人生第一條 5.10a！',
          like_count: 12,
          comment_count: 5,
          is_liked: true,
        },
        {
          id: '2',
          category_id: 'psychology',
          category_name: '心理挑戰',
          category_emoji: '🧠',
          title: '克服先鋒恐懼',
          content:
            '一開始對先鋒有很大的恐懼，總是擔心墜落。在朋友的鼓勵下，一步一步地練習，現在已經可以享受先鋒帶來的自由感了。',
          like_count: 8,
          comment_count: 3,
          is_liked: false,
        },
      ]

      setStories(mockData)
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    } finally {
      setIsLoading(false)
    }
  }, [biographyId])

  useEffect(() => {
    fetchStories()
  }, [fetchStories])

  // 按讚切換
  const handleToggleLike = async (storyId: string) => {
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
    const item = stories.find((i) => i.id === storyId)
    return {
      liked: !item?.is_liked,
      like_count: item?.is_liked ? (item?.like_count || 1) - 1 : (item?.like_count || 0) + 1,
    }
  }

  // 獲取留言
  const handleFetchComments = async (_storyId: string) => {
    return []
  }

  // 新增留言
  const handleAddComment = async (storyId: string, content: string) => {
    setStories((prev) =>
      prev.map((item) =>
        item.id === storyId
          ? { ...item, comment_count: item.comment_count + 1 }
          : item
      )
    )
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
