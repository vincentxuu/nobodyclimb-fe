/**
 * 心願清單頁面
 *
 * 對應 apps/web/src/app/profile/bucket-list/page.tsx
 * 使用 GET /bucket-list/:biographyId 取得人生清單
 */
import React, { useCallback } from 'react'
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
  MapPin,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, IconButton } from '@/components/ui'
import { ProtectedRoute } from '@/components/shared'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'
import {
  useBucketList,
  useToggleBucketItem,
  useDeleteBucketItem,
  type BucketListItem,
} from '@/lib/hooks'

interface BucketCardProps {
  item: BucketListItem
  onToggle: () => void
  onDelete: () => void
  index: number
}

function BucketCard({ item, onToggle, onDelete, index }: BucketCardProps) {
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
          {item.target_location && (
            <View style={styles.locationRow}>
              <MapPin size={12} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="small" color="textMuted">
                {item.target_location}
              </Text>
            </View>
          )}
          {item.target_grade && (
            <View style={styles.gradeBadge}>
              <Text variant="small" style={styles.gradeText}>
                {item.target_grade}
              </Text>
            </View>
          )}
          {isCompleted && item.completed_at ? (
            <Text variant="small" color="textMuted">
              完成於 {item.completed_at.split('T')[0]}
            </Text>
          ) : item.target_date ? (
            <Text variant="small" color="textMuted">
              目標日期：{item.target_date.split('T')[0]}
            </Text>
          ) : null}
        </View>
        {item.category && (
          <View style={styles.typeBadge}>
            <Text variant="small" color="textMuted">
              {item.category}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  )
}

export default function BucketListScreen() {
  const router = useRouter()
  const { data: bucketList = [], isLoading, isError, refetch } = useBucketList()
  const toggleMutation = useToggleBucketItem()
  const deleteMutation = useDeleteBucketItem()

  const handleBack = () => {
    router.back()
  }

  const handleAddItem = () => {
    // TODO: 打開新增心願的表單
    Alert.alert('新增心願', '此功能開發中')
  }

  const handleToggleItem = useCallback(
    (item: BucketListItem) => {
      const willComplete = item.status !== 'completed'
      toggleMutation.mutate({ id: item.id, completed: willComplete })
    },
    [toggleMutation]
  )

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      deleteMutation.mutate(itemId)
    },
    [deleteMutation]
  )

  const completedCount = bucketList.filter((i) => i.status === 'completed').length
  const pendingCount = bucketList.filter((i) => i.status !== 'completed').length

  const renderItem = ({ item, index }: { item: BucketListItem; index: number }) => (
    <BucketCard
      item={item}
      onToggle={() => handleToggleItem(item)}
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
        {!isLoading && !isError && (
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
        )}

        {/* 列表 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
          </View>
        ) : isError ? (
          <View style={styles.emptyContainer}>
            <Mountain size={48} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="body" color="textSubtle" style={styles.emptyText}>
              載入失敗，請重試
            </Text>
            <Pressable onPress={() => refetch()}>
              <Text variant="body" color="textMain" fontWeight="600">
                重試
              </Text>
            </Pressable>
          </View>
        ) : bucketList.length === 0 ? (
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
            data={bucketList}
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
