'use client'

import { cn } from '@/lib/utils'
import { BookOpen, Clock, ChevronRight, Check, Lightbulb, Sparkles } from 'lucide-react'
import type { StoryQuestion, Story, StoryCategory } from '@/lib/types/biography-v2'

interface StoriesSectionProps {
  /** 故事問題列表，按類別分組 */
  questionsByCategory: Record<StoryCategory, StoryQuestion[]>
  /** 已填寫的故事 */
  stories: Story[]
  /** 故事點擊回調 */
  onStoryClick: (questionId: string) => void
  /** 新增自訂問題回調 */
  onAddCustomQuestion?: (category: StoryCategory) => void
  /** 自訂樣式 */
  className?: string
}

const categoryMeta: Record<
  StoryCategory,
  { label: string; emoji: string; description: string }
> = {
  growth: {
    label: '成長軌跡',
    emoji: '🌱',
    description: '你的攀岩旅程',
  },
  psychology: {
    label: '心理層面',
    emoji: '🧠',
    description: '攀岩中的心理感受',
  },
  community: {
    label: '社群連結',
    emoji: '🤝',
    description: '與岩友的故事',
  },
  practical: {
    label: '實用經驗',
    emoji: '🔧',
    description: '裝備、訓練、技巧',
  },
  dreams: {
    label: '願望與目標',
    emoji: '🎯',
    description: '未來的攀岩計畫',
  },
  life: {
    label: '人生連結',
    emoji: '💫',
    description: '攀岩與生活',
  },
}

/**
 * 故事編輯區塊
 *
 * 用於編輯用戶的故事內容
 */
export function StoriesSection({
  questionsByCategory,
  stories,
  onStoryClick,
  onAddCustomQuestion,
  className,
}: StoriesSectionProps) {
  const getStory = (questionId: string): Story | undefined => {
    return stories.find((s) => s.question_id === questionId)
  }

  const totalQuestions = Object.values(questionsByCategory).flat().length
  const filledCount = stories.filter((s) => s.content?.trim()).length

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-[#3F3D3D]" />
          <h3 className="font-semibold text-[#1B1A1A]">深度故事</h3>
          <span className="text-xs text-[#6D6C6C] px-2 py-0.5 bg-[#F5F5F5] rounded-full flex items-center gap-1">
            <Clock size={12} />
            5 分鐘以上
          </span>
        </div>
        <span className="text-sm text-[#6D6C6C]">
          {filledCount}/{totalQuestions} 已填寫
        </span>
      </div>

      <p className="text-sm text-[#6D6C6C] flex items-center gap-1">
        <Lightbulb size={14} />
        挑一兩個有感覺的題目寫就好，這部分可以慢慢補
      </p>

      {/* Categories */}
      <div className="space-y-4">
        {(Object.entries(questionsByCategory) as [StoryCategory, StoryQuestion[]][]).map(
          ([category, questions]) => {
            const meta = categoryMeta[category]
            const categoryFilled = questions.filter((q) =>
              stories.some((s) => s.question_id === q.id && s.content?.trim())
            ).length

            return (
              <div
                key={category}
                className="border border-[#DBD8D8] rounded-xl overflow-hidden"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between p-4 bg-[#F5F5F5]">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.emoji}</span>
                    <div>
                      <span className="font-medium text-[#1B1A1A]">
                        {meta.label}
                      </span>
                      <p className="text-xs text-[#6D6C6C]">{meta.description}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-sm px-2 py-0.5 rounded-full',
                      categoryFilled > 0
                        ? 'bg-brand-accent/20 text-[#1B1A1A]'
                        : 'bg-[#EBEAEA] text-[#6D6C6C]'
                    )}
                  >
                    {categoryFilled}/{questions.length}
                  </span>
                </div>

                {/* Questions */}
                <div className="divide-y divide-[#EBEAEA]">
                  {questions.map((question) => {
                    const story = getStory(question.id)
                    const isFilled = !!story?.content?.trim()

                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => onStoryClick(question.id)}
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#F5F5F5] transition-colors"
                      >
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

                        {/* Question */}
                        <div className="flex-1 min-w-0">
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
                          {isFilled && story?.content && (
                            <p className="text-sm text-[#6D6C6C] mt-1 line-clamp-1">
                              {story.content}
                            </p>
                          )}
                        </div>

                        {/* Action */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-1 rounded-full',
                              isFilled
                                ? 'bg-brand-accent/10 text-[#1B1A1A]'
                                : 'bg-[#F5F5F5] text-[#6D6C6C]'
                            )}
                          >
                            {isFilled ? '編輯' : '開始寫'}
                          </span>
                          <ChevronRight size={16} className="text-[#B6B3B3]" />
                        </div>
                      </button>
                    )
                  })}

                  {/* Add Custom Question */}
                  {onAddCustomQuestion && (
                    <button
                      type="button"
                      onClick={() => onAddCustomQuestion(category)}
                      className="w-full flex items-center gap-2 p-4 text-sm text-[#6D6C6C] hover:text-[#1B1A1A] hover:bg-[#F5F5F5] transition-colors"
                    >
                      <Sparkles size={16} />
                      自訂問題
                    </button>
                  )}
                </div>
              </div>
            )
          }
        )}
      </div>
    </div>
  )
}

export default StoriesSection
