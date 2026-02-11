'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, RotateCcw, Home, Clock, Target, Flame, PartyPopper, HeartCrack } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { GameStats } from '@/lib/games/rope-system/types'
import { useGameSounds } from '@/lib/games/rope-system/sounds'

interface ResultModalProps {
  isOpen: boolean
  stats: GameStats
  totalQuestions: number
  categoryName?: string
  isGameOver?: boolean
  onPlayAgain: () => void
  onGoHome: () => void
  className?: string
}

export function ResultModal({
  isOpen,
  stats,
  totalQuestions,
  categoryName,
  isGameOver = false,
  onPlayAgain,
  onGoHome,
  className,
}: ResultModalProps) {
  const { playComplete, playGameOver } = useGameSounds()

  // 播放音效
  useEffect(() => {
    if (isOpen) {
      if (isGameOver) {
        playGameOver()
      } else {
        playComplete()
      }
    }
  }, [isOpen, isGameOver, playComplete, playGameOver])

  // 計算正確率
  const accuracy = totalQuestions > 0
    ? Math.round((stats.correctCount / totalQuestions) * 100)
    : 0

  // 格式化時間
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={cn(
              'w-full max-w-md rounded-lg bg-white p-8 shadow-xl',
              className
            )}
          >
            {/* 標題 */}
            <div className="mb-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mb-4 flex justify-center"
              >
                {isGameOver ? (
                  <HeartCrack className="h-16 w-16 text-[#1B1A1A]" />
                ) : (
                  <PartyPopper className="h-16 w-16 text-[#FFE70C]" />
                )}
              </motion.div>
              <h2 className="text-2xl font-bold text-[#1B1A1A]">
                {isGameOver ? '遊戲結束' : '完成練習！'}
              </h2>
              {categoryName && (
                <p className="mt-1 text-[#535353]">{categoryName}</p>
              )}
            </div>

            {/* 統計資料 */}
            <div className="mb-6 space-y-4">
              {/* 分數 */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between rounded-lg bg-[#F5F5F5] p-4"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-[#FFE70C]" />
                  <span className="text-[#535353]">分數</span>
                </div>
                <span className="text-2xl font-bold text-[#1B1A1A]">
                  {stats.score.toLocaleString()}
                </span>
              </motion.div>

              {/* 正確率 */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-between rounded-lg bg-[#F5F5F5] p-4"
              >
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-[#1B1A1A]" />
                  <span className="text-[#535353]">正確率</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-[#1B1A1A]">
                    {accuracy}%
                  </span>
                  <span className="ml-2 text-sm text-[#535353]">
                    {stats.correctCount} / {totalQuestions}
                  </span>
                </div>
              </motion.div>

              {/* 最高連擊 */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-between rounded-lg bg-[#F5F5F5] p-4"
              >
                <div className="flex items-center gap-3">
                  <Flame className="h-6 w-6 text-[#FFE70C]" />
                  <span className="text-[#535353]">最高連擊</span>
                </div>
                <span className="text-2xl font-bold text-[#1B1A1A]">
                  {stats.maxCombo}
                </span>
              </motion.div>

              {/* 用時 */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-between rounded-lg bg-[#F5F5F5] p-4"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-[#1B1A1A]" />
                  <span className="text-[#535353]">用時</span>
                </div>
                <span className="text-2xl font-bold text-[#1B1A1A]">
                  {formatTime(stats.timeSpent)}
                </span>
              </motion.div>
            </div>

            {/* 按鈕 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <Button
                onClick={onPlayAgain}
                className="w-full"
                size="lg"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                再玩一次
              </Button>
              <Button
                onClick={onGoHome}
                variant="secondary"
                className="w-full"
                size="lg"
              >
                <Home className="mr-2 h-5 w-5" />
                回到首頁
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
