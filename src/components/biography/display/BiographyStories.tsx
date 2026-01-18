'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { BookOpen } from 'lucide-react'
import type { BiographyV2 } from '@/lib/types/biography-v2'
import {
  getStoryQuestionById,
  getStoryCategoryById,
  SYSTEM_STORY_CATEGORIES,
} from '@/lib/constants/biography-questions'
import {
  ALL_STORY_QUESTIONS as LEGACY_STORY_QUESTIONS,
  STORY_CATEGORIES as LEGACY_STORY_CATEGORIES,
  type StoryCategory as LegacyStoryCategory,
} from '@/lib/constants/biography-stories'

interface BiographyStoriesProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 自訂樣式 */
  className?: string
}

interface StoryItem {
  id: string
  title: string
  content: string
  categoryId: string
  categoryName: string
}

// 分類顏色映射 - 使用品牌色系（新版 ID）
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  [SYSTEM_STORY_CATEGORIES.GROWTH]: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  [SYSTEM_STORY_CATEGORIES.PSYCHOLOGY]: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  [SYSTEM_STORY_CATEGORIES.COMMUNITY]: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  [SYSTEM_STORY_CATEGORIES.PRACTICAL]: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  [SYSTEM_STORY_CATEGORIES.DREAMS]: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  [SYSTEM_STORY_CATEGORIES.LIFE]: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  // 舊版分類 ID
  growth: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  psychology: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  community: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  practical: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  dreams: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  life: { bg: 'bg-brand-light', text: 'text-brand-dark' },
}

/**
 * 根據舊版欄位名稱查找問題定義
 */
function getLegacyQuestionByField(field: string) {
  return LEGACY_STORY_QUESTIONS.find((q) => q.field === field)
}

/**
 * 根據舊版分類 ID 取得分類名稱
 */
function getLegacyCategoryName(categoryId: LegacyStoryCategory) {
  return LEGACY_STORY_CATEGORIES.find((c) => c.id === categoryId)?.name || '故事'
}

/**
 * 故事列表展示組件
 *
 * 顯示用戶填寫的所有故事，使用橫向滾動卡片
 */
export function BiographyStories({
  biography,
  className,
}: BiographyStoriesProps) {
  // 將回答整理為展示列表
  const stories = useMemo(() => {
    if (!biography.stories || biography.stories.length === 0) return []

    const items: StoryItem[] = []

    for (const story of biography.stories) {
      if (!story.content) continue

      // 優先使用舊版定義（因為舊版欄位名和舊版問題定義是對應的）
      const legacyQuestion = getLegacyQuestionByField(story.question_id)
      if (legacyQuestion) {
        items.push({
          id: story.question_id,
          title: legacyQuestion.title,
          content: story.content,
          categoryId: legacyQuestion.category,
          categoryName: getLegacyCategoryName(legacyQuestion.category),
        })
        continue
      }

      // 如果舊版定義找不到，嘗試用新版 API 查找（用於 V2 格式的新資料）
      const systemQuestion = getStoryQuestionById(story.question_id)
      if (systemQuestion) {
        const category = getStoryCategoryById(systemQuestion.category_id)
        items.push({
          id: story.question_id,
          title: systemQuestion.title,
          content: story.content,
          categoryId: systemQuestion.category_id,
          categoryName: category?.name || '故事',
        })
        continue
      }

      // 如果都找不到，使用預設值
      items.push({
        id: story.question_id,
        title: story.question_id, // 使用欄位名稱作為標題
        content: story.content,
        categoryId: 'growth',
        categoryName: '故事',
      })
    }

    return items
  }, [biography.stories])

  if (stories.length === 0) {
    return null
  }

  return (
    <section className={cn('py-8', className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-[#3F3D3D]" />
          <h2 className="text-xl font-bold text-[#1B1A1A]">小故事</h2>
        </div>
        <span className="text-sm text-[#6D6C6C]">
          已分享 {stories.length} 則故事
        </span>
      </div>

      {/* 故事橫向滾動 */}
      <div className="flex gap-6 overflow-x-auto pb-4 snap-x -mx-4 px-4">
        {stories.map((story, index) => {
          const colors = CATEGORY_COLORS[story.categoryId] || { bg: 'bg-gray-100', text: 'text-gray-700' }

          return (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.05 }}
              className="w-80 flex-shrink-0 snap-start rounded-xl bg-white p-6 shadow-sm border border-[#EBEAEA]"
            >
              {/* 分類標籤 */}
              <div className={cn(
                'mb-3 inline-block rounded px-2 py-1 text-xs font-medium',
                colors.bg,
                colors.text
              )}>
                {story.categoryName}
              </div>

              {/* 標題 */}
              <h3 className="mb-3 font-semibold text-[#1B1A1A]">
                {story.title}
              </h3>

              {/* 完整內容 */}
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#6D6C6C]">
                {story.content}
              </p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

export default BiographyStories
