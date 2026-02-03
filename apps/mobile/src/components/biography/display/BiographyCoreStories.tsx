/**
 * BiographyCoreStories 組件
 *
 * 核心故事展示，對應 apps/web/src/components/biography/display/BiographyCoreStories.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { Feather } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, Card } from '@/components/ui'
import { ContentInteractionBar } from './ContentInteractionBar'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

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
      // TODO: 整合 biographyContentService.getCoreStories(biographyId)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // 模擬資料
      const mockData: CoreStory[] = [
        {
          id: '1',
          question_id: 'climbing_origin',
          title: '你與攀岩的相遇',
          subtitle: '是什麼契機讓你開始攀岩？',
          content:
            '那是 2021 年的夏天，一位朋友邀請我去岩館體驗。一開始只是覺得好玩，後來發現攀岩不只是運動，更是一種與自己對話的方式。每一條路線都像是一道謎題，需要用身體和心靈去解開。',
          like_count: 15,
          comment_count: 8,
          is_liked: true,
        },
        {
          id: '2',
          question_id: 'climbing_meaning',
          title: '攀岩對你來說是什麼？',
          subtitle: '攀岩在你的人生中扮演什麼角色？',
          content:
            '攀岩教會我如何面對恐懼，如何在困境中找到出路。每次站在岩壁下，我都會被提醒：人生就像攀岩，不一定每次都能登頂，但每一步都值得珍惜。',
          like_count: 23,
          comment_count: 12,
          is_liked: false,
        },
        {
          id: '3',
          question_id: 'advice_to_self',
          title: '給剛開始攀岩的自己',
          subtitle: '如果能回到過去，你會給自己什麼建議？',
          content:
            '不要害怕失敗，每一次墜落都是學習。享受過程，不要只盯著難度數字。多認識社群裡的朋友，攀岩是一項很溫暖的運動。',
          like_count: 18,
          comment_count: 6,
          is_liked: false,
        },
      ]

      // 按照預定順序排序
      const sorted = [...mockData].sort((a, b) => {
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
  const handleFetchComments = async (_storyId: string) => {
    // TODO: 整合 biographyContentService.getCoreStoryComments(storyId)
    return []
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
    return { id: Date.now().toString(), content, created_at: new Date().toISOString() }
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EBEAEA',
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
