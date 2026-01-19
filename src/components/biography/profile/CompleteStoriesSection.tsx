'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Biography } from '@/lib/types'
import { ADVANCED_STORY_QUESTIONS, STORY_CATEGORIES, StoryCategory } from '@/lib/constants/biography-stories'
import { cn } from '@/lib/utils'

interface CompleteStoriesSectionProps {
  person: Biography
  isOwner: boolean
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
 * 小故事（完整版）
 * 顯示所有已填寫的進階故事，直接顯示完整內容
 */
export function CompleteStoriesSection({ person, isOwner }: CompleteStoriesSectionProps) {
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
    <section id="complete-stories" className="bg-gray-50 py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          小故事
        </h2>
        <p className="mb-10 text-gray-600">
          {filledStories.length > 0
            ? `已分享 ${filledStories.length} 則故事`
            : '還沒有分享故事'}
        </p>

        {/* 故事橫向滾動 */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
          {/* 已填寫的故事 */}
          {filledStories.map((story, index) => (
            <motion.div
              key={story.field}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.05 }}
              className="w-80 flex-shrink-0 snap-start rounded-lg bg-white p-6 shadow-sm"
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

          {/* 未填寫的故事（只給擁有者看） */}
          {isOwner && unfilledStories.slice(0, 3).map((story, index) => (
            <motion.div
              key={story.field}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (filledStories.length + index) * 0.05 }}
              className="w-80 flex-shrink-0 snap-start"
            >
              <Link href={`/profile#${story.field}`} className="block h-full">
                <div className="group flex h-full min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-brand-accent">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors group-hover:bg-yellow-100 group-hover:text-yellow-600">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="mb-2 rounded bg-gray-200 px-2 py-1 text-xs text-gray-500 transition-colors group-hover:bg-yellow-100 group-hover:text-yellow-600">
                    {getCategoryName(story.category)}
                  </div>
                  <h3 className="mb-2 font-medium text-gray-500 transition-colors group-hover:text-gray-700">
                    {story.title}
                  </h3>
                  <p className="text-sm text-gray-400">點擊新增故事</p>
                </div>
              </Link>
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
  )
}
