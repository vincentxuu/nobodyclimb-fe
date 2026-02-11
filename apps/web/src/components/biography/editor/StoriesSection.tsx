'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Clock,
  ChevronRight,
  ChevronDown,
  Check,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Brain,
  Users,
  Wrench,
  Compass,
  Palette,
  Shuffle,
  type LucideIcon,
} from 'lucide-react'
import type { StoryQuestion, Story, StoryCategory } from '@/lib/types/biography-v2'
import { RandomRecommend } from './RandomRecommend'

interface StoriesSectionProps {
  /** 故事問題列表，按類別分組 */
  questionsByCategory: Record<StoryCategory, StoryQuestion[]>
  /** 已填寫的故事 */
  stories: Story[]
  /** 故事點擊回調 */
  onStoryClick: (_questionId: string) => void
  /** 新增自訂問題回調 */
  onAddCustomQuestion?: (_category: StoryCategory) => void
  /** 是否顯示隨機推薦 */
  showRandomRecommend?: boolean
  /** 自訂樣式 */
  className?: string
}

const categoryMeta: Record<
  StoryCategory,
  { label: string; icon: LucideIcon; description: string }
> = {
  growth: {
    label: '成長軌跡',
    icon: TrendingUp,
    description: '你的攀岩旅程',
  },
  psychology: {
    label: '心理層面',
    icon: Brain,
    description: '攀岩中的心理感受',
  },
  community: {
    label: '社群連結',
    icon: Users,
    description: '與岩友的故事',
  },
  practical: {
    label: '實用經驗',
    icon: Wrench,
    description: '裝備、訓練、技巧',
  },
  dreams: {
    label: '願望與目標',
    icon: Compass,
    description: '未來的攀岩計畫',
  },
  life: {
    label: '人生連結',
    icon: Palette,
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
  showRandomRecommend = true,
  className,
}: StoriesSectionProps) {
  const [randomRecommendVisible, setRandomRecommendVisible] = useState(showRandomRecommend)
  // 預設所有分類都是收合的
  const [expandedCategories, setExpandedCategories] = useState<Set<StoryCategory>>(new Set())

  const toggleCategory = (category: StoryCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const getStory = (questionId: string): Story | undefined => {
    return stories.find((s) => s.question_id === questionId)
  }

  const totalQuestions = Object.values(questionsByCategory).flat().length
  const filledCount = stories.filter((s) => s.content?.trim()).length

  // 計算未填寫的問題
  const unfilledQuestions = useMemo(() => {
    return Object.values(questionsByCategory)
      .flat()
      .filter((q) => !stories.some((s) => s.question_id === q.id && s.content?.trim()))
  }, [questionsByCategory, stories])

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

      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6D6C6C] flex items-center gap-1">
          <Lightbulb size={14} />
          挑一兩個有感覺的題目寫就好，這部分可以慢慢補
        </p>
        {!randomRecommendVisible && unfilledQuestions.length > 0 && (
          <button
            type="button"
            onClick={() => setRandomRecommendVisible(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-brand-dark border border-brand-dark rounded-lg hover:bg-brand-accent/10 transition-colors"
          >
            <Shuffle size={14} />
            隨機推薦一題
          </button>
        )}
      </div>

      {/* Random Recommend */}
      {randomRecommendVisible && unfilledQuestions.length > 0 && (
        <RandomRecommend
          unfilledQuestions={unfilledQuestions}
          onQuestionClick={(questionId) => onStoryClick(questionId)}
          onClose={() => setRandomRecommendVisible(false)}
        />
      )}

      {/* Categories */}
      <div className="space-y-4">
        {(Object.entries(questionsByCategory) as [StoryCategory, StoryQuestion[]][]).map(
          ([category, questions]) => {
            const meta = categoryMeta[category]
            const categoryFilled = questions.filter((q) =>
              stories.some((s) => s.question_id === q.id && s.content?.trim())
            ).length
            const isExpanded = expandedCategories.has(category)

            return (
              <div
                key={category}
                className="border border-[#DBD8D8] rounded-lg overflow-hidden"
              >
                {/* Category Header - 可點擊展開/收合 */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 bg-[#F5F5F5] hover:bg-[#EBEAEA] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      size={18}
                      className={cn(
                        'text-[#6D6C6C] transition-transform',
                        isExpanded ? 'rotate-0' : '-rotate-90'
                      )}
                    />
                    <meta.icon size={20} className="text-[#3F3D3D]" />
                    <div className="text-left">
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
                </button>

                {/* Questions - 只有展開時顯示 */}
                {isExpanded && (
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
                                {question.title}
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
                )}
              </div>
            )
          }
        )}
      </div>
    </div>
  )
}

export default StoriesSection
