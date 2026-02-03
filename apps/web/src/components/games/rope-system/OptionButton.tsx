'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type OptionState = 'default' | 'selected' | 'correct' | 'wrong' | 'disabled'

interface OptionButtonProps {
  children: React.ReactNode
  state?: OptionState
  onClick?: () => void
  disabled?: boolean
  className?: string
  /** 選項序號，用於鍵盤快捷鍵提示 */
  index?: number
}

const stateStyles: Record<OptionState, string> = {
  default: 'border-[#E5E5E5] bg-white hover:border-[#1B1A1A]',
  selected: 'border-[#FFE70C] border-2 bg-[rgba(255,231,12,0.1)]',
  correct: 'border-[#22C55E] border-2 bg-[rgba(34,197,94,0.1)]',
  wrong: 'border-[#EF4444] border-2 bg-[rgba(239,68,68,0.1)]',
  disabled: 'border-[#E5E5E5] bg-[#F5F5F5] opacity-60 cursor-not-allowed',
}

const animations = {
  default: {},
  selected: {
    scale: [1, 1.02, 1],
    transition: { duration: 0.2 },
  },
  correct: {
    scale: [1, 1.02, 1],
    transition: { duration: 0.3 },
  },
  wrong: {
    x: [0, -8, 8, -8, 8, 0],
    transition: { duration: 0.4 },
  },
  disabled: {},
}

export function OptionButton({
  children,
  state = 'default',
  onClick,
  disabled = false,
  className,
  index,
}: OptionButtonProps) {
  const isDisabled = disabled || state === 'disabled'
  const showCheckIcon = state === 'correct'
  const showXIcon = state === 'wrong'
  const showRadio = state === 'default' || state === 'selected'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'relative flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE70C] focus-visible:ring-offset-2',
        stateStyles[state],
        className
      )}
      animate={animations[state]}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
    >
      {/* 圖示區域 */}
      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
        {showCheckIcon && <Check className="h-5 w-5 text-[#22C55E]" />}
        {showXIcon && <X className="h-5 w-5 text-[#EF4444]" />}
        {showRadio && (
          <div
            className={cn(
              'h-4 w-4 rounded-full border-2',
              state === 'selected'
                ? 'border-[#FFE70C] bg-[#FFE70C]'
                : 'border-[#E5E5E5] bg-white'
            )}
          >
            {state === 'selected' && (
              <div className="flex h-full items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-[#1B1A1A]" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 內容區域 */}
      <span className="flex-1 text-[#1B1A1A]">{children}</span>

      {/* 鍵盤快捷鍵提示 */}
      {index !== undefined && (
        <span className="hidden text-xs text-[#535353] sm:block">
          {index + 1}
        </span>
      )}
    </motion.button>
  )
}
