'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  /** 進度百分比 (0-100) */
  progress: number
  /** 當前題號 */
  current?: number
  /** 總題數 */
  total?: number
  /** 是否顯示數字 */
  showNumbers?: boolean
  /** 自訂樣式 */
  className?: string
}

export function ProgressBar({
  progress,
  current,
  total,
  showNumbers = true,
  className,
}: ProgressBarProps) {
  // 確保進度在 0-100 範圍內
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* 進度條 */}
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#E5E5E5]">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-[#FFE70C]"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* 數字顯示 */}
      {showNumbers && current !== undefined && total !== undefined && (
        <span className="min-w-[60px] text-right text-sm text-[#535353]">
          {current} / {total}
        </span>
      )}
    </div>
  )
}
