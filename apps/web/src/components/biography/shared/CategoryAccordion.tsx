'use client'

import { useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight, Check, Sparkles } from 'lucide-react'

interface CategoryAccordionProps {
  /** 標題 */
  title: string
  /** Emoji 圖示 */
  emoji?: string
  /** 完成進度 */
  progress?: {
    completed: number
    total: number
  }
  /** 是否預設展開 */
  defaultExpanded?: boolean
  /** 子內容 */
  children: ReactNode
  /** 自訂樣式 */
  className?: string
  /** Header 右側額外內容 */
  headerRight?: ReactNode
}

/**
 * 分類摺疊組件
 *
 * 用於故事編輯器中的分類展示
 */
export function CategoryAccordion({
  title,
  emoji,
  progress,
  defaultExpanded = false,
  children,
  className,
  headerRight,
}: CategoryAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const hasProgress = progress && progress.total > 0
  const progressPercentage = hasProgress
    ? Math.round((progress.completed / progress.total) * 100)
    : 0

  return (
    <div
      className={cn(
        'border border-[#DBD8D8] rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-[#F5F5F5] hover:bg-[#EBEAEA] transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            size={20}
            className={cn(
              'text-[#6D6C6C] transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
          {emoji && <span className="text-lg">{emoji}</span>}
          <span className="font-medium text-[#1B1A1A]">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {hasProgress && (
            <span
              className={cn(
                'text-sm',
                progress.completed > 0 ? 'text-[#1B1A1A]' : 'text-[#6D6C6C]'
              )}
            >
              {progress.completed}/{progress.total} 已填寫
            </span>
          )}
          {headerRight}
        </div>
      </button>

      {/* Progress Bar (if has progress) */}
      {hasProgress && progressPercentage > 0 && (
        <div className="h-1 bg-[#EBEAEA]">
          <div
            className="h-full bg-brand-accent transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Content */}
      {isExpanded && <div className="p-4">{children}</div>}
    </div>
  )
}

/**
 * 故事項目組件
 *
 * 用於顯示單個故事問題
 */
interface StoryItemProps {
  /** 問題標題 */
  title: string
  /** 說明文字 */
  subtitle?: string
  /** 已填寫的回答摘要 */
  answer?: string
  /** 是否已填寫 */
  isFilled?: boolean
  /** 是否為用戶自訂問題 */
  isCustom?: boolean
  /** 點擊回調 */
  onClick?: () => void
  /** 自訂樣式 */
  className?: string
}

export function StoryItem({
  title,
  subtitle,
  answer,
  isFilled = false,
  isCustom = false,
  onClick,
  className,
}: StoryItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-4 rounded-lg border transition-all duration-200',
        'hover:shadow-md hover:border-[#B6B3B3]',
        isFilled ? 'bg-brand-accent/10 border-brand-accent' : 'bg-white border-[#DBD8D8]',
        className
      )}
    >
      {/* Status Icon */}
      <div
        className={cn(
          'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
          isFilled
            ? 'bg-brand-accent text-brand-dark'
            : 'border-2 border-[#B6B3B3]'
        )}
      >
        {isFilled && <Check size={12} />}
      </div>

      {/* Content */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-1">
          {isCustom && <Sparkles size={14} className="text-brand-accent" />}
          <span
            className={cn(
              'font-medium',
              isFilled ? 'text-[#1B1A1A]' : 'text-[#3F3D3D]'
            )}
          >
            {title}
          </span>
        </div>
        {subtitle && !isFilled && (
          <p className="text-sm text-[#6D6C6C] mt-0.5">{subtitle}</p>
        )}
        {answer && (
          <p className="text-sm text-[#6D6C6C] mt-1 line-clamp-2">「{answer}」</p>
        )}
      </div>

      {/* Action */}
      <span
        className={cn(
          'text-sm font-medium px-3 py-1 rounded-full flex-shrink-0',
          isFilled
            ? 'text-[#1B1A1A] bg-brand-accent/20'
            : 'text-[#3F3D3D] bg-[#F5F5F5]'
        )}
      >
        {isFilled ? '編輯' : '開始寫'}
      </span>
    </button>
  )
}

export default CategoryAccordion
