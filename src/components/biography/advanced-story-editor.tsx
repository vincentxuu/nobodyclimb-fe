'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, ChevronDown } from 'lucide-react'
import {
  StoryQuestion,
  STORY_CATEGORIES,
  calculateStoryProgress,
  groupStoriesByCategory,
} from '@/lib/constants/biography-stories'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getStoryIcon, CATEGORY_ICONS } from '@/lib/utils/biography-ui'

interface AdvancedStoryEditorProps {
  biography: Record<string, unknown>
  onSave: (_field: string, _value: string) => Promise<void>
  onClose?: () => void
  className?: string
}

/**
 * 標題列組件
 */
function StoryListHeader({
  progress,
  onClose,
}: {
  progress: ReturnType<typeof calculateStoryProgress>
  onClose?: () => void
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
      <div>
        <h2 className="text-lg font-semibold text-brand-dark">小故事</h2>
        <p className="text-sm text-text-subtle">
          已填寫 {progress.completed}/{progress.total} 個故事 · {progress.percentage}%
        </p>
      </div>
      {onClose && (
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}

/**
 * 已填寫故事卡片
 */
function FilledStoryCard({
  question,
  content,
  isEditing,
  editValue,
  isSaving,
  onStartEdit,
  onSave,
  onCancel,
  onEditValueChange,
}: {
  question: StoryQuestion
  content: string
  isEditing: boolean
  editValue: string
  isSaving: boolean
  onStartEdit: () => void
  onSave: () => Promise<void>
  onCancel: () => void
  onEditValueChange: (_value: string) => void
}) {
  const Icon = getStoryIcon(question.icon)

  return (
    <motion.div
      layout
      id={`story-${question.field}`}
      className={cn(
        'rounded-lg bg-white p-6 shadow-sm transition-all duration-200',
        isEditing
          ? 'border-2 border-brand-accent shadow-lg'
          : 'border border-gray-200 hover:border-brand-accent/50 hover:shadow-md cursor-pointer'
      )}
      whileHover={!isEditing ? { y: -4 } : undefined}
      onClick={!isEditing ? onStartEdit : undefined}
    >
      {/* 問題標題 */}
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-accent/20">
          <Icon className="h-5 w-5 text-brand-dark" />
        </div>
        <div className="flex-1">
          <h4 className="mb-1 font-semibold text-brand-dark">{question.title}</h4>
          <p className="text-xs text-text-subtle">{question.subtitle}</p>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="pl-13">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Textarea
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                placeholder={question.placeholder}
                className="mb-3 min-h-[120px] resize-none border-brand-light focus:border-brand-accent"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-subtle">{editValue.length} 字</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onSave}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : '儲存'}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="line-clamp-3 whitespace-pre-wrap text-sm text-gray-700">{content}</p>
              <p className="mt-2 text-xs text-text-subtle">點擊編輯</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/**
 * 未填寫故事卡片
 */
function EmptyStoryCard({
  question,
  onStartEdit,
}: {
  question: StoryQuestion
  onStartEdit: () => void
}) {
  const Icon = getStoryIcon(question.icon)

  return (
    <motion.div
      className={cn(
        'cursor-pointer rounded-lg bg-white p-6 transition-all duration-200',
        'border-2 border-dashed border-gray-300',
        'hover:border-brand-accent hover:bg-brand-accent/5'
      )}
      whileHover={{ scale: 1.01 }}
      onClick={onStartEdit}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <h4 className="mb-1 font-medium text-gray-700">{question.title}</h4>
          <p className="text-xs text-text-subtle">{question.subtitle}</p>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-gray-500">點擊開始填寫</p>
    </motion.div>
  )
}

/**
 * 未填寫區域（折疊）
 */
function UnfilledStoriesSection({
  questions,
  isExpanded,
  onToggle,
  onStartEdit,
}: {
  questions: StoryQuestion[]
  isExpanded: boolean
  onToggle: () => void
  onStartEdit: (_question: StoryQuestion) => void
}) {
  if (questions.length === 0) return null

  return (
    <div className="mt-8">
      {/* 折疊按鈕 */}
      <button
        onClick={onToggle}
        className={cn(
          'flex w-full items-center justify-between',
          'rounded-lg border border-gray-200 bg-gray-50 px-4 py-3',
          'transition-colors hover:bg-gray-100'
        )}
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            className={cn(
              'h-5 w-5 text-gray-600 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
          <span className="font-medium text-gray-700">未填寫的故事</span>
          <span className="text-sm text-text-subtle">({questions.length} 題)</span>
        </div>
      </button>

      {/* 展開內容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.4, ease: 'easeInOut' },
              opacity: { duration: 0.3, delay: isExpanded ? 0.1 : 0 },
            }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid grid-cols-1 gap-4">
              {questions.map((question) => (
                <EmptyStoryCard
                  key={question.field}
                  question={question}
                  onStartEdit={() => onStartEdit(question)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * 分類標題組件
 */
function CategoryHeader({
  categoryId,
  count,
}: {
  categoryId: string
  count: number
}) {
  const category = STORY_CATEGORIES.find((c) => c.id === categoryId)
  const Icon = category ? CATEGORY_ICONS[category.id] : null

  if (!category || count === 0) return null

  return (
    <div className="mb-4 flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-brand-dark" />}
      <h3 className="text-base font-semibold text-brand-dark">{category.name}</h3>
      <span className="text-sm text-text-subtle">({count})</span>
    </div>
  )
}

/**
 * 進階故事編輯器 - 精簡列表式
 */
export function AdvancedStoryEditor({
  biography,
  onSave,
  onClose,
  className,
}: AdvancedStoryEditorProps) {
  // 狀態管理
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showUnfilled, setShowUnfilled] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 計算分組和進度
  const { filled, unfilled } = useMemo(
    () => groupStoriesByCategory(biography),
    [biography]
  )
  const progress = calculateStoryProgress(biography)

  // 取得顯示值
  const getDisplayValue = useCallback(
    (field: string): string => {
      return (biography[field] as string) || ''
    },
    [biography]
  )

  // 開始編輯
  const handleStartEdit = useCallback(
    (question: StoryQuestion) => {
      const currentValue = getDisplayValue(question.field)
      setEditingField(question.field)
      setEditValue(currentValue)
      setError(null)

      // 如果是從未填寫區開始編輯，展開該分類
      if (!currentValue && showUnfilled) {
        setShowUnfilled(false)
      }

      // 平滑滾動到卡片位置
      setTimeout(() => {
        const element = document.getElementById(`story-${question.field}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    },
    [getDisplayValue, showUnfilled]
  )

  // 取消編輯
  const handleCancelEdit = useCallback(() => {
    setEditingField(null)
    setEditValue('')
    setError(null)
  }, [])

  // 儲存
  const handleSave = useCallback(async () => {
    if (!editingField) return

    setIsSaving(true)
    setError(null)

    try {
      await onSave(editingField, editValue)
      setEditingField(null)
      setEditValue('')
    } catch (err) {
      console.error('Failed to save:', err)
      setError('儲存失敗，請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }, [editingField, editValue, onSave])

  return (
    <div className={cn('flex flex-col bg-white', className)}>
      {/* 標題列 */}
      <StoryListHeader progress={progress} onClose={onClose} />

      {/* 錯誤提示 */}
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-6 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 主內容區 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* 按分類顯示已填寫的故事 */}
        {STORY_CATEGORIES.map((category) => {
          const questions = filled.get(category.id) || []
          if (questions.length === 0) return null

          return (
            <div key={category.id} className="mb-8 last:mb-0">
              <CategoryHeader categoryId={category.id} count={questions.length} />
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const content = getDisplayValue(question.field)
                  const isEditing = editingField === question.field

                  return (
                    <motion.div
                      key={question.field}
                      custom={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.3,
                        ease: 'easeOut',
                      }}
                    >
                      <FilledStoryCard
                        question={question}
                        content={content}
                        isEditing={isEditing}
                        editValue={editValue}
                        isSaving={isSaving}
                        onStartEdit={() => handleStartEdit(question)}
                        onSave={handleSave}
                        onCancel={handleCancelEdit}
                        onEditValueChange={setEditValue}
                      />
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* 未填寫區域 */}
        <UnfilledStoriesSection
          questions={unfilled}
          isExpanded={showUnfilled}
          onToggle={() => setShowUnfilled(!showUnfilled)}
          onStartEdit={handleStartEdit}
        />
      </div>
    </div>
  )
}

export default AdvancedStoryEditor
