'use client'

import { cn } from '@/lib/utils'
import type { TagDimension } from '@/lib/types/biography-v2'
import { TagSelectorGroup } from '../shared/TagSelector'

interface TagsSectionProps {
  /** 標籤維度列表 */
  dimensions: TagDimension[]
  /** 已選中的標籤，按維度分組 */
  selections: Record<string, string[]>
  /** 選擇變更回調 */
  onSelectionChange: (dimensionId: string, selectedIds: string[]) => void
  /** 新增自訂標籤回調 */
  onAddCustomTag?: (dimensionId: string) => void
  /** 新增自訂維度回調 */
  onAddCustomDimension?: () => void
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
  className,
}: TagsSectionProps) {
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
