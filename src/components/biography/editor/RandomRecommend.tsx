'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Shuffle, X, ChevronRight } from 'lucide-react'
import type { StoryQuestion, OneLinerQuestion } from '@/lib/types/biography-v2'

interface RandomRecommendProps {
  /** 未填寫的問題列表 */
  unfilledQuestions: (StoryQuestion | OneLinerQuestion)[]
  /** 點擊問題回調 */
  onQuestionClick: (questionId: string, type: 'story' | 'oneliner') => void
  /** 關閉回調 */
  onClose?: () => void
  /** 自訂樣式 */
  className?: string
}

/**
 * 隨機推薦組件
 *
 * 隨機推薦未填寫的問題
 */
export function RandomRecommend({
  unfilledQuestions,
  onQuestionClick,
  onClose,
  className,
}: RandomRecommendProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (unfilledQuestions.length === 0) {
    return (
      <div
        className={cn(
          'bg-brand-accent/20 rounded-xl p-4 text-center',
          className
        )}
      >
        <p className="text-[#1B1A1A] font-medium">
          太棒了！你已經回答了所有問題！
        </p>
      </div>
    )
  }

  const shuffleQuestion = () => {
    const newIndex = Math.floor(Math.random() * unfilledQuestions.length)
    setCurrentIndex(newIndex)
  }

  const currentQuestion = unfilledQuestions[currentIndex]
  const isStory = 'category' in currentQuestion
  const questionType = isStory ? 'story' : 'oneliner'

  return (
    <div
      className={cn(
        'bg-white border border-[#DBD8D8] rounded-xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F5F5F5]">
        <div className="flex items-center gap-2">
          <Shuffle size={16} className="text-[#3F3D3D]" />
          <span className="text-sm font-medium text-[#1B1A1A]">
            隨機推薦問題
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#6D6C6C] hover:text-[#1B1A1A] hover:bg-[#EBEAEA] rounded transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Question */}
      <div className="p-4">
        <p className="text-[#1B1A1A] font-medium mb-2">
          {currentQuestion.question}
        </p>
        {'prompt' in currentQuestion && currentQuestion.prompt && (
          <p className="text-sm text-[#6D6C6C] mb-4">{currentQuestion.prompt}</p>
        )}
        {'format_hint' in currentQuestion && currentQuestion.format_hint && (
          <p className="text-sm text-[#6D6C6C] mb-4">{currentQuestion.format_hint}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={shuffleQuestion}
            className="flex items-center gap-1 px-3 py-2 text-sm text-[#6D6C6C] bg-[#F5F5F5] rounded-lg hover:bg-[#EBEAEA] transition-colors"
          >
            <Shuffle size={14} />
            換一題
          </button>
          <button
            type="button"
            onClick={() => onQuestionClick(currentQuestion.id, questionType)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-white bg-brand-dark rounded-lg hover:bg-brand-dark-hover transition-colors"
          >
            開始回答
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Counter */}
      <div className="px-4 pb-4">
        <p className="text-xs text-[#8E8C8C] text-center">
          還有 {unfilledQuestions.length} 題未回答
        </p>
      </div>
    </div>
  )
}

export default RandomRecommend
