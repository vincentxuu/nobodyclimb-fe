'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface GraduationBadgeProps {
  isGraduated: boolean
  accentColor: string
  personalityName: string
}

export function GraduationBadge({
  isGraduated,
  accentColor,
  personalityName,
}: GraduationBadgeProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const wasGraduated = useRef(isGraduated)

  useEffect(() => {
    if (isGraduated && !wasGraduated.current) {
      setShowCelebration(true)
      const timer = setTimeout(() => setShowCelebration(false), 3000)
      wasGraduated.current = true
      return () => clearTimeout(timer)
    }
    wasGraduated.current = isGraduated
  }, [isGraduated])

  if (!isGraduated) return null

  const confettiColors = ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6', accentColor]

  return (
    <div className="relative mb-6">
      <AnimatePresence>
        {showCelebration && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i / 24) * 360
              const distance = 80 + (i % 5) * 15
              const x = Math.cos((angle * Math.PI) / 180) * distance
              const y = Math.sin((angle * Math.PI) / 180) * distance
              const color = confettiColors[i % confettiColors.length]
              const size = 4 + (i % 3) * 2

              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{ backgroundColor: color, width: size, height: size }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{ x, y, opacity: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, delay: i * 0.03, ease: 'easeOut' }}
                />
              )
            })}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="flex items-center gap-4 rounded-2xl border-2 p-4"
        style={{ borderColor: accentColor, backgroundColor: `${accentColor}08` }}
      >
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <Trophy className="h-7 w-7" style={{ color: accentColor }} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">訓練計畫完成！</h3>
          <p className="text-sm text-gray-600">恭喜你完成 {personalityName} 的 4 週訓練計畫</p>
        </div>
      </motion.div>
    </div>
  )
}
