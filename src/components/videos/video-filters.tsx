import React from 'react'
import { Button } from '@/components/ui/button'
import type { VideoCategory } from '@/lib/types'

interface VideoFiltersProps {
  selectedCategory: VideoCategory | 'all'
  onCategoryChange: (category: VideoCategory | 'all') => void
}

const VideoFilters: React.FC<VideoFiltersProps> = ({ 
  selectedCategory, 
  onCategoryChange 
}) => {
  const categories: Array<{ value: VideoCategory | 'all'; label: string }> = [
    { value: 'all', label: '全部' },
    { value: '戶外攀岩', label: '戶外攀岩' },
    { value: '室內攀岩', label: '室內攀岩' },
    { value: '競技攀岩', label: '競技攀岩' },
    { value: '抱石', label: '抱石' },
    { value: '教學影片', label: '教學影片' },
    { value: '紀錄片', label: '紀錄片' },
    { value: '裝備評測', label: '裝備評測' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Button
          key={category.value}
          variant={selectedCategory === category.value ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange(category.value)}
          className="text-xs"
        >
          {category.label}
        </Button>
      ))}
    </div>
  )
}

export default VideoFilters