'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Check, Users, ChevronRight, X, Sparkles, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChoiceQuestion as ChoiceQuestionType, ChoiceOption } from '@/lib/hooks/useQuestions'

interface ChoiceQuestionProps {
  question: ChoiceQuestionType
  onSubmit: (_optionId: string, _customText?: string, _followUpText?: string) => Promise<{
    responseMessage: string
    communityCount: number
  }>
  onSkip: () => void
  onComplete: () => void
}

type Phase = 'selecting' | 'response' | 'followup' | 'complete'

export function ChoiceQuestion({
  question,
  onSubmit,
  onSkip,
  onComplete,
}: ChoiceQuestionProps) {
  const [phase, setPhase] = useState<Phase>('selecting')
  const [selectedOption, setSelectedOption] = useState<ChoiceOption | null>(null)
  const [customText, setCustomText] = useState('')
  const [followUpText, setFollowUpText] = useState('')
  const [responseMessage, setResponseMessage] = useState('')
  const [communityCount, setCommunityCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 計算總人數
  const totalCount = question.options.reduce((sum, opt) => sum + opt.count, 0)

  const handleOptionSelect = useCallback(async (option: ChoiceOption) => {
    setSelectedOption(option)

    // 如果是「其他」選項，先不提交，等用戶輸入
    if (option.isOther) {
      return
    }

    setIsSubmitting(true)
    try {
      const result = await onSubmit(option.id)
      setResponseMessage(result.responseMessage)
      setCommunityCount(result.communityCount)
      setPhase('response')
    } catch (error) {
      console.error('Failed to submit answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [onSubmit])

  const handleOtherSubmit = useCallback(async () => {
    if (!selectedOption || !customText.trim()) return

    setIsSubmitting(true)
    try {
      const result = await onSubmit(selectedOption.id, customText)
      setResponseMessage(result.responseMessage)
      setCommunityCount(result.communityCount)
      setPhase('response')
    } catch (error) {
      console.error('Failed to submit answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedOption, customText, onSubmit])

  const handleContinueToFollowUp = useCallback(() => {
    if (question.followUpPrompt) {
      setPhase('followup')
    } else {
      onComplete()
    }
  }, [question.followUpPrompt, onComplete])

  const handleFollowUpSubmit = useCallback(async () => {
    if (!selectedOption) return

    setIsSubmitting(true)
    try {
      // 更新回答以包含 follow-up 文字
      await onSubmit(selectedOption.id, customText || undefined, followUpText || undefined)
      setPhase('complete')
      // 短暫顯示完成狀態後繼續
      setTimeout(() => {
        onComplete()
      }, 1000)
    } catch (error) {
      console.error('Failed to submit follow-up:', error)
      onComplete() // 即使失敗也繼續
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedOption, customText, followUpText, onSubmit, onComplete])

  const handleSkipFollowUp = useCallback(() => {
    onComplete()
  }, [onComplete])

  // 選擇階段
  if (phase === 'selecting') {
    return (
      <div className="relative mx-auto max-w-2xl px-4 py-8">
        {/* 關閉按鈕 */}
        <button
          onClick={onSkip}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="跳過"
        >
          <X size={20} />
        </button>

        {/* 標題 */}
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            <Sparkles size={14} />
            <span>快速認識你</span>
          </div>
          <h2 className="text-2xl font-bold text-[#1B1A1A]">{question.question}</h2>
          {question.hint && (
            <p className="mt-2 text-[#6D6C6C]">{question.hint}</p>
          )}
        </div>

        {/* 社群驗證 */}
        {totalCount > 0 && (
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-[#8E8C8C]">
            <Users size={16} />
            <span>已有 {totalCount} 人回答過這個問題</span>
          </div>
        )}

        {/* 選項列表 */}
        <div className="space-y-3">
          {question.options.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => handleOptionSelect(option)}
              disabled={isSubmitting}
              className={cn(
                'w-full rounded-xl border-2 p-4 text-left transition-all',
                selectedOption?.id === option.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                isSubmitting && 'opacity-50 cursor-not-allowed'
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#1B1A1A]">{option.label}</span>
                {option.count > 0 && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-[#8E8C8C]">
                    {option.count} 人
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* 其他選項的輸入框 */}
        {selectedOption?.isOther && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 space-y-3"
          >
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="請描述你的開始..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[#1B1A1A] placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <Button
              onClick={handleOtherSubmit}
              disabled={!customText.trim() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? '送出中...' : '送出'}
            </Button>
          </motion.div>
        )}

        {/* 跳過按鈕 */}
        <div className="mt-8 text-center">
          <button
            onClick={onSkip}
            className="text-sm text-[#8E8C8C] underline-offset-2 hover:text-[#6D6C6C] hover:underline"
          >
            先跳過，之後再回答
          </button>
        </div>
      </div>
    )
  }

  // 回應階段
  if (phase === 'response') {
    return (
      <div className="relative mx-auto max-w-2xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>

          <h3 className="mb-2 text-xl font-medium text-[#1B1A1A]">
            {responseMessage}
          </h3>

          <p className="mb-6 text-[#6D6C6C]">
            已有 <span className="font-medium text-primary">{communityCount}</span> 人和你一樣
          </p>

          <Button
            onClick={handleContinueToFollowUp}
            className="gap-2"
          >
            {question.followUpPrompt ? '繼續' : '完成'}
            <ChevronRight size={18} />
          </Button>
        </motion.div>
      </div>
    )
  }

  // 跟進問題階段
  if (phase === 'followup') {
    return (
      <div className="relative mx-auto max-w-2xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* 標題 */}
          <div className="text-center">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              <MessageCircle size={14} />
              <span>一句話就好</span>
            </div>
            <h2 className="text-xl font-bold text-[#1B1A1A]">
              {question.followUpPrompt}
            </h2>
            <p className="mt-2 text-sm text-[#8E8C8C]">
              可選填，讓其他人更了解你的故事
            </p>
          </div>

          {/* 輸入框 */}
          <input
            type="text"
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            placeholder={question.followUpPlaceholder || '輸入你的故事...'}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[#1B1A1A] placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
          />

          {/* 按鈕 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkipFollowUp}
              className="flex-1"
            >
              跳過
            </Button>
            <Button
              onClick={handleFollowUpSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? '送出中...' : '送出'}
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  // 完成階段
  return (
    <div className="relative mx-auto max-w-2xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-medium text-[#1B1A1A]">完成！</h3>
      </motion.div>
    </div>
  )
}

export default ChoiceQuestion
