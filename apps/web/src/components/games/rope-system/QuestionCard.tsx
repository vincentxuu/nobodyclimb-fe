'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Question } from '@/lib/games/rope-system/types'
import { ChoiceQuestion } from './ChoiceQuestion'
import { OrderingQuestion } from './OrderingQuestion'

interface QuestionCardProps {
  question: Question
  onAnswer: (_answer: string | string[]) => void
  disabled?: boolean
  showResult?: boolean
  userAnswer?: string | string[]
  className?: string
}

export function QuestionCard({
  question,
  onAnswer,
  disabled = false,
  showResult = false,
  userAnswer,
  className,
}: QuestionCardProps) {
  // 處理單選題答案
  const handleChoiceAnswer = (answer: string) => {
    onAnswer(answer)
  }

  // 處理排序題答案
  const handleOrderingAnswer = (answer: string[]) => {
    onAnswer(answer)
  }

  return (
    <motion.div
      className={cn('rounded-lg border border-[#E5E5E5] bg-white p-6', className)}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <AnimatePresence mode="wait">
        {question.type === 'ordering' ? (
          <OrderingQuestion
            key={question.id}
            question={question}
            onAnswer={handleOrderingAnswer}
            disabled={disabled}
            showResult={showResult}
            userAnswer={userAnswer as string[] | undefined}
          />
        ) : (
          // choice 和 situation 都使用 ChoiceQuestion
          <ChoiceQuestion
            key={question.id}
            question={question}
            onAnswer={handleChoiceAnswer}
            disabled={disabled}
            showResult={showResult}
            userAnswer={userAnswer as string | undefined}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
