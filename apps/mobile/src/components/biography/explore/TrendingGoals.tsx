/**
 * TrendingGoals 組件
 *
 * 熱門目標排行，對應 apps/web/src/components/biography/explore/trending-goals.tsx
 */

import { BRAND_YELLOW, RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { Check, Flame, Home, MapPin, Mountain, Plus, Target, Users } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Avatar, Card, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

// 類型定義
interface TrendingItem {
  id: string
  title: string
  category: string
  target_grade?: string
  target_location?: string
  inspired_count?: number
  likes_count?: number
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

interface TrendingGoalsProps {
  searchTerm?: string
  filter?: string
  category?: string
  title?: string
  emptyMessage?: string
}

export function TrendingGoals({
  searchTerm,
  filter,
  category,
  title,
  emptyMessage,
}: TrendingGoalsProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [items, setItems] = useState<TrendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set())

  const loadTrendingItems = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get('/bucket-list/explore/trending', {
        params: { limit: 10 },
      })
      const rawData: TrendingItem[] = response.data?.data ?? response.data ?? []

      let filteredData = rawData

      // 依搜尋詞過濾
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        filteredData = filteredData.filter(
          (item) =>
            item.title.toLowerCase().includes(search) ||
            item.target_location?.toLowerCase().includes(search) ||
            item.author_name?.toLowerCase().includes(search)
        )
      }

      if (category) {
        filteredData = filteredData.filter((item) => item.category === category)
      }

      // 依分類過濾
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
      console.error('Failed to load trending items:', err)
      setError('載入熱門目標時發生錯誤')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filter, category])

  useEffect(() => {
    loadTrendingItems()
  }, [loadTrendingItems])

  const handleAddToList = async (itemId: string) => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    setAddingItems((prev) => new Set(prev).add(itemId))

    try {
      await apiClient.post(`/bucket-list/${itemId}/reference`)
      setAddedItems((prev) => new Set(prev).add(itemId))
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, inspired_count: (item.inspired_count || 0) + 1 } : item
        )
      )
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } }
      if (error?.response?.status === 409) {
        setAddedItems((prev) => new Set(prev).add(itemId))
      } else {
        console.error('Failed to add to list:', err)
      }
    } finally {
      setAddingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const getCategoryLabel = (category: string) => {
    return BUCKET_LIST_CATEGORIES.find((c) => c.value === category)?.label || category
  }

  const getCategoryIcon = (category: string) => {
    if (category === 'outdoor_route' || category === 'adventure') {
      return <Mountain size={12} color={SEMANTIC_COLORS.textSubtle} />
    }
    return <Home size={12} color={SEMANTIC_COLORS.textSubtle} />
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
        <Flame size={24} color={WB_COLORS[100]} />
        <Text variant="h4" fontWeight="700">
          {title ?? '本週熱門目標'}
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text color="textSubtle">
            {emptyMessage ??
              (searchTerm ? `找不到符合「${searchTerm}」的熱門目標` : '目前沒有熱門目標')}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => (
            <Animated.View key={item.id} entering={FadeInDown.delay(index * 100).duration(400)}>
              <Card style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.cardMain}>
                    {/* 排名與標題 */}
                    <View style={styles.titleRow}>
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>{index + 1}</Text>
                      </View>
                      <View style={styles.titleContent}>
                        <Text variant="body" fontWeight="600">
                          {item.title}
                        </Text>
                        {item.target_grade && (
                          <Text variant="small" color="textSubtle">
                            {item.target_grade}
                          </Text>
                        )}
                      </View>
                      {/* 分類標籤 */}
                      <View style={styles.categoryTag}>
                        {getCategoryIcon(item.category)}
                        <Text variant="small" color="textSubtle">
                          {getCategoryLabel(item.category)}
                        </Text>
                      </View>
                    </View>

                    {/* 統計資訊 */}
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Users size={14} color={SEMANTIC_COLORS.textMuted} />
                        <Text variant="small" color="textMuted">
                          被 {item.inspired_count || 0} 人加入
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Target size={14} color={SEMANTIC_COLORS.textMuted} />
                        <Text variant="small" color="textMuted">
                          {item.likes_count || 0} 人已完成
                        </Text>
                      </View>
                      {item.target_location && (
                        <View style={styles.statItem}>
                          <MapPin size={14} color={SEMANTIC_COLORS.textMuted} />
                          <Text variant="small" color="textMuted">
                            {item.target_location}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 作者資訊 */}
                    {item.author_name && (
                      <Pressable
                        style={styles.authorRow}
                        onPress={() =>
                          router.push(
                            `/biography/profile/${item.author_slug || item.biography_id}` as any
                          )
                        }
                      >
                        <Avatar size="xs" />
                        <Text variant="small" color="textSubtle">
                          由 <Text fontWeight="500">{item.author_name}</Text> 設立
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {/* 加入按鈕 */}
                  <View style={styles.cardAction}>
                    <Pressable
                      style={[styles.addButton, addedItems.has(item.id) && styles.addButtonAdded]}
                      onPress={() => handleAddToList(item.id)}
                      disabled={addingItems.has(item.id) || addedItems.has(item.id)}
                    >
                      {addingItems.has(item.id) ? (
                        <ActivityIndicator size="small" color={WB_COLORS[0]} />
                      ) : addedItems.has(item.id) ? (
                        <>
                          <Check size={16} color={WB_COLORS[0]} />
                          <Text style={styles.addButtonText}>已加入</Text>
                        </>
                      ) : (
                        <>
                          <Plus size={16} color={SEMANTIC_COLORS.textMain} />
                          <Text style={styles.addButtonTextOutline}>加入</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
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
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardMain: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_YELLOW[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: WB_COLORS[100],
  },
  titleContent: {
    flex: 1,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  cardAction: {
    marginLeft: SPACING.sm,
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.textMain,
    backgroundColor: 'transparent',
  },
  addButtonAdded: {
    backgroundColor: SEMANTIC_COLORS.textMain,
    borderColor: SEMANTIC_COLORS.textMain,
  },
  addButtonText: {
    color: WB_COLORS[0],
    fontSize: 13,
    fontWeight: '500',
  },
  addButtonTextOutline: {
    color: SEMANTIC_COLORS.textMain,
    fontSize: 13,
    fontWeight: '500',
  },
})

export default TrendingGoals
