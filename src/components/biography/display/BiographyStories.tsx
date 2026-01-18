'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { BiographyV2 } from '@/lib/types/biography-v2'
import {
  SYSTEM_STORY_CATEGORY_LIST,
  SYSTEM_STORY_QUESTION_LIST,
  getStoryQuestionById,
  getStoryCategoryById,
} from '@/lib/constants/biography-questions'
import { StoryCard } from './StoryCard'

interface BiographyStoriesProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 初始顯示的故事數量 */
  initialCount?: number
  /** 自訂樣式 */
  className?: string
}

interface StoryItem {
  id: string
  title: string
  content: string
  emoji: string
  categoryId: string
  isCustom: boolean
}

/**
 * 故事列表展示組件
 *
 * 顯示用戶填寫的所有故事
 */
export function BiographyStories({
  biography,
  initialCount = 4,
  className,
}: BiographyStoriesProps) {
  const [showAll, setShowAll] = useState(false)

  // 將回答整理為展示列表
  const stories = useMemo(() => {
    if (!biography.stories?.answers) return []

    const items: StoryItem[] = []

    for (const answer of biography.stories.answers) {
      if (!answer.content) continue

      // 嘗試找系統問題
      const systemQuestion = getStoryQuestionById(answer.question_id)
      if (systemQuestion) {
        const category = getStoryCategoryById(systemQuestion.category_id)
        items.push({
          id: answer.question_id,
          title: systemQuestion.title,
          content: answer.content,
          emoji: category?.emoji || '📖',
          categoryId: systemQuestion.category_id,
          isCustom: false,
        })
      } else {
        // 找用戶自訂問題
        const customQuestion = biography.stories.custom_questions?.find(
          (q) => q.id === answer.question_id
        )
        if (customQuestion) {
          // 找分類（可能是系統分類或用戶自訂分類）
          let emoji = '📖'
          const systemCategory = getStoryCategoryById(customQuestion.category_id)
          if (systemCategory) {
            emoji = systemCategory.emoji
          } else {
            const customCategory = biography.stories.custom_categories?.find(
              (c) => c.id === customQuestion.category_id
            )
            if (customCategory) {
              emoji = customCategory.emoji
            }
          }

          items.push({
            id: answer.question_id,
            title: customQuestion.title,
            content: answer.content,
            emoji,
            categoryId: customQuestion.category_id,
            isCustom: true,
          })
        }
      }
    }

    return items
  }, [biography.stories])

  if (stories.length === 0) {
    return null
  }

  const visibleStories = showAll ? stories : stories.slice(0, initialCount)
  const hasMore = stories.length > initialCount

  return (
    <section className={cn('py-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📖</span>
          <h2 className="text-lg font-semibold text-gray-900">我的故事</h2>
        </div>
        <span className="text-sm text-gray-500">共 {stories.length} 則故事</span>
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleStories.map((story) => (
          <StoryCard
            key={story.id}
            title={story.title}
            content={story.content}
            emoji={story.emoji}
            isCustom={story.isCustom}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2 rounded-full border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            {showAll ? '收合故事' : `載入更多故事 (${stories.length - initialCount})`}
          </button>
        </div>
      )}
    </section>
  )
}

export default BiographyStories
