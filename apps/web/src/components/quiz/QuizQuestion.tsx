'use client'

import type { QuizQuestion as QuizQuestionType } from '@nobodyclimb/types'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'

const AXIS_COLORS: Record<string, { bg: string; accent: string; label: string }> = {
  body: { bg: 'from-red-50/60 to-orange-50/40', accent: '#E84545', label: '身體風格' },
  motive: { bg: 'from-amber-50/60 to-yellow-50/40', accent: '#F7B731', label: '攀爬動機' },
  mind: { bg: 'from-emerald-50/60 to-teal-50/40', accent: '#27AE60', label: '心理模式' },
}

const LIKERT_OPTIONS = [
  { value: 1, label: '非常不同意', emoji: '😐' },
  { value: 2, label: '不同意', emoji: '🤔' },
  { value: 3, label: '普通', emoji: '😶' },
  { value: 4, label: '同意', emoji: '😊' },
  { value: 5, label: '非常同意', emoji: '🔥' },
]

interface Props {
  question: QuizQuestionType
  selectedValue: number | null
  onAnswer: (value: number) => void
  onPrev?: () => void
  questionIndex: number
}

export function QuizQuestion({ question, selectedValue, onAnswer, onPrev, questionIndex }: Props) {
  const axisStyle = AXIS_COLORS[question.axis] || AXIS_COLORS.body

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={questionIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="mb-3 flex justify-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: `${axisStyle.accent}15`, color: axisStyle.accent }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: axisStyle.accent }}
            />
            {axisStyle.label}
          </span>
        </div>

        <p className="mb-8 text-center text-xl font-semibold leading-relaxed text-gray-900 md:text-2xl">
          {question.textZh}
        </p>

        <div className="space-y-2.5">
          {LIKERT_OPTIONS.map((option) => {
            const isSelected = selectedValue === option.value
            return (
              <motion.button
                key={option.value}
                onClick={() => onAnswer(option.value)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left text-base transition-all duration-200 ${
                  isSelected
                    ? 'border-transparent font-medium text-white shadow-lg'
                    : 'border-gray-100 bg-white text-gray-700 shadow-sm hover:border-gray-200 hover:shadow-md'
                }`}
                style={
                  isSelected
                    ? { backgroundColor: axisStyle.accent, borderColor: axisStyle.accent }
                    : undefined
                }
              >
                <span className="text-lg">{option.emoji}</span>
                <span>{option.label}</span>
              </motion.button>
            )
          })}
        </div>

        {onPrev && (
          <motion.button
            onClick={onPrev}
            whileHover={{ x: -2 }}
            className="mt-8 flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-600"
          >
            <ChevronLeft className="h-4 w-4" />
            上一題
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
