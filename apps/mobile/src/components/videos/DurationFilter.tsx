/**
 * DurationFilter 組件
 *
 * 時長過濾器，對應 apps/web/src/components/videos/duration-filter.tsx
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Select, type SelectOption } from '@/components/ui/Select'
import { VIDEO_DURATION_OPTIONS, type VideoDuration } from './types'

export { VIDEO_DURATION_OPTIONS }

export interface DurationFilterProps {
  /** 當前選中時長 */
  selectedDuration: VideoDuration | 'all'
  /** 時長變化時的回調 */
  onDurationChange: (duration: VideoDuration | 'all') => void
}

/**
 * 時長過濾器
 *
 * @example
 * ```tsx
 * <DurationFilter
 *   selectedDuration="all"
 *   onDurationChange={(duration) => setDuration(duration)}
 * />
 * ```
 */
export function DurationFilter({
  selectedDuration,
  onDurationChange,
}: DurationFilterProps) {
  // 轉換為 SelectOption 格式
  const options: SelectOption[] = VIDEO_DURATION_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }))

  const handleChange = (value: string) => {
    onDurationChange(value as VideoDuration | 'all')
  }

  return (
    <View style={styles.container}>
      <Select
        options={options}
        value={selectedDuration}
        onValueChange={handleChange}
        placeholder="選擇時長"
        title="選擇時長"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
})

export default DurationFilter
