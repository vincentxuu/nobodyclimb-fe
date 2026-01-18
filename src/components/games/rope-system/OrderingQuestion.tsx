'use client'

import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { motion, Reorder, useDragControls } from 'framer-motion'
import { GripVertical, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Question, QuestionOption } from '@/lib/games/rope-system/types'
import { Button } from '@/components/ui/button'

interface OrderingQuestionProps {
  question: Question
  onAnswer: (answer: string[]) => void
  disabled?: boolean
  showResult?: boolean
  userAnswer?: string[]
  className?: string
}

interface DraggableItemProps {
  option: QuestionOption
  index: number
  disabled: boolean
  showResult: boolean
  isCorrectPosition: boolean
  isWrongPosition: boolean
}

function DraggableItem({
  option,
  index,
  disabled,
  showResult,
  isCorrectPosition,
  isWrongPosition,
}: DraggableItemProps) {
  const dragControls = useDragControls()

  return (
    <Reorder.Item
      value={option}
      dragListener={!disabled && !showResult}
      dragControls={dragControls}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-white p-4 transition-colors',
        showResult && isCorrectPosition && 'border-[#22C55E] bg-[rgba(34,197,94,0.1)]',
        showResult && isWrongPosition && 'border-[#EF4444] bg-[rgba(239,68,68,0.1)]',
        !showResult && 'border-[#E5E5E5]',
        !disabled && !showResult && 'cursor-grab active:cursor-grabbing'
      )}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      {/* 拖曳手柄 */}
      {!disabled && !showResult && (
        <div
          className="touch-none"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="h-5 w-5 text-[#535353]" />
        </div>
      )}

      {/* 結果圖示 */}
      {showResult && (
        <div className="flex h-5 w-5 items-center justify-center">
          {isCorrectPosition ? (
            <Check className="h-5 w-5 text-[#22C55E]" />
          ) : (
            <X className="h-5 w-5 text-[#EF4444]" />
          )}
        </div>
      )}

      {/* 序號 */}
      <div
        className={cn(
          'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium',
          showResult && isCorrectPosition
            ? 'bg-[#22C55E] text-white'
            : showResult && isWrongPosition
              ? 'bg-[#EF4444] text-white'
              : 'bg-[#FFE70C] text-[#1B1A1A]'
        )}
      >
        {index + 1}
      </div>

      {/* 選項內容 */}
      <div className="flex flex-1 items-center gap-3">
        {option.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={option.image}
            alt=""
            className="h-10 w-10 rounded object-cover"
          />
        )}
        <span className="text-[#1B1A1A]">{option.text}</span>
      </div>
    </Reorder.Item>
  )
}

export function OrderingQuestion({
  question,
  onAnswer,
  disabled = false,
  showResult = false,
  userAnswer,
  className,
}: OrderingQuestionProps) {
  const [items, setItems] = useState<QuestionOption[]>(question.options)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // 重置排序
  useEffect(() => {
    // 如果有用戶答案，按照用戶答案排序
    if (userAnswer && userAnswer.length > 0) {
      const orderedItems = userAnswer
        .map((id) => question.options.find((opt) => opt.id === id))
        .filter((opt): opt is QuestionOption => opt !== undefined)
      setItems(orderedItems)
    } else {
      // 隨機打亂選項
      setItems([...question.options].sort(() => Math.random() - 0.5))
    }
    setHasSubmitted(false)
  }, [question.id, question.options, userAnswer])

  // 處理重新排序
  const handleReorder = useCallback((newItems: QuestionOption[]) => {
    setItems(newItems)
  }, [])

  // 提交答案
  const handleSubmit = useCallback(() => {
    if (hasSubmitted || disabled) return
    setHasSubmitted(true)
    const answer = items.map((item) => item.id)
    onAnswer(answer)
  }, [items, hasSubmitted, disabled, onAnswer])

  // 檢查某個位置是否正確
  const isPositionCorrect = useCallback(
    (optionId: string, index: number): boolean => {
      if (!showResult || !Array.isArray(question.correctAnswer)) return false
      return question.correctAnswer[index] === optionId
    },
    [showResult, question.correctAnswer]
  )

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

      {/* 操作提示 */}
      {!disabled && !showResult && (
        <div className="text-sm text-[#535353]">
          請將步驟拖曳至正確的順序，完成後點擊「確認順序」。
        </div>
      )}

      {/* 排序列表 */}
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={handleReorder}
        className="space-y-2"
      >
        {items.map((option, index) => (
          <DraggableItem
            key={option.id}
            option={option}
            index={index}
            disabled={disabled}
            showResult={showResult}
            isCorrectPosition={isPositionCorrect(option.id, index)}
            isWrongPosition={showResult && !isPositionCorrect(option.id, index)}
          />
        ))}
      </Reorder.Group>

      {/* 確認按鈕 */}
      {!disabled && !showResult && !hasSubmitted && (
        <Button onClick={handleSubmit} className="w-full" size="lg">
          確認順序
        </Button>
      )}
    </motion.div>
  )
}
