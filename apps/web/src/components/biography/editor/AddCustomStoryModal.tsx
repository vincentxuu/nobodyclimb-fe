'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { X, Loader2, BookOpen } from 'lucide-react'
import type { StoryQuestion, StoryCategoryDefinition, ContentSource } from '@/lib/types/biography-v2'
import { useQuestions } from '@/lib/hooks/useQuestions'

interface AddCustomStoryModalProps {
  /** 是否開啟 */
  isOpen: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 可選擇的分類列表（如未提供則從 API 取得） */
  categories?: StoryCategoryDefinition[]
  /** 預設選擇的分類 ID */
  defaultCategoryId?: string
  /** 儲存回調 */
  onSave: (_question: StoryQuestion) => void
  /** 是否正在儲存 */
  isSaving?: boolean
  /** 自訂樣式 */
  className?: string
}

/**
 * 新增自訂故事問題 Modal
 *
 * 用於用戶新增自訂故事問題
 */
export function AddCustomStoryModal({
  isOpen,
  onClose,
  categories: categoriesProp,
  defaultCategoryId,
  onSave,
  isSaving = false,
  className,
}: AddCustomStoryModalProps) {
  const { data: questionsData } = useQuestions()

  // 從 API 取得分類（如 prop 未提供）
  const categories = useMemo(() => {
    if (categoriesProp) return categoriesProp
    if (!questionsData) return []
    return questionsData.categories.map((c) => ({
      id: c.id,
      source: 'system' as const,
      name: c.name,
      icon: c.icon || 'BookOpen',
      description: c.description || '',
      order: c.display_order,
    }))
  }, [categoriesProp, questionsData])

  const t = useTranslations('BiographyEditor')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const [categoryId, setCategoryId] = useState(defaultCategoryId || '')

  // 重置表單狀態
  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setSubtitle('')
      setPlaceholder('')
      setCategoryId(defaultCategoryId || categories[0]?.id || '')
    }
  }, [isOpen, defaultCategoryId, categories])

  const handleSave = () => {
    if (!title.trim() || !categoryId) return

    const newQuestion: StoryQuestion = {
      id: `usr_story_${Date.now()}`,
      source: 'user' as ContentSource,
      category_id: categoryId,
      title: title.trim().endsWith('？') ? title.trim() : `${title.trim()}？`,
      subtitle: subtitle.trim(),
      placeholder: placeholder.trim() || t('storyTextPlaceholder'),
      difficulty: 'easy',
      order: 999,
    }

    onSave(newQuestion)
  }

  if (!isOpen) return null

  const canSave = title.trim().length > 0 && categoryId
  const selectedCategory = categories.find((c) => c.id === categoryId)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-dark/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-white w-full md:max-w-md md:rounded-lg rounded-t-2xl max-h-[90vh] flex flex-col',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#EBEAEA]">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-[#3F3D3D]" />
            <h3 className="font-semibold text-[#1B1A1A]">{t('addCustomStoryTitle')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#6D6C6C] hover:text-[#1B1A1A] hover:bg-[#F5F5F5] rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 問題標題 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1B1A1A]">
              {t('storyTitleLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('storyTitlePlaceholder')}
              className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors text-[#1B1A1A] placeholder:text-[#9D9D9D]"
              maxLength={50}
            />
            <p className="text-xs text-[#8E8C8C]">
              {t('storyTitleHint')}
            </p>
          </div>

          {/* 問題說明 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1B1A1A]">
              {t('storySubtitleLabel')} <span className="text-[#8E8C8C]">{t('storySubtitleOptional')}</span>
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder={t('storySubtitlePlaceholder')}
              className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors text-[#1B1A1A] placeholder:text-[#9D9D9D]"
              maxLength={50}
            />
            <p className="text-xs text-[#8E8C8C]">
              {t('storySubtitleHint')}
            </p>
          </div>

          {/* 所屬分類 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1B1A1A]">
              {t('storyCategoryLabel')} <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 border border-[#B6B3B3] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {selectedCategory && (
              <p className="text-xs text-[#8E8C8C]">
                {selectedCategory.description}
              </p>
            )}
          </div>

          {/* 範例答案 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1B1A1A]">
              {t('storyPlaceholderLabel')} <span className="text-[#8E8C8C]">{t('storyPlaceholderOptional')}</span>
            </label>
            <input
              type="text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder={t('storyPlaceholderPlaceholder')}
              className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors text-[#1B1A1A] placeholder:text-[#9D9D9D]"
              maxLength={50}
            />
          </div>

          {/* 預覽 */}
          {title.trim() && (
            <div className="bg-[#F5F5F5] rounded-lg p-4 space-y-3">
              <p className="text-sm text-[#6D6C6C]">{t('storyPreviewLabel')}</p>
              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="mb-2">
                  <span className="text-xs text-[#8E8C8C]">
                    {selectedCategory?.name || t('storyUncategorized')}
                  </span>
                </div>
                <p className="font-medium text-[#1B1A1A]">
                  {title.trim().endsWith('？') ? title.trim() : `${title.trim()}？`}
                </p>
                {subtitle.trim() && (
                  <p className="text-sm text-[#8E8C8C]">{subtitle.trim()}</p>
                )}
                <div className="pt-2 border-t border-[#EBEAEA]">
                  <p className="text-sm text-[#B6B3B3] italic">
                    {placeholder.trim() || t('storyTextPlaceholder')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 提示 */}
          <div className="bg-brand-accent/10 rounded-lg p-4">
            <p className="text-sm text-[#3F3D3D]">
              {t('storyTip')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EBEAEA] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-[#B6B3B3] text-[#3F3D3D] rounded-lg font-medium hover:bg-[#F5F5F5] transition-colors"
          >
            {t('cancelButton')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={cn(
              'flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
              canSave
                ? 'bg-brand-dark text-white hover:bg-brand-dark-hover'
                : 'bg-[#EBEAEA] text-[#B6B3B3] cursor-not-allowed'
            )}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t('addingStatus')}
              </>
            ) : (
              t('addStoryButton')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddCustomStoryModal
