'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, X, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GuidedQuestion {
  id: string
  question: string
  subtitle?: string
  placeholder?: string
  type: 'text' | 'textarea'
  category: string
}

interface GuidedQuestionsProps {
  questions: GuidedQuestion[]
  onComplete: (_answers: Record<string, string>) => void
  onSkip: () => void
  title?: string
  subtitle?: string
}

const ENCOURAGEMENTS = [
  '太棒了！讓我們繼續',
  '很好的回答！',
  '精彩！再來一題',
  '完美！你做得很好',
  '讚！保持下去',
]

export function GuidedQuestions({
  questions,
  onComplete,
  onSkip,
  title = '讓更多人認識你',
  subtitle = '回答幾個簡單的問題，讓你的人物誌更加完整',
}: GuidedQuestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encouragementText, setEncouragementText] = useState('')

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const isLastQuestion = currentIndex === questions.length - 1

  const handleAnswerChange = useCallback(
    (value: string) => {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: value,
      }))
    },
    [currentQuestion?.id]
  )

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      onComplete(answers)
      return
    }

    // 顯示鼓勵文字
    if (answers[currentQuestion.id]?.trim()) {
      const randomEncouragement =
        ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
      setEncouragementText(randomEncouragement)
      setShowEncouragement(true)
      setTimeout(() => {
        setShowEncouragement(false)
        setCurrentIndex((prev) => prev + 1)
      }, 800)
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [isLastQuestion, answers, currentQuestion?.id, onComplete])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [currentIndex])

  const handleSkipQuestion = useCallback(() => {
    if (isLastQuestion) {
      onComplete(answers)
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [isLastQuestion, answers, onComplete])

  if (!currentQuestion) return null

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-8">
      {/* 關閉按鈕 */}
      <button
        onClick={onSkip}
        className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label="稍後再填"
      >
        <X size={20} />
      </button>

      {/* 標題 */}
      <div className="mb-8 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
          <Sparkles size={14} />
          <span>快速設定</span>
        </div>
        <h2 className="text-2xl font-bold text-[#1B1A1A]">{title}</h2>
        <p className="mt-2 text-[#6D6C6C]">{subtitle}</p>
      </div>

      {/* 進度條 */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-sm text-[#8E8C8C]">
          <span>
            第 {currentIndex + 1} 題，共 {questions.length} 題
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* 問題卡片 */}
      <AnimatePresence mode="wait">
        {showEncouragement ? (
          <motion.div
            key="encouragement"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex min-h-[300px] flex-col items-center justify-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xl font-medium text-[#1B1A1A]">{encouragementText}</p>
          </motion.div>
        ) : (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* 分類標籤 */}
            <div className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-[#6D6C6C]">
              {currentQuestion.category}
            </div>

            {/* 問題 */}
            <div className="space-y-2">
              <h3 className="text-xl font-medium text-[#1B1A1A]">{currentQuestion.question}</h3>
              {currentQuestion.subtitle && (
                <p className="text-sm text-[#8E8C8C]">{currentQuestion.subtitle}</p>
              )}
            </div>

            {/* 輸入框 */}
            {currentQuestion.type === 'textarea' ? (
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder={currentQuestion.placeholder || '輸入你的回答...'}
                className="min-h-[150px] w-full resize-none rounded-lg border border-gray-200 bg-white p-4 text-[#1B1A1A] placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder={currentQuestion.placeholder || '輸入你的回答...'}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[#1B1A1A] placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 按鈕區 */}
      {!showEncouragement && (
        <div className="mt-8 flex items-center justify-between">
          <div className="flex gap-2">
            {currentIndex > 0 && (
              <Button variant="ghost" onClick={handlePrev} className="gap-1 text-[#6D6C6C]">
                <ChevronLeft size={18} />
                上一題
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleSkipQuestion}
              className="text-[#8E8C8C] hover:text-[#6D6C6C]"
            >
              跳過此題
            </Button>
            <Button
              onClick={handleNext}
              className={cn(
                'gap-1',
                answers[currentQuestion.id]?.trim()
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-gray-200 text-[#6D6C6C]'
              )}
            >
              {isLastQuestion ? '完成' : '下一題'}
              {!isLastQuestion && <ChevronRight size={18} />}
            </Button>
          </div>
        </div>
      )}

      {/* 稍後再填提示 */}
      <div className="mt-8 text-center">
        <button
          onClick={onSkip}
          className="text-sm text-[#8E8C8C] underline-offset-2 hover:text-[#6D6C6C] hover:underline"
        >
          稍後再填，先去逛逛
        </button>
      </div>
    </div>
  )
}

export default GuidedQuestions
