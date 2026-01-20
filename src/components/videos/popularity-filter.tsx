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

const PopularityFilter: React.FC<PopularityFilterProps> = ({
  selectedPopularity,
  onPopularityChange,
}) => {
  const selectedLabel = VIDEO_POPULARITY_OPTIONS.find(opt => opt.value === selectedPopularity)?.label || '全部'

  return (
    <div className="w-full md:w-40">
      <Select value={selectedPopularity} onValueChange={(value) => onPopularityChange(value as VideoPopularity | 'all')}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="熱門程度">
            {selectedLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {VIDEO_POPULARITY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default PopularityFilter
