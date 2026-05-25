import { useTranslations } from 'next-intl'
import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VIDEO_POPULARITY_OPTIONS, type VideoPopularity } from '@/lib/types'

interface PopularityFilterProps {
  selectedPopularity: VideoPopularity | 'all'
  // eslint-disable-next-line no-unused-vars
  onPopularityChange: (_popularity: VideoPopularity | 'all') => void
}

const POPULARITY_LABEL_KEYS: Record<VideoPopularity | 'all', string> = {
  all: 'popularityAll',
  viral: 'popularityViral',
  popular: 'popularityPopular',
  normal: 'popularityNormal',
  niche: 'popularityNiche',
}

const PopularityFilter: React.FC<PopularityFilterProps> = ({
  selectedPopularity,
  onPopularityChange,
}) => {
  const t = useTranslations('VideosPage')

  const selectedLabel = t(POPULARITY_LABEL_KEYS[selectedPopularity] ?? 'popularityAll')

  return (
    <div className="w-full md:w-40">
      <Select
        value={selectedPopularity}
        onValueChange={(value) => onPopularityChange(value as VideoPopularity | 'all')}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('popularitySelectPlaceholder')}>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {VIDEO_POPULARITY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(POPULARITY_LABEL_KEYS[option.value])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default PopularityFilter
