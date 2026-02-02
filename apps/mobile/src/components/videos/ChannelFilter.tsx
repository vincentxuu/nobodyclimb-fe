/**
 * ChannelFilter 組件
 *
 * 頻道過濾器，對應 apps/web/src/components/videos/channel-filter.tsx
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Select, type SelectOption } from '@/components/ui/Select'

export interface ChannelFilterProps {
  /** 可選頻道列表 */
  channels: string[]
  /** 當前選中頻道 */
  selectedChannel: string
  /** 頻道變化時的回調 */
  onChannelChange: (channel: string) => void
}

/**
 * 頻道過濾器
 *
 * @example
 * ```tsx
 * <ChannelFilter
 *   channels={['頻道A', '頻道B']}
 *   selectedChannel="all"
 *   onChannelChange={(channel) => setChannel(channel)}
 * />
 * ```
 */
export function ChannelFilter({
  channels,
  selectedChannel,
  onChannelChange,
}: ChannelFilterProps) {
  // 建立選項列表
  const options: SelectOption[] = [
    { value: 'all', label: '全部頻道' },
    ...channels.map((channel) => ({
      value: channel,
      label: channel,
    })),
  ]

  return (
    <View style={styles.container}>
      <Select
        options={options}
        value={selectedChannel}
        onValueChange={onChannelChange}
        placeholder="選擇頻道"
        title="選擇頻道"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
})

export default ChannelFilter
