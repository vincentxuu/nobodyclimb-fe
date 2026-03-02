/**
 * BiographyBucketList 組件
 *
 * 在人物誌詳情頁顯示人生清單，分為進行中和已完成兩個區塊
 * 對應 apps/web/src/components/bucket-list/biography-bucket-list.tsx
 */
import React, { useState, useMemo, useCallback } from 'react'
import { StyleSheet, View, ScrollView, Pressable } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Check, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'
import { apiClient } from '@/lib/api'
import type { BucketListItem } from '@nobodyclimb/types'
import { Text } from '../ui/Text'
import { Spinner } from '../ui/Spinner'
import { BucketListItemCard } from './BucketListItem'

export interface BiographyBucketListProps {
  /** 傳記 ID */
  biographyId: string
}

/**
 * 傳記心願清單顯示
 */
export function BiographyBucketList({ biographyId }: BiographyBucketListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bucket-list', biographyId],
    queryFn: async () => {
      const response = await apiClient.get(`/biographies/${biographyId}/bucket-list`)
      return response.data as BucketListItem[]
    },
    enabled: !!biographyId,
  })

  const bucketList = data || []

  // 只顯示公開的項目
  const publicItems = useMemo(
    () => bucketList.filter((item) => item.is_public),
    [bucketList]
  )

  // 分類：進行中和已完成
  const activeItems = useMemo(
    () => publicItems.filter((item) => item.status === 'active'),
    [publicItems]
  )
  const completedItems = useMemo(
    () => publicItems.filter((item) => item.status === 'completed'),
    [publicItems]
  )

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner />
      </View>
    )
  }

  if (error || publicItems.length === 0) {
    return null // 沒有公開的人生清單時不顯示
  }

  return (
    <View style={styles.container}>
      {/* 進行中的目標 */}
      {activeItems.length > 0 && (
        <View style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            進行中 ({activeItems.length})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {activeItems.map((item) => (
              <View key={item.id} style={styles.cardWrapper}>
                <BucketListItemCard
                  item={item}
                  variant="expanded"
                  showActions={false}
                  isOwner={false}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 已完成的目標 */}
      {completedItems.length > 0 && (
        <View style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            已完成 ({completedItems.length})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {completedItems.map((item) => (
              <View key={item.id} style={styles.cardWrapper}>
                <CompletedBucketListCard item={item} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

/**
 * 已完成目標卡片（帶完成故事）
 */
interface CompletedBucketListCardProps {
  item: BucketListItem
}

function CompletedBucketListCard({ item }: CompletedBucketListCardProps) {
  const [expanded, setExpanded] = useState(false)

  const hasCompletionStory =
    item.completion_story || item.psychological_insights || item.technical_insights

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  return (
    <View style={styles.completedCard}>
      {/* 完成標記與主要內容 */}
      <View style={styles.completedCardHeader}>
        {/* 完成勾勾角標 */}
        <View style={styles.checkBadge}>
          <Check size={20} color={SEMANTIC_COLORS.textMain} />
        </View>

        {/* 目標內容 */}
        <View style={styles.completedCardContent}>
          <Text variant="h4" numberOfLines={2}>
            {item.title}
          </Text>
          {item.description && (
            <Text
              variant="body"
              color="textSubtle"
              numberOfLines={2}
              style={styles.description}
            >
              {item.description}
            </Text>
          )}

          {/* 完成日期 */}
          {item.completed_at && (
            <View style={styles.completedDateRow}>
              <CheckCircle2 size={14} color={SEMANTIC_COLORS.textSubtle} />
              <Text variant="caption" color="textSubtle">
                完成於 {new Date(item.completed_at).toLocaleDateString('zh-TW')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 完成故事展開區 */}
      {hasCompletionStory && (
        <View style={styles.storySection}>
          {!expanded ? (
            <Pressable onPress={handleToggle} style={styles.storyToggle}>
              <Text variant="bodyBold" color="textMain">
                查看完成故事
              </Text>
              <ChevronRight size={16} color={SEMANTIC_COLORS.textSubtle} />
            </Pressable>
          ) : (
            <View style={styles.storyContent}>
              {item.completion_story && (
                <View style={styles.storyBlock}>
                  <View style={styles.storyBlockHeader}>
                    <View style={styles.storyDot} />
                    <Text variant="bodyBold">完成故事</Text>
                  </View>
                  <Text variant="body" color="textMain" style={styles.storyText}>
                    {item.completion_story}
                  </Text>
                </View>
              )}

              {item.psychological_insights && (
                <View style={styles.storyBlock}>
                  <View style={styles.storyBlockHeader}>
                    <View style={styles.storyDot} />
                    <Text variant="bodyBold">心理層面</Text>
                  </View>
                  <Text variant="body" color="textMain" style={styles.storyText}>
                    {item.psychological_insights}
                  </Text>
                </View>
              )}

              {item.technical_insights && (
                <View style={styles.storyBlock}>
                  <View style={styles.storyBlockHeader}>
                    <View style={styles.storyDot} />
                    <Text variant="bodyBold">技術層面</Text>
                  </View>
                  <Text variant="body" color="textMain" style={styles.storyText}>
                    {item.technical_insights}
                  </Text>
                </View>
              )}

              <Pressable onPress={handleToggle} style={styles.collapseButton}>
                <Text variant="body" color="textSubtle">
                  收起
                </Text>
                <ChevronDown size={16} color={SEMANTIC_COLORS.textSubtle} />
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING[6],
  },
  loadingContainer: {
    padding: SPACING[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: SPACING[4],
  },
  sectionTitle: {
    paddingHorizontal: SPACING[4],
  },
  horizontalList: {
    paddingHorizontal: SPACING[4],
    gap: SPACING[4],
  },
  cardWrapper: {
    width: 320,
  },
  completedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: `${SEMANTIC_COLORS.brand}4D`,
    overflow: 'hidden',
  },
  completedCardHeader: {
    padding: SPACING[4],
    backgroundColor: `${SEMANTIC_COLORS.brand}0D`,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: SPACING[4],
    right: SPACING[4],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SEMANTIC_COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCardContent: {
    paddingRight: 40, // 為勾勾留空間
  },
  description: {
    marginTop: SPACING[2],
  },
  completedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    marginTop: SPACING[3],
  },
  storySection: {
    borderTopWidth: 1,
    borderTopColor: `${SEMANTIC_COLORS.brand}33`,
  },
  storyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING[4],
    backgroundColor: '#FFFFFF',
  },
  storyContent: {
    padding: SPACING[4],
    backgroundColor: '#FFFFFF',
    gap: SPACING[4],
  },
  storyBlock: {
    gap: SPACING[2],
  },
  storyBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  storyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SEMANTIC_COLORS.brand,
  },
  storyText: {
    lineHeight: 24,
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    alignSelf: 'flex-start',
  },
})
