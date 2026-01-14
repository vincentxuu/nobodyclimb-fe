'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Target, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { bucketListService } from '@/lib/api/services'
import type { BucketListItem } from '@/lib/types'
import { BucketListItemCard } from './bucket-list-item'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface BiographyBucketListProps {
  biographyId: string
  className?: string
}

/**
 * 在人物誌詳情頁顯示人生清單
 * 分為進行中和已完成兩個區塊
 */
export function BiographyBucketList({ biographyId, className }: BiographyBucketListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bucket-list', biographyId],
    queryFn: () => bucketListService.getBucketList(biographyId),
    enabled: !!biographyId,
  })

  const bucketList = data?.data || []

  // 只顯示公開的項目
  const publicItems = bucketList.filter((item) => item.is_public)

  // 分類：進行中和已完成
  const activeItems = publicItems.filter((item) => item.status === 'active')
  const completedItems = publicItems.filter((item) => item.status === 'completed')

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <LoadingSpinner />
      </div>
    )
  }

  if (error || publicItems.length === 0) {
    return null // 沒有公開的人生清單時不顯示
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 進行中的目標 */}
      {activeItems.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-[#1B1A1A]">
            <Target className="h-5 w-5" />
            進行中 ({activeItems.length})
          </h3>
          <div className="space-y-3">
            {activeItems.map((item) => (
              <BucketListItemCard
                key={item.id}
                item={item}
                variant="default"
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* 已完成的目標 */}
      {completedItems.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-[#1B1A1A]">
            <Check className="h-5 w-5 text-brand-dark" />
            已完成 ({completedItems.length})
          </h3>
          <div className="space-y-3">
            {completedItems.map((item) => (
              <CompletedBucketListCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 已完成目標卡片（帶完成故事）
 */
function CompletedBucketListCard({ item }: { item: BucketListItem }) {
  const [expanded, setExpanded] = React.useState(false)

  const hasCompletionStory =
    item.completion_story || item.psychological_insights || item.technical_insights

  return (
    <div className="rounded-lg border border-[#FAF40A] bg-yellow-50/30">
      <BucketListItemCard
        item={item}
        variant="default"
        showActions={false}
        className="border-0 bg-transparent shadow-none"
      />

      {/* 完成故事展開 */}
      {hasCompletionStory && (
        <div className="border-t border-[#FAF40A]/50 p-4">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-sm text-[#1B1A1A] hover:underline"
            >
              查看完成故事 →
            </button>
          ) : (
            <div className="space-y-4">
              {item.completion_story && (
                <div>
                  <h4 className="text-sm font-medium text-[#1B1A1A]">完成故事</h4>
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                    {item.completion_story}
                  </p>
                </div>
              )}

              {item.psychological_insights && (
                <div>
                  <h4 className="text-sm font-medium text-[#1B1A1A]">💭 心理層面</h4>
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                    {item.psychological_insights}
                  </p>
                </div>
              )}

              {item.technical_insights && (
                <div>
                  <h4 className="text-sm font-medium text-[#1B1A1A]">🧗 技術層面</h4>
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                    {item.technical_insights}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-sm text-gray-500 hover:underline"
              >
                收起
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
