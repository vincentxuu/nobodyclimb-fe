'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { STORY_CATEGORIES, StoryCategory } from '@/lib/constants/biography-stories'
import { cn } from '@/lib/utils'

interface StoryModalProps {
  story: {
    title: string
    content: string
    category: StoryCategory
  } | null
  open: boolean
  onClose: () => void
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
 * 故事詳情 Modal
 */
export function StoryModal({ story, open, onClose }: StoryModalProps) {
  const getCategoryName = (categoryId: StoryCategory) => {
    return STORY_CATEGORIES.find(c => c.id === categoryId)?.name || ''
  }

  return (
    <AnimatePresence>
      {open && story && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal 內容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 z-50 mx-auto my-auto max-h-[80vh] max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:p-8"
          >
            {/* 關閉按鈕 */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* 分類標籤 */}
            <div className={cn(
              'mb-4 inline-block rounded px-3 py-1 text-sm',
              CATEGORY_COLORS[story.category].bg,
              CATEGORY_COLORS[story.category].text
            )}>
              {getCategoryName(story.category)}
            </div>

            {/* 標題 */}
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              {story.title}
            </h2>

            {/* 內容 */}
            <div className="prose prose-gray max-w-none">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-700">
                {story.content}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
