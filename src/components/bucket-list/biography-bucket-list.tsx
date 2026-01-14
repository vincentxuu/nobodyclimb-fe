'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { bucketListService } from '@/lib/api/services'
import type { BucketListItem } from '@/lib/types'
import { BucketListItemCard } from './bucket-list-item'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { LikeButton } from '@/components/biography/like-button'
import { ReferenceButton } from '@/components/biography/reference-button'
import { CommentSection } from '@/components/biography/comment-section'

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
            進行中 ({activeItems.length})
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {activeItems.map((item) => (
              <div key={item.id} className="w-96 flex-shrink-0 snap-center">
                <BucketListItemCard
                  item={item}
                  variant="expanded"
                  showActions={false}
                  isOwner={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已完成的目標 */}
      {completedItems.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-[#1B1A1A]">
            已完成 ({completedItems.length})
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {completedItems.map((item) => (
              <div key={item.id} className="w-96 flex-shrink-0 snap-center">
                <CompletedBucketListCard item={item} />
              </div>
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
    <div className="group h-full overflow-hidden rounded-xl border border-brand-accent/30 bg-white shadow-sm transition-all hover:shadow-md hover:border-brand-accent/50">
      {/* 完成標記與主要內容 */}
      <div className="relative bg-brand-accent/5 p-6">
        {/* 完成勾勾角標 */}
        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent">
          <Check className="h-5 w-5 text-brand-dark" />
        </div>

        {/* 目標內容 */}
        <div className="pr-10">
          <h4 className="mb-2 text-lg font-semibold text-brand-dark">{item.title}</h4>
          {item.description && (
            <p className="mb-3 text-sm text-text-subtle line-clamp-2">{item.description}</p>
          )}

          {/* 完成日期 */}
          {item.completed_at && (
            <div className="flex items-center gap-2 text-xs text-text-subtle">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>完成於 {new Date(item.completed_at).toLocaleDateString('zh-TW')}</span>
            </div>
          )}
        </div>
      </div>

      {/* 完成故事展開區 */}
      {hasCompletionStory && (
        <div className="border-t border-brand-accent/20">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full bg-white p-4 text-left text-sm font-medium text-brand-dark transition-colors hover:bg-brand-light"
            >
              <span className="flex items-center justify-between">
                查看完成故事
                <span className="text-text-subtle">→</span>
              </span>
            </button>
          ) : (
            <div className="space-y-4 bg-white p-4">
              {item.completion_story && (
                <div>
                  <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-dark">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-accent"></span>
                    完成故事
                  </h5>
                  <p className="text-sm leading-relaxed text-text-main whitespace-pre-line">
                    {item.completion_story}
                  </p>
                </div>
              )}

              {item.psychological_insights && (
                <div>
                  <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-dark">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-accent"></span>
                    心理層面
                  </h5>
                  <p className="text-sm leading-relaxed text-text-main whitespace-pre-line">
                    {item.psychological_insights}
                  </p>
                </div>
              )}

              {item.technical_insights && (
                <div>
                  <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-dark">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-accent"></span>
                    技術層面
                  </h5>
                  <p className="text-sm leading-relaxed text-text-main whitespace-pre-line">
                    {item.technical_insights}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-sm text-text-subtle transition-colors hover:text-brand-dark"
              >
                收起 ↑
              </button>
            </div>
          )}
        </div>
      )}

      {/* 互動功能區 - 按讚、參考、留言 */}
      {item.is_public && (
        <div className="border-t border-brand-accent/20 bg-white p-4">
          <div className="flex items-center gap-4">
            <LikeButton
              itemId={item.id}
              initialCount={item.likes_count || 0}
              variant="icon"
            />
            <ReferenceButton
              itemId={item.id}
              initialCount={item.inspired_count || 0}
              variant="icon"
            />
          </div>
          <div className="mt-3">
            <CommentSection
              itemId={item.id}
              initialCount={item.comments_count || 0}
            />
          </div>
        </div>
      )}
    </div>
  )
}
