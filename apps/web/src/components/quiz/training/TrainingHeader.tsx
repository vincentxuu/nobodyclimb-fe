'use client'

import type { PersonalityType } from '@nobodyclimb/types'
import { motion } from 'framer-motion'
import { Mountain } from 'lucide-react'
import { ProgressRing } from './ProgressRing'

interface TrainingHeaderProps {
  personality: PersonalityType
  completedDays: number
  totalDays: number
}

export function TrainingHeader({ personality, completedDays, totalDays }: TrainingHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start"
    >
      <div className="flex flex-col items-center gap-3 sm:items-start">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${personality.color}15` }}
        >
          <Mountain className="h-8 w-8" style={{ color: personality.color }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{personality.nameZh} 訓練計畫</h1>
          <p className="mt-1 text-sm text-gray-500">{personality.nameEn} Training Plan</p>
        </div>
      </div>
      <div className="sm:ml-auto">
        <ProgressRing completed={completedDays} total={totalDays} color={personality.color} />
      </div>
    </motion.div>
  )
}
