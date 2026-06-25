'use client'

import type { PersonalityType } from '@nobodyclimb/types'
import { motion } from 'framer-motion'
import { Calendar, Clock, Sparkles, Target } from 'lucide-react'

interface StartGuideProps {
  personality: PersonalityType
}

export function StartGuide({ personality }: StartGuideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-2xl border-2 border-dashed p-6"
      style={{ borderColor: `${personality.color}40` }}
    >
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5" style={{ color: personality.color }} />
        <h2 className="text-lg font-bold text-gray-900">開始你的訓練計畫</h2>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        這個計畫專為<strong>{personality.nameZh}</strong>
        設計，核心理念是「訓練你的反面」——透過強化你較少使用的面向，成為更全面的攀岩者。
      </p>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 p-3">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">4 週</span>
          <span className="text-xs text-gray-500">完整計畫</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 p-3">
          <Target className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">12 天</span>
          <span className="text-xs text-gray-500">訓練天數</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 p-3">
          <Clock className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">20-45 分</span>
          <span className="text-xs text-gray-500">每日時長</span>
        </div>
      </div>
    </motion.div>
  )
}
