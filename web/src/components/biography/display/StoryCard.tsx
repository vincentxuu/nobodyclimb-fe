'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  TrendingUp,
  Brain,
  Users,
  Wrench,
  Compass,
  Palette,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'

// Icon mapping for dynamic rendering
const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  Brain,
  Users,
  Wrench,
  Compass,
  Palette,
  BookOpen,
}

interface StoryCardProps {
  /** 問題標題 */
  title: string
  /** 故事內容 */
  content: string
  /** 分類 Icon 名稱 (Lucide icon name) */
  icon?: string
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
  icon,
  isCustom = false,
  maxLines: _maxLines = 3,
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
          ? 'bg-brand-accent/5 border-brand-accent/30 hover:border-brand-accent'
          : 'bg-white border-[#DBD8D8] hover:border-[#B6B3B3]',
        className
      )}
      onClick={handleClick}
    >
      {/* Title */}
      <div className="flex items-start gap-2 mb-3">
        {(() => {
          const IconComponent = icon ? iconMap[icon] : null
          return IconComponent ? (
            <IconComponent size={18} className="text-[#3F3D3D] flex-shrink-0 mt-0.5" />
          ) : null
        })()}
        <h3 className="font-medium text-[#1B1A1A]">
          {isCustom && <Sparkles size={14} className="text-brand-accent mr-1 inline" />}
          {title}
        </h3>
      </div>

      {/* Content */}
      <div
        className={cn(
          'text-[#6D6C6C] leading-relaxed',
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
          className="mt-3 text-sm text-brand-dark font-medium hover:underline"
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
          className="mt-3 text-sm text-[#6D6C6C] font-medium hover:underline"
        >
          收合
        </button>
      )}
    </div>
  )
}

export default StoryCard
