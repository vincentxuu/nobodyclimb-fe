'use client'

import { cn } from '@/lib/utils'
import { Tag, ChevronRight } from 'lucide-react'
import type { TagDimension } from '@/lib/types/biography-v2'
import { TagSelectorGroup } from '../shared/TagSelector'

interface TagsSectionProps {
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
  /** 是否為手機版（顯示摘要模式） */
  isMobile?: boolean
  /** 打開 BottomSheet 編輯（手機版用） */
  onOpenBottomSheet?: () => void
  /** 自訂樣式 */
  className?: string
}

/**
 * 標籤編輯區塊
 *
 * 用於編輯用戶的身份標籤
 */
export function TagsSection({
  dimensions,
  selections,
  onSelectionChange,
  onAddCustomTag,
  onAddCustomDimension,
  isMobile = false,
  onOpenBottomSheet,
  className,
}: TagsSectionProps) {
  // 計算已選標籤總數
  const totalSelected = Object.values(selections).reduce(
    (sum, ids) => sum + ids.length,
    0
  )

  // 獲取已選標籤的名稱（用於手機版摘要）
  const selectedTagLabels = dimensions.flatMap((dim) =>
    (selections[dim.id] || [])
      .map((tagId) => dim.options.find((o) => o.id === tagId)?.label)
      .filter(Boolean)
  ).slice(0, 6) // 最多顯示 6 個

  // 手機版：顯示摘要 + 編輯按鈕
  if (isMobile) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-[#3F3D3D]" />
            <h3 className="font-semibold text-[#1B1A1A]">身份標籤</h3>
            {totalSelected > 0 && (
              <span className="text-xs text-[#6D6C6C] px-2 py-0.5 bg-[#F5F5F5] rounded-full">
                已選 {totalSelected} 個
              </span>
            )}
          </div>
        </div>

        {/* Selected Tags Summary */}
        {selectedTagLabels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedTagLabels.map((label, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-[#F5F5F5] rounded-full text-sm text-[#3F3D3D]"
              >
                {label}
              </span>
            ))}
            {totalSelected > 6 && (
              <span className="px-3 py-1.5 bg-[#F5F5F5] rounded-full text-sm text-[#6D6C6C]">
                +{totalSelected - 6} 個
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#8E8C8C]">還沒有選擇任何標籤</p>
        )}

        {/* Edit Button */}
        <button
          type="button"
          onClick={onOpenBottomSheet}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[#DBD8D8] rounded-xl text-sm font-medium text-[#3F3D3D] hover:bg-[#F5F5F5] transition-colors"
        >
          編輯標籤
          <ChevronRight size={16} />
        </button>
      </div>
    )
  }

  // 桌面版：顯示完整選擇器
  return (
    <div className={cn('space-y-4', className)}>
      <TagSelectorGroup
        dimensions={dimensions}
        selections={selections}
        onSelectionChange={onSelectionChange}
        visibleCount={4}
        showAddCustom={true}
        onAddCustomTag={onAddCustomTag}
        onAddCustomDimension={onAddCustomDimension}
      />
    </div>
  )
}

export default TagsSection
