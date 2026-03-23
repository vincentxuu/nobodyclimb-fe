/**
 * BiographyOneLiners 組件
 *
 * 一句話系列展示，對應 apps/web/src/components/biography/display/BiographyOneLiners.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { MessageCircle, Sparkles } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { apiClient } from '@/lib/api'
import { Text, Card } from '@/components/ui'
import { ContentInteractionBar } from './ContentInteractionBar'
import { BRAND_YELLOW, RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'

// 類型定義
interface OneLiner {
  id: string
  question_id: string
  question?: string
  question_text?: string
  answer: string
  like_count: number
  comment_count: number
  is_liked?: boolean
}

interface BiographyOneLinersProps {
  biographyId: string
}

// 核心故事問題 ID，不需要在一句話中重複顯示
const CORE_QUESTION_IDS = new Set([
  'climbing_origin',
  'climbing_meaning',
  'advice_to_self',
])

/**
 * 一句話系列展示組件
 */
export function BiographyOneLiners({ biographyId }: BiographyOneLinersProps) {
  const [oneLiners, setOneLiners] = useState<OneLiner[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 獲取一句話列表
  const fetchOneLiners = useCallback(async () => {
    try {
      const response = await apiClient.get(`/content/biographies/${biographyId}/one-liners`)
      const data: OneLiner[] = response.data?.data ?? response.data ?? []

      // 過濾掉核心故事的問題
      const filtered = data.filter(
        (item) => !CORE_QUESTION_IDS.has(item.question_id)
      )
      setOneLiners(filtered)
    } catch (error) {
      console.error('Failed to fetch one-liners:', error)
    } finally {
      setIsLoading(false)
    }
  }, [biographyId])

  useEffect(() => {
    fetchOneLiners()
  }, [fetchOneLiners])

  // 按讚切換
  const handleToggleLike = async (oneLinerId: string) => {
    apiClient.post(`/content/one-liners/${oneLinerId}/like`).catch(console.error)
    setOneLiners((prev) =>
      prev.map((item) =>
        item.id === oneLinerId
          ? {
              ...item,
              is_liked: !item.is_liked,
              like_count: item.is_liked ? item.like_count - 1 : item.like_count + 1,
            }
          : item
      )
    )
    const item = oneLiners.find((i) => i.id === oneLinerId)
    return {
      liked: !item?.is_liked,
      like_count: item?.is_liked ? (item?.like_count || 1) - 1 : (item?.like_count || 0) + 1,
    }
  }

  // 獲取留言
  const handleFetchComments = async (oneLinerId: string) => {
    try {
      const response = await apiClient.get(`/content/one-liners/${oneLinerId}/comments`)
      return response.data?.data ?? response.data ?? []
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      return []
    }
  }

  // 新增留言
  const handleAddComment = async (oneLinerId: string, content: string) => {
    setOneLiners((prev) =>
      prev.map((item) =>
        item.id === oneLinerId
          ? { ...item, comment_count: item.comment_count + 1 }
          : item
      )
    )
    try {
      const response = await apiClient.post(`/content/one-liners/${oneLinerId}/comments`, { content })
      return response.data?.data ?? response.data ?? { id: Date.now().toString(), content, created_at: new Date().toISOString() }
    } catch (error) {
      console.error('Failed to add comment:', error)
      // 回滾
      setOneLiners((prev) =>
        prev.map((item) =>
          item.id === oneLinerId
            ? { ...item, comment_count: item.comment_count - 1 }
            : item
        )
      )
      return { id: Date.now().toString(), content, created_at: new Date().toISOString() }
    }
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

  if (oneLiners.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MessageCircle size={18} color={SEMANTIC_COLORS.textSubtle} />
        <Text variant="body" fontWeight="600">
          關於我
        </Text>
      </View>

      <View style={styles.list}>
        {oneLiners.map((item, index) => {
          const isCustom = !item.question // 自訂問題沒有系統問題文字
          const questionText = item.question || item.question_text || ''

          return (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 100).duration(400)}
            >
              <Card style={StyleSheet.flatten([styles.card, isCustom ? styles.customCard : undefined])}>
                <View style={styles.questionRow}>
                  {isCustom && <Sparkles size={14} color={BRAND_YELLOW[100]} />}
                  <Text variant="small" fontWeight="500" color="textMuted">
                    {questionText}
                  </Text>
                </View>
                <Text variant="body" style={styles.answer}>
                  「{item.answer}」
                </Text>

                {/* 互動按鈕 */}
                <ContentInteractionBar
                  contentType="one-liners"
                  contentId={item.id}
                  isLiked={item.is_liked || false}
                  likeCount={item.like_count}
                  commentCount={item.comment_count}
                  onToggleLike={() => handleToggleLike(item.id)}
                  onFetchComments={() => handleFetchComments(item.id)}
                  onAddComment={(content) => handleAddComment(item.id, content)}
                  showBorder={false}
                />
              </Card>
            </Animated.View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
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
    borderColor: WB_COLORS[30],
  },
  customCard: {
    backgroundColor: 'rgba(255, 231, 12, 0.05)',
    borderColor: 'rgba(255, 231, 12, 0.3)',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  answer: {
    color: SEMANTIC_COLORS.textMain,
  },
})

export default BiographyOneLiners
