import { useTranslations } from 'next-intl'
import React from 'react'
import { Button } from '@/components/ui/button'
import type { VideoCategory } from '@/lib/types'

interface VideoFiltersProps {
  selectedCategory: VideoCategory | 'all'
  // eslint-disable-next-line no-unused-vars
  onCategoryChange: (_category: VideoCategory | 'all') => void
}

const VideoFilters: React.FC<VideoFiltersProps> = ({ selectedCategory, onCategoryChange }) => {
  const t = useTranslations('VideosPage')

  const categories: Array<{ value: VideoCategory | 'all'; labelKey: string }> = [
    { value: 'all', labelKey: 'categoryAll' },
    // 攀岩類型
    { value: '戶外上攀', labelKey: 'categoryOutdoorLead' },
    { value: '戶外抱石', labelKey: 'categoryOutdoorBoulder' },
    { value: '室內上攀', labelKey: 'categoryIndoorLead' },
    { value: '室內抱石', labelKey: 'categoryIndoorBoulder' },
    { value: '賽事', labelKey: 'categoryCompetition' },
    // 內容類型
    { value: '教學影片', labelKey: 'categoryTutorial' },
    { value: '訓練', labelKey: 'categoryTraining' },
    { value: '紀錄片', labelKey: 'categoryDocumentary' },
    { value: '裝備評測', labelKey: 'categoryGearReview' },
    { value: '挑戰影片', labelKey: 'categoryChallenge' },
    { value: '訪談', labelKey: 'categoryInterview' },
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
          {t(category.labelKey)}
        </Button>
      ))}
    </div>
  )
}

export default VideoFilters
