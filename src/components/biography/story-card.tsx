'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { StoryQuestion } from '@/lib/constants/biography-stories'
import { cn } from '@/lib/utils'
import { getStoryIcon, getCategoryInfo } from '@/lib/utils/biography-ui'

interface StoryCardProps {
  question: StoryQuestion
  content: string
  variant?: 'default' | 'compact' | 'featured'
  showCategory?: boolean
  className?: string
  delay?: number
}

/**
 * 故事卡片組件
 * 用於展示人物誌中的故事內容
 */
export function StoryCard({
  question,
  content,
  variant = 'default',
  showCategory = true,
  className,
  delay = 0,
}: StoryCardProps) {
  const Icon = getStoryIcon(question.icon)
  const categoryInfo = getCategoryInfo(question.category)

  if (variant === 'compact') {
    return (
      <motion.div
        className={cn(
          'rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md',
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
      >
        <div className="mb-2 flex items-center gap-2">
          <Icon className={cn('h-4 w-4', categoryInfo?.color || 'text-gray-500')} />
          <h4 className="text-sm font-medium text-gray-900">{question.title}</h4>
        </div>
        <p className="line-clamp-3 text-sm text-gray-600">{content}</p>
      </motion.div>
    )
  }

  if (variant === 'featured') {
    return (
      <motion.div
        className={cn(
          'overflow-hidden rounded-xl border-2 border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-lg',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
      >
        {/* 分類標籤 */}
        {showCategory && categoryInfo && (
          <div className={cn('px-6 py-3', `bg-gradient-to-r from-gray-50 to-white`)}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  categoryInfo.color,
                  'bg-white shadow-sm'
                )}
              >
                {categoryInfo.name}
              </span>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* 標題 */}
          <div className="mb-4 flex items-start gap-3">
            <div
              className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                'bg-gray-100'
              )}
            >
              <Icon className={cn('h-5 w-5', categoryInfo?.color || 'text-gray-500')} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{question.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{question.subtitle}</p>
            </div>
          </div>

          {/* 內容 */}
          <div className="relative">
            <div className="absolute -left-2 top-0 h-full w-1 rounded-full bg-gradient-to-b from-gray-200 to-transparent" />
            <p className="whitespace-pre-wrap pl-4 text-base leading-relaxed text-gray-700">
              {content}
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  // Default variant
  return (
    <motion.div
      className={cn('rounded-lg bg-white p-6 shadow-sm', className)}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {/* 分類與標題 */}
      <div className="mb-4">
        {showCategory && categoryInfo && (
          <span
            className={cn(
              'mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
              categoryInfo.color,
              'bg-gray-50'
            )}
          >
            {categoryInfo.name}
          </span>
        )}
        <div className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', categoryInfo?.color || 'text-gray-500')} />
          <h3 className="text-lg font-medium text-gray-900">{question.title}</h3>
        </div>
      </div>

      {/* 內容 */}
      <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-600">{content}</p>
    </motion.div>
  )
}

interface StoryCardGroupProps {
  stories: Array<{
    question: StoryQuestion
    content: string
  }>
  title?: string
  variant?: 'default' | 'compact' | 'featured'
  columns?: 1 | 2 | 3
  className?: string
}

/**
 * 故事卡片群組
 * 用於展示多個故事卡片
 */
export function StoryCardGroup({
  stories,
  title,
  variant = 'default',
  columns = 1,
  className,
}: StoryCardGroupProps) {
  if (stories.length === 0) return null

  const gridClass =
    columns === 1
      ? 'grid-cols-1'
      : columns === 2
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={className}>
      {title && <h2 className="mb-6 text-xl font-semibold text-gray-900">{title}</h2>}
      <div className={cn('grid gap-4', gridClass)}>
        {stories.map((story, index) => (
          <StoryCard
            key={story.question.field}
            question={story.question}
            content={story.content}
            variant={variant}
            delay={index * 0.1}
          />
        ))}
      </div>
    </div>
  )
}

interface StoryCategorySectionProps {
  categoryId: string
  stories: Array<{
    question: StoryQuestion
    content: string
  }>
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

/**
 * 故事分類區塊
 * 按分類展示故事
 */
export function StoryCategorySection({
  categoryId,
  stories,
  variant = 'default',
  className,
}: StoryCategorySectionProps) {
  const categoryInfo = getCategoryInfo(categoryId)
  const CategoryIcon = categoryInfo ? getStoryIcon(categoryInfo.icon) : BookOpen

  if (stories.length === 0) return null

  return (
    <div className={cn('space-y-4', className)}>
      {/* 分類標題 */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            'bg-gray-100'
          )}
        >
          <CategoryIcon className={cn('h-5 w-5', categoryInfo?.color || 'text-gray-500')} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{categoryInfo?.name}</h3>
          <p className="text-sm text-gray-500">{categoryInfo?.description}</p>
        </div>
      </div>

      {/* 故事卡片 */}
      <div className="space-y-4 pl-[52px]">
        {stories.map((story, index) => (
          <StoryCard
            key={story.question.field}
            question={story.question}
            content={story.content}
            variant={variant}
            showCategory={false}
            delay={index * 0.1}
          />
        ))}
      </div>
    </div>
  )
}

export default StoryCard
