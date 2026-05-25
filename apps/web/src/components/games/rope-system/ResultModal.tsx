'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Clock,
  Flame,
  HeartCrack,
  Home,
  PartyPopper,
  RotateCcw,
  Target,
  Trophy,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useGameSounds } from '@/lib/games/rope-system/sounds'
import type { GameStats } from '@/lib/games/rope-system/types'
import { cn } from '@/lib/utils'

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
  const t = useTranslations('GamesPage')
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
  const accuracy = totalQuestions > 0 ? Math.round((stats.correctCount / totalQuestions) * 100) : 0

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
            className={cn('w-full max-w-md rounded-lg bg-white p-8 shadow-xl', className)}
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
                {isGameOver ? t('gameOver') : t('practiceComplete')}
              </h2>
              {categoryName && <p className="mt-1 text-[#535353]">{categoryName}</p>}
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
                  <span className="text-[#535353]">{t('score')}</span>
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
                  <span className="text-[#535353]">{t('accuracy')}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-[#1B1A1A]">{accuracy}%</span>
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
                  <span className="text-[#535353]">{t('maxCombo')}</span>
                </div>
                <span className="text-2xl font-bold text-[#1B1A1A]">{stats.maxCombo}</span>
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
                  <span className="text-[#535353]">{t('timeSpent')}</span>
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
              <Button onClick={onPlayAgain} className="w-full" size="lg">
                <RotateCcw className="mr-2 h-5 w-5" />
                {t('playAgain')}
              </Button>
              <Button onClick={onGoHome} variant="secondary" className="w-full" size="lg">
                <Home className="mr-2 h-5 w-5" />
                {t('goHome')}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
