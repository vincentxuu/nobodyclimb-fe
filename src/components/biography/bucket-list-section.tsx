'use client'

import { useState, useEffect } from 'react'
import { Loader2, ListTodo, CheckCircle2, Circle, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { bucketListService } from '@/lib/api/services'
import { BucketListCard } from './bucket-list-card'
import { cn } from '@/lib/utils'

interface BucketListItem {
  id: string
  biography_id: string
  title: string
  category: string
  description: string | null
  target_grade: string | null
  target_location: string | null
  target_date: string | null
  status: 'active' | 'completed' | 'archived'
  enable_progress: number
  progress_mode: string | null
  progress: number
  milestones: string | null
  completion_story: string | null
  psychological_insights: string | null
  technical_insights: string | null
  completion_media: string | null
  completed_at: string | null
  likes_count: number
  comments_count: number
  inspired_count: number
  is_public: number
  sort_order: number
  created_at: string
  updated_at: string
}

interface BucketListSectionProps {
  biographyId: string
  isOwner?: boolean
  className?: string
}

type FilterStatus = 'all' | 'active' | 'completed'

export function BucketListSection({
  biographyId,
  isOwner = false,
  className,
}: BucketListSectionProps) {
  const [items, setItems] = useState<BucketListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')

  useEffect(() => {
    loadItems()
  }, [biographyId])

  const loadItems = async () => {
    setIsLoading(true)
    try {
      const response = await bucketListService.getBucketList(biographyId)
      if (response.success && response.data) {
        setItems(response.data as BucketListItem[])
      }
    } catch (error) {
      console.error('Failed to load bucket list:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true
    return item.status === filter
  })

  const activeCount = items.filter((item) => item.status === 'active').length
  const completedCount = items.filter((item) => item.status === 'completed').length

  if (isLoading) {
    return (
      <div className={cn('flex justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <ListTodo className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">還沒有人生清單項目</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Circle className="h-4 w-4" />
            <span>{activeCount} 進行中</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>{completedCount} 已完成</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterStatus)}
            className="text-sm border-0 bg-transparent text-gray-600 focus:ring-0 cursor-pointer"
          >
            <option value="all">全部</option>
            <option value="active">進行中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredItems.map((item) => (
          <BucketListCard key={item.id} item={item} isOwner={isOwner} />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          沒有符合篩選條件的項目
        </div>
      )}
    </div>
  )
}
