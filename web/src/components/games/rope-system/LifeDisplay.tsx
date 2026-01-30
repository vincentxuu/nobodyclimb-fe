'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GAME_CONFIG } from '@/lib/games/rope-system/constants'

interface LifeDisplayProps {
  lives: number
  maxLives?: number
  className?: string
}

export function LifeDisplay({
  lives,
  maxLives = GAME_CONFIG.INITIAL_LIVES,
  className,
}: LifeDisplayProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: maxLives }).map((_, index) => {
        const isActive = index < lives
        const isLosing = index === lives // 剛失去的那顆心

        return (
          <AnimatePresence key={index} mode="wait">
            <motion.div
              initial={false}
              animate={
                isLosing
                  ? {
                      scale: [1, 1.3, 0.8, 1],
                      opacity: [1, 1, 0.5, 0.3],
                    }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 0.4 }}
            >
              <Heart
                className={cn(
                  'h-6 w-6 transition-colors',
                  isActive
                    ? 'fill-[#EF4444] text-[#EF4444]'
                    : 'fill-[#E5E5E5] text-[#E5E5E5]'
                )}
              />
            </motion.div>
          </AnimatePresence>
        )
      })}
    </div>
  )
}
