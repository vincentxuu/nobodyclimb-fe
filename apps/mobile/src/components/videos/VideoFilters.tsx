/**
 * VideoFilters 組件
 *
 * 影片分類過濾器，對應 apps/web/src/components/videos/video-filters.tsx
 * 使用按鈕群組顯示分類選項
 */

import { SPACING } from '@nobodyclimb/constants'
import { ScrollView, StyleSheet } from 'react-native'
import { Button } from '@/components/ui/Button'
import type { VideoCategory } from './types'

/** 分類選項 */
const CATEGORIES: Array<{ value: VideoCategory | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: '戶外上攀', label: '戶外上攀' },
  { value: '戶外抱石', label: '戶外抱石' },
  { value: '室內上攀', label: '室內上攀' },
  { value: '室內抱石', label: '室內抱石' },
  { value: '賽事', label: '賽事' },
  { value: '教學影片', label: '教學影片' },
  { value: '訓練', label: '訓練' },
  { value: '紀錄片', label: '紀錄片' },
  { value: '裝備評測', label: '裝備評測' },
  { value: '挑戰影片', label: '挑戰影片' },
  { value: '訪談', label: '訪談' },
]

export interface VideoFiltersProps {
  /** 當前選中分類 */
  selectedCategory: VideoCategory | 'all'
  /** 分類變化時的回調 */
  onCategoryChange: (category: VideoCategory | 'all') => void
}

/**
 * 影片分類過濾器
 *
 * @example
 * ```tsx
 * <VideoFilters
 *   selectedCategory="all"
 *   onCategoryChange={(category) => setCategory(category)}
 * />
 * ```
 */
export function VideoFilters({ selectedCategory, onCategoryChange }: VideoFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((category) => (
        <Button
          key={category.value}
          variant={selectedCategory === category.value ? 'primary' : 'outline'}
          size="sm"
          onPress={() => onCategoryChange(category.value)}
          style={styles.button}
        >
          {category.label}
        </Button>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING[2],
    paddingHorizontal: SPACING[4],
  },
  button: {
    marginRight: 0,
  },
})

export default VideoFilters
