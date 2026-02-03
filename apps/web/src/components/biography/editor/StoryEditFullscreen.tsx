'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { X, Check, Lightbulb, Loader2, Trash2 } from 'lucide-react'
import type { StoryQuestion, Story } from '@/lib/types/biography-v2'

interface StoryEditFullscreenProps {
  /** 是否開啟 */
  isOpen: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 問題資料 */
  question: StoryQuestion | null
  /** 已存在的故事資料 */
  story?: Story | null
  /** 儲存回調 */
  onSave: (_content: string) => void
  /** 刪除回調 */
  onDelete?: () => void
  /** 是否正在儲存 */
  isSaving?: boolean
  /** 自訂樣式 */
  className?: string
}

/**
 * 全螢幕故事編輯器
 *
 * 手機版專用的全螢幕故事編輯介面
 */
export function StoryEditFullscreen({
  isOpen,
  onClose,
  question,
  story,
  onSave,
  onDelete,
  isSaving = false,
  className,
}: StoryEditFullscreenProps) {
  const [content, setContent] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 初始化內容
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      if (story?.content) {
        setContent(story.content)
      } else {
        setContent('')
      }
      setShowDeleteConfirm(false)
      // 延遲聚焦，等待動畫完成
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 300)
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
      setShowDeleteConfirm(false)
    }
  }

  const handleClose = () => {
    // 如果有未儲存的變更，可以顯示確認對話框
    // 目前直接關閉
    onClose()
  }

  if (!isOpen && !isAnimating) return null

  const hasContent = !!story?.content?.trim()
  const hasChanges = content !== (story?.content || '')
  const canSave = content.trim().length > 0 && hasChanges

  // 寫作提示
  const writingTips = [
    '不用追求完美，想到什麼就寫什麼',
    '可以先寫幾句，之後再慢慢補充',
    '真實的故事最動人',
    '你的經驗對其他人可能很有幫助',
  ]
  const randomTip = writingTips[Math.floor(Math.random() * writingTips.length)]

  return (
    <div
      className={cn(
        'fixed inset-0 z-[1000] bg-white flex flex-col transition-transform duration-300 ease-out',
        isOpen ? 'translate-y-0' : 'translate-y-full',
        className
      )}
      onTransitionEnd={() => {
        if (!isOpen) setIsAnimating(false)
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#EBEAEA] bg-white safe-area-inset-top">
        <button
          type="button"
          onClick={handleClose}
          className="flex items-center gap-1 text-[#6D6C6C] hover:text-[#1B1A1A] transition-colors"
        >
          <X size={20} />
          <span className="text-sm">取消</span>
        </button>

        <h3 className="font-medium text-[#1B1A1A] text-sm">編輯故事</h3>

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || isSaving}
          className={cn(
            'flex items-center gap-1 transition-colors',
            canSave
              ? 'text-brand-dark font-medium'
              : 'text-[#B6B3B3] cursor-not-allowed'
          )}
        >
          {isSaving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Check size={18} />
          )}
          <span className="text-sm">{isSaving ? '儲存中' : '儲存'}</span>
        </button>
      </div>

      {/* Question Header */}
      {question && (
        <div className="px-4 py-4 bg-[#F5F5F5] border-b border-[#EBEAEA]">
          <p className="font-medium text-[#1B1A1A]">{question.title}</p>
          {question.subtitle && (
            <p className="text-sm text-[#6D6C6C] mt-1 flex items-start gap-1">
              <Lightbulb size={14} className="mt-0.5 flex-shrink-0" />
              {question.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Text Area */}
        <div className="flex-1 p-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={question?.placeholder || '寫下你的故事...'}
            className="w-full h-full resize-none focus:outline-none bg-white text-[#1B1A1A] placeholder:text-[#B6B3B3] text-base leading-relaxed"
            maxLength={5000}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#EBEAEA] space-y-3 safe-area-inset-bottom">
          {/* Character Count & Delete */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8E8C8C]">
              {content.length}/5000
            </span>
            {hasContent && onDelete && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6D6C6C]">確定刪除？</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="text-xs text-red-500 font-medium"
                    >
                      確定
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-xs text-[#6D6C6C]"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1 text-xs text-[#6D6C6C] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                    刪除
                  </button>
                )}
              </>
            )}
          </div>

          {/* Writing Tip */}
          <div className="bg-brand-accent/10 rounded-lg p-3">
            <p className="text-xs text-[#3F3D3D] flex items-center gap-1.5">
              <Lightbulb size={14} className="flex-shrink-0" />
              <span className="font-medium">寫作小提示：</span>
              {randomTip}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoryEditFullscreen
