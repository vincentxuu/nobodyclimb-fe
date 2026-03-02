/**
 * BucketListItem 組件
 *
 * 心願清單項目卡片
 * 對應 apps/web/src/components/bucket-list/bucket-list-item.tsx
 */
import React, { useState, useMemo, useCallback } from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import {
  Target,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Check,
  MoreVertical,
  Tent,
  Home,
  Trophy,
  Dumbbell,
  Plane,
  Award,
  Activity,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'
import type { BucketListItem as BucketListItemType, BucketListCategory } from '@nobodyclimb/types'
import { Text } from '../ui/Text'
import { Button } from '../ui/Button'
import { ProgressTracker, ProgressBar } from './ProgressTracker'
import { FadeIn } from '../animations'

// 分類圖標和標籤映射
const categoryConfig: Record<
  BucketListCategory,
  { icon: LucideIcon; label: string }
> = {
  outdoor_route: { icon: Tent, label: '戶外路線' },
  indoor_grade: { icon: Home, label: '室內難度' },
  competition: { icon: Trophy, label: '比賽目標' },
  training: { icon: Dumbbell, label: '訓練目標' },
  adventure: { icon: Plane, label: '冒險挑戰' },
  skill: { icon: Award, label: '技能學習' },
  injury_recovery: { icon: Activity, label: '受傷復原' },
  other: { icon: Target, label: '其他' },
}

export type BucketListItemVariant = 'default' | 'compact' | 'expanded'

export interface BucketListItemCardProps {
  /** 心願項目資料 */
  item: BucketListItemType
  /** 顯示變體 */
  variant?: BucketListItemVariant
  /** 是否顯示操作按鈕 */
  showActions?: boolean
  /** 是否為擁有者 */
  isOwner?: boolean
  /** 編輯回調 */
  onEdit?: (item: BucketListItemType) => void
  /** 刪除回調 */
  onDelete?: (item: BucketListItemType) => void
  /** 完成回調 */
  onComplete?: (item: BucketListItemType) => void
  /** 點擊回調 */
  onPress?: (item: BucketListItemType) => void
}

/**
 * 心願清單項目卡片
 */
export function BucketListItemCard({
  item,
  variant = 'default',
  showActions = true,
  isOwner = false,
  onEdit,
  onDelete,
  onComplete,
  onPress,
}: BucketListItemCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const category = categoryConfig[item.category]
  const CategoryIcon = category.icon
  const isCompleted = item.status === 'completed'
  const isArchived = item.status === 'archived'

  // 計算顯示進度
  const displayProgress = useMemo(() => {
    if (!item.enable_progress) return null

    let milestones = item.milestones
    if (typeof milestones === 'string') {
      try {
        milestones = JSON.parse(milestones)
      } catch {
        milestones = null
      }
    }

    if (
      item.progress_mode === 'milestone' &&
      milestones &&
      Array.isArray(milestones) &&
      milestones.length > 0
    ) {
      const completed = milestones.filter((m) => m.completed).length
      return Math.round((completed / milestones.length) * 100)
    }
    return item.progress
  }, [item])

  const handlePress = useCallback(() => {
    onPress?.(item)
  }, [item, onPress])

  const handleEdit = useCallback(() => {
    setShowMenu(false)
    onEdit?.(item)
  }, [item, onEdit])

  const handleDelete = useCallback(() => {
    setShowMenu(false)
    onDelete?.(item)
  }, [item, onDelete])

  const handleComplete = useCallback(() => {
    setShowMenu(false)
    onComplete?.(item)
  }, [item, onComplete])

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.card,
        isCompleted && styles.cardCompleted,
        isArchived && styles.cardArchived,
      ]}
    >
      <View style={[styles.content, variant === 'compact' && styles.contentCompact]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Category Badge */}
            <View style={styles.categoryBadge}>
              <CategoryIcon size={12} color={SEMANTIC_COLORS.textMain} />
              <Text variant="small" style={styles.categoryText}>
                {category.label}
              </Text>
            </View>

            {/* Title */}
            <Text
              variant={variant === 'compact' ? 'bodyBold' : 'h4'}
              numberOfLines={2}
              style={[
                styles.title,
                isCompleted && styles.titleCompleted,
              ]}
            >
              {item.title}
            </Text>

            {/* Meta info */}
            {variant !== 'compact' && (
              <View style={styles.metaRow}>
                {item.target_grade && (
                  <View style={styles.metaItem}>
                    <Target size={12} color={SEMANTIC_COLORS.textSubtle} />
                    <Text variant="caption" color="textSubtle">
                      {item.target_grade}
                    </Text>
                  </View>
                )}
                {item.target_location && (
                  <View style={styles.metaItem}>
                    <MapPin size={12} color={SEMANTIC_COLORS.textSubtle} />
                    <Text variant="caption" color="textSubtle">
                      {item.target_location}
                    </Text>
                  </View>
                )}
                {item.target_date && (
                  <View style={styles.metaItem}>
                    <Calendar size={12} color={SEMANTIC_COLORS.textSubtle} />
                    <Text variant="caption" color="textSubtle">
                      {item.target_date}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Status & Actions */}
          <View style={styles.headerRight}>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Check size={12} color={SEMANTIC_COLORS.textMain} />
                <Text variant="small" color="textMain">
                  已完成
                </Text>
              </View>
            )}

            {showActions && isOwner && (
              <View style={styles.menuContainer}>
                <Pressable
                  onPress={() => setShowMenu(!showMenu)}
                  style={styles.menuButton}
                >
                  <MoreVertical size={16} color={SEMANTIC_COLORS.textSubtle} />
                </Pressable>

                {showMenu && (
                  <FadeIn style={styles.menu}>
                    {!isCompleted && (
                      <Pressable onPress={handleComplete} style={styles.menuItem}>
                        <Check size={16} color={SEMANTIC_COLORS.textMain} />
                        <Text variant="body">標記完成</Text>
                      </Pressable>
                    )}
                    <Pressable onPress={handleEdit} style={styles.menuItem}>
                      <Edit size={16} color={SEMANTIC_COLORS.textMain} />
                      <Text variant="body">編輯</Text>
                    </Pressable>
                    <Pressable onPress={handleDelete} style={styles.menuItemDanger}>
                      <Trash2 size={16} color="#DC2626" />
                      <Text variant="body" style={styles.menuItemDangerText}>
                        刪除
                      </Text>
                    </Pressable>
                  </FadeIn>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {variant === 'expanded' && item.description && (
          <Text
            variant="body"
            color="textSubtle"
            numberOfLines={3}
            style={styles.description}
          >
            {item.description}
          </Text>
        )}

        {/* Progress */}
        {item.enable_progress && displayProgress !== null && !isCompleted && (
          <View style={styles.progressSection}>
            {item.progress_mode === 'milestone' && item.milestones ? (
              <ProgressTracker
                mode="milestone"
                progress={displayProgress}
                milestones={item.milestones}
                size="sm"
                showLabels={variant === 'expanded'}
              />
            ) : (
              <ProgressBar progress={displayProgress} size="sm" />
            )}
          </View>
        )}

        {/* Completion Story Preview */}
        {isCompleted && item.completion_story && variant === 'expanded' && (
          <View style={styles.completionStory}>
            <Text variant="bodyBold" color="textMain">
              完成故事
            </Text>
            <Text variant="body" color="textSubtle" numberOfLines={2}>
              {item.completion_story}
            </Text>
          </View>
        )}

        {/* Completed Date */}
        {isCompleted && item.completed_at && (
          <Text variant="caption" color="textSubtle" style={styles.completedDate}>
            完成於 {new Date(item.completed_at).toLocaleDateString('zh-TW')}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

/**
 * 心願清單區塊組件
 */
export interface BucketListSectionProps {
  /** 區塊標題 */
  title: string
  /** 項目列表 */
  items: BucketListItemType[]
  /** 空狀態文字 */
  emptyText?: string
  /** 是否顯示數量 */
  showCount?: boolean
  /** 是否為擁有者 */
  isOwner?: boolean
  /** 編輯回調 */
  onEdit?: (item: BucketListItemType) => void
  /** 刪除回調 */
  onDelete?: (item: BucketListItemType) => void
  /** 完成回調 */
  onComplete?: (item: BucketListItemType) => void
  /** 點擊回調 */
  onPress?: (item: BucketListItemType) => void
}

export function BucketListSection({
  title,
  items,
  emptyText = '還沒有任何目標',
  showCount = true,
  isOwner = false,
  onEdit,
  onDelete,
  onComplete,
  onPress,
}: BucketListSectionProps) {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text variant="h4">
          {title}
          {showCount && (
            <Text variant="body" color="textSubtle">
              {' '}({items.length})
            </Text>
          )}
        </Text>
      </View>

      {items.length === 0 ? (
        <Text variant="body" color="textSubtle" style={styles.emptyText}>
          {emptyText}
        </Text>
      ) : (
        <View style={styles.itemList}>
          {items.map((item) => (
            <BucketListItemCard
              key={item.id}
              item={item}
              isOwner={isOwner}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
              onPress={onPress}
            />
          ))}
        </View>
      )}
    </View>
  )
}

/**
 * 新增心願清單按鈕
 */
export interface AddBucketListButtonProps {
  onPress: () => void
}

export function AddBucketListButton({ onPress }: AddBucketListButtonProps) {
  return (
    <Button
      variant="secondary"
      leftIcon={Target}
      onPress={onPress}
      fullWidth
      style={styles.addButton}
    >
      新增目標
    </Button>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#EBEAEA',
    overflow: 'hidden',
    marginBottom: SPACING[3],
  },
  cardCompleted: {
    borderColor: `${SEMANTIC_COLORS.brand}80`,
    backgroundColor: `${SEMANTIC_COLORS.brand}08`,
  },
  cardArchived: {
    opacity: 0.6,
  },
  content: {
    padding: SPACING[4],
  },
  contentCompact: {
    padding: SPACING[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING[2],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    gap: 4,
  },
  categoryText: {
    color: SEMANTIC_COLORS.textMain,
  },
  title: {
    marginTop: SPACING[2],
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    textDecorationColor: `${SEMANTIC_COLORS.brand}99`,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING[2],
    gap: SPACING[3],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${SEMANTIC_COLORS.brand}B3`,
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.full,
    gap: 4,
  },
  menuContainer: {
    position: 'relative',
  },
  menuButton: {
    padding: SPACING[1],
    borderRadius: RADIUS.full,
  },
  menu: {
    position: 'absolute',
    top: 28,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#EBEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
    minWidth: 120,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    gap: SPACING[2],
  },
  menuItemDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    gap: SPACING[2],
  },
  menuItemDangerText: {
    color: '#DC2626',
  },
  description: {
    marginTop: SPACING[3],
  },
  progressSection: {
    marginTop: SPACING[3],
  },
  completionStory: {
    marginTop: SPACING[3],
    backgroundColor: `${SEMANTIC_COLORS.brand}1A`,
    borderRadius: RADIUS.md,
    padding: SPACING[3],
    gap: SPACING[1],
  },
  completedDate: {
    marginTop: SPACING[2],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: SPACING[8],
  },
  itemList: {
    gap: SPACING[3],
  },
  addButton: {
    borderStyle: 'dashed',
  },
})
