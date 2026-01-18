'use client'

import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Question } from '@/lib/games/rope-system/types'
import { OptionButton, type OptionState } from './OptionButton'

interface ChoiceQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
  disabled?: boolean
  showResult?: boolean
  userAnswer?: string
  className?: string
}

export function ChoiceQuestion({
  question,
  onAnswer,
  disabled = false,
  showResult = false,
  userAnswer,
  className,
}: ChoiceQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  // 重置選擇狀態
  useEffect(() => {
    setSelectedOption(userAnswer || null)
  }, [question.id, userAnswer])

  // 取得選項狀態
  const getOptionState = useCallback(
    (optionId: string): OptionState => {
      if (disabled && !showResult) return 'disabled'

      if (showResult) {
        const isCorrect = question.correctAnswer === optionId
        const isSelected = selectedOption === optionId

        if (isCorrect) return 'correct'
        if (isSelected && !isCorrect) return 'wrong'
        return 'disabled'
      }

      if (selectedOption === optionId) return 'selected'
      return 'default'
    },
    [disabled, showResult, selectedOption, question.correctAnswer]
  )

  // 處理選項點擊
  const handleOptionClick = useCallback(
    (optionId: string) => {
      if (disabled || showResult) return

      setSelectedOption(optionId)
      onAnswer(optionId)
    },
    [disabled, showResult, onAnswer]
  )

  // 鍵盤快捷鍵
  useEffect(() => {
    if (disabled || showResult) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyIndex = parseInt(e.key, 10) - 1
      if (keyIndex >= 0 && keyIndex < question.options.length) {
        const option = question.options[keyIndex]
        handleOptionClick(option.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled, showResult, question.options, handleOptionClick])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn('space-y-4', className)}
    >
      {/* 情境描述 */}
      {question.scenario && (
        <div className="rounded-lg bg-[#F5F5F5] p-4">
          <div className="mb-1 text-sm font-medium text-[#535353]">情境</div>
          <div className="text-[#1B1A1A]">{question.scenario}</div>
        </div>
      )}

      {/* 題目 */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-[#535353]">問題</div>
        <h2 className="text-lg font-medium text-[#1B1A1A]">
          {question.question}
        </h2>
      </div>

      {/* 題目圖片 */}
      {question.imageUrl && (
        <div className="overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.imageUrl}
            alt="題目圖片"
            className="h-auto w-full"
          />
        </div>
      )}

      {/* 選項列表 */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <OptionButton
            key={option.id}
            state={getOptionState(option.id)}
            onClick={() => handleOptionClick(option.id)}
            disabled={disabled || showResult}
            index={index}
          >
            <div className="flex items-center gap-3">
              {option.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={option.image}
                  alt=""
                  className="h-10 w-10 rounded object-cover"
                />
              )}
              <span>{option.text}</span>
            </div>
          </OptionButton>
        ))}
      </div>
    </motion.div>
  )
}
