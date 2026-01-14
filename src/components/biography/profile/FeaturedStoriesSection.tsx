'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Biography } from '@/lib/types'
import { ADVANCED_STORY_QUESTIONS, STORY_CATEGORIES, StoryCategory } from '@/lib/constants/biography-stories'
import { cn } from '@/lib/utils'

interface FeaturedStoriesSectionProps {
  person: Biography
}

// 分類顏色映射 - 使用品牌色系
const CATEGORY_COLORS: Record<StoryCategory, { bg: string; text: string }> = {
  growth: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  psychology: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  community: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  practical: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  dreams: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  life: { bg: 'bg-brand-light', text: 'text-brand-dark' },
}

/**
 * 精選故事區塊
 * 挑選 3-4 個最精彩的進階故事展示，直接顯示完整內容
 */
export function FeaturedStoriesSection({ person }: FeaturedStoriesSectionProps) {
  // 整理已填寫的進階故事
  const filledStories = useMemo(() => {
    return ADVANCED_STORY_QUESTIONS
      .filter(q => {
        const content = person[q.field as keyof Biography] as string | null
        return content && content.trim()
      })
      .map(q => ({
        ...q,
        content: person[q.field as keyof Biography] as string
      }))
  }, [person])

  // 智能選擇精選故事：優先選擇不同類別
  const featuredStories = useMemo(() => {
    if (filledStories.length === 0) return []

    // 按類別分組
    const storiesByCategory = filledStories.reduce((acc, story) => {
      if (!acc[story.category]) {
        acc[story.category] = []
      }
      acc[story.category].push(story)
      return acc
    }, {} as Record<StoryCategory, typeof filledStories>)

    const selected: typeof filledStories = []
    const categories = Object.keys(storiesByCategory) as StoryCategory[]
    let categoryIndex = 0

    // 輪流從每個類別選一個故事，直到選滿 5 個
    while (selected.length < 5 && selected.length < filledStories.length) {
      const category = categories[categoryIndex % categories.length]
      const categoryStories = storiesByCategory[category]

      if (categoryStories && categoryStories.length > 0) {
        selected.push(categoryStories.shift()!)
      }

      // 如果該類別沒故事了，移除該類別
      if (!categoryStories || categoryStories.length === 0) {
        categories.splice(categoryIndex % categories.length, 1)
        if (categories.length === 0) break
      } else {
        categoryIndex++
      }
    }

    return selected
  }, [filledStories])

  if (featuredStories.length === 0) return null

  const getCategoryName = (categoryId: StoryCategory) => {
    return STORY_CATEGORIES.find(c => c.id === categoryId)?.name || ''
  }

  return (
    <section className="bg-gray-50 py-12">
      <div className="container mx-auto max-w-6xl px-4">
        <h2 className="mb-8 text-2xl font-bold text-gray-900">
          精選小故事
        </h2>

        {/* 橫向滾動故事卡片 */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
          {featuredStories.map((story, index) => (
            <motion.div
              key={story.field}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="w-80 flex-shrink-0 snap-center rounded-lg bg-white p-6 shadow-sm"
            >
              {/* 分類標籤 */}
              <div className={cn(
                'mb-3 inline-block rounded px-2 py-1 text-xs',
                CATEGORY_COLORS[story.category].bg,
                CATEGORY_COLORS[story.category].text
              )}>
                {getCategoryName(story.category)}
              </div>

              {/* 標題 */}
              <h3 className="mb-3 font-semibold text-gray-900">
                {story.title}
              </h3>

              {/* 完整內容 */}
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {story.content}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
