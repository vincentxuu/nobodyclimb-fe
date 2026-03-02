'use client'

import { cn } from '@/lib/utils'
import { Check, ChevronRight, BarChart3, LucideIcon } from 'lucide-react'

interface ProgressIndicatorProps {
  /** 各區塊的完成狀態 */
  sections: {
    id: string
    label: string
    icon: LucideIcon
    isCompleted: boolean
    progress?: {
      completed: number
      total: number
    }
  }[]
  /** 當前活動區塊 ID */
  activeSection?: string
  /** 區塊點擊回調 */
  onSectionClick?: (_sectionId: string) => void
  /** 自訂樣式 */
  className?: string
}

/**
 * 進度指示器
 *
 * 顯示人物誌的填寫進度
 */
export function ProgressIndicator({
  sections,
  activeSection,
  onSectionClick,
  className,
}: ProgressIndicatorProps) {
  const completedCount = sections.filter((s) => s.isCompleted).length
  const totalCount = sections.length
  const overallProgress = Math.round((completedCount / totalCount) * 100)

  return (
    <div className={cn('bg-white rounded-lg border border-[#DBD8D8] p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-[#3F3D3D]" />
          <span className="font-medium text-[#1B1A1A]">完成進度</span>
        </div>
        <span
          className={cn(
            'text-sm font-medium px-2 py-1 rounded-full',
            overallProgress === 100
              ? 'bg-brand-accent/20 text-[#1B1A1A]'
              : 'bg-[#F5F5F5] text-[#6D6C6C]'
          )}
        >
          {overallProgress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-[#EBEAEA] rounded-full mb-4 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            overallProgress === 100 ? 'bg-brand-accent' : 'bg-brand-dark'
          )}
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSectionClick?.(section.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
              activeSection === section.id
                ? 'bg-brand-accent/10'
                : 'hover:bg-[#F5F5F5]',
              !onSectionClick && 'cursor-default'
            )}
          >
            {/* Status Icon */}
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                section.isCompleted
                  ? 'bg-brand-accent text-brand-dark'
                  : 'bg-[#EBEAEA]'
              )}
            >
              {section.isCompleted ? (
                <Check size={14} />
              ) : (
                <section.icon size={14} className="text-[#6D6C6C]" />
              )}
            </div>

            {/* Label & Progress */}
            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  'text-sm',
                  section.isCompleted ? 'text-[#1B1A1A]' : 'text-[#6D6C6C]'
                )}
              >
                {section.label}
              </span>
              {section.progress && (
                <span className="text-xs text-[#8E8C8C] ml-2">
                  {section.progress.completed}/{section.progress.total}
                </span>
              )}
            </div>

            {/* Arrow */}
            {onSectionClick && (
              <ChevronRight size={16} className="text-[#B6B3B3]" />
            )}
          </button>
        ))}
      </div>

      {/* Completion Message */}
      {overallProgress === 100 && (
        <div className="mt-4 p-3 bg-brand-accent/20 rounded-lg">
          <p className="text-sm text-[#1B1A1A] text-center">
            太棒了！你的人物誌已經完成！
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * 簡易進度條
 *
 * 用於顯示單一區塊的完成進度
 */
interface SimpleProgressBarProps {
  /** 完成數量 */
  completed: number
  /** 總數量 */
  total: number
  /** 顯示文字 */
  showLabel?: boolean
  /** 自訂樣式 */
  className?: string
}

export function SimpleProgressBar({
  completed,
  total,
  showLabel = true,
  className,
}: SimpleProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-[#EBEAEA] rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            percentage === 100 ? 'bg-brand-accent' : 'bg-brand-dark'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[#6D6C6C] whitespace-nowrap">
          {completed}/{total}
        </span>
      )}
    </div>
  )
}

export default ProgressIndicator
