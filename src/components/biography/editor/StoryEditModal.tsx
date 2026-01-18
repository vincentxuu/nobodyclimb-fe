'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X, Lightbulb, Loader2 } from 'lucide-react'
import type { StoryQuestion, Story } from '@/lib/types/biography-v2'

interface StoryEditModalProps {
  /** 是否開啟 */
  isOpen: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 問題資料 */
  question: StoryQuestion | null
  /** 已存在的故事資料 */
  story?: Story | null
  /** 儲存回調 */
  onSave: (content: string) => void
  /** 刪除回調 */
  onDelete?: () => void
  /** 是否正在儲存 */
  isSaving?: boolean
  /** 自訂樣式 */
  className?: string
}

/**
 * 故事編輯 Modal
 *
 * 用於編輯單個故事的內容
 */
export function StoryEditModal({
  isOpen,
  onClose,
  question,
  story,
  onSave,
  onDelete,
  isSaving = false,
  className,
}: StoryEditModalProps) {
  const [content, setContent] = useState('')

  // 初始化內容
  useEffect(() => {
    if (story?.content) {
      setContent(story.content)
    } else {
      setContent('')
    }
  }, [story, isOpen])

  const handleSave = () => {
    if (content.trim()) {
      onSave(content)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
    }
  }

  if (!isOpen || !question) return null

  const hasContent = !!story?.content?.trim()
  const hasChanges = content !== (story?.content || '')

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#EBEAEA]">
          <h3 className="font-semibold text-[#1B1A1A]">編輯故事</h3>
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
          {/* Question */}
          <div className="bg-[#F5F5F5] rounded-xl p-4">
            <p className="font-medium text-[#1B1A1A]">{question.question}</p>
            {question.prompt && (
              <p className="text-sm text-[#6D6C6C] mt-2 flex items-start gap-1">
                <Lightbulb size={14} className="mt-0.5 flex-shrink-0" />
                {question.prompt}
              </p>
            )}
          </div>

          {/* Text Area */}
          <div className="space-y-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="寫下你的故事..."
              className="w-full h-64 px-4 py-3 border border-[#B6B3B3] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
              maxLength={5000}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#8E8C8C]">
                {content.length}/5000
              </span>
              {hasContent && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs text-[#6D6C6C] hover:text-red-500 transition-colors"
                >
                  刪除這篇故事
                </button>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-brand-accent/10 rounded-xl p-4">
            <p className="text-sm text-[#3F3D3D]">
              <span className="font-medium">寫作小提示：</span>
              不用追求完美，想到什麼就寫什麼。你隨時可以回來修改。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EBEAEA] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-[#B6B3B3] text-[#3F3D3D] rounded-xl font-medium hover:bg-[#F5F5F5] transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!content.trim() || isSaving || !hasChanges}
            className={cn(
              'flex-1 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2',
              content.trim() && hasChanges
                ? 'bg-brand-dark text-white hover:bg-brand-dark-hover'
                : 'bg-[#EBEAEA] text-[#B6B3B3] cursor-not-allowed'
            )}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                儲存中...
              </>
            ) : (
              '儲存'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoryEditModal
