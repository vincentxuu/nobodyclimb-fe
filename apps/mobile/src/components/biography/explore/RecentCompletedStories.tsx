/**
 * RecentCompletedStories 組件
 *
 * 最新完成故事，對應 apps/web/src/components/biography/explore/recent-completed-stories.tsx
 */
import React, { useEffect, useState, useCallback } from 'react'
import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  Sparkles,
  Mountain,
  MessageCircle,
  Link as LinkIcon,
  Clock,
  Brain,
  ChevronRight,
} from 'lucide-react-native'

import { Text, Card, Avatar } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 類型定義
interface CompletedItem {
  id: string
  title: string
  category: string
  target_location?: string
  completion_story?: string
  psychological_insights?: string
  technical_insights?: string
  completed_at?: string
  likes_count?: number
  comments_count?: number
  inspired_count?: number
  biography_id?: string
  author_name?: string
  author_avatar?: string | null
  author_slug?: string
}

// 分類標籤
const BUCKET_LIST_CATEGORIES = [
  { value: 'outdoor_route', label: '戶外路線' },
  { value: 'indoor_grade', label: '室內難度' },
  { value: 'competition', label: '比賽' },
  { value: 'training', label: '訓練' },
  { value: 'adventure', label: '冒險' },
  { value: 'skill', label: '技巧' },
  { value: 'injury_recovery', label: '傷後復健' },
  { value: 'other', label: '其他' },
]

interface RecentCompletedStoriesProps {
  searchTerm?: string
  filter?: string
}

export function RecentCompletedStories({ searchTerm, filter }: RecentCompletedStoriesProps) {
  const router = useRouter()
  const [items, setItems] = useState<CompletedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecentCompleted = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // TODO: 整合 bucketListService.getRecentCompleted(10)
      await new Promise((resolve) => setTimeout(resolve, 500))

      const mockData: CompletedItem[] = [
        {
          id: '1',
          title: '完攀人生第一條 5.11',
          category: 'outdoor_route',
          target_location: '龍洞',
          completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          psychological_insights: '克服了對先鋒的恐懼，終於突破心理障礙',
          technical_insights: '腳點的選擇很重要，要相信自己的腳法',
          likes_count: 15,
          comments_count: 8,
          inspired_count: 5,
          author_name: '攀岩小明',
          author_slug: 'xiaoming',
        },
        {
          id: '2',
          title: '抱石 V5 穩定完成',
          category: 'indoor_grade',
          completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          completion_story: '經過三個月的訓練，終於能穩定完成 V5 路線了！',
          likes_count: 10,
          comments_count: 3,
          inspired_count: 8,
          author_name: '抱石達人',
          author_slug: 'boulderer',
        },
      ]

      let filteredData = mockData

      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        filteredData = filteredData.filter(
          (item) =>
            item.title.toLowerCase().includes(search) ||
            item.completion_story?.toLowerCase().includes(search) ||
            item.author_name?.toLowerCase().includes(search)
        )
      }

      if (filter && filter !== 'all') {
        const categoryMap: Record<string, string[]> = {
          growth: ['training', 'skill'],
          experience: ['outdoor_route', 'indoor_grade', 'adventure'],
          recovery: ['injury_recovery'],
          footprint: ['adventure'],
        }
        const categories = categoryMap[filter] || []
        if (categories.length > 0) {
          filteredData = filteredData.filter((item) => categories.includes(item.category))
        }
      }

      setItems(filteredData)
    } catch (err) {
      console.error('Failed to load recent completed:', err)
      setError('載入最新完成故事時發生錯誤')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filter])

  useEffect(() => {
    loadRecentCompleted()
  }, [loadRecentCompleted])

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} 分鐘前`
    if (diffHours < 24) return `${diffHours} 小時前`
    if (diffDays < 7) return `${diffDays} 天前`
    return date.toLocaleDateString('zh-TW')
  }

  const getCategoryLabel = (category: string) => {
    return BUCKET_LIST_CATEGORIES.find((c) => c.value === category)?.label || category
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text color="error">{error}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* 標題 */}
      <View style={styles.header}>
        <Sparkles size={24} color="#EAB308" />
        <Text variant="h4" fontWeight="700">
          最新完成故事
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text color="textSubtle">
            {searchTerm ? `找不到符合「${searchTerm}」的完成故事` : '目前沒有完成故事'}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => (
            <Animated.View key={item.id} entering={FadeInDown.delay(index * 100).duration(400)}>
              <Card style={styles.card}>
                {/* 作者與時間 */}
                <Pressable
                  style={styles.authorRow}
                  onPress={() =>
                    router.push(`/biography/${item.author_slug || item.biography_id}` as any)
                  }
                >
                  <View style={styles.authorInfo}>
                    <Avatar size="sm" source={item.author_avatar ? { uri: item.author_avatar } : undefined} />
                    <View>
                      <Text variant="body">
                        <Text fontWeight="500">{item.author_name}</Text>
                        <Text color="textSubtle"> 完成了「{item.title}」</Text>
                      </Text>
                    </View>
                  </View>
                  <View style={styles.timeRow}>
                    <Clock size={14} color={SEMANTIC_COLORS.textMuted} />
                    <Text variant="small" color="textMuted">
                      {formatTimeAgo(item.completed_at ?? null)}
                    </Text>
                  </View>
                </Pressable>

                {/* 分類標籤 */}
                <View style={styles.categoryRow}>
                  <View style={styles.categoryTag}>
                    <Mountain size={12} color={SEMANTIC_COLORS.textSubtle} />
                    <Text variant="small" color="textSubtle">
                      {getCategoryLabel(item.category)}
                      {item.target_location && ` · ${item.target_location}`}
                    </Text>
                  </View>
                </View>

                {/* 完成故事內容 */}
                {(item.psychological_insights || item.technical_insights) && (
                  <View style={styles.insightsContainer}>
                    {item.psychological_insights && (
                      <View style={[styles.insightCard, styles.insightCardBlue]}>
                        <View style={styles.insightHeader}>
                          <Brain size={14} color="#1D4ED8" />
                          <Text style={styles.insightLabel}>心理層面</Text>
                        </View>
                        <Text variant="small" numberOfLines={3} style={styles.insightText}>
                          {item.psychological_insights}
                        </Text>
                      </View>
                    )}
                    {item.technical_insights && (
                      <View style={[styles.insightCard, styles.insightCardGreen]}>
                        <View style={styles.insightHeader}>
                          <Mountain size={14} color="#15803D" />
                          <Text style={styles.insightLabelGreen}>技術層面</Text>
                        </View>
                        <Text variant="small" numberOfLines={3} style={styles.insightText}>
                          {item.technical_insights}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* 完成故事摘要 */}
                {item.completion_story && !item.psychological_insights && !item.technical_insights && (
                  <View style={styles.storyContainer}>
                    <Text variant="body" numberOfLines={3} color="textSubtle">
                      {item.completion_story}
                    </Text>
                  </View>
                )}

                {/* 互動資訊 */}
                <View style={styles.footer}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Mountain size={14} color={SEMANTIC_COLORS.textMuted} />
                      <Text variant="small" color="textMuted">
                        {item.likes_count || 0}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <MessageCircle size={14} color={SEMANTIC_COLORS.textMuted} />
                      <Text variant="small" color="textMuted">
                        {item.comments_count || 0}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <LinkIcon size={14} color={SEMANTIC_COLORS.textMuted} />
                      <Text variant="small" color="textMuted">
                        {item.inspired_count || 0} 人也加入
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.viewButton}
                    onPress={() =>
                      router.push(`/biography/${item.author_slug || item.biography_id}` as any)
                    }
                  >
                    <Text variant="small" color="textSubtle">
                      查看完整故事
                    </Text>
                    <ChevronRight size={16} color={SEMANTIC_COLORS.textSubtle} />
                  </Pressable>
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    gap: SPACING.md,
  },
  card: {
    padding: SPACING.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryRow: {
    marginBottom: SPACING.md,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  insightsContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  insightCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  insightCardBlue: {
    backgroundColor: '#EFF6FF',
  },
  insightCardGreen: {
    backgroundColor: '#F0FDF4',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  insightLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1D4ED8',
  },
  insightLabelGreen: {
    fontSize: 13,
    fontWeight: '500',
    color: '#15803D',
  },
  insightText: {
    color: SEMANTIC_COLORS.textSubtle,
  },
  storyContainer: {
    marginBottom: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
})

export default RecentCompletedStories
