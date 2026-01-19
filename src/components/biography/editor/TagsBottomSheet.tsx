'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Check,
  Tag,
  ChevronDown,
  Plus,
  Sparkles,
  HeartPulse,
  Footprints,
  Clock,
  Tent,
  Music,
  Target,
  Users,
  Hand,
  Dumbbell,
  MapPin,
  type LucideIcon,
} from 'lucide-react'
import type { TagDimension } from '@/lib/types/biography-v2'
import { TagCard } from '../shared/TagChip'

// Icon mapping for dynamic rendering
const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  HeartPulse,
  Footprints,
  Clock,
  Tent,
  Music,
  Target,
  Users,
  Hand,
  Dumbbell,
  MapPin,
}

interface TagsBottomSheetProps {
  /** 是否開啟 */
  isOpen: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 標籤維度列表 */
  dimensions: TagDimension[]
  /** 已選中的標籤，按維度分組 */
  selections: Record<string, string[]>
  /** 選擇變更回調 */
  onSelectionChange: (_dimensionId: string, _selectedIds: string[]) => void
  /** 新增自訂標籤回調 */
  onAddCustomTag?: (_dimensionId: string) => void
  /** 新增自訂維度回調 */
  onAddCustomDimension?: () => void
  /** 完成回調 */
  onComplete?: () => void
  /** 自訂樣式 */
  className?: string
}

/**
 * 標籤編輯 Bottom Sheet
 *
 * 手機版專用的標籤編輯介面，使用底部滑出動畫
 */
export function TagsBottomSheet({
  isOpen,
  onClose,
  dimensions,
  selections,
  onSelectionChange,
  onAddCustomTag,
  onAddCustomDimension,
  onComplete,
  className,
}: TagsBottomSheetProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set())
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  // 處理開啟/關閉動畫
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      // 預設展開前兩個維度
      const defaultExpanded = new Set(dimensions.slice(0, 2).map((d) => d.id))
      setExpandedDimensions(defaultExpanded)
    }
  }, [isOpen, dimensions])

  // 處理拖曳開始
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true)
    startY.current = clientY
  }, [])

  // 處理拖曳移動
  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return
    const deltaY = clientY - startY.current
    if (deltaY > 0) {
      setDragY(deltaY)
    }
  }, [isDragging])

  // 處理拖曳結束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    if (dragY > 100) {
      // 拖曳超過 100px 關閉
      onClose()
    }
    setDragY(0)
  }, [dragY, onClose])

  // 處理觸控事件
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY)
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }

  // 處理滑鼠事件
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientY)
  }

  const handleMouseUp = () => {
    handleDragEnd()
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      handleDragEnd()
    }
  }

  // 處理標籤點擊
  const handleTagClick = (dimension: TagDimension, tagId: string) => {
    const currentSelection = selections[dimension.id] || []
    const isMultiSelect = dimension.selection_mode === 'multiple'

    if (isMultiSelect) {
      if (currentSelection.includes(tagId)) {
        onSelectionChange(
          dimension.id,
          currentSelection.filter((id) => id !== tagId)
        )
      } else {
        onSelectionChange(dimension.id, [...currentSelection, tagId])
      }
    } else {
      if (currentSelection.includes(tagId)) {
        onSelectionChange(dimension.id, [])
      } else {
        onSelectionChange(dimension.id, [tagId])
      }
    }
  }

  // 切換維度展開狀態
  const toggleDimension = (dimensionId: string) => {
    setExpandedDimensions((prev) => {
      const next = new Set(prev)
      if (next.has(dimensionId)) {
        next.delete(dimensionId)
      } else {
        next.add(dimensionId)
      }
      return next
    })
  }

  // 計算總選中數量
  const totalSelected = Object.values(selections).reduce(
    (sum, ids) => sum + ids.length,
    0
  )

  // 處理完成
  const handleComplete = () => {
    if (onComplete) {
      onComplete()
    }
    onClose()
  }

  if (!isOpen && !isAnimating) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0'
      )}
      onTransitionEnd={() => {
        if (!isOpen) setIsAnimating(false)
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-dark/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          className
        )}
        style={{
          transform: isDragging ? `translateY(${dragY}px)` : undefined,
          maxHeight: 'calc(100vh - env(safe-area-inset-top) - 60px)',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-10 h-1 bg-[#DBD8D8] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-[#EBEAEA]">
          <div className="flex items-center gap-2">
            <Tag size={20} className="text-[#3F3D3D]" />
            <h3 className="font-semibold text-[#1B1A1A]">幫自己貼標籤</h3>
            {totalSelected > 0 && (
              <span className="text-xs text-[#6D6C6C] px-2 py-0.5 bg-[#F5F5F5] rounded-full">
                已選 {totalSelected} 個
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleComplete}
            className="flex items-center gap-1 px-4 py-2 bg-brand-dark text-white rounded-full text-sm font-medium hover:bg-brand-dark-hover transition-colors"
          >
            <Check size={16} />
            完成
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {dimensions.map((dimension) => {
            const isExpanded = expandedDimensions.has(dimension.id)
            const selectedCount = (selections[dimension.id] || []).length

            return (
              <div
                key={dimension.id}
                className="border border-[#EBEAEA] rounded-xl overflow-hidden"
              >
                {/* Dimension Header */}
                <button
                  type="button"
                  onClick={() => toggleDimension(dimension.id)}
                  className="w-full flex items-center justify-between p-3 bg-[#F5F5F5] hover:bg-[#EBEAEA] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const IconComponent = iconMap[dimension.icon]
                      return IconComponent ? (
                        <IconComponent size={18} className="text-[#3F3D3D]" />
                      ) : (
                        <Tag size={18} className="text-[#3F3D3D]" />
                      )
                    })()}
                    <span className="font-medium text-[#1B1A1A] text-sm">
                      {dimension.name}
                    </span>
                    {selectedCount > 0 && (
                      <span className="text-xs text-brand-dark font-medium">
                        ({selectedCount})
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={18}
                    className={cn(
                      'text-[#6D6C6C] transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </button>

                {/* Tags */}
                {isExpanded && (
                  <div className="p-3 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {dimension.options.map((option) => (
                        <TagCard
                          key={option.id}
                          tag={option}
                          selected={(selections[dimension.id] || []).includes(
                            option.id
                          )}
                          onClick={() => handleTagClick(dimension, option.id)}
                          multiSelect={dimension.selection_mode === 'multiple'}
                          size="sm"
                        />
                      ))}
                      {/* 新增自訂標籤按鈕 */}
                      {onAddCustomTag && (
                        <button
                          type="button"
                          onClick={() => onAddCustomTag(dimension.id)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-[#DBD8D8] rounded-full text-sm text-[#6D6C6C] hover:border-[#3F3D3D] hover:text-[#3F3D3D] transition-colors"
                        >
                          <Plus size={14} />
                          <span>新增</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[#8E8C8C]">
                      {dimension.selection_mode === 'multiple'
                        ? '可複選'
                        : '單選'}
                      {dimension.description && ` · ${dimension.description}`}
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {/* 新增標籤類別按鈕 */}
          {onAddCustomDimension && (
            <button
              type="button"
              onClick={onAddCustomDimension}
              className="flex items-center gap-1 text-sm text-[#6D6C6C] hover:text-[#1B1A1A] transition-colors mt-2"
            >
              <Plus size={16} />
              新增標籤類別
            </button>
          )}
        </div>

        {/* Safe Area Padding */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  )
}

export default TagsBottomSheet
