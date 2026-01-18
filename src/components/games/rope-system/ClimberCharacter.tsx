'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { motion, useAnimation, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { CharacterState } from '@/lib/games/rope-system/types'
import { ANIMATION_DURATION } from '@/lib/games/rope-system/constants'

interface ClimberCharacterProps {
  /** 角色位置 (0-100)，0 為底部，100 為頂部 */
  position: number
  /** 角色狀態 */
  state: CharacterState
  /** 掉落動畫完成回調 */
  onFallComplete?: () => void
  className?: string
}

// 動畫變體
const characterVariants: Variants = {
  idle: {
    rotate: [0, 2, -2, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
  climbing: {
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  },
  falling: {
    y: [0, 60, 55, 120, 115, 180],
    rotate: [0, 15, -10, 20, -15, 0],
    transition: {
      duration: ANIMATION_DURATION.FALL / 1000,
      ease: [0.45, 0.05, 0.55, 0.95] as const,
      times: [0, 0.2, 0.25, 0.45, 0.5, 1],
    },
  },
  celebrating: {
    scale: [1, 1.1, 1],
    rotate: [0, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
}

export function ClimberCharacter({
  position,
  state,
  onFallComplete,
  className,
}: ClimberCharacterProps) {
  const controls = useAnimation()

  // 根據狀態播放動畫
  useEffect(() => {
    const playAnimation = async () => {
      switch (state) {
        case 'idle':
          await controls.start('idle')
          break
        case 'climbing':
          await controls.start('climbing')
          // 攀爬完成後回到 idle
          setTimeout(() => {
            controls.start('idle')
          }, 300)
          break
        case 'falling':
          await controls.start('falling')
          onFallComplete?.()
          break
        case 'celebrating':
          await controls.start('celebrating')
          break
      }
    }

    playAnimation()
  }, [state, controls, onFallComplete])

  // 計算位置（將 0-100 轉換為實際像素位置）
  const calculatePosition = (pos: number) => {
    // 容器高度的百分比，反轉使 100 在頂部
    return `${100 - pos}%`
  }

  return (
    <div
      className={cn(
        'relative h-full w-full',
        className
      )}
    >
      {/* 繩索 */}
      <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-[#8B7355] to-[#6B5344]" />

      {/* 攀岩牆背景紋理 */}
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-3 w-3 rounded-full bg-[#1B1A1A]"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${10 + i * 20}%`,
            }}
          />
        ))}
      </div>

      {/* 攀岩者角色 */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: calculatePosition(position),
        }}
        variants={characterVariants}
        animate={controls}
        initial="idle"
      >
        <div className="relative">
          {/* 角色圖示 */}
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-lg',
              state === 'falling'
                ? 'bg-[rgba(239,68,68,0.2)]'
                : state === 'celebrating'
                  ? 'bg-[rgba(34,197,94,0.2)]'
                  : 'bg-white'
            )}
          >
            {state === 'falling' ? '😱' : state === 'celebrating' ? '🎉' : '🧗'}
          </div>

          {/* 確保站 / 繩索連接點 */}
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#FFE70C]" />
        </div>
      </motion.div>

      {/* 底部確保站 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B1A1A] text-xl shadow-lg">
          🧍
        </div>
        <div className="mt-1 text-center text-xs text-[#535353]">確保站</div>
      </div>
    </div>
  )
}
