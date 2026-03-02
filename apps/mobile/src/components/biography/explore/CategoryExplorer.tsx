/**
 * CategoryExplorer 組件
 *
 * 依分類探索，對應 apps/web/src/components/biography/explore/category-explorer.tsx
 */
import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import Animated, { FadeIn } from 'react-native-reanimated'
import {
  Lightbulb,
  Mountain,
  Target,
  Dumbbell,
  Trophy,
  Plane,
  BookOpen,
  ChevronRight,
} from 'lucide-react-native'

import { Text, Card } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 類型定義
type BucketListCategory =
  | 'outdoor_route'
  | 'indoor_grade'
  | 'competition'
  | 'training'
  | 'adventure'
  | 'skill'
  | 'injury_recovery'
  | 'other'

interface CategoryCount {
  category: BucketListCategory
  count: number
}

// 分類配置
const categoryConfig: Record<
  BucketListCategory,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  outdoor_route: { icon: Mountain, color: '#16A34A', bgColor: '#DCFCE7' },
  indoor_grade: { icon: Target, color: '#2563EB', bgColor: '#DBEAFE' },
  competition: { icon: Trophy, color: '#CA8A04', bgColor: '#FEF9C3' },
  training: { icon: Dumbbell, color: '#9333EA', bgColor: '#F3E8FF' },
  adventure: { icon: Plane, color: '#EA580C', bgColor: '#FFEDD5' },
  skill: { icon: BookOpen, color: '#4F46E5', bgColor: '#E0E7FF' },
  injury_recovery: { icon: Mountain, color: '#DC2626', bgColor: '#FEE2E2' },
  other: { icon: Lightbulb, color: '#6B7280', bgColor: '#F3F4F6' },
}

// 分類標籤
const BUCKET_LIST_CATEGORIES: { value: BucketListCategory; label: string }[] = [
  { value: 'outdoor_route', label: '戶外路線' },
  { value: 'indoor_grade', label: '室內難度' },
  { value: 'competition', label: '比賽' },
  { value: 'training', label: '訓練' },
  { value: 'adventure', label: '冒險' },
  { value: 'skill', label: '技巧' },
  { value: 'injury_recovery', label: '傷後復健' },
  { value: 'other', label: '其他' },
]

// 技巧經驗分享主題
const experienceTopics = [
  {
    id: 'fear',
    title: '克服恐懼經驗',
    description: '分享如何面對和克服攀岩中的恐懼',
    icon: Mountain,
    color: '#DB2777',
    bgColor: '#FCE7F3',
  },
  {
    id: 'recovery',
    title: '受傷復原故事',
    description: '受傷後的復健與重返岩壁的歷程',
    icon: Mountain,
    color: '#DC2626',
    bgColor: '#FEE2E2',
  },
  {
    id: 'experience',
    title: '攀登經驗分享',
    description: '難忘的攀登經歷與心得',
    icon: Mountain,
    color: '#16A34A',
    bgColor: '#DCFCE7',
  },
  {
    id: 'training',
    title: '訓練心得',
    description: '有效的訓練方法與技巧',
    icon: Dumbbell,
    color: '#9333EA',
    bgColor: '#F3E8FF',
  },
]

export function CategoryExplorer() {
  const router = useRouter()
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCategoryCounts = async () => {
      setLoading(true)
      try {
        // TODO: 整合 bucketListService.getCategoryCounts()
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 模擬資料
        setCategoryCounts([
          { category: 'outdoor_route', count: 45 },
          { category: 'indoor_grade', count: 32 },
          { category: 'training', count: 28 },
          { category: 'competition', count: 15 },
          { category: 'adventure', count: 12 },
          { category: 'skill', count: 20 },
          { category: 'injury_recovery', count: 8 },
          { category: 'other', count: 5 },
        ])
      } catch (err) {
        console.error('Failed to load category counts:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCategoryCounts()
  }, [])

  const getCategoryLabel = (category: BucketListCategory) => {
    return BUCKET_LIST_CATEGORIES.find((c) => c.value === category)?.label || category
  }

  const getCategoryConfig = (category: BucketListCategory) => {
    return categoryConfig[category] || categoryConfig.other
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* 技巧與經驗分享 */}
      <View style={styles.section}>
        <View style={styles.header}>
          <Lightbulb size={24} color="#F59E0B" />
          <Text variant="h4" fontWeight="700">
            技巧與經驗分享
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.topicsRow}>
            {experienceTopics.map((topic, index) => {
              const Icon = topic.icon
              return (
                <Animated.View key={topic.id} entering={FadeIn.delay(index * 50)}>
                  <Pressable
                    onPress={() => router.push(`/biography/explore/topic/${topic.id}` as any)}
                  >
                    <Card style={styles.topicCard}>
                      <View style={[styles.iconContainer, { backgroundColor: topic.bgColor }]}>
                        <Icon size={20} color={topic.color} />
                      </View>
                      <Text variant="body" fontWeight="600" style={styles.topicTitle}>
                        {topic.title}
                      </Text>
                      <Text variant="small" color="textMuted" numberOfLines={2}>
                        {topic.description}
                      </Text>
                      <View style={styles.exploreRow}>
                        <Text variant="small" color="textSubtle">
                          探索
                        </Text>
                        <ChevronRight size={14} color={SEMANTIC_COLORS.textSubtle} />
                      </View>
                    </Card>
                  </Pressable>
                </Animated.View>
              )
            })}
          </View>
        </ScrollView>
      </View>

      {/* 依目標分類探索 */}
      <View style={styles.section}>
        <View style={styles.header}>
          <Target size={24} color="#6366F1" />
          <Text variant="h4" fontWeight="700">
            依目標分類探索
          </Text>
        </View>

        <View style={styles.categoryGrid}>
          {BUCKET_LIST_CATEGORIES.map((cat, index) => {
            const config = getCategoryConfig(cat.value)
            const Icon = config.icon
            const countData = categoryCounts.find((c) => c.category === cat.value)

            return (
              <Animated.View
                key={cat.value}
                entering={FadeIn.delay(index * 30)}
                style={styles.categoryItem}
              >
                <Pressable
                  onPress={() => router.push(`/biography/explore/category/${cat.value}` as any)}
                >
                  <Card style={styles.categoryCard}>
                    <View style={[styles.categoryIcon, { backgroundColor: config.bgColor }]}>
                      <Icon size={24} color={config.color} />
                    </View>
                    <Text variant="small" fontWeight="500" style={styles.categoryLabel}>
                      {getCategoryLabel(cat.value)}
                    </Text>
                    {countData && countData.count > 0 && (
                      <Text variant="small" color="textMuted">
                        {countData.count} 個目標
                      </Text>
                    )}
                  </Card>
                </Pressable>
              </Animated.View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
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
  topicsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  topicCard: {
    width: 180,
    padding: SPACING.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  topicTitle: {
    marginBottom: 4,
  },
  exploreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: SPACING.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryItem: {
    width: '23%',
    minWidth: 80,
  },
  categoryCard: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  categoryLabel: {
    textAlign: 'center',
    marginBottom: 2,
  },
})

export default CategoryExplorer
