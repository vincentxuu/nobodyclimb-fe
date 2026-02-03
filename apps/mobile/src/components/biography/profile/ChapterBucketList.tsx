/**
 * ChapterBucketList 組件
 *
 * Chapter 3 - 人生清單，對應 apps/web/src/components/biography/profile/ChapterBucketList.tsx
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { Lock } from 'lucide-react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

import { Text } from '@/components/ui'
import { BiographyBucketList } from '@/components/bucket-list'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 類型定義
interface BucketListItem {
  id: string
  title: string
  is_completed: boolean
}

interface BiographyV2 {
  id: string
  name: string
  stories?: Array<{ question_id: string; content?: string }>
}

interface ChapterBucketListProps {
  person: BiographyV2 | null
  isOwner: boolean
}

/**
 * Chapter 3 - 人生清單
 * 永遠顯示，沒有資料時顯示預設內容
 */
export function ChapterBucketList({ person, isOwner: _isOwner }: ChapterBucketListProps) {
  const [items, setItems] = useState<BucketListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 從 stories 陣列中取得 bucket_list_story
  const bucketListStory = useMemo(() => {
    if (!person?.stories) return null
    const story = person.stories.find(s => s.question_id === 'bucket_list_story')
    return story?.content || null
  }, [person?.stories])

  // 獲取人生清單項目
  const loadItems = useCallback(async () => {
    if (!person?.id) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      // TODO: 整合 bucketListService.getBucketList(person.id)
      await new Promise(resolve => setTimeout(resolve, 500))

      // 模擬資料
      setItems([
        { id: '1', title: '完攀龍洞黃金海岸', is_completed: true },
        { id: '2', title: '挑戰 Fontainebleau 經典抱石', is_completed: false },
        { id: '3', title: '攀登 El Capitan', is_completed: false },
      ])
    } catch (error) {
      console.error('Failed to load bucket list:', error)
    } finally {
      setIsLoading(false)
    }
  }, [person?.id])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMuted} />
        </View>
      </View>
    )
  }

  const hasContent = bucketListStory || items.length > 0

  if (!person) return null

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* 章節標題 */}
      <View style={styles.header}>
        <View style={styles.chapterBadge}>
          <Text variant="small" fontWeight="600">
            Chapter 3
          </Text>
        </View>
        <Text variant="h3" fontWeight="700" style={styles.title}>
          攀岩人生清單
        </Text>
      </View>

      {hasContent ? (
        <>
          {/* 人生清單故事描述 */}
          {bucketListStory && (
            <Text variant="body" color="textSubtle" style={styles.story}>
              {bucketListStory}
            </Text>
          )}

          {/* 結構化人生清單 */}
          <View style={styles.listContainer}>
            <BiographyBucketList biographyId={person.id} />
          </View>
        </>
      ) : (
        /* 沒有資料時的預設內容 */
        <View style={styles.placeholderContainer}>
          <View style={styles.placeholderContent}>
            <Lock size={18} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="body" color="textMuted">
              {person.name} 的攀岩人生清單正在醞釀中...
            </Text>
          </View>
          <Text variant="small" color="textMuted" style={styles.placeholderSubtext}>
            每個攀岩者都有屬於自己的目標與夢想
          </Text>
        </View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  header: {
    marginBottom: SPACING.lg,
  },
  chapterBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE70C',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginBottom: SPACING.sm,
  },
  title: {
    color: SEMANTIC_COLORS.textMain,
  },
  story: {
    lineHeight: 28,
    marginBottom: SPACING.lg,
  },
  listContainer: {
    marginTop: SPACING.md,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  placeholderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  placeholderSubtext: {
    textAlign: 'center',
  },
})

export default ChapterBucketList
