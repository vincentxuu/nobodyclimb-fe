'use client'

import { Check, Circle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Milestone } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ProgressTrackerProps {
  mode: 'manual' | 'milestone' | null
  progress: number
  milestones?: Milestone[] | null
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  editable?: boolean
  onProgressChange?: (progress: number) => void // eslint-disable-line no-unused-vars
  onMilestoneToggle?: (milestoneId: string, completed: boolean) => void // eslint-disable-line no-unused-vars
}

/**
 * 進度追蹤組件
 * 支援兩種模式：
 * - manual: 顯示百分比進度條
 * - milestone: 顯示里程碑檢查點
 */
export function ProgressTracker({
  mode,
  progress,
  milestones,
  showLabels = true,
  size = 'md',
  className,
  editable = false,
  onProgressChange,
  onMilestoneToggle,
}: ProgressTrackerProps) {
  const t = useTranslations('BucketList')
  if (!mode) return null

  const sizeClasses = {
    sm: {
      bar: 'h-1.5',
      milestone: 'w-5 h-5',
      milestoneContainer: 'h-5',
      text: 'text-xs',
      spacing: 'gap-1',
    },
    md: {
      bar: 'h-2',
      milestone: 'w-6 h-6',
      milestoneContainer: 'h-6',
      text: 'text-sm',
      spacing: 'gap-2',
    },
    lg: {
      bar: 'h-3',
      milestone: 'w-8 h-8',
      milestoneContainer: 'h-8',
      text: 'text-base',
      spacing: 'gap-3',
    },
  }

  const sizes = sizeClasses[size]

  if (mode === 'manual') {
    return (
      <div className={cn('w-full', className)}>
        <div className={cn('relative w-full rounded-full bg-gray-200', sizes.bar)}>
          <div
            className={cn(
              'absolute left-0 top-0 rounded-full bg-brand-accent/70 transition-all duration-300',
              sizes.bar
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        {showLabels && (
          <div className={cn('mt-1 flex justify-between', sizes.text, 'text-gray-500')}>
            <span>{t('progress')}</span>
            <span>{progress}%</span>
          </div>
        )}
        {editable && (
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => onProgressChange?.(parseInt(e.target.value, 10))}
            className="mt-2 w-full cursor-pointer"
          />
        )}
      </div>
    )
  }

  // Milestone mode
  // 解析 milestones（防禦性檢查）
  let parsedMilestones = milestones
  if (typeof parsedMilestones === 'string') {
    try {
      parsedMilestones = JSON.parse(parsedMilestones)
    } catch {
      parsedMilestones = null
    }
  }

  if (!parsedMilestones || !Array.isArray(parsedMilestones) || parsedMilestones.length === 0) {
    return null
  }

  const sortedMilestones = [...parsedMilestones].sort((a, b) => a.percentage - b.percentage)

  // 判斷是否為多里程碑（超過 5 個），需要特殊的行動版處理
  const isManyMilestones = sortedMilestones.length > 5

  return (
    <div className={cn('w-full', isManyMilestones && 'overflow-x-auto scrollbar-hide', className)}>
      <div className={cn(isManyMilestones && 'min-w-[500px]')}>
        {/* 里程碑進度條 */}
        <div className="px-3">
          <div className={cn('relative', sizes.milestoneContainer)}>
            {/* 背景線 */}
            <div
              className={cn(
                'absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full bg-gray-200',
                sizes.bar
              )}
            />

            {/* 已完成的進度線 */}
            <div
              className={cn(
                'absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-brand-accent/70 transition-all duration-300',
                sizes.bar
              )}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />

            {/* 里程碑點 */}
            {sortedMilestones.map((milestone) => {
              const isCompleted = milestone.completed
              return (
                <button
                  key={milestone.id}
                  type="button"
                  disabled={!editable}
                  onClick={() => editable && onMilestoneToggle?.(milestone.id, !isCompleted)}
                  className={cn(
                    'absolute top-0 z-10 flex -translate-x-1/2 items-center justify-center rounded-full border-2 transition-all',
                    sizes.milestone,
                    isCompleted
                      ? 'border-[#1B1A1A] bg-brand-accent/70 text-[#1B1A1A]'
                      : 'border-gray-300 bg-white text-gray-300',
                    editable && 'cursor-pointer hover:border-[#1B1A1A]'
                  )}
                  style={{ left: `${milestone.percentage}%` }}
                  title={milestone.title}
                >
                  {isCompleted ? (
                    <Check
                      className={cn(
                        size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
                      )}
                    />
                  ) : (
                    <Circle
                      className={cn(
                        size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-2.5 w-2.5' : 'h-3 w-3'
                      )}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 里程碑標籤 */}
        {showLabels && (
          <div className={cn('mt-2 px-3', isManyMilestones && 'pb-1')}>
            <div className="relative">
              {sortedMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={cn(
                    'absolute flex -translate-x-1/2 flex-col items-center gap-0.5 text-center',
                    sizes.text,
                    milestone.completed ? 'text-[#1B1A1A]' : 'text-gray-400'
                  )}
                  style={{ left: `${milestone.percentage}%` }}
                  title={milestone.title}
                >
                  <span className="whitespace-nowrap text-[10px] font-medium">
                    {milestone.percentage}%
                  </span>
                  <span className="max-w-[3rem] truncate text-[10px]">{milestone.title}</span>
                </div>
              ))}
              {/* 佔位元素，確保容器有高度 */}
              <div className="invisible flex flex-col gap-0.5">
                <span className="text-[10px]">&nbsp;</span>
                <span className="text-[10px]">&nbsp;</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 簡化的進度條組件（只顯示進度）
 */
export function ProgressBar({
  progress,
  size = 'md',
  showLabel = true,
  className,
}: {
  progress: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}) {
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-gray-200',
          heightClasses[size]
        )}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-brand-accent/70 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showLabel && (
        <span className="mt-0.5 block text-right text-xs text-gray-500">{progress}%</span>
      )}
    </div>
  )
}
