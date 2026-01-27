'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Biography } from '@/lib/types'
import { biographyContentService, type Story } from '@/lib/api/services'
import { cn } from '@/lib/utils'
import { ContentInteractionBar } from '../display/ContentInteractionBar'

interface FeaturedStoriesSectionProps {
  person: Biography
}

// 分類顏色映射
const STORY_CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  sys_cat_growth: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  sys_cat_psychology: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  sys_cat_community: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  sys_cat_practical: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  sys_cat_dreams: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  sys_cat_life: { bg: 'bg-brand-light', text: 'text-brand-dark' },
}

/**
 * 精選故事區塊
 * 從 biography_stories 表取得資料，挑選 3-5 個最精彩的故事展示
 */
export function FeaturedStoriesSection({ person }: FeaturedStoriesSectionProps) {
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 從 API 獲取小故事
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await biographyContentService.getStories(person.id)
        if (response.success && response.data) {
          setStories(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch stories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStories()
  }, [person.id])

  // 按讚切換
  const handleToggleLike = useCallback(async (storyId: string) => {
    const response = await biographyContentService.toggleStoryLike(storyId)
    if (response.success && response.data) {
      setStories((prev) =>
        prev.map((item) =>
          item.id === storyId
            ? { ...item, is_liked: response.data!.liked, like_count: response.data!.like_count }
            : item
        )
      )
      return response.data
    }
    throw new Error('Failed to toggle like')
  }, [])

  // 獲取留言
  const handleFetchComments = useCallback(async (storyId: string) => {
    const response = await biographyContentService.getStoryComments(storyId)
    if (response.success && response.data) {
      return response.data
    }
    return []
  }, [])

  // 新增留言
  const handleAddComment = useCallback(async (storyId: string, content: string) => {
    const response = await biographyContentService.addStoryComment(storyId, { content })
    if (response.success && response.data) {
      setStories((prev) =>
        prev.map((item) =>
          item.id === storyId
            ? { ...item, comment_count: item.comment_count + 1 }
            : item
        )
      )
      return response.data
    }
    throw new Error('Failed to add comment')
  }, [])

  // 智能選擇精選故事：優先選擇不同類別
  const featuredStories = useMemo(() => {
    if (stories.length === 0) return []

    // 按類別分組
    const storiesByCategory = stories.reduce((acc, story) => {
      const categoryId = story.category_id || 'uncategorized'
      if (!acc[categoryId]) {
        acc[categoryId] = []
      }
      acc[categoryId].push(story)
      return acc
    }, {} as Record<string, Story[]>)

    const selected: Story[] = []
    const categories = Object.keys(storiesByCategory)
    let categoryIndex = 0

    // 輪流從每個類別選一個故事，直到選滿 5 個
    while (selected.length < 5 && selected.length < stories.length) {
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
  }, [stories])

  if (isLoading) {
    return (
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </div>
      </section>
    )
  }

  if (featuredStories.length === 0) return null

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
              key={story.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="w-80 flex-shrink-0 snap-center rounded-lg bg-white p-6 shadow-sm flex flex-col"
            >
              {/* 分類標籤 */}
              {story.category_name && (
                <div className={cn(
                  'mb-3 inline-block rounded px-2 py-1 text-xs self-start',
                  STORY_CATEGORY_COLORS[story.category_id || 'sys_cat_growth']?.bg || 'bg-brand-accent/20',
                  STORY_CATEGORY_COLORS[story.category_id || 'sys_cat_growth']?.text || 'text-brand-dark'
                )}>
                  {story.category_name}
                </div>
              )}

              {/* 標題 */}
              <h3 className="mb-3 font-semibold text-gray-900">
                {story.title}
              </h3>

              {/* 完整內容 */}
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 flex-1">
                {story.content}
              </p>

              {/* 互動按鈕 */}
              <ContentInteractionBar
                contentType="stories"
                contentId={story.id}
                isLiked={story.is_liked || false}
                likeCount={story.like_count}
                commentCount={story.comment_count}
                onToggleLike={() => handleToggleLike(story.id)}
                onFetchComments={() => handleFetchComments(story.id)}
                onAddComment={(content) => handleAddComment(story.id, content)}
                className="mt-4 pt-3 border-t border-gray-100"
                showBorder={false}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
