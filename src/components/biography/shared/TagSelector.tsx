'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Plus, Tag, Clock, Lightbulb } from 'lucide-react'
import type { TagDimension } from '@/lib/types/biography-v2'
import { TagCard } from './TagChip'

interface TagSelectorProps {
  /** 標籤維度資料 */
  dimension: TagDimension
  /** 已選中的標籤 ID 列表 */
  selectedIds: string[]
  /** 選擇變更回調 */
  onSelectionChange: (selectedIds: string[]) => void
  /** 是否預設展開 */
  defaultExpanded?: boolean
  /** 是否顯示新增自訂標籤按鈕 */
  showAddCustom?: boolean
  /** 新增自訂標籤回調 */
  onAddCustom?: () => void
  /** 自訂樣式 */
  className?: string
}

/**
 * 標籤選擇器組件
 *
 * 用於編輯器中選擇某個維度的標籤
 */
export function TagSelector({
  dimension,
  selectedIds,
  onSelectionChange,
  defaultExpanded = true,
  showAddCustom = true,
  onAddCustom,
  className,
}: TagSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const isMultiSelect = dimension.selection_mode === 'multiple'

  const handleTagClick = (tagId: string) => {
    if (isMultiSelect) {
      // 複選：toggle 選擇
      if (selectedIds.includes(tagId)) {
        onSelectionChange(selectedIds.filter((id) => id !== tagId))
      } else {
        onSelectionChange([...selectedIds, tagId])
      }
    } else {
      // 單選：替換選擇
      if (selectedIds.includes(tagId)) {
        onSelectionChange([])
      } else {
        onSelectionChange([tagId])
      }
    }
  }

  const selectedCount = selectedIds.filter((id) =>
    dimension.options.some((opt) => opt.id === id)
  ).length

  return (
    <div
      className={cn(
        'border border-[#DBD8D8] rounded-xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-[#F5F5F5] hover:bg-[#EBEAEA] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{dimension.emoji}</span>
          <span className="font-medium text-[#1B1A1A]">{dimension.name}</span>
          <span className="text-xs text-[#6D6C6C] px-2 py-0.5 bg-[#EBEAEA] rounded-full">
            {isMultiSelect ? '可複選' : '單選'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className="text-sm text-[#1B1A1A] font-medium">
              已選 {selectedCount} 個
            </span>
          )}
          <ChevronDown
            size={20}
            className={cn(
              'text-[#6D6C6C] transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {dimension.description && (
            <p className="text-sm text-[#6D6C6C] mb-4">{dimension.description}</p>
          )}

          {/* Tags Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {dimension.options.map((option) => (
              <TagCard
                key={option.id}
                tag={option}
                selected={selectedIds.includes(option.id)}
                onClick={() => handleTagClick(option.id)}
                multiSelect={isMultiSelect}
              />
            ))}
          </div>

          {/* Add Custom Button */}
          {showAddCustom && onAddCustom && (
            <button
              type="button"
              onClick={onAddCustom}
              className="flex items-center gap-1 text-sm text-[#6D6C6C] hover:text-[#1B1A1A] transition-colors mt-3"
            >
              <Plus size={16} />
              自訂標籤
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 標籤選擇器群組
 *
 * 用於顯示多個維度的標籤選擇器
 */
interface TagSelectorGroupProps {
  /** 標籤維度列表 */
  dimensions: TagDimension[]
  /** 已選中的標籤，按維度分組 */
  selections: Record<string, string[]>
  /** 選擇變更回調 */
  onSelectionChange: (dimensionId: string, selectedIds: string[]) => void
  /** 顯示的維度數量（剩餘會收合） */
  visibleCount?: number
  /** 是否顯示新增自訂標籤按鈕 */
  showAddCustom?: boolean
  /** 新增自訂標籤回調 */
  onAddCustomTag?: (dimensionId: string) => void
  /** 新增自訂維度回調 */
  onAddCustomDimension?: () => void
  /** 自訂樣式 */
  className?: string
}

export function TagSelectorGroup({
  dimensions,
  selections,
  onSelectionChange,
  visibleCount = 4,
  showAddCustom = true,
  onAddCustomTag,
  onAddCustomDimension,
  className,
}: TagSelectorGroupProps) {
  const [showAll, setShowAll] = useState(false)

  const visibleDimensions = showAll
    ? dimensions
    : dimensions.slice(0, visibleCount)
  const hiddenCount = dimensions.length - visibleCount

  const totalSelected = Object.values(selections).reduce(
    (sum, ids) => sum + ids.length,
    0
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-[#3F3D3D]" />
          <h3 className="font-semibold text-[#1B1A1A]">幫自己貼標籤</h3>
          <span className="text-xs text-[#6D6C6C] px-2 py-0.5 bg-[#F5F5F5] rounded-full flex items-center gap-1">
            <Clock size={12} />
            30 秒
          </span>
        </div>
        {totalSelected > 0 && (
          <span className="text-sm text-[#1B1A1A] font-medium">
            已選 {totalSelected} 個標籤
          </span>
        )}
      </div>

      <p className="text-sm text-[#6D6C6C] flex items-center gap-1">
        <Lightbulb size={14} />
        選一選就完成了，不用打字
      </p>

      {/* Dimension Selectors */}
      <div className="space-y-4">
        {visibleDimensions.map((dimension) => (
          <TagSelector
            key={dimension.id}
            dimension={dimension}
            selectedIds={selections[dimension.id] || []}
            onSelectionChange={(ids) => onSelectionChange(dimension.id, ids)}
            defaultExpanded={dimensions.indexOf(dimension) < 2}
            showAddCustom={showAddCustom}
            onAddCustom={
              onAddCustomTag ? () => onAddCustomTag(dimension.id) : undefined
            }
          />
        ))}
      </div>

      {/* Show More / Show Less */}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-sm text-[#6D6C6C] hover:text-[#1B1A1A] transition-colors"
        >
          {showAll ? (
            <>
              收合更多標籤
              <ChevronUp size={16} />
            </>
          ) : (
            <>
              展開更多標籤 ({hiddenCount} 個類別)
              <ChevronDown size={16} />
            </>
          )}
        </button>
      )}

      {/* Add Custom Dimension */}
      {showAddCustom && onAddCustomDimension && (
        <button
          type="button"
          onClick={onAddCustomDimension}
          className="flex items-center gap-1 text-sm text-[#6D6C6C] hover:text-[#1B1A1A] transition-colors"
        >
          <Plus size={16} />
          新增標籤類別
        </button>
      )}
    </div>
  )
}

export default TagSelector
