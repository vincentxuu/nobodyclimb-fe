'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Loader2 } from 'lucide-react'
import { Biography } from '@/lib/types'
import { biographyContentService, type Story } from '@/lib/api/services'
import { cn } from '@/lib/utils'

interface CompleteStoriesSectionProps {
  person: Biography
  isOwner: boolean
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
 * 小故事（完整版）
 * 從 biography_stories 表取得資料，顯示所有已填寫的進階故事
 */
export function CompleteStoriesSection({ person, isOwner }: CompleteStoriesSectionProps) {
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

  if (isLoading) {
    return (
      <section id="complete-stories" className="bg-gray-50 py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </div>
      </section>
    )
  }

  if (stories.length === 0 && !isOwner) return null

  return (
    <section id="complete-stories" className="bg-gray-50 py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          小故事
        </h2>
        <p className="mb-10 text-gray-600">
          {stories.length > 0
            ? `已分享 ${stories.length} 則故事`
            : '還沒有分享故事'}
        </p>

        {/* 故事橫向滾動 */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
          {/* 已填寫的故事 */}
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.05 }}
              className="w-80 flex-shrink-0 snap-start rounded-lg bg-white p-6 shadow-sm"
            >
              {/* 分類標籤 */}
              {story.category_name && (
                <div className={cn(
                  'mb-3 inline-block rounded px-2 py-1 text-xs',
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
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {story.content}
              </p>
            </motion.div>
          ))}

          {/* 新增更多故事（只給擁有者看） */}
          {isOwner && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: stories.length * 0.05 }}
              className="w-80 flex-shrink-0 snap-start"
            >
              <Link href="/profile#stories" className="block h-full">
                <div className="group flex h-full min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-brand-accent">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors group-hover:bg-yellow-100 group-hover:text-yellow-600">
                    <Plus className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-medium text-gray-500 transition-colors group-hover:text-gray-700">
                    新增更多故事
                  </h3>
                  <p className="text-sm text-gray-400">分享你的攀岩經歷</p>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
