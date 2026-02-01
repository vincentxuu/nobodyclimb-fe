'use client'

import * as React from 'react'
import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Milestone } from '@/lib/types'

interface ProgressTrackerProps {
  mode: 'manual' | 'milestone' | null
  progress: number
  milestones?: Milestone[] | null
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  editable?: boolean
  onProgressChange?: (progress: number) => void  // eslint-disable-line no-unused-vars
  onMilestoneToggle?: (milestoneId: string, completed: boolean) => void  // eslint-disable-line no-unused-vars
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
  if (!mode) return null

  const sizeClasses = {
    sm: {
      bar: 'h-1.5',
      milestone: 'w-5 h-5',
      text: 'text-xs',
      spacing: 'gap-1',
    },
    md: {
      bar: 'h-2',
      milestone: 'w-6 h-6',
      text: 'text-sm',
      spacing: 'gap-2',
    },
    lg: {
      bar: 'h-3',
      milestone: 'w-8 h-8',
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
            <span>進度</span>
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

  return (
    <div className={cn('w-full', className)}>
      {/* 里程碑進度條 */}
      <div className="relative">
        {/* 背景線 */}
        <div className={cn('absolute top-1/2 w-full -translate-y-1/2 rounded-full bg-gray-200', sizes.bar)} />

        {/* 已完成的進度線 */}
        <div
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-brand-accent/70 transition-all duration-300',
            sizes.bar
          )}
          style={{ width: `${progress}%` }}
        />

        {/* 里程碑點 */}
        <div className="relative flex items-center justify-between">
          {sortedMilestones.map((milestone) => {
            const isCompleted = milestone.completed
            return (
              <button
                key={milestone.id}
                type="button"
                disabled={!editable}
                onClick={() => editable && onMilestoneToggle?.(milestone.id, !isCompleted)}
                className={cn(
                  'relative z-10 flex items-center justify-center rounded-full border-2 transition-all',
                  sizes.milestone,
                  isCompleted
                    ? 'border-[#1B1A1A] bg-brand-accent/70 text-[#1B1A1A]'
                    : 'border-gray-300 bg-white text-gray-300',
                  editable && 'cursor-pointer hover:border-[#1B1A1A]'
                )}
                title={milestone.title}
              >
                {isCompleted ? (
                  <Check className={cn(size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5')} />
                ) : (
                  <Circle className={cn(size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 里程碑標籤 */}
      {showLabels && (
        <div className="mt-2 flex justify-between">
          {sortedMilestones.map((milestone) => (
            <div
              key={milestone.id}
              className={cn(
                'flex flex-col items-center text-center',
                sizes.text,
                milestone.completed ? 'text-[#1B1A1A]' : 'text-gray-400'
              )}
              style={{ width: `${100 / sortedMilestones.length}%` }}
            >
              <span className="line-clamp-2 max-w-[80px]">{milestone.title}</span>
              <span className="text-xs text-gray-400">{milestone.percentage}%</span>
            </div>
          ))}
        </div>
      )}
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
      <div className={cn('relative w-full overflow-hidden rounded-full bg-gray-200', heightClasses[size])}>
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
