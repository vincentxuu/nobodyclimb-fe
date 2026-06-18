/**
 * 心願清單頁面
 *
 * 對應 apps/web/src/app/profile/bucket-list/page.tsx
 * 使用 GET /bucket-list/:biographyId 取得人生清單
 */

import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import type { CompleteBucketListInput, CreateBucketListInput } from '@nobodyclimb/schemas'
import type { BucketListItem as SharedBucketListItem } from '@nobodyclimb/types'
import { useRouter } from 'expo-router'
import {
  CheckCircle2,
  ChevronLeft,
  Circle,
  Edit2,
  MapPin,
  Mountain,
  Plus,
  Trash2,
} from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BucketListCompletionForm } from '@/components/bucket-list/BucketListCompletionForm'
import { BucketListForm } from '@/components/bucket-list/BucketListForm'
import { ProgressBar, ProgressTracker } from '@/components/bucket-list/ProgressTracker'
import { ProtectedRoute } from '@/components/shared'
import { Button, IconButton, Text } from '@/components/ui'
import {
  type BucketListItem,
  useBucketList,
  useCompleteBucketItem,
  useCreateBucketItem,
  useDeleteBucketItem,
  useToggleBucketItem,
  useUpdateBucketItem,
  useUpdateBucketMilestone,
} from '@/lib/hooks'

type TabValue = 'all' | 'active' | 'completed' | 'archived'

const STATUS_TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '進行中' },
  { value: 'completed', label: '已完成' },
  { value: 'archived', label: '已封存' },
]

const CATEGORY_LABELS: Record<string, string> = {
  outdoor_route: '戶外路線',
  indoor_grade: '室內難度',
  competition: '比賽目標',
  training: '訓練目標',
  adventure: '冒險挑戰',
  skill: '技能學習',
  injury_recovery: '受傷復原',
  other: '其他',
}

interface BucketCardProps {
  item: BucketListItem
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onMilestoneToggle: (milestoneId: string, completed: boolean) => void
  index: number
}

