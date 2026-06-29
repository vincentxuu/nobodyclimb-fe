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

const DurationFilter: React.FC<DurationFilterProps> = ({ selectedDuration, onDurationChange }) => {
  return (
    <div className="w-full md:w-48">
      <Select
        value={selectedDuration}
        onValueChange={(value) => onDurationChange(value as VideoDuration | 'all')}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="選擇時長" />
        </SelectTrigger>
        <SelectContent>
          {VIDEO_DURATION_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default DurationFilter
