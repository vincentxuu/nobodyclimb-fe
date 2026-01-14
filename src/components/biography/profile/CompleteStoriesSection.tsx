'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { Biography } from '@/lib/types'
import { ADVANCED_STORY_QUESTIONS, STORY_CATEGORIES, StoryCategory } from '@/lib/constants/biography-stories'
import { cn } from '@/lib/utils'
import { StoryModal } from './StoryModal'

interface CompleteStoriesSectionProps {
  person: Biography
  isOwner: boolean
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
 * 更多故事（完整版）
 * 顯示所有已填寫的進階故事
 */
export function CompleteStoriesSection({ person, isOwner }: CompleteStoriesSectionProps) {
  const [selectedStory, setSelectedStory] = useState<{
    title: string
    content: string
    category: StoryCategory
  } | null>(null)

  // 整理已填寫的故事
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

  // 整理未填寫的故事（只給擁有者看）
  const unfilledStories = useMemo(() => {
    if (!isOwner) return []
    return ADVANCED_STORY_QUESTIONS.filter(q => {
      const content = person[q.field as keyof Biography] as string | null
      return !content || !content.trim()
    })
  }, [person, isOwner])

  const getCategoryName = (categoryId: StoryCategory) => {
    return STORY_CATEGORIES.find(c => c.id === categoryId)?.name || ''
  }

  if (filledStories.length === 0 && !isOwner) return null

  return (
    <>
      <section id="complete-stories" className="bg-gray-50 py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            更多故事
          </h2>
          <p className="mb-10 text-gray-600">
            {filledStories.length > 0
              ? `已分享 ${filledStories.length} 則故事`
              : '還沒有分享故事'}
          </p>

          {/* 故事網格 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* 已填寫的故事 */}
            {filledStories.map((story, index) => (
              <motion.div
                key={story.field}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <div
                  onClick={() => setSelectedStory({
                    title: story.title,
                    content: story.content,
                    category: story.category
                  })}
                  className="group h-full cursor-pointer rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md"
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

                  {/* 內容預覽 */}
                  <p className="mb-4 line-clamp-4 text-sm leading-relaxed text-gray-600">
                    {story.content}
                  </p>

                  {/* 閱讀更多提示 */}
                  <div className="flex items-center gap-2 text-sm font-medium text-brand-accent opacity-0 transition-opacity group-hover:opacity-100">
                    <span>閱讀完整故事</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </motion.div>
            ))}

            {/* 未填寫的故事（只給擁有者看） */}
            {isOwner && unfilledStories.slice(0, 3).map((story, index) => (
              <motion.div
                key={story.field}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (filledStories.length + index) * 0.05 }}
              >
                <div className="group flex h-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-brand-accent">
                  <div className="mb-3 rounded bg-gray-200 px-2 py-1 text-xs text-gray-500 transition-colors group-hover:bg-yellow-100 group-hover:text-yellow-600">
                    {getCategoryName(story.category)}
                  </div>
                  <h3 className="mb-2 font-medium text-gray-500 transition-colors group-hover:text-gray-700">
                    {story.title}
                  </h3>
                  <p className="text-sm text-gray-400">點擊新增故事</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 更多未填寫的故事提示 */}
          {isOwner && unfilledStories.length > 3 && (
            <div className="mt-8 text-center">
              <p className="text-gray-500">
                還有 {unfilledStories.length - 3} 個故事主題等待你的分享
              </p>
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
