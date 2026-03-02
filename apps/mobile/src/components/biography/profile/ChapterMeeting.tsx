/**
 * ChapterMeeting 組件
 *
 * Chapter 1 - 相遇篇，對應 apps/web/src/components/biography/profile/ChapterMeeting.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { Lock } from 'lucide-react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'

import { Text } from '@/components/ui'
import { ContentInteractionBar } from '../display/ContentInteractionBar'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

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
      // TODO: 整合 useCoreStories hook
      await new Promise(resolve => setTimeout(resolve, 500))

      // 模擬資料
      setStory({
        id: '1',
        question_id: 'climbing_origin',
        content: '那是 2021 年的夏天，一位朋友邀請我去岩館體驗。一開始只是覺得好玩，後來發現攀岩不只是運動，更是一種與自己對話的方式。\n\n每一條路線都像是一道謎題，需要用身體和心靈去解開。',
        like_count: 15,
        comment_count: 8,
        is_liked: true,
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

  const isPlaceholder = !story?.content
  const paragraphs = story?.content?.split('\n').filter(p => p.trim()) || []

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
              <Animated.View
                key={index}
                entering={FadeInDown.delay(index * 100).duration(300)}
              >
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
    backgroundColor: '#FFE70C',
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
