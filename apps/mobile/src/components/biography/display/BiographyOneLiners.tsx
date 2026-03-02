/**
 * BiographyOneLiners 組件
 *
 * 一句話系列展示，對應 apps/web/src/components/biography/display/BiographyOneLiners.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { MessageCircle, Sparkles } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, Card } from '@/components/ui'
import { ContentInteractionBar } from './ContentInteractionBar'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

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
      // TODO: 整合 biographyContentService.getOneLiners(biographyId)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // 模擬資料
      const mockData: OneLiner[] = [
        {
          id: '1',
          question_id: 'fear_overcome',
          question: '你如何克服攀岩中的恐懼？',
          answer: '深呼吸，相信自己的腳法，專注於下一個動作。',
          like_count: 5,
          comment_count: 2,
          is_liked: false,
        },
        {
          id: '2',
          question_id: 'favorite_route',
          question: '最難忘的路線是哪條？',
          answer: '龍洞的經典路線 Yellow Wall，完攀那刻的感動至今難忘。',
          like_count: 8,
          comment_count: 3,
          is_liked: true,
        },
        {
          id: '3',
          question_id: 'custom_question',
          question_text: '為什麼選擇先鋒攀登？',
          answer: '先鋒的自由度和挑戰性，讓我更能感受攀岩的純粹。',
          like_count: 3,
          comment_count: 1,
          is_liked: false,
        },
      ]

      // 過濾掉核心故事的問題
      const filtered = mockData.filter(
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
    // TODO: 整合 biographyContentService.toggleOneLinerLike(oneLinerId)
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
  const handleFetchComments = async (_oneLinerId: string) => {
    // TODO: 整合 biographyContentService.getOneLinerComments(oneLinerId)
    return []
  }

  // 新增留言
  const handleAddComment = async (oneLinerId: string, content: string) => {
    // TODO: 整合 biographyContentService.addOneLinerComment(oneLinerId, { content })
    setOneLiners((prev) =>
      prev.map((item) =>
        item.id === oneLinerId
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
                  {isCustom && <Sparkles size={14} color="#FFE70C" />}
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DBD8D8',
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
