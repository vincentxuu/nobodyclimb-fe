/**
 * FeaturedStoriesSection 組件
 *
 * 精選故事區塊，對應 apps/web/src/components/biography/profile/FeaturedStoriesSection.tsx
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { StyleSheet, View, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native'
import Animated, { FadeInRight } from 'react-native-reanimated'

import { Text, Card } from '@/components/ui'
import { ContentInteractionBar } from '../display/ContentInteractionBar'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 類型定義
interface Story {
  id: string
  category_id?: string
  category_name?: string
  title?: string
  content: string
  like_count: number
  comment_count: number
  is_liked?: boolean
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
  sys_cat_growth: { bg: 'rgba(255, 231, 12, 0.2)', text: '#1B1A1A' },
  sys_cat_psychology: { bg: '#FFF9E6', text: '#1B1A1A' },
  sys_cat_community: { bg: 'rgba(255, 231, 12, 0.2)', text: '#1B1A1A' },
  sys_cat_practical: { bg: '#FFF9E6', text: '#1B1A1A' },
  sys_cat_dreams: { bg: 'rgba(255, 231, 12, 0.2)', text: '#1B1A1A' },
  sys_cat_life: { bg: '#FFF9E6', text: '#1B1A1A' },
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

  // 從 API 獲取小故事
  const fetchStories = useCallback(async () => {
    try {
      // TODO: 整合 biographyContentService.getStories(person.id)
      await new Promise(resolve => setTimeout(resolve, 500))

      // 模擬資料
      setStories([
        {
          id: '1',
          category_id: 'sys_cat_growth',
          category_name: '成長故事',
          title: '從入門到突破 5.10',
          content: '記得第一次踏進岩館，完全不知道怎麼開始。看著牆上五顏六色的點，手腳並用地往上爬，才發現原來攀岩是這麼有趣的運動。',
          like_count: 12,
          comment_count: 5,
          is_liked: true,
        },
        {
          id: '2',
          category_id: 'sys_cat_psychology',
          category_name: '心理挑戰',
          title: '克服先鋒恐懼',
          content: '一開始對先鋒有很大的恐懼，總是擔心墜落。在朋友的鼓勵下，一步一步地練習，現在已經可以享受先鋒帶來的自由感了。',
          like_count: 8,
          comment_count: 3,
          is_liked: false,
        },
        {
          id: '3',
          category_id: 'sys_cat_community',
          category_name: '社群故事',
          title: '岩館認識的好朋友',
          content: '攀岩讓我認識了很多志同道合的朋友，大家一起練習、互相鼓勵，這種感覺真的很棒。',
          like_count: 15,
          comment_count: 7,
          is_liked: false,
        },
      ])
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    } finally {
      setIsLoading(false)
    }
  }, [person.id])

  useEffect(() => {
    fetchStories()
  }, [fetchStories])

  // 按讚切換
  const handleToggleLike = useCallback(async (storyId: string) => {
    setStories(prev =>
      prev.map(item =>
        item.id === storyId
          ? { ...item, is_liked: !item.is_liked, like_count: item.is_liked ? item.like_count - 1 : item.like_count + 1 }
          : item
      )
    )
    const item = stories.find(i => i.id === storyId)
    return {
      liked: !item?.is_liked,
      like_count: item?.is_liked ? (item?.like_count || 1) - 1 : (item?.like_count || 0) + 1,
    }
  }, [stories])

  // 獲取留言
  const handleFetchComments = useCallback(async (_storyId: string) => {
    return []
  }, [])

  // 新增留言
  const handleAddComment = useCallback(async (storyId: string, content: string) => {
    setStories(prev =>
      prev.map(item =>
        item.id === storyId
          ? { ...item, comment_count: item.comment_count + 1 }
          : item
      )
    )
    return { id: Date.now().toString(), content, created_at: new Date().toISOString() }
  }, [])

  // 智能選擇精選故事
  const featuredStories = useMemo(() => {
    if (stories.length === 0) return []
    return stories.slice(0, 5)
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
          const colors = STORY_CATEGORY_COLORS[categoryId] || { bg: '#F5F5F5', text: '#1B1A1A' }

          return (
            <Animated.View
              key={story.id}
              entering={FadeInRight.delay(index * 50).duration(300)}
              style={[styles.cardWrapper, { width: cardWidth }]}
            >
              <Card style={styles.card}>
                {/* 分類標籤 */}
                {story.category_name && (
                  <View style={[styles.categoryTag, { backgroundColor: colors.bg }]}>
                    <Text variant="small" style={{ color: colors.text }}>
                      {story.category_name}
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EBEAEA',
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
