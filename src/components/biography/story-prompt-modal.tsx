'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Info, BarChart, Loader2, ChevronRight, Users } from 'lucide-react'
import {
  StoryQuestion,
  StoryCategory,
  ADVANCED_STORY_QUESTIONS,
  getUnfilledQuestions,
  calculateStoryProgress,
} from '@/lib/constants/biography-stories'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getStoryIcon, getCategoryInfo } from '@/lib/utils/biography-ui'

/**
 * 推題策略類型
 */
type PromptStrategy = 'random' | 'category_rotate' | 'easy_first' | 'popular' | 'completion_priority'

/**
 * 推題選擇策略
 */
function selectNextPrompt(
  unfilledQuestions: StoryQuestion[],
  strategy: PromptStrategy = 'random',
  lastPromptedField?: string
): StoryQuestion | null {
  if (unfilledQuestions.length === 0) return null

  // 過濾掉最近推過的題目
  const available = lastPromptedField
    ? unfilledQuestions.filter((q) => q.field !== lastPromptedField)
    : unfilledQuestions

  const questions = available.length > 0 ? available : unfilledQuestions

  switch (strategy) {
    case 'random':
      return questions[Math.floor(Math.random() * questions.length)]

    case 'category_rotate': {
      // 按分類優先順序選擇
      const categoryOrder: StoryCategory[] = [
        'growth',
        'psychology',
        'community',
        'practical',
        'dreams',
        'life',
      ]
      for (const cat of categoryOrder) {
        const catQuestions = questions.filter((q) => q.category === cat)
        if (catQuestions.length > 0) {
          return catQuestions[Math.floor(Math.random() * catQuestions.length)]
        }
      }
      // 備用：隨機選擇
      return questions[Math.floor(Math.random() * questions.length)]
    }

    case 'easy_first': {
      // 先推簡單有趣的題目
      const easyFields = ['funny_moment', 'favorite_spot', 'climbing_trip', 'life_outside_climbing']
      const easyQuestions = questions.filter((q) => easyFields.includes(q.field))
      if (easyQuestions.length > 0) {
        return easyQuestions[Math.floor(Math.random() * easyQuestions.length)]
      }
      return questions[Math.floor(Math.random() * questions.length)]
    }

    case 'completion_priority': {
      // 優先完成某個分類
      const categoryProgress: Record<StoryCategory, number> = {
        growth: 0,
        psychology: 0,
        community: 0,
        practical: 0,
        dreams: 0,
        life: 0,
      }
      questions.forEach((q) => {
        categoryProgress[q.category]++
      })

      // 找出最接近完成的分類
      let minRemaining = Infinity
      let targetCategory: StoryCategory = 'growth'
      for (const [cat, remaining] of Object.entries(categoryProgress)) {
        if (remaining > 0 && remaining < minRemaining) {
          minRemaining = remaining
          targetCategory = cat as StoryCategory
        }
      }

      const targetQuestions = questions.filter((q) => q.category === targetCategory)
      if (targetQuestions.length > 0) {
        return targetQuestions[Math.floor(Math.random() * targetQuestions.length)]
      }
      // 備用：隨機選擇
      return questions[Math.floor(Math.random() * questions.length)]
    }

    default:
      return questions[Math.floor(Math.random() * questions.length)]
  }
}

interface StoryPromptModalProps {
  biography: Record<string, unknown>
  userName?: string
  isOpen: boolean
  onClose: () => void
  onSave: (_storyField: string, _storyValue: string) => Promise<void>
  onSkip?: (_skippedField: string) => void
  strategy?: PromptStrategy
  lastPromptedField?: string
  /** 從後端 API 獲取的推薦題目欄位名稱，優先使用此欄位以確保頻率控制生效 */
  initialField?: string | null
}

/**
 * 每次登入推題彈窗
 * 用於引導用戶漸進式填寫人物誌故事
 */
