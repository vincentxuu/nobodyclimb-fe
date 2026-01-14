'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { Biography } from '@/lib/types'
import { ADVANCED_STORY_QUESTIONS, STORY_CATEGORIES, StoryCategory } from '@/lib/constants/biography-stories'
import { cn } from '@/lib/utils'
import { StoryModal } from './StoryModal'

interface FeaturedStoriesSectionProps {
  person: Biography
}

// 分類顏色映射
const CATEGORY_COLORS: Record<StoryCategory, { bg: string; text: string }> = {
  growth: { bg: 'bg-amber-100', text: 'text-amber-700' },
  psychology: { bg: 'bg-purple-100', text: 'text-purple-700' },
  community: { bg: 'bg-blue-100', text: 'text-blue-700' },
  practical: { bg: 'bg-green-100', text: 'text-green-700' },
  dreams: { bg: 'bg-pink-100', text: 'text-pink-700' },
  life: { bg: 'bg-teal-100', text: 'text-teal-700' },
}

/**
 * 精選故事區塊
 * 挑選 3-4 個最精彩的進階故事展示
 */
export function FeaturedStoriesSection({ person }: FeaturedStoriesSectionProps) {
  const [selectedStory, setSelectedStory] = useState<{
    title: string
    content: string
    category: StoryCategory
  } | null>(null)

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

  // 取前 4 個作為精選
  const featuredStories = filledStories.slice(0, 4)

  if (featuredStories.length === 0) return null

  const getCategoryName = (categoryId: StoryCategory) => {
    return STORY_CATEGORIES.find(c => c.id === categoryId)?.name || ''
  }

  return (
    <>
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-8 text-2xl font-bold text-gray-900">
            攀岩故事精選
          </h2>

          {/* 主故事卡片 */}
          {featuredStories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedStory({
                title: featuredStories[0].title,
                content: featuredStories[0].content,
                category: featuredStories[0].category
              })}
              className="mb-6 cursor-pointer rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={cn(
                'mb-3 inline-block rounded px-2 py-1 text-xs',
                CATEGORY_COLORS[featuredStories[0].category].bg,
                CATEGORY_COLORS[featuredStories[0].category].text
              )}>
                {getCategoryName(featuredStories[0].category)}
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                {featuredStories[0].title}
              </h3>
              <p className="mb-4 line-clamp-3 text-gray-600 leading-relaxed">
                {featuredStories[0].content}
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-brand-accent">
                <span>閱讀完整故事</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </motion.div>
          )}

          {/* 其他精選故事卡片 */}
          {featuredStories.length > 1 && (
            <div className="grid gap-4 md:grid-cols-3">
              {featuredStories.slice(1, 4).map((story, index) => (
                <motion.div
                  key={story.field}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedStory({
                    title: story.title,
                    content: story.content,
                    category: story.category
                  })}
                  className="cursor-pointer rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className={cn(
                    'mb-2 inline-block rounded px-2 py-1 text-xs',
                    CATEGORY_COLORS[story.category].bg,
                    CATEGORY_COLORS[story.category].text
                  )}>
                    {getCategoryName(story.category)}
                  </div>
                  <h4 className="mb-2 font-medium text-gray-900">
                    {story.title}
                  </h4>
                  <p className="line-clamp-2 text-sm text-gray-600">
                    {story.content}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 故事詳情 Modal */}
      <StoryModal
        story={selectedStory}
        open={!!selectedStory}
        onClose={() => setSelectedStory(null)}
      />
    </>
  )
}
