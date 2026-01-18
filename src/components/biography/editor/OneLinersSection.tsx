'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MessageCircle, Check, ChevronDown, RefreshCw, Plus, Clock, Lightbulb, Sparkles } from 'lucide-react'
import type { OneLinerQuestion, OneLiner } from '@/lib/types/biography-v2'

interface OneLinersSectionProps {
  /** 問題列表 */
  questions: OneLinerQuestion[]
  /** 已填寫的答案 */
  answers: OneLiner[]
  /** 答案變更回調 */
  onAnswerChange: (questionId: string, answer: string | null) => void
  /** 新增自訂問題回調 */
  onAddCustomQuestion?: () => void
  /** 隨機推薦回調 */
  onRandomRecommend?: () => void
  /** 自訂樣式 */
  className?: string
}

/**
 * 快問快答編輯區塊
 *
 * 用於編輯用戶的一句話回答
 */
export function OneLinersSection({
  questions,
  answers,
  onAnswerChange,
  onAddCustomQuestion,
  onRandomRecommend,
  className,
}: OneLinersSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getAnswer = (questionId: string): string | undefined => {
    return answers.find((a) => a.question_id === questionId)?.answer
  }

  const filledCount = answers.filter((a) => a.answer?.trim()).length
  const totalCount = questions.length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-[#3F3D3D]" />
          <h3 className="font-semibold text-[#1B1A1A]">快問快答</h3>
          <span className="text-xs text-[#6D6C6C] px-2 py-0.5 bg-[#F5F5F5] rounded-full flex items-center gap-1">
            <Clock size={12} />
            2 分鐘
          </span>
        </div>
        <span className="text-sm text-[#6D6C6C]">
          {filledCount}/{totalCount} 已填寫
        </span>
      </div>

      <p className="text-sm text-[#6D6C6C] flex items-center gap-1">
        <Lightbulb size={14} />
        選幾題回答就好，不用全部填
      </p>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((question) => {
          const answer = getAnswer(question.id)
          const isFilled = !!answer?.trim()
          const isExpanded = expandedId === question.id

          return (
            <div
              key={question.id}
              className={cn(
                'border rounded-xl overflow-hidden transition-all duration-200',
                isFilled
                  ? 'border-brand-accent bg-brand-accent/10'
                  : 'border-[#DBD8D8] bg-white'
              )}
            >
              {/* Question Header */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : question.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {/* Status Icon */}
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                      isFilled
                        ? 'bg-brand-accent text-brand-dark'
                        : 'border-2 border-[#B6B3B3]'
                    )}
                  >
                    {isFilled && <Check size={12} />}
                  </div>

                  {/* Question Text */}
                  <div>
                    <div className="flex items-center gap-1">
                      {question.source === 'user' && (
                        <Sparkles size={14} className="text-brand-accent" />
                      )}
                      <span
                        className={cn(
                          'font-medium',
                          isFilled ? 'text-[#1B1A1A]' : 'text-[#3F3D3D]'
                        )}
                      >
                        {question.question}
                      </span>
                    </div>
                    {isFilled && !isExpanded && (
                      <p className="text-sm text-[#6D6C6C] mt-1 line-clamp-1">
                        {answer}
                      </p>
                    )}
                  </div>
                </div>

                {/* Expand Icon */}
                <ChevronDown
                  size={20}
                  className={cn(
                    'text-[#B6B3B3] transition-transform flex-shrink-0',
                    isExpanded && 'rotate-180'
                  )}
                />
              </button>

              {/* Answer Input */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {question.format_hint && (
                    <p className="text-sm text-[#6D6C6C] bg-[#F5F5F5] px-3 py-2 rounded-lg flex items-center gap-1">
                      <Lightbulb size={14} />
                      {question.format_hint}
                    </p>
                  )}
                  <input
                    type="text"
                    value={answer || ''}
                    onChange={(e) =>
                      onAnswerChange(question.id, e.target.value || null)
                    }
                    placeholder="輸入你的答案..."
                    className="w-full px-4 py-3 border border-[#B6B3B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
                    maxLength={200}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#8E8C8C]">
                      {(answer?.length || 0)}/200
                    </span>
                    {isFilled && (
                      <button
                        type="button"
                        onClick={() => onAnswerChange(question.id, null)}
                        className="text-xs text-[#6D6C6C] hover:text-red-500 transition-colors"
                      >
                        清除回答
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {onRandomRecommend && (
          <button
            type="button"
            onClick={onRandomRecommend}
            className="flex items-center gap-1 text-sm text-[#6D6C6C] hover:text-[#1B1A1A] transition-colors px-3 py-2 bg-[#F5F5F5] rounded-lg"
          >
            <RefreshCw size={16} />
            隨機推薦問題
          </button>
        )}

        {onAddCustomQuestion && (
          <button
            type="button"
            onClick={onAddCustomQuestion}
            className="flex items-center gap-1 text-sm text-[#6D6C6C] hover:text-[#1B1A1A] transition-colors px-3 py-2 bg-[#F5F5F5] rounded-lg"
          >
            <Plus size={16} />
            自訂問題
          </button>
        )}
      </div>
    </div>
  )
}

export default OneLinersSection
