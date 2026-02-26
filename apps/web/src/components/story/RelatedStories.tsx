'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

interface RelatedStory {
  id: string
  type: 'core-stories' | 'one-liners' | 'stories'
  title: string
  preview: string
  category?: string
  categoryEmoji?: string
}

interface RelatedStoriesProps {
  stories: RelatedStory[]
  authorName: string
  authorSlug: string
}

const TYPE_LABELS = {
  'core-stories': '核心故事',
  'one-liners': '一句話',
  'stories': '小故事',
}

export function RelatedStories({ stories, authorName, authorSlug }: RelatedStoriesProps) {
  if (stories.length === 0) {
    return null
  }

  return (
    <div className="mt-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#1B1A1A]">
          來自 {authorName} 的更多故事
        </h2>
        <Link
          href={`/biography/profile/${authorSlug}`}
          className="flex items-center gap-1 text-sm text-[#6D6C6C] hover:text-[#1B1A1A] transition-colors"
        >
          <span>查看全部</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stories.map((story, index) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link href={`/story/${story.type}/${story.id}`}>
              <div className="group h-full rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                {/* 類型標籤 */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-medium text-[#8E8C8C]">
                    {TYPE_LABELS[story.type]}
                  </span>
                  {story.category && (
                    <>
                      <span className="text-[#DCDADA]">•</span>
                      <span className="text-xs text-[#8E8C8C]">
                        {story.categoryEmoji && `${story.categoryEmoji} `}
                        {story.category}
                      </span>
                    </>
                  )}
                </div>

                {/* 標題 */}
                {story.title && (
                  <h3 className="mb-2 text-base font-semibold text-[#1B1A1A] line-clamp-1 group-hover:text-emerald-700 transition-colors">
                    {story.title}
                  </h3>
                )}

                {/* 預覽內容 */}
                <p className="text-sm leading-relaxed text-[#6D6C6C] line-clamp-3">
                  {story.preview}
                </p>

                {/* 查看更多指示 */}
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>閱讀全文</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
