import { useTranslations } from 'next-intl'
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
  // eslint-disable-next-line no-unused-vars
  onChannelChange: (_channel: string) => void
}

const ChannelFilter: React.FC<ChannelFilterProps> = ({
  channels,
  selectedChannel,
  onChannelChange,
}) => {
  const t = useTranslations('VideosPage')

  return (
    <div className="w-full md:w-64">
      <Select value={selectedChannel} onValueChange={onChannelChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('channelSelectPlaceholder')}>
            {selectedChannel === 'all' ? t('channelAll') : selectedChannel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('channelAll')}</SelectItem>
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
