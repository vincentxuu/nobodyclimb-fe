'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { BucketListItem } from '@/lib/types'
import { BiographyV2 } from '@/lib/types/biography-v2'
import { bucketListService } from '@/lib/api/services'
import { BiographyBucketList } from '@/components/bucket-list'

interface ChapterBucketListProps {
  person: BiographyV2 | null
  isOwner: boolean
}

/**
 * Chapter 3 - 人生清單
 * 永遠顯示，沒有資料時顯示預設內容
 */
export function ChapterBucketList({ person, isOwner: _isOwner }: ChapterBucketListProps) {
  const [items, setItems] = useState<BucketListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 從 stories 陣列中取得 bucket_list_story
  const bucketListStory = useMemo(() => {
    if (!person?.stories) return null
    const story = person.stories.find(s => s.question_id === 'bucket_list_story')
    return story?.content || null
  }, [person?.stories])

  // 檢查是否有人生清單項目
  const loadItems = useCallback(async () => {
    if (!person?.id) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const response = await bucketListService.getBucketList(person.id)
      if (response.success && response.data) {
        setItems(response.data)
      }
    } catch (error) {
      console.error('Failed to load bucket list:', error)
    } finally {
      setIsLoading(false)
    }
  }, [person?.id])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // 載入中時顯示 loading
  if (isLoading) {
    return (
      <section className="bg-white py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </div>
      </section>
    )
  }

  const hasContent = bucketListStory || items.length > 0

  if (!person) return null

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-8">
          <span className="text-sm font-medium uppercase tracking-wider bg-brand-accent">
            Chapter 3
          </span>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            攀岩人生清單
          </h2>
        </div>

        {hasContent ? (
          <>
            {/* 人生清單故事描述 */}
            {bucketListStory && (
              <p className="mb-8 text-lg leading-relaxed text-gray-700">
                {bucketListStory}
              </p>
            )}
            {/* 結構化人生清單 */}
            <div className="mt-8">
              <BiographyBucketList biographyId={person.id} />
            </div>
          </>
        ) : (
          /* 沒有資料時的預設內容 */
          <div className="flex flex-col items-center justify-center py-12 text-center" data-placeholder="true">
            <div className="flex items-center gap-2 text-lg text-gray-400">
              <Lock size={18} />
              <span>{person.name} 的攀岩人生清單正在醞釀中...</span>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              每個攀岩者都有屬於自己的目標與夢想
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
