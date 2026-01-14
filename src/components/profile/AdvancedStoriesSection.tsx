'use client'

import React, { useState } from 'react'
import { ChevronRight, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AdvancedStoryEditor } from '@/components/biography/advanced-story-editor'
import { calculateStoryProgress, STORY_CATEGORIES } from '@/lib/constants/biography-stories'
import { CATEGORY_ICONS } from '@/lib/utils/biography-ui'

interface AdvancedStoriesSectionProps {
  biography: Record<string, unknown>
  isEditing: boolean
  isMobile: boolean
  onSave: (field: string, value: string) => Promise<void>
  onSaveAll?: (changes: Record<string, string>) => Promise<void>
}

export default function AdvancedStoriesSection({
  biography,
  isEditing,
  isMobile,
  onSave,
  onSaveAll,
}: AdvancedStoriesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const progress = calculateStoryProgress(biography)

  return (
    <div className="space-y-4">
      {/* Progress Info */}
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {progress.completed}/{progress.total}
        </span>
        {isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-600"
          >
            {isExpanded ? '收起' : '展開編輯'}
            <ChevronRight
              className={`ml-1 h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </Button>
        )}
      </div>

      {/* Progress Overview */}
      {!isExpanded && (
        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">完成進度</span>
            <span className="text-sm font-medium text-gray-900">{progress.percentage}%</span>
          </div>
          {/* Progress Bar */}
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-200">
            <motion.div
              className="h-full rounded-full bg-brand-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {/* Category Summary */}
          <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {STORY_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.id]
              const categoryProgress = progress.byCategory[category.id]
              const isComplete = categoryProgress.completed === categoryProgress.total

              return (
                <div
                  key={category.id}
                  className="flex items-center gap-2 rounded-md bg-white px-3 py-2"
                >
                  {isComplete ? (
                    <Check className="h-4 w-4 text-brand-accent" />
                  ) : (
                    <Icon className={`h-4 w-4 ${category.color}`} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-700">{category.name}</p>
                    <p className="text-xs text-gray-500">
                      {categoryProgress.completed}/{categoryProgress.total}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          {isEditing && (
            <p className="mt-3 text-center text-xs text-gray-500">
              點擊「展開編輯」開始填寫你的攀岩故事
            </p>
          )}
        </div>
      )}

      {/* Expanded Editor */}
      <AnimatePresence>
        {isExpanded && isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-gray-200">
              <AdvancedStoryEditor
                biography={biography}
                onSave={onSave}
                onSaveAll={onSaveAll}
                onClose={() => setIsExpanded(false)}
                className="max-h-[600px]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
