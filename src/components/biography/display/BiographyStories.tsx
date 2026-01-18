'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import type { BiographyV2 } from '@/lib/types/biography-v2'
import {
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
    if (!biography.stories || biography.stories.length === 0) return []

    const items: StoryItem[] = []

    for (const story of biography.stories) {
      if (!story.content) continue

      // 嘗試找系統問題
      const systemQuestion = getStoryQuestionById(story.question_id)
      if (systemQuestion) {
        const category = getStoryCategoryById(systemQuestion.category_id)
        items.push({
          id: story.question_id,
          title: systemQuestion.title,
          content: story.content,
          emoji: category?.emoji || '📖',
          categoryId: systemQuestion.category_id,
          isCustom: story.source === 'user',
        })
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
          <BookOpen size={18} className="text-[#3F3D3D]" />
          <h2 className="text-lg font-semibold text-[#1B1A1A]">我的故事</h2>
        </div>
        <span className="text-sm text-[#6D6C6C]">共 {stories.length} 則故事</span>
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
            className="inline-flex items-center gap-1 px-6 py-2 rounded-full border border-[#B6B3B3] text-[#6D6C6C] font-medium hover:bg-[#F5F5F5] transition-colors"
          >
            {showAll ? (
              <>
                收合故事
                <ChevronUp size={16} />
              </>
            ) : (
              <>
                載入更多故事 (+{stories.length - initialCount})
                <ChevronDown size={16} />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  )
}

export default BiographyStories
