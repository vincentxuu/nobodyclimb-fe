import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ChannelFilterProps {
  channels: string[]
  selectedChannel: string
  onChannelChange: (channel: string) => void
}

const ChannelFilter: React.FC<ChannelFilterProps> = ({
  channels,
  selectedChannel,
  onChannelChange,
}) => {
  return (
    <div className="w-full md:w-64">
      <Select value={selectedChannel} onValueChange={onChannelChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="選擇頻道">
            {selectedChannel === 'all' ? '全部頻道' : selectedChannel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部頻道</SelectItem>
          {channels.map((channel) => (
            <SelectItem key={channel} value={channel}>
              {channel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default ChannelFilter
