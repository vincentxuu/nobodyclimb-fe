'use client'

import type { PersonalityType } from '@nobodyclimb/types'
import { motion } from 'framer-motion'
import type { DecodedScores } from '@/lib/quiz/decode-scores'

interface Props {
  personality: PersonalityType
  scores: DecodedScores | null
}

export function ResultProfile({ personality, scores }: Props) {
  const isGoalType = personality.code[1] === 'G'
  const indexLabel = isGoalType ? '恆毅力指數' : '心流指數'
  const defaultIndex = isGoalType ? 75 : 68
  const indexValue = scores ? (isGoalType ? scores.gritIndex : scores.flowIndex) : defaultIndex

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mb-10"
    >
      <div className="mb-6 flex items-center justify-between rounded-2xl bg-gray-50 px-6 py-4">
        <span className="text-sm font-medium text-gray-600">{indexLabel}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold" style={{ color: personality.color }}>
            {Math.round(indexValue)}
          </span>
          <span className="text-sm text-gray-400">/ 100</span>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-gray-900">性格描述</h2>
      <div className="space-y-3 text-base leading-relaxed text-gray-600">
        {personality.description
          .split('\n')
          .filter(Boolean)
          .map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-emerald-50 p-4">
          <div className="mb-1 text-xs font-medium text-emerald-600">Flow 最佳狀態</div>
          <p className="text-sm text-gray-700">{personality.flowState}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <div className="mb-1 text-xs font-medium text-amber-600">Clutch 關鍵時刻</div>
          <p className="text-sm text-gray-700">{personality.clutchState}</p>
        </div>
      </div>
    </motion.div>
  )
}
