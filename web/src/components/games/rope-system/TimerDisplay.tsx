'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimerDisplayProps {
  /** 剩餘秒數 */
  seconds: number
  /** 是否顯示警告（時間不足） */
  warningThreshold?: number
  className?: string
}

export function TimerDisplay({
  seconds,
  warningThreshold = 10,
  className,
}: TimerDisplayProps) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  const isWarning = seconds <= warningThreshold && seconds > 0

  // 格式化時間
  const formattedTime = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`

  return (
    <motion.div
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-1.5',
        isWarning ? 'bg-[rgba(239,68,68,0.1)]' : 'bg-[#F5F5F5]',
        className
      )}
      animate={
        isWarning
          ? {
              scale: [1, 1.05, 1],
            }
          : {}
      }
      transition={{
        duration: 0.5,
        repeat: isWarning ? Infinity : 0,
      }}
    >
      <Clock
        className={cn(
          'h-4 w-4',
          isWarning ? 'text-[#EF4444]' : 'text-[#535353]'
        )}
      />
      <span
        className={cn(
          'font-mono text-lg font-medium',
          isWarning ? 'text-[#EF4444]' : 'text-[#1B1A1A]'
        )}
      >
        {formattedTime}
      </span>
    </motion.div>
  )
}
