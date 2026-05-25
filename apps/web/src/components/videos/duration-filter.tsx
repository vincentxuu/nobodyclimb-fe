import { useTranslations } from 'next-intl'
import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VIDEO_DURATION_OPTIONS, type VideoDuration } from '@/lib/types'

interface DurationFilterProps {
  selectedDuration: VideoDuration | 'all'
  // eslint-disable-next-line no-unused-vars
  onDurationChange: (_duration: VideoDuration | 'all') => void
}

const DURATION_LABEL_KEYS: Record<VideoDuration | 'all', string> = {
  all: 'durationAll',
  short: 'durationShort',
  medium: 'durationMedium',
  long: 'durationLong',
}

const DurationFilter: React.FC<DurationFilterProps> = ({ selectedDuration, onDurationChange }) => {
  const t = useTranslations('VideosPage')

  const selectedLabel = t(DURATION_LABEL_KEYS[selectedDuration] ?? 'durationAll')

  return (
    <div className="w-full md:w-48">
      <Select
        value={selectedDuration}
        onValueChange={(value) => onDurationChange(value as VideoDuration | 'all')}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('durationSelectPlaceholder')}>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {VIDEO_DURATION_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(DURATION_LABEL_KEYS[option.value])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default DurationFilter
