/**
 * ChapterAdvice 組件
 *
 * Chapter 4 - 給自己的話，對應 apps/web/src/components/biography/profile/ChapterAdvice.tsx
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { Lock } from 'lucide-react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

import { Text, Card } from '@/components/ui'
import { ContentInteractionBar } from '../display/ContentInteractionBar'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface CoreStory {
  id: string
  question_id: string
  content: string
  is_liked?: boolean
  like_count: number
  comment_count: number
  updated_at?: string
}

interface ChapterAdviceProps {
  biographyId: string
  personName?: string
  updatedAt?: string
}

/**
 * Chapter 4 - 給自己的話
 * 信件/便條紙風格設計
 */
export function ChapterAdvice({ biographyId, personName, updatedAt }: ChapterAdviceProps) {
  const [story, setStory] = useState<CoreStory | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 獲取故事
  const fetchStory = useCallback(async () => {
    try {
      // TODO: 整合 useAdviceToSelfStory hook
      await new Promise(resolve => setTimeout(resolve, 500))

      // 模擬資料
      setStory({
        id: '3',
        question_id: 'advice_to_self',
        content: '不要害怕失敗，每一次墜落都是學習。\n\n享受過程，不要只盯著難度數字。\n\n多認識社群裡的朋友，攀岩是一項很溫暖的運動。',
        like_count: 18,
        comment_count: 6,
        is_liked: false,
        updated_at: '2024-12-01T10:00:00Z',
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

  // 格式化日期
  const displayDate = useMemo(() => {
    const dateStr = story?.updated_at || updatedAt
    if (!dateStr) return null

    try {
      return new Date(dateStr).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    } catch {
      return null
    }
  }, [story?.updated_at, updatedAt])

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

  const isPlaceholder = !story?.content

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <View style={styles.content}>
        {/* 章節標題 */}
        <View style={styles.header}>
          <Text variant="small" fontWeight="600" style={styles.chapterText}>
            Chapter 4
          </Text>
          <Text variant="h3" fontWeight="600" style={styles.title}>
            給剛開始攀岩的自己
          </Text>
        </View>

        {/* 便條紙風格內容框 */}
        <Card style={styles.noteCard}>
          {/* 頂部裝飾線 */}
          <View style={styles.decorLine} />

          {isPlaceholder ? (
            <View style={styles.placeholderContainer}>
              <Lock size={18} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="body" color="textMuted">
                等這個人心情好再來問
              </Text>
            </View>
          ) : (
            <>
              <Text variant="body" color="textSubtle" style={styles.noteContent}>
                {story?.content}
              </Text>

              {/* 簽名 */}
              <View style={styles.signature}>
                <Text variant="body" fontWeight="500" color="textSubtle">
                  — {personName}
                </Text>
                {displayDate && (
                  <Text variant="small" color="textMuted">
                    {displayDate}
                  </Text>
                )}
              </View>

              {/* 互動按鈕 */}
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
        </Card>
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
    backgroundColor: '#F5F5F5',
  },
  content: {
    backgroundColor: '#F5F5F5',
    paddingVertical: SPACING.xl * 1.5,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  chapterText: {
    color: SEMANTIC_COLORS.textMain,
    marginBottom: SPACING.xs,
  },
  title: {
    textAlign: 'center',
  },
  noteCard: {
    backgroundColor: '#fff',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  decorLine: {
    position: 'absolute',
    top: -4,
    left: SPACING.lg,
    width: 64,
    height: 8,
    backgroundColor: '#FFE70C',
    borderRadius: 4,
  },
  placeholderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  noteContent: {
    lineHeight: 28,
    marginBottom: SPACING.lg,
  },
  signature: {
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
})

export default ChapterAdvice
