'use client'

import { motion } from 'framer-motion'
import { CheckCircle, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  calculateStoryProgress,
  STORY_CATEGORIES,
  StoryCategory,
} from '@/lib/constants/biography-stories'
import { cn } from '@/lib/utils'
import { CATEGORY_ICONS } from '@/lib/utils/biography-ui'

interface StoryProgressProps {
  biography: Record<string, unknown>
  onEditClick?: () => void
  onCategoryClick?: (_selectedCategory: StoryCategory) => void
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

/**
 * 故事進度組件
 * 顯示人物誌故事的填寫進度
 */
export function StoryProgress({
  biography,
  onEditClick,
  onCategoryClick,
  variant = 'default',
  className,
}: StoryProgressProps) {
  const t = useTranslations('BiographyPage')
  const progress = calculateStoryProgress(biography)

  if (variant === 'compact') {
    return (
      <div className={cn('rounded-lg bg-white p-4 shadow-sm', className)}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{t('storyProgressTitle')}</span>
          <span className="text-sm text-gray-500">
            {progress.completed}/{progress.total}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <motion.div
            className="h-full rounded-full bg-brand-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {t('storyProgressCompleted', { percentage: progress.percentage })}
        </p>
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('rounded-lg bg-white p-6 shadow-sm', className)}>
        {/* 總體進度 */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{t('myStoryProgress')}</h3>
            {onEditClick && (
              <Button variant="outline" size="sm" onClick={onEditClick}>
                {t('continueWriting')}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {t('overallProgress', { completed: progress.completed, total: progress.total })}
            </span>
            <span className="font-medium text-gray-900">{progress.percentage}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="h-full rounded-full bg-brand-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* 分類進度 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">{t('categoryProgress')}</h4>
          {STORY_CATEGORIES.map((category) => {
            const categoryProgress = progress.byCategory[category.id]
            const percentage =
              categoryProgress.total > 0
                ? Math.round((categoryProgress.completed / categoryProgress.total) * 100)
                : 0
            const Icon = CATEGORY_ICONS[category.id]
            const isComplete = categoryProgress.completed === categoryProgress.total

            return (
              <motion.button
                key={category.id}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                  'hover:bg-gray-50',
                  onCategoryClick && 'cursor-pointer'
                )}
                onClick={() => onCategoryClick?.(category.id)}
                whileHover={{ scale: onCategoryClick ? 1.01 : 1 }}
                whileTap={{ scale: onCategoryClick ? 0.99 : 1 }}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
                    isComplete ? 'bg-brand-accent/20' : 'bg-gray-100'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle className="h-5 w-5 text-brand-accent" />
                  ) : (
                    <Icon className={cn('h-5 w-5', category.color)} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    <span className="text-xs text-gray-500">
                      {categoryProgress.completed}/{categoryProgress.total}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        isComplete
                          ? 'bg-brand-accent'
                          : percentage > 0
                            ? 'bg-gradient-to-r from-gray-300 to-gray-400'
                            : 'bg-gray-200'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                    />
                  </div>
                </div>
                {onCategoryClick && (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn('rounded-lg bg-white p-6 shadow-sm', className)}>
      {/* 總體進度 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{t('storyCompletion')}</h3>
          <p className="text-sm text-gray-500">
            {t('storiesWritten', { completed: progress.completed, total: progress.total })}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-gray-900">{progress.percentage}%</span>
        </div>
      </div>

      {/* 進度條 */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-100">
        <motion.div
          className="h-full rounded-full bg-brand-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* 分類小圓點 */}
      <div className="flex flex-wrap gap-2">
        {STORY_CATEGORIES.map((category) => {
          const categoryProgress = progress.byCategory[category.id]
          const isComplete = categoryProgress.completed === categoryProgress.total
          const hasProgress = categoryProgress.completed > 0
          const Icon = CATEGORY_ICONS[category.id]

          return (
            <div
              key={category.id}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1',
                isComplete
                  ? 'bg-brand-accent/20 text-brand-dark'
                  : hasProgress
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-gray-50 text-gray-400'
              )}
              title={`${category.name}: ${categoryProgress.completed}/${categoryProgress.total}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
                {categoryProgress.completed}/{categoryProgress.total}
              </span>
            </div>
          )
        })}
      </div>

      {/* 操作按鈕 */}
      {onEditClick && (
        <Button className="mt-4 w-full" onClick={onEditClick}>
          {t('continueWritingStories')}
        </Button>
      )}
    </div>
  )
}

interface StoryProgressBadgeProps {
  biography: Record<string, unknown>
  className?: string
}

/**
 * 故事進度徽章
 * 用於在卡片等小空間顯示進度
 */
export function StoryProgressBadge({ biography, className }: StoryProgressBadgeProps) {
  const progress = calculateStoryProgress(biography)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1',
        className
      )}
    >
      <div className="flex h-4 w-4 items-center justify-center">
        <svg className="h-4 w-4 -rotate-90 transform" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6" fill="none" stroke="#e5e7eb" strokeWidth="2" />
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="#FFE70C"
            strokeWidth="2"
            strokeDasharray={`${(progress.percentage / 100) * 37.7} 37.7`}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="text-xs font-medium text-gray-700">
        {progress.completed}/{progress.total}
      </span>
    </div>
  )
}

interface CategoryQuickStatsProps {
  biography: Record<string, unknown>
  className?: string
}

/**
 * 分類快速統計
 * 以圖標形式顯示各分類的完成狀態
 */
export function CategoryQuickStats({ biography, className }: CategoryQuickStatsProps) {
  const progress = calculateStoryProgress(biography)

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {STORY_CATEGORIES.map((category) => {
        const categoryProgress = progress.byCategory[category.id]
        const isComplete = categoryProgress.completed === categoryProgress.total
        const hasProgress = categoryProgress.completed > 0
        const Icon = CATEGORY_ICONS[category.id]

        return (
          <div
            key={category.id}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full',
              isComplete ? 'bg-brand-accent/20' : hasProgress ? 'bg-yellow-50' : 'bg-gray-50'
            )}
            title={`${category.name}: ${categoryProgress.completed}/${categoryProgress.total}`}
          >
            {isComplete ? (
              <CheckCircle className="h-3.5 w-3.5 text-brand-accent" />
            ) : (
              <Icon className={cn('h-3.5 w-3.5', hasProgress ? category.color : 'text-gray-300')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default StoryProgress
