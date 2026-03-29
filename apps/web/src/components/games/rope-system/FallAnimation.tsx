'use client'

import { motion, useAnimation } from 'framer-motion'
import * as React from 'react'
import { useEffect } from 'react'
import { ANIMATION_DURATION } from '@/lib/games/rope-system/constants'
import { useGameSounds } from '@/lib/games/rope-system/sounds'
import { cn } from '@/lib/utils'

interface FallAnimationProps {
  /** 起始位置 (0-100) */
  startPosition: number
  /** 結束位置 (0-100) */
  endPosition: number
  /** 動畫完成回調 */
  onComplete: () => void
  /** 平台數量 */
  platformCount?: number
  className?: string
}

interface Platform {
  id: number
  position: number
}

export function FallAnimation({
  startPosition,
  endPosition,
  onComplete,
  platformCount = 3,
  className,
}: FallAnimationProps) {
  const controls = useAnimation()
  const { playFall, playImpact } = useGameSounds()

  // 生成平台位置
  const platforms: Platform[] = React.useMemo(() => {
    const step = (startPosition - endPosition) / (platformCount + 1)
    return Array.from({ length: platformCount }, (_, i) => ({
      id: i,
      position: startPosition - step * (i + 1),
    }))
  }, [startPosition, endPosition, platformCount])

  // 執行掉落動畫
  useEffect(() => {
    const runFallAnimation = async () => {
      // 播放掉落音效
      playFall()

      // 計算掉落距離的 Y 值
      const totalDistance = startPosition - endPosition
      const stepSize = totalDistance / (platformCount + 1)

      // 建立階梯式掉落的 keyframes
      const yKeyframes: number[] = [0]
      const times: number[] = [0]

      for (let i = 1; i <= platformCount; i++) {
        const fallDistance = stepSize * i
        // 掉落到平台
        yKeyframes.push(fallDistance)
        times.push((i * 2 - 1) / ((platformCount + 1) * 2))
        // 輕微反彈
        yKeyframes.push(fallDistance - 5)
        times.push((i * 2) / ((platformCount + 1) * 2))

        // 撞擊時播放音效
        setTimeout(
          () => {
            playImpact()
          },
          (ANIMATION_DURATION.FALL / (platformCount + 1)) * i
        )
      }

      // 最終位置
      yKeyframes.push(totalDistance)
      times.push(1)

      // 執行動畫
      await controls.start({
        y: yKeyframes,
        rotate: [0, 15, -10, 20, -15, 10, -5, 0],
        transition: {
          duration: ANIMATION_DURATION.FALL / 1000,
          ease: 'easeIn',
          times,
        },
      })

      // 撞擊效果
      await controls.start({
        scale: [1, 1.2, 0.9, 1],
        transition: { duration: 0.3 },
      })

      onComplete()
    }

    runFallAnimation()
  }, [controls, startPosition, endPosition, platformCount, onComplete, playFall, playImpact])

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      {/* 平台 */}
      {platforms.map((platform) => (
        <motion.div
          key={platform.id}
          className="absolute left-0 right-0 flex items-center justify-center"
          style={{
            top: `${100 - platform.position}%`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 * platform.id }}
        >
          <div className="h-1 w-16 rounded-full bg-[#8B7355] shadow-md" />
        </motion.div>
      ))}

      {/* 掉落中的角色 */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: `${100 - startPosition}%`,
        }}
        animate={controls}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(239,68,68,0.2)] text-3xl shadow-lg">
          😱
        </div>
      </motion.div>

      {/* 掉落軌跡效果 */}
      <motion.div
        className="pointer-events-none absolute left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-transparent via-[#EF4444] to-transparent opacity-50"
        style={{
          top: `${100 - startPosition}%`,
        }}
        initial={{ height: 0 }}
        animate={{ height: `${startPosition - endPosition}%` }}
        transition={{
          duration: ANIMATION_DURATION.FALL / 1000,
          ease: 'easeIn',
        }}
      />
    </div>
  )
}
