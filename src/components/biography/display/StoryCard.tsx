'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StoryCardProps {
  /** 問題標題 */
  title: string
  /** 故事內容 */
  content: string
  /** 分類 Emoji */
  emoji?: string
  /** 是否為用戶自訂問題 */
  isCustom?: boolean
  /** 最大顯示行數 */
  maxLines?: number
  /** 點擊回調（展開閱讀） */
  onReadMore?: () => void
  /** 自訂樣式 */
  className?: string
}

/**
 * 故事卡片組件
 *
 * 用於展示單則故事
 */
export function StoryCard({
  title,
  content,
  emoji,
  isCustom = false,
  maxLines = 3,
  onReadMore,
  className,
}: StoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 判斷內容是否需要截斷
  const needsTruncation = content.length > 100 // 簡單判斷，實際可根據行數

  const handleClick = () => {
    if (onReadMore) {
      onReadMore()
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer',
        isCustom
          ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
          : 'bg-white border-gray-200 hover:border-gray-300',
        className
      )}
      onClick={handleClick}
    >
      {/* Title */}
      <div className="flex items-start gap-2 mb-3">
        {emoji && <span className="text-lg flex-shrink-0">{emoji}</span>}
        <h3 className="font-medium text-gray-900">
          {isCustom && <span className="text-amber-500 mr-1">✨</span>}
          {title}
        </h3>
      </div>

      {/* Content */}
      <div
        className={cn(
          'text-gray-600 leading-relaxed',
          !isExpanded && needsTruncation && 'line-clamp-3'
        )}
      >
        {content}
      </div>

      {/* Read More Button */}
      {needsTruncation && !isExpanded && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
          className="mt-3 text-sm text-primary font-medium hover:underline"
        >
          繼續閱讀
        </button>
      )}

      {/* Collapse Button */}
      {isExpanded && needsTruncation && !onReadMore && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(false)
          }}
          className="mt-3 text-sm text-gray-500 font-medium hover:underline"
        >
          收合
        </button>
      )}
    </div>
  )
}

export default StoryCard
