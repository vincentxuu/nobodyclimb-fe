'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X, Loader2, Tag } from 'lucide-react'
import type { TagDimension, TagOption, ContentSource } from '@/lib/types/biography-v2'

interface AddCustomTagModalProps {
  /** 是否開啟 */
  isOpen: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 可選擇的維度列表 */
  dimensions: TagDimension[]
  /** 預設選擇的維度 ID */
  defaultDimensionId?: string
  /** 儲存回調 */
  onSave: (_tag: TagOption) => void
  /** 是否正在儲存 */
  isSaving?: boolean
  /** 自訂樣式 */
  className?: string
}

/**
 * 新增自訂標籤 Modal
 *
 * 用於用戶新增自訂標籤
 */
export function AddCustomTagModal({
  isOpen,
  onClose,
  dimensions,
  defaultDimensionId,
  onSave,
  isSaving = false,
  className,
}: AddCustomTagModalProps) {
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [dimensionId, setDimensionId] = useState(defaultDimensionId || '')

  // 重置表單狀態
  useEffect(() => {
    if (isOpen) {
      setLabel('')
      setDescription('')
      setDimensionId(defaultDimensionId || dimensions[0]?.id || '')
    }
  }, [isOpen, defaultDimensionId, dimensions])

  const handleSave = () => {
    if (!label.trim() || !dimensionId) return

    const newTag: TagOption = {
      id: `usr_tag_${Date.now()}`,
      source: 'user' as ContentSource,
      dimension_id: dimensionId,
      label: label.trim().startsWith('#') ? label.trim() : `#${label.trim()}`,
      description: description.trim(),
      order: 999,
    }

    onSave(newTag)
  }

  if (!isOpen) return null

  const canSave = label.trim().length > 0 && dimensionId

  return (
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-dark/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-white w-full md:max-w-md md:rounded-lg rounded-t-2xl max-h-[90vh] flex flex-col mb-20 md:mb-0',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#EBEAEA]">
          <div className="flex items-center gap-2">
            <Tag size={20} className="text-[#3F3D3D]" />
            <h3 className="font-semibold text-[#1B1A1A]">新增自訂標籤</h3>
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
          {/* 標籤名稱 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1B1A1A]">
              標籤名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例如：深夜岩館族"
              className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors text-[#1B1A1A] placeholder:text-[#9D9D9D]"
              maxLength={20}
            />
            <p className="text-xs text-[#8E8C8C]">
              會自動加上 # 符號，最多 20 字
            </p>
          </div>

          {/* 標籤說明 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1B1A1A]">
              標籤說明 <span className="text-[#8E8C8C]">(選填)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：十點後才開始爬"
              className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors text-[#1B1A1A] placeholder:text-[#9D9D9D]"
              maxLength={50}
            />
            <p className="text-xs text-[#8E8C8C]">
              幫助其他人了解這個標籤，最多 50 字
            </p>
          </div>

          {/* 所屬維度 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1B1A1A]">
              所屬類別 <span className="text-red-500">*</span>
            </label>
            <select
              value={dimensionId}
              onChange={(e) => setDimensionId(e.target.value)}
              className="w-full px-4 py-3 border border-[#B6B3B3] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors bg-white"
            >
              {dimensions.map((dim) => (
                <option key={dim.id} value={dim.id}>
                  {dim.emoji} {dim.name}
                </option>
              ))}
            </select>
          </div>

          {/* 預覽 */}
          {label.trim() && (
            <div className="bg-[#F5F5F5] rounded-lg p-4">
              <p className="text-sm text-[#6D6C6C] mb-2">預覽</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DBD8D8] rounded-full">
                <span className="text-sm font-medium text-[#1B1A1A]">
                  {label.trim().startsWith('#') ? label.trim() : `#${label.trim()}`}
                </span>
              </div>
              {description.trim() && (
                <p className="text-xs text-[#8E8C8C] mt-2">{description.trim()}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EBEAEA] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-[#B6B3B3] text-[#3F3D3D] rounded-lg font-medium hover:bg-[#F5F5F5] transition-colors"
          >
            取消
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
                新增中...
              </>
            ) : (
              '新增標籤'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddCustomTagModal
