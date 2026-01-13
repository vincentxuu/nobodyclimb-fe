'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Brain,
  Users,
  Lightbulb,
  Compass,
  Heart,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Save,
  Loader2,
  BookOpen,
  Star,
  Mountain,
  TreePine,
  Trophy,
  CloudRain,
  Shield,
  RefreshCw,
  Waves,
  Scale,
  Gift,
  UserCheck,
  Smile,
  MapPin,
  MessageSquare,
  Building,
  HeartPulse,
  Route,
  Dumbbell,
  Target,
  Wrench,
  Backpack,
  Cloud,
  Plane,
  CheckCircle,
  Flag,
  Layers,
  Video,
  Palette,
  Sparkles,
  MessageCircle,
} from 'lucide-react'
import {
  StoryCategory,
  StoryQuestion,
  STORY_CATEGORIES,
  ADVANCED_STORY_QUESTIONS,
  getQuestionsByCategory,
  calculateStoryProgress,
} from '@/lib/constants/biography-stories'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

/**
 * 圖標映射
 */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp, Brain, Users, Lightbulb, Compass, Heart, Star, Mountain,
  TreePine, Trophy, CloudRain, Shield, RefreshCw, Waves, Scale, Gift,
  UserCheck, Smile, MapPin, MessageSquare, Building, HeartPulse, Route,
  Dumbbell, Target, Wrench, Backpack, Cloud, Plane, CheckCircle, Flag,
  Layers, Video, Palette, Sparkles, MessageCircle, BookOpen,
}

const CATEGORY_ICONS: Record<StoryCategory, React.ComponentType<{ className?: string }>> = {
  growth: TrendingUp,
  psychology: Brain,
  community: Users,
  practical: Lightbulb,
  dreams: Compass,
  life: Heart,
}

function getIcon(iconName?: string): React.ComponentType<{ className?: string }> {
  if (!iconName) return BookOpen
  return ICON_MAP[iconName] || BookOpen
}

interface AdvancedStoryEditorProps {
  biography: Record<string, unknown>
  onSave: (field: string, value: string) => Promise<void>
  onSaveAll?: (data: Record<string, string>) => Promise<void>
  onClose?: () => void
  initialCategory?: StoryCategory
  className?: string
}

/**
 * 進階故事編輯器
 * 用於編輯人物誌的 30 個進階故事問題
 */
export function AdvancedStoryEditor({
  biography,
  onSave,
  onSaveAll,
  onClose,
  initialCategory = 'growth',
  className,
}: AdvancedStoryEditorProps) {
  const [activeCategory, setActiveCategory] = useState<StoryCategory>(initialCategory)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({})

  const questions = getQuestionsByCategory(activeCategory)
  const progress = calculateStoryProgress(biography)
  const categoryInfo = STORY_CATEGORIES.find((c) => c.id === activeCategory)

  // 開始編輯
  const handleStartEdit = useCallback((question: StoryQuestion) => {
    const currentValue = (biography[question.field] as string) || ''
    setEditingField(question.field)
    setEditValue(pendingChanges[question.field] ?? currentValue)
  }, [biography, pendingChanges])

  // 取消編輯
  const handleCancelEdit = useCallback(() => {
    setEditingField(null)
    setEditValue('')
  }, [])

  // 儲存單一欄位
  const handleSaveSingle = useCallback(async () => {
    if (!editingField) return

    setIsSaving(true)
    try {
      await onSave(editingField, editValue)
      setPendingChanges((prev) => {
        const next = { ...prev }
        delete next[editingField]
        return next
      })
      setEditingField(null)
      setEditValue('')
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }, [editingField, editValue, onSave])

  // 暫存變更（不立即儲存）
  const handleStageChange = useCallback(() => {
    if (!editingField) return
    setPendingChanges((prev) => ({
      ...prev,
      [editingField]: editValue,
    }))
    setEditingField(null)
    setEditValue('')
  }, [editingField, editValue])

  // 儲存所有變更
  const handleSaveAll = useCallback(async () => {
    if (!onSaveAll || Object.keys(pendingChanges).length === 0) return

    setIsSaving(true)
    try {
      await onSaveAll(pendingChanges)
      setPendingChanges({})
    } catch (error) {
      console.error('Failed to save all:', error)
    } finally {
      setIsSaving(false)
    }
  }, [onSaveAll, pendingChanges])

  // 取得顯示值
  const getDisplayValue = useCallback(
    (field: string): string => {
      return pendingChanges[field] ?? (biography[field] as string) ?? ''
    },
    [biography, pendingChanges]
  )

  // 檢查是否有內容
  const hasContent = useCallback(
    (field: string): boolean => {
      const value = getDisplayValue(field)
      return value.trim().length > 0
    },
    [getDisplayValue]
  )

  return (
    <div className={cn('flex h-full flex-col bg-white', className)}>
      {/* 標題列 */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">編輯進階故事</h2>
          <p className="text-sm text-gray-500">
            已填寫 {progress.completed}/{progress.total} 個故事
          </p>
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(pendingChanges).length > 0 && onSaveAll && (
            <Button onClick={handleSaveAll} disabled={isSaving} size="sm">
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              儲存全部 ({Object.keys(pendingChanges).length})
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* 分類導航 */}
      <div className="border-b border-gray-100 px-6 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STORY_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id]
            const categoryProgress = progress.byCategory[category.id]
            const isActive = activeCategory === category.id
            const isComplete = categoryProgress.completed === categoryProgress.total

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  'flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {isComplete ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <Icon className={cn('h-4 w-4', isActive ? 'text-white' : category.color)} />
                )}
                <span>{category.name}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs',
                    isActive ? 'bg-white/20' : 'bg-gray-200'
                  )}
                >
                  {categoryProgress.completed}/{categoryProgress.total}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 分類說明 */}
      {categoryInfo && (
        <div className="border-b border-gray-50 bg-gray-50/50 px-6 py-3">
          <p className="text-sm text-gray-600">{categoryInfo.description}</p>
        </div>
      )}

      {/* 問題列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-4">
          {questions.map((question) => {
            const Icon = getIcon(question.icon)
            const isEditing = editingField === question.field
            const content = getDisplayValue(question.field)
            const hasPendingChange = question.field in pendingChanges
            const filled = hasContent(question.field)

            return (
              <motion.div
                key={question.field}
                className={cn(
                  'rounded-lg border p-4 transition-colors',
                  isEditing
                    ? 'border-gray-300 bg-gray-50'
                    : hasPendingChange
                      ? 'border-yellow-200 bg-yellow-50'
                      : filled
                        ? 'border-green-100 bg-green-50/30'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                )}
                layout
              >
                {/* 問題標題 */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                        filled ? 'bg-green-100' : 'bg-gray-100'
                      )}
                    >
                      {filled ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Icon className={cn('h-4 w-4', categoryInfo?.color || 'text-gray-500')} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{question.title}</h4>
                      <p className="text-sm text-gray-500">{question.subtitle}</p>
                    </div>
                  </div>
                  {hasPendingChange && !isEditing && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                      待儲存
                    </span>
                  )}
                </div>

                {/* 編輯區域 */}
                <AnimatePresence mode="wait">
                  {isEditing ? (
                    <motion.div
                      key="editing"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder={question.placeholder}
                        className="mb-3 min-h-[120px] resize-none"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                          取消
                        </Button>
                        {onSaveAll && (
                          <Button variant="outline" size="sm" onClick={handleStageChange}>
                            暫存
                          </Button>
                        )}
                        <Button size="sm" onClick={handleSaveSingle} disabled={isSaving}>
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          儲存
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="display"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {content ? (
                        <div
                          className="cursor-pointer rounded-lg bg-white p-3 text-gray-700 transition-colors hover:bg-gray-50"
                          onClick={() => handleStartEdit(question)}
                        >
                          <p className="line-clamp-3 whitespace-pre-wrap text-sm">{content}</p>
                          <p className="mt-2 text-xs text-gray-400">點擊編輯</p>
                        </div>
                      ) : (
                        <button
                          className="w-full rounded-lg border-2 border-dashed border-gray-200 p-4 text-center text-sm text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50"
                          onClick={() => handleStartEdit(question)}
                        >
                          點擊填寫你的故事
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface SingleStoryEditorProps {
  question: StoryQuestion
  value: string
  onChange: (value: string) => void
  onSave: () => Promise<void>
  onCancel: () => void
  isSaving?: boolean
  className?: string
}

/**
 * 單一故事編輯器
 * 用於彈窗或獨立頁面編輯單一故事
 */
export function SingleStoryEditor({
  question,
  value,
  onChange,
  onSave,
  onCancel,
  isSaving = false,
  className,
}: SingleStoryEditorProps) {
  const Icon = getIcon(question.icon)
  const categoryInfo = STORY_CATEGORIES.find((c) => c.id === question.category)

  return (
    <div className={cn('rounded-xl bg-white p-6 shadow-lg', className)}>
      {/* 分類標籤 */}
      {categoryInfo && (
        <span
          className={cn(
            'mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium',
            categoryInfo.color,
            'bg-gray-50'
          )}
        >
          {categoryInfo.name}
        </span>
      )}

      {/* 問題標題 */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
          <Icon className={cn('h-5 w-5', categoryInfo?.color || 'text-gray-500')} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{question.title}</h3>
          <p className="text-sm text-gray-500">{question.subtitle}</p>
        </div>
      </div>

      {/* 編輯區 */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        className="mb-4 min-h-[200px] resize-none"
        autoFocus
      />

      {/* 字數統計 */}
      <div className="mb-4 text-right text-xs text-gray-400">{value.length} 字</div>

      {/* 操作按鈕 */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>
          取消
        </Button>
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          儲存
        </Button>
      </div>
    </div>
  )
}

export default AdvancedStoryEditor
