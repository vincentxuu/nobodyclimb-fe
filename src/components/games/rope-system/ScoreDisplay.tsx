'use client'

import * as React from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ScoreDisplayProps {
  score: number
  className?: string
}

export function ScoreDisplay({ score, className }: ScoreDisplayProps) {
  // 使用 spring 動畫讓數字滾動更順暢
  const springScore = useSpring(score, {
    stiffness: 100,
    damping: 20,
  })

  const displayScore = useTransform(springScore, (value) =>
    Math.round(value).toLocaleString()
  )

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-[#535353]">分數</span>
      <motion.span
        className="text-2xl font-bold text-[#1B1A1A]"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 0.3 }}
        key={score}
      >
        {displayScore}
      </motion.span>
    </div>
  )
}
