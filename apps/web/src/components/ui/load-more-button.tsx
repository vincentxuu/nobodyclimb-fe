'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoadMoreButtonProps {
  /** 按鈕點擊事件 */
  onClick: () => void
  /** 是否正在載入中 */
  loading?: boolean
  /** 是否還有更多資料可載入 */
  hasMore?: boolean
  /** 按鈕文字 */
  text?: string
  /** 載入中的文字 */
  loadingText?: string
  /** 沒有更多資料時的文字 */
  noMoreText?: string
  /** 自訂樣式類名 */
  className?: string
}

export function LoadMoreButton({
  onClick,
  loading = false,
  hasMore = true,
  text = '看更多',
  loadingText = '載入中...',
  noMoreText = '已顯示全部',
  className,
}: LoadMoreButtonProps) {
  if (!hasMore) {
    return (
      <div className={`py-8 text-center ${className ?? ''}`}>
        <p className="text-text-subtle">{noMoreText}</p>
      </div>
    )
  }

  return (
    <div className={`mt-8 text-center md:mt-12 ${className ?? ''}`}>
      <Button
        variant="outline"
        onClick={onClick}
        disabled={loading}
        className="h-11 border border-text-main px-8 text-text-main hover:bg-neutral-200 hover:text-text-main"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          text
        )}
      </Button>
    </div>
  )
}
