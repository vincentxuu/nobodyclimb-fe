'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { Biography, BucketListItem } from '@/lib/types'
import { bucketListService } from '@/lib/api/services'
import { BiographyBucketList } from '@/components/bucket-list'

interface ChapterBucketListProps {
  person: Biography
  isOwner: boolean
}

/**
 * Chapter 3 - 人生清單
 * 只在有內容時顯示（有故事描述或有清單項目）
 */
export function ChapterBucketList({ person, isOwner }: ChapterBucketListProps) {
  const [items, setItems] = useState<BucketListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 檢查是否有人生清單項目
  const loadItems = useCallback(async () => {
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
  }, [person.id])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // 沒有故事描述、沒有清單項目、且不是擁有者時，不顯示此區塊
  if (!isLoading && !person.bucket_list_story && items.length === 0 && !isOwner) {
    return null
  }

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

        {/* 人生清單故事描述 */}
        {person.bucket_list_story && (
          <p className="mb-8 text-lg leading-relaxed text-gray-700">
            {person.bucket_list_story}
          </p>
        )}
        {/* 結構化人生清單 */}
        <div className="mt-8">
          <BiographyBucketList biographyId={person.id} />
        </div>
      </div>
    </section>
  )
}
