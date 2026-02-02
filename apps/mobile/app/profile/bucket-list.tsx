/**
 * 心願清單頁面
 *
 * 對應 apps/web/src/app/profile/bucket-list/page.tsx
 */
import React, { useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Mountain,
  Building2,
  MapPin,
  Trash2,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, IconButton, Tabs, TabsList, TabsTrigger } from '@/components/ui'
import { ProtectedRoute } from '@/components/shared'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

type BucketType = 'all' | 'crag' | 'gym' | 'route'
type BucketStatus = 'pending' | 'completed'

interface BucketItem {
  id: string
  type: BucketType
  title: string
  location?: string
  grade?: string
  status: BucketStatus
  completedAt?: string
  targetDate?: string
}

// 模擬資料
const MOCK_BUCKET_LIST: BucketItem[] = [
  {
    id: '1',
    type: 'crag',
    title: '龍洞',
    location: '新北市貢寮區',
    status: 'completed',
    completedAt: '2024-01-10',
  },
  {
    id: '2',
    type: 'route',
    title: '黃金岩壁 5.12a',
    location: '龍洞',
    grade: '5.12a',
    status: 'pending',
    targetDate: '2024-06-01',
  },
  {
    id: '3',
    type: 'gym',
    title: 'RedRock 攀岩館',
    location: '台北市內湖區',
    status: 'pending',
  },
  {
    id: '4',
    type: 'crag',
    title: '關子嶺',
    location: '台南市白河區',
    status: 'pending',
    targetDate: '2024-03-15',
  },
]

const TYPE_ICONS: Record<BucketType, React.ComponentType<{ size: number; color: string }>> = {
  all: MapPin,
  crag: Mountain,
  gym: Building2,
  route: MapPin,
}

const TYPE_LABELS: Record<BucketType, string> = {
  all: '全部',
  crag: '岩場',
  gym: '岩館',
  route: '路線',
}

interface BucketCardProps {
  item: BucketItem
  onPress: () => void
  onToggle: () => void
  onDelete: () => void
  index: number
}

function BucketCard({ item, onPress, onToggle, onDelete, index }: BucketCardProps) {
  const Icon = TYPE_ICONS[item.type]
  const isCompleted = item.status === 'completed'

  const handleLongPress = () => {
    Alert.alert('刪除項目', `確定要刪除「${item.title}」嗎？`, [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: onDelete },
    ])
  }

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <Pressable
        style={({ pressed }) => [
          styles.bucketCard,
          isCompleted && styles.bucketCardCompleted,
          pressed && styles.bucketCardPressed,
        ]}
        onPress={onPress}
        onLongPress={handleLongPress}
      >
        <Pressable onPress={onToggle} style={styles.checkButton}>
          {isCompleted ? (
            <CheckCircle2 size={24} color="#10B981" />
          ) : (
            <Circle size={24} color={SEMANTIC_COLORS.textMuted} />
          )}
        </Pressable>
        <View style={styles.bucketContent}>
          <Text
            variant="body"
            fontWeight="500"
            style={isCompleted && styles.completedText}
          >
            {item.title}
          </Text>
          {item.location && (
            <View style={styles.locationRow}>
              <Icon size={12} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="small" color="textMuted">
                {item.location}
              </Text>
            </View>
          )}
          {item.grade && (
            <View style={styles.gradeBadge}>
              <Text variant="small" style={styles.gradeText}>
                {item.grade}
              </Text>
            </View>
          )}
          {isCompleted && item.completedAt ? (
            <Text variant="small" color="textMuted">
              完成於 {item.completedAt}
            </Text>
          ) : item.targetDate ? (
            <Text variant="small" color="textMuted">
              目標日期：{item.targetDate}
            </Text>
          ) : null}
        </View>
        <View style={styles.typeBadge}>
          <Text variant="small" color="textMuted">
            {TYPE_LABELS[item.type]}
          </Text>
        </View>
        <ChevronRight size={18} color={SEMANTIC_COLORS.textMuted} />
      </Pressable>
    </Animated.View>
  )
}

export default function BucketListScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<BucketType>('all')
  const [bucketList, setBucketList] = useState<BucketItem[]>(MOCK_BUCKET_LIST)
  const [isLoading] = useState(false)

  const handleBack = () => {
    router.back()
  }

  const handleAddItem = () => {
    // TODO: 打開新增心願的表單
    Alert.alert('新增心願', '此功能開發中')
  }

  const handleItemPress = useCallback(
    (item: BucketItem) => {
      switch (item.type) {
        case 'crag':
          router.push(`/crag/${item.id}` as any)
          break
        case 'gym':
          router.push(`/gym/${item.id}` as any)
          break
        default:
          break
      }
    },
    [router]
  )

  const handleToggleItem = useCallback((itemId: string) => {
    setBucketList((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newStatus: BucketStatus = item.status === 'completed' ? 'pending' : 'completed'
          return {
            ...item,
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
          }
        }
        return item
      })
    )
  }, [])

  const handleDeleteItem = useCallback((itemId: string) => {
    setBucketList((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

  const filteredList =
    activeTab === 'all'
      ? bucketList
      : bucketList.filter((item) => item.type === activeTab)

  const completedCount = bucketList.filter((i) => i.status === 'completed').length
  const pendingCount = bucketList.filter((i) => i.status === 'pending').length

  const renderItem = ({ item, index }: { item: BucketItem; index: number }) => (
    <BucketCard
      item={item}
      onPress={() => handleItemPress(item)}
      onToggle={() => handleToggleItem(item.id)}
      onDelete={() => handleDeleteItem(item.id)}
      index={index}
    />
  )

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 導航列 */}
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
          <Text variant="h3" fontWeight="600">
            心願清單
          </Text>
          <IconButton
            icon={<Plus size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleAddItem}
            variant="ghost"
          />
        </View>

        {/* 統計 */}
        <View style={styles.statsBar}>
          <View style={styles.statBox}>
            <Text variant="h4" fontWeight="700" style={styles.completedNumber}>
              {completedCount}
            </Text>
            <Text variant="small" color="textMuted">
              已完成
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text variant="h4" fontWeight="700">
              {pendingCount}
            </Text>
            <Text variant="small" color="textMuted">
              進行中
            </Text>
          </View>
        </View>

        {/* 分類標籤 */}
        <View style={styles.tabsContainer}>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as BucketType)}
          >
            <TabsList>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <TabsTrigger key={key} value={key}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </View>

        {/* 列表 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
          </View>
        ) : filteredList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Mountain size={48} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="body" color="textSubtle" style={styles.emptyText}>
              還沒有心願清單
            </Text>
            <Text variant="small" color="textMuted">
              點擊右上角新增目標
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredList}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    </ProtectedRoute>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
  },
  completedNumber: {
    color: '#10B981',
  },
  tabsContainer: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listContent: {
    padding: SPACING.md,
  },
  bucketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  bucketCardCompleted: {
    backgroundColor: '#F0FDF4',
  },
  bucketCardPressed: {
    opacity: 0.7,
  },
  checkButton: {
    padding: 4,
  },
  bucketContent: {
    flex: 1,
    gap: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: SEMANTIC_COLORS.textMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gradeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  gradeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '600',
  },
  typeBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    marginTop: SPACING.sm,
  },
})
