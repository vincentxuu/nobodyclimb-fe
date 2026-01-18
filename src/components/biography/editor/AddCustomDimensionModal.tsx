'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X, Loader2, Layers } from 'lucide-react'
import type { TagDimension, ContentSource } from '@/lib/types/biography-v2'

// 常用 emoji 選項
const EMOJI_OPTIONS = [
  '🎯', '🎨', '🎸', '🎮', '🏆', '🌟', '💡', '🔥',
  '🌈', '🎭', '🎪', '🎬', '📚', '🎤', '🎹', '🎻',
  '🏋️', '🧗', '🚴', '🏃', '⛷️', '🏄', '🧘', '🤸',
  '🍕', '🍜', '🍵', '🍺', '☕', '🥤', '🧋', '🍦',
]

interface AddCustomDimensionModalProps {
  /** 是否開啟 */
  isOpen: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 儲存回調 */
  onSave: (_dimension: TagDimension) => void
  /** 是否正在儲存 */
  isSaving?: boolean
  /** 自訂樣式 */
  className?: string
}

/**
 * 新增自訂標籤維度 Modal
 *
 * 用於用戶新增自訂標籤類別
 */
export function AddCustomDimensionModal({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  className,
}: AddCustomDimensionModalProps) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [description, setDescription] = useState('')
  const [selectionMode, setSelectionMode] = useState<'single' | 'multiple'>('multiple')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // 重置表單狀態
  useEffect(() => {
    if (isOpen) {
      setName('')
      setEmoji('🎯')
      setDescription('')
      setSelectionMode('multiple')
      setShowEmojiPicker(false)
    }
  }, [isOpen])

  const handleSave = () => {
    if (!name.trim()) return

    const newDimension: TagDimension = {
      id: `usr_dim_${Date.now()}`,
      source: 'user' as ContentSource,
      name: name.trim(),
      emoji,
      icon: 'Tag', // 用戶自訂維度使用預設 icon
      description: description.trim(),
      selection_mode: selectionMode,
      options: [],
      order: 999,
      is_active: true,
    }

    onSave(newDimension)
  }

  if (!isOpen) return null

  const canSave = name.trim().length > 0

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
          'relative bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#EBEAEA]">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-[#3F3D3D]" />
            <h3 className="font-semibold text-[#1B1A1A]">新增標籤類別</h3>
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
          {/* Emoji 選擇 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1B1A1A]">
              圖示
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-16 h-16 text-3xl bg-[#F5F5F5] rounded-xl border border-[#DBD8D8] hover:border-[#B6B3B3] transition-colors flex items-center justify-center"
              >
                {emoji}
              </button>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-[#DBD8D8] rounded-xl shadow-lg z-10 w-[280px]">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => {
                          setEmoji(e)
                          setShowEmojiPicker(false)
                        }}
                        className={cn(
                          'w-8 h-8 text-xl rounded hover:bg-[#F5F5F5] transition-colors',
                          emoji === e && 'bg-brand-accent/20'
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 維度名稱 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1B1A1A]">
              類別名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：裝備偏好"
              className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors text-[#1B1A1A] placeholder:text-[#9D9D9D]"
              maxLength={10}
            />
            <p className="text-xs text-[#8E8C8C]">
              最多 10 字
            </p>
          </div>

          {/* 維度說明 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1B1A1A]">
              類別說明 <span className="text-[#8E8C8C]">(選填)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：你喜歡什麼裝備？"
              className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors text-[#1B1A1A] placeholder:text-[#9D9D9D]"
              maxLength={30}
            />
          </div>

          {/* 選擇模式 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1B1A1A]">
              選擇模式
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectionMode('single')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl border transition-colors text-left',
                  selectionMode === 'single'
                    ? 'border-brand-dark bg-brand-accent/10'
                    : 'border-[#DBD8D8] hover:border-[#B6B3B3]'
                )}
              >
                <p className="font-medium text-[#1B1A1A]">單選</p>
                <p className="text-xs text-[#8E8C8C] mt-1">只能選一個標籤</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode('multiple')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl border transition-colors text-left',
                  selectionMode === 'multiple'
                    ? 'border-brand-dark bg-brand-accent/10'
                    : 'border-[#DBD8D8] hover:border-[#B6B3B3]'
                )}
              >
                <p className="font-medium text-[#1B1A1A]">複選</p>
                <p className="text-xs text-[#8E8C8C] mt-1">可以選多個標籤</p>
              </button>
            </div>
          </div>

          {/* 預覽 */}
          {name.trim() && (
            <div className="bg-[#F5F5F5] rounded-xl p-4">
              <p className="text-sm text-[#6D6C6C] mb-2">預覽</p>
              <div className="flex items-center gap-2">
                <span className="text-xl">{emoji}</span>
                <span className="font-medium text-[#1B1A1A]">{name.trim()}</span>
                <span className="text-xs text-[#6D6C6C] px-2 py-0.5 bg-white rounded-full">
                  {selectionMode === 'single' ? '單選' : '可複選'}
                </span>
              </div>
              {description.trim() && (
                <p className="text-xs text-[#8E8C8C] mt-2">{description.trim()}</p>
              )}
            </div>
          )}

          {/* 提示 */}
          <div className="bg-brand-accent/10 rounded-xl p-4">
            <p className="text-sm text-[#3F3D3D]">
              建立類別後，你可以在裡面新增自訂標籤。
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
            disabled={!canSave || isSaving}
            className={cn(
              'flex-1 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2',
              canSave
                ? 'bg-brand-dark text-white hover:bg-brand-dark-hover'
                : 'bg-[#EBEAEA] text-[#B6B3B3] cursor-not-allowed'
            )}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                建立中...
              </>
            ) : (
              '建立類別'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddCustomDimensionModal
