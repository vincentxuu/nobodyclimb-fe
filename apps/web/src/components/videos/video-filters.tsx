import React from 'react'
import { Button } from '@/components/ui/button'
import type { VideoCategory } from '@/lib/types'

interface VideoFiltersProps {
  selectedCategory: VideoCategory | 'all'
  // eslint-disable-next-line no-unused-vars
  onCategoryChange: (_category: VideoCategory | 'all') => void
}

const VideoFilters: React.FC<VideoFiltersProps> = ({ 
  selectedCategory, 
  onCategoryChange 
}) => {
  const categories: Array<{ value: VideoCategory | 'all'; label: string }> = [
    { value: 'all', label: '全部' },
    // 攀岩類型
    { value: '戶外上攀', label: '戶外上攀' },
    { value: '戶外抱石', label: '戶外抱石' },
    { value: '室內上攀', label: '室內上攀' },
    { value: '室內抱石', label: '室內抱石' },
    { value: '賽事', label: '賽事' },
    // 內容類型
    { value: '教學影片', label: '教學影片' },
    { value: '訓練', label: '訓練' },
    { value: '紀錄片', label: '紀錄片' },
    { value: '裝備評測', label: '裝備評測' },
    { value: '挑戰影片', label: '挑戰影片' },
    { value: '訪談', label: '訪談' },
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