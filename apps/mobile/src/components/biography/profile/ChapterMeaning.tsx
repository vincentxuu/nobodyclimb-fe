/**
 * ChapterMeaning 組件
 *
 * Chapter 2 - 意義篇，對應 apps/web/src/components/biography/profile/ChapterMeaning.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

import { Text } from '@/components/ui'
import { ContentInteractionBar } from '../display/ContentInteractionBar'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

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
      // TODO: 整合 useClimbingMeaningStory hook
      await new Promise(resolve => setTimeout(resolve, 500))

      // 模擬資料
      setStory({
        id: '2',
        question_id: 'climbing_meaning',
        content: '攀岩教會我如何面對恐懼，如何在困境中找到出路。每次站在岩壁下，我都會被提醒：人生就像攀岩，不一定每次都能登頂，但每一步都值得珍惜。',
        like_count: 23,
        comment_count: 12,
        is_liked: false,
      })
    } catch (error) {
      console.error('Failed to fetch story:', error)
    } finally {
      setIsLoading(false)
    }
  }, [biographyId])

  useEffect(() => {
    fetchStory()
  }, [fetchStory])

  // 按讚切換
  const handleToggleLike = async () => {
    if (!story) throw new Error('No story')
    setStory(prev => prev ? {
      ...prev,
      is_liked: !prev.is_liked,
      like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count + 1,
    } : null)
    return {
      liked: !story.is_liked,
      like_count: story.is_liked ? story.like_count - 1 : story.like_count + 1,
    }
  }

  // 獲取留言
  const handleFetchComments = async () => {
    return []
  }

  // 新增留言
  const handleAddComment = async (content: string) => {
    if (story) {
      setStory(prev => prev ? { ...prev, comment_count: prev.comment_count + 1 } : null)
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
    backgroundColor: '#FFE70C',
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