function parseMilestones(item: BucketListItem) {
  if (!item.enable_progress || item.progress_mode !== 'milestone' || !item.milestones) return null

  if (typeof item.milestones === 'string') {
    try {
      const parsed = JSON.parse(item.milestones)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  return Array.isArray(item.milestones) ? item.milestones : null
}

function getDisplayProgress(item: BucketListItem) {
  if (!item.enable_progress) return null

  const milestones = parseMilestones(item)
  if (item.progress_mode === 'milestone' && milestones?.length) {
    const completed = milestones.filter((milestone) => milestone.completed).length
    return Math.round((completed / milestones.length) * 100)
  }

  return item.progress
}

function BucketCard({
  item,
  onToggle,
  onEdit,
  onDelete,
  onMilestoneToggle,
  index,
}: BucketCardProps) {
  const isCompleted = item.status === 'completed'
  const isArchived = item.status === 'archived'
  const categoryLabel = CATEGORY_LABELS[item.category] ?? item.category
  const milestones = parseMilestones(item)
  const displayProgress = getDisplayProgress(item)

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
          isArchived && styles.bucketCardArchived,
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
          <Text variant="body" fontWeight="500" style={isCompleted && styles.completedText}>
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
          {item.enable_progress && displayProgress !== null && !isCompleted && (
            <View style={styles.progressSection}>
              {item.progress_mode === 'milestone' && milestones ? (
                <ProgressTracker
                  mode="milestone"
                  progress={displayProgress}
                  milestones={milestones}
                  size="sm"
                  editable
                  showLabels
                  onMilestoneToggle={onMilestoneToggle}
                />
              ) : (
                <ProgressBar progress={displayProgress} size="sm" />
              )}
            </View>
          )}
          <View style={styles.cardActions}>
            {!isArchived && (
              <Button variant="secondary" size="sm" onPress={onEdit} leftIcon={Edit2}>
                編輯
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onPress={handleLongPress}
              leftIcon={Trash2}
              style={styles.deleteButton}
            >
              刪除
            </Button>
          </View>
        </View>
        <View style={styles.typeBadge}>
          <Text variant="small" color="textMuted">
            {categoryLabel}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  )
}

export default function BucketListScreen() {
  const router = useRouter()
  const { data: bucketList = [], isLoading, isError, refetch } = useBucketList()
  const createMutation = useCreateBucketItem()
  const completeMutation = useCompleteBucketItem()
  const toggleMutation = useToggleBucketItem()
  const deleteMutation = useDeleteBucketItem()
  const updateMutation = useUpdateBucketItem()
  const updateMilestoneMutation = useUpdateBucketMilestone()
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<BucketListItem | null>(null)
  const [completingItem, setCompletingItem] = useState<BucketListItem | null>(null)
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const handleBack = () => {
    router.back()
  }

  const handleAddItem = () => {
    setEditingItem(null)
    setIsFormVisible(true)
  }

  const handleCloseForm = useCallback(() => {
    setIsFormVisible(false)
    setEditingItem(null)
  }, [])

  const handleEditItem = useCallback((item: BucketListItem) => {
    setEditingItem(item)
    setIsFormVisible(true)
  }, [])

  const handleSubmitItem = useCallback(
    (data: CreateBucketListInput) => {
      if (editingItem) {
        updateMutation.mutate(
          { id: editingItem.id, data },
          {
            onSuccess: () => {
              handleCloseForm()
              Alert.alert('更新成功', '心願已更新')
            },
            onError: (error) => {
              const message = error instanceof Error ? error.message : '請稍後再試'
              Alert.alert('更新失敗', message)
            },
          }
        )
        return
      }

      createMutation.mutate(data, {
        onSuccess: () => {
          handleCloseForm()
          Alert.alert('新增成功', '心願已加入清單')
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : '請稍後再試'
          Alert.alert('新增失敗', message)
        },
      })
    },
    [createMutation, editingItem, handleCloseForm, updateMutation]
  )

  const handleToggleItem = useCallback(
    (item: BucketListItem) => {
      if (item.status === 'completed') {
        toggleMutation.mutate({ id: item.id, completed: false })
        return
      }

      setCompletingItem(item)
    },
    [toggleMutation]
  )

  const handleCompleteItem = useCallback(
    (data: CompleteBucketListInput) => {
      if (!completingItem) return

      completeMutation.mutate(
        { id: completingItem.id, data },
        {
          onSuccess: () => {
            setCompletingItem(null)
            Alert.alert('已標記完成', '完成故事已儲存')
          },
          onError: (error) => {
            const message = error instanceof Error ? error.message : '請稍後再試'
            Alert.alert('儲存失敗', message)
          },
        }
      )
    },
    [completeMutation, completingItem]
  )

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      deleteMutation.mutate(itemId)
    },
    [deleteMutation]
  )

  const handleMilestoneToggle = useCallback(
    (itemId: string, milestoneId: string, completed: boolean) => {
      updateMilestoneMutation.mutate(
        { id: itemId, milestoneId, completed },
        {
          onError: (error) => {
            const message = error instanceof Error ? error.message : '請稍後再試'
            Alert.alert('更新里程碑失敗', message)
          },
        }
      )
    },
    [updateMilestoneMutation]
  )

  const stats = useMemo(
    () => ({
      total: bucketList.length,
      active: bucketList.filter((i) => i.status === 'active').length,
      completed: bucketList.filter((i) => i.status === 'completed').length,
      archived: bucketList.filter((i) => i.status === 'archived').length,
    }),
    [bucketList]
  )

  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set(bucketList.map((item) => item.category).filter(Boolean)))
    return categories.map((value) => ({
      value,
      label: CATEGORY_LABELS[value] ?? value,
      count: bucketList.filter((item) => item.category === value).length,
    }))
  }, [bucketList])

  const filteredBucketList = useMemo(() => {
    return bucketList
      .filter((item) => activeTab === 'all' || item.status === activeTab)
      .filter((item) => categoryFilter === 'all' || item.category === categoryFilter)
      .sort((a, b) => {
        const statusOrder = { active: 0, completed: 1, archived: 2 }
        const statusDiff = statusOrder[a.status] - statusOrder[b.status]
        if (statusDiff !== 0) return statusDiff
        return (a.sort_order || 0) - (b.sort_order || 0)
      })
  }, [activeTab, bucketList, categoryFilter])

  const renderItem = ({ item, index }: { item: BucketListItem; index: number }) => (
    <BucketCard
      item={item}
      onToggle={() => handleToggleItem(item)}
      onEdit={() => handleEditItem(item)}
      onDelete={() => handleDeleteItem(item.id)}
      onMilestoneToggle={(milestoneId, completed) =>
        handleMilestoneToggle(item.id, milestoneId, completed)
      }
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
                {stats.total}
              </Text>
              <Text variant="small" color="textMuted">
                全部
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text variant="h4" fontWeight="700">
                {stats.active}
              </Text>
              <Text variant="small" color="textMuted">
                進行中
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text variant="h4" fontWeight="700" style={styles.completedNumber}>
                {stats.completed}
              </Text>
              <Text variant="small" color="textMuted">
                已完成
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text variant="h4" fontWeight="700" color="textMuted">
                {stats.archived}
              </Text>
              <Text variant="small" color="textMuted">
                已封存
              </Text>
            </View>
          </View>
        )}

        {!isLoading && !isError && bucketList.length > 0 && (
          <View style={styles.filters}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {STATUS_TABS.map((tab) => {
                  const count = tab.value === 'all' ? stats.total : stats[tab.value]
                  const isActive = activeTab === tab.value
                  return (
                    <Pressable
                      key={tab.value}
                      onPress={() => setActiveTab(tab.value)}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                    >
                      <Text
                        variant="small"
                        fontWeight={isActive ? '600' : '400'}
                        style={isActive && styles.filterChipTextActive}
                      >
                        {tab.label} ({count})
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </ScrollView>
            {categoryOptions.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterRow}>
                  <Pressable
                    onPress={() => setCategoryFilter('all')}
                    style={[
                      styles.categoryChip,
                      categoryFilter === 'all' && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      variant="small"
                      fontWeight={categoryFilter === 'all' ? '600' : '400'}
                      style={categoryFilter === 'all' && styles.filterChipTextActive}
                    >
                      全部分類
                    </Text>
                  </Pressable>
                  {categoryOptions.map((category) => {
                    const isActive = categoryFilter === category.value
                    return (
                      <Pressable
                        key={category.value}
                        onPress={() => setCategoryFilter(category.value)}
                        style={[styles.categoryChip, isActive && styles.filterChipActive]}
                      >
                        <Text
                          variant="small"
                          fontWeight={isActive ? '600' : '400'}
                          style={isActive && styles.filterChipTextActive}
                        >
                          {category.label} ({category.count})
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </ScrollView>
            )}
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
            <Button variant="primary" size="md" onPress={handleAddItem}>
              <Text fontWeight="600" style={styles.addButtonText}>
                新增目標
              </Text>
            </Button>
          </View>
        ) : filteredBucketList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Mountain size={48} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="body" color="textSubtle" style={styles.emptyText}>
              目前篩選沒有符合的目標
            </Text>
            <Button
              variant="secondary"
              size="md"
              onPress={() => {
                setActiveTab('all')
                setCategoryFilter('all')
              }}
            >
              清除篩選
            </Button>
          </View>
        ) : (
          <FlatList
            data={filteredBucketList}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}

        <Modal visible={isFormVisible} animationType="slide" onRequestClose={handleCloseForm}>
          <SafeAreaView style={styles.formContainer} edges={['top', 'bottom']}>
            <BucketListForm
              item={editingItem as SharedBucketListItem | null}
              onSubmit={handleSubmitItem}
              onCancel={handleCloseForm}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </SafeAreaView>
        </Modal>

        <Modal
          visible={!!completingItem}
          animationType="slide"
          onRequestClose={() => setCompletingItem(null)}
        >
          <SafeAreaView style={styles.formContainer} edges={['top', 'bottom']}>
            {completingItem && (
              <BucketListCompletionForm
                item={completingItem}
                onSubmit={handleCompleteItem}
                onCancel={() => setCompletingItem(null)}
                isLoading={completeMutation.isPending}
              />
            )}
          </SafeAreaView>
        </Modal>
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
  bucketCardArchived: {
    backgroundColor: '#F3F4F6',
    opacity: 0.82,
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
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  progressSection: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  deleteButton: {
    borderColor: '#FCA5A5',
  },
  typeBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  filters: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: SEMANTIC_COLORS.textMain,
    borderColor: SEMANTIC_COLORS.textMain,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  addButtonText: {
    color: '#FFFFFF',
  },
  formContainer: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
})
