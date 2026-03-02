/**
 * PopularityFilter 組件
 *
 * 熱門度過濾器，對應 apps/web/src/components/videos/popularity-filter.tsx
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Select, type SelectOption } from '@/components/ui/Select'
import { VIDEO_POPULARITY_OPTIONS, type VideoPopularity } from './types'

export { VIDEO_POPULARITY_OPTIONS }

export interface PopularityFilterProps {
  /** 當前選中熱門程度 */
  selectedPopularity: VideoPopularity | 'all'
  /** 熱門程度變化時的回調 */
  onPopularityChange: (popularity: VideoPopularity | 'all') => void
}

/**
 * 熱門度過濾器
 *
 * @example
 * ```tsx
 * <PopularityFilter
 *   selectedPopularity="all"
 *   onPopularityChange={(popularity) => setPopularity(popularity)}
 * />
 * ```
 */
export function PopularityFilter({
  selectedPopularity,
  onPopularityChange,
}: PopularityFilterProps) {
  // 轉換為 SelectOption 格式
  const options: SelectOption[] = VIDEO_POPULARITY_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }))

  const handleChange = (value: string) => {
    onPopularityChange(value as VideoPopularity | 'all')
  }

  return (
    <View style={styles.container}>
      <Select
        options={options}
        value={selectedPopularity}
        onValueChange={handleChange}
        placeholder="熱門程度"
        title="熱門程度"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
})

export default PopularityFilter