export function StoryPromptModal({
  biography,
  userName = '你',
  isOpen,
  onClose,
  onSave,
  onSkip,
  strategy = 'random',
  lastPromptedField,
  initialField,
}: StoryPromptModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState<StoryQuestion | null>(null)
  const [value, setValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExamples, setShowExamples] = useState(false)

  // 計算進度
  const storyProgress = useMemo(() => calculateStoryProgress(biography), [biography])

  // 取得未填寫的問題並選擇一個推薦
  useEffect(() => {
    if (isOpen) {
      const unfilled = getUnfilledQuestions(biography)
      let nextQuestion: StoryQuestion | null = null

      // 優先使用後端 API 推薦的題目（確保頻率控制生效）
      // 從未填寫的問題中查找，避免顯示已填寫的題目
      if (initialField) {
        nextQuestion = unfilled.find((q) => q.field === initialField) || null
      }

      // 如果後端沒有推薦或找不到對應題目，使用本地策略選擇
      if (!nextQuestion) {
        nextQuestion = selectNextPrompt(unfilled, strategy, lastPromptedField)
      }

      setCurrentQuestion(nextQuestion)
      setValue('')
      setError(null)
    }
  }, [isOpen, biography, strategy, lastPromptedField, initialField])

  // 取得分類資訊
  const categoryInfo = useMemo(() => {
    if (!currentQuestion) return null
    return getCategoryInfo(currentQuestion.category)
  }, [currentQuestion])

  // 計算當前分類進度
  const categoryProgress = useMemo(() => {
    if (!currentQuestion || !categoryInfo) return null
    const catProgress = storyProgress.byCategory[currentQuestion.category]
    const total = ADVANCED_STORY_QUESTIONS.filter(
      (q) => q.category === currentQuestion.category
    ).length
    const filled = total - catProgress.total + catProgress.completed
    return { filled, total }
  }, [currentQuestion, categoryInfo, storyProgress])

  // 儲存
  const handleSave = useCallback(async () => {
    if (!currentQuestion || !value.trim()) return

    setIsSaving(true)
    setError(null)
    try {
      await onSave(currentQuestion.field, value.trim())
      onClose()
    } catch (err) {
      console.error('Failed to save:', err)
      setError('儲存失敗，請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }, [currentQuestion, value, onSave, onClose])

  // 跳過
  const handleSkip = useCallback(() => {
    if (currentQuestion) {
      onSkip?.(currentQuestion.field)
    }
    onClose()
  }, [currentQuestion, onSkip, onClose])

  // 換一題
  const handleChangeQuestion = useCallback(() => {
    const unfilled = getUnfilledQuestions(biography)
    const nextQuestion = selectNextPrompt(
      unfilled,
      'random',
      currentQuestion?.field
    )
    setCurrentQuestion(nextQuestion)
    setValue('')
  }, [biography, currentQuestion])

  if (!currentQuestion) return null

  const Icon = getStoryIcon(currentQuestion.icon)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 彈窗 */}
          <motion.div
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[85vh] max-w-lg -translate-y-1/2 overflow-auto rounded-2xl bg-white shadow-2xl sm:max-h-[90vh]"
            initial={{ opacity: 0, scale: 0.95, y: '-45%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, y: '-45%' }}
            transition={{ duration: 0.2 }}
          >
            {/* 標題列 */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">歡迎回來，{userName}！</h2>
                <p className="text-sm text-gray-500">今天來聊聊這個嗎？</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 內容 */}
            <div className="px-6 py-5">
              {/* 問題卡片 */}
              <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="mb-2 flex items-start gap-2">
                  <div
                    className={cn(
                      'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                      'bg-white shadow-sm'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', categoryInfo?.color || 'text-gray-500')} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{currentQuestion.title}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">{currentQuestion.subtitle}</p>
                  </div>
                </div>

                {/* 輸入區 */}
                <Textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="min-h-[100px] resize-none border-gray-200 bg-white text-sm"
                  autoFocus
                />

                {/* 字數 */}
                <div className="mt-2 text-right text-xs text-gray-400">{value.length} 字</div>

                {/* 錯誤提示 */}
                {error && (
                  <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>

              {/* 進度資訊 */}
              <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
                {categoryInfo && categoryProgress && (
                  <div className="flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" />
                    <span>
                      「{categoryInfo.name}」第 {categoryProgress.filled + 1}/{categoryProgress.total}{' '}
                      題
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <BarChart className="h-3.5 w-3.5" />
                  <span>
                    已完成 {storyProgress.completed}/{storyProgress.total} 個故事（{storyProgress.percentage}%）
                  </span>
                </div>
              </div>

              {/* 其他人分享（可選） */}
              <button
                className="mb-4 flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100"
                onClick={() => setShowExamples(!showExamples)}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>看看其他人怎麼分享</span>
                </div>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform',
                    showExamples && 'rotate-90'
                  )}
                />
              </button>

              {showExamples && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 rounded-lg bg-gray-50 p-4"
                >
                  <p className="text-sm italic text-gray-500">
                    「{getExampleAnswer(currentQuestion.field)}」
                  </p>
                  <p className="mt-2 text-right text-xs text-gray-400">— 匿名岩友</p>
                </motion.div>
              )}
            </div>

            {/* 底部按鈕 */}
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  下次再說
                </Button>
                <Button variant="ghost" size="sm" onClick={handleChangeQuestion}>
                  換一題
                </Button>
              </div>
              <Button onClick={handleSave} disabled={!value.trim() || isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                儲存
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * 取得範例答案（靜態，可以之後從 API 取得）
 */
function getExampleAnswer(field: string): string {
  const examples: Record<string, string> = {
    memorable_moment:
      '那次在龍洞的夕陽下完攀，整個人被橘紅色的光芒包圍，那一刻覺得所有的練習都值得了。',
    biggest_challenge:
      '曾經因為指腱炎休息了半年，那段時間學會了耐心，也更珍惜能夠攀爬的每一天。',
    funny_moment:
      '有一次爬到一半褲子破掉，只好硬著頭皮爬完整條路線，下來後才發現後面的人都在偷笑。',
    fear_management:
      '每次害怕墜落時，我會深呼吸三次，告訴自己繩子會接住我，然後專注在下一個動作。',
    favorite_spot:
      '最推薦北部的原岩，定線有創意，氣氛也很好，是我開始愛上抱石的地方。',
    climbing_mentor:
      '我的教練總是說「慢慢來，比較快」，這句話改變了我急躁的個性，不只在攀岩上。',
    life_outside_climbing:
      '除了攀岩，我也很喜歡攝影。常常帶著相機去岩場，記錄岩友們專注的表情。',
  }

  return examples[field] || '這是一段很棒的攀岩故事...'
}

/**
 * 簡化版推題提示
 * 用於在頁面角落顯示小提示
 */
interface StoryPromptBadgeProps {
  biography: Record<string, unknown>
  onClick: () => void
  className?: string
}

export function StoryPromptBadge({ biography, onClick, className }: StoryPromptBadgeProps) {
  const unfilled = getUnfilledQuestions(biography)

  if (unfilled.length === 0) return null

  return (
    <motion.button
      className={cn(
        'flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg transition-shadow hover:shadow-xl',
        className
      )}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <MessageCircle className="h-5 w-5 text-blue-500" />
      <span className="text-sm font-medium text-gray-700">今天來寫個故事？</span>
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">
        {unfilled.length} 題待填
      </span>
    </motion.button>
  )
}

export default StoryPromptModal
