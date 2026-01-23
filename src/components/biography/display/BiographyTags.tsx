'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Tag, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import type { BiographyV2, TagSelection, TagOption } from '@/lib/types/biography-v2'
import { renderDynamicTag } from '@/lib/types/biography-v2'
import { getTagOptionById } from '@/lib/constants/biography-tags'

interface BiographyTagsProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 最多顯示的標籤數量（手機版） */
  mobileLimit?: number
  /** 自訂樣式 */
  className?: string
}

/**
 * 標籤展示組件
 *
 * 展示用戶選擇的所有標籤
 */
export function BiographyTags({
  biography,
  mobileLimit = 8,
  className,
}: BiographyTagsProps) {
  const [showAll, setShowAll] = useState(false)

  // 將選中的標籤整理為扁平列表，自訂標籤優先顯示
  const selectedTags = useMemo(() => {
    if (!biography.tags || biography.tags.length === 0) return []

    // 建立自訂標籤查找表
    const customTagsMap = new Map<string, TagOption>()

    // 加入用戶為系統維度新增的自訂標籤
    if (biography.custom_tags) {
      for (const tag of biography.custom_tags) {
        customTagsMap.set(tag.id, tag)
      }
    }

    // 加入用戶自訂維度中的所有標籤
    if (biography.custom_dimensions) {
      for (const dimension of biography.custom_dimensions) {
        for (const tag of dimension.options) {
          customTagsMap.set(tag.id, tag)
        }
      }
    }

    // 輔助函數：查找標籤定義（優先從自訂標籤查找）
    const findTagOption = (tagId: string) => {
      return customTagsMap.get(tagId) || getTagOptionById(tagId)
    }

    // 輔助函數：判斷是否為自訂標籤
    const isCustomTag = (tagSelection: TagSelection) => {
      // 1. 檢查 source
      if (tagSelection.source === 'user') return true
      // 2. 檢查是否在 customTagsMap 中
      if (customTagsMap.has(tagSelection.tag_id)) return true
      // 3. 檢查 tag_id 是否以 usr_ 開頭
      if (tagSelection.tag_id.startsWith('usr_')) return true
      return false
    }

    const customTags: Array<{
      id: string
      label: string
      isCustom: boolean
    }> = []
    const systemTags: Array<{
      id: string
      label: string
      isCustom: boolean
    }> = []

    for (const tagSelection of biography.tags) {
      const option = findTagOption(tagSelection.tag_id)
      if (option) {
        // 處理動態標籤
        if (option.is_dynamic) {
          const renderedLabels = renderDynamicTag(option, biography)
          if (Array.isArray(renderedLabels)) {
            for (const label of renderedLabels) {
              systemTags.push({
                id: `${tagSelection.tag_id}_${label}`,
                label,
                isCustom: false,
              })
            }
          } else {
            systemTags.push({
              id: tagSelection.tag_id,
              label: renderedLabels,
              isCustom: false,
            })
          }
        } else {
          const tag = {
            id: tagSelection.tag_id,
            label: option.label,
            isCustom: isCustomTag(tagSelection),
          }
          if (tag.isCustom) {
            customTags.push(tag)
          } else {
            systemTags.push(tag)
          }
        }
      }
    }

    // 自訂標籤優先,然後是系統標籤
    return [...customTags, ...systemTags]
  }, [biography])

  if (selectedTags.length === 0) {
    return null
  }

  const visibleTags = showAll ? selectedTags : selectedTags.slice(0, mobileLimit)
  const hiddenCount = selectedTags.length - mobileLimit

  return (
    <section className={cn('py-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Tag size={18} className="text-[#3F3D3D]" />
        <h2 className="text-lg font-semibold text-[#1B1A1A]">關鍵字</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleTags.map((tag) => (
          <span
            key={tag.id}
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              tag.isCustom
                ? 'bg-brand-accent/10 text-[#1B1A1A] border border-brand-accent/50'
                : 'bg-[#EBEAEA] text-[#3F3D3D] hover:bg-[#DBD8D8]'
            )}
          >
            {tag.isCustom && <Sparkles size={12} className="text-brand-accent" />}
            {tag.label}
          </span>
        ))}

        {/* Show more button (mobile) */}
        {!showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-[#6D6C6C] bg-[#F5F5F5] hover:bg-[#EBEAEA] transition-colors"
          >
            展開更多標籤 (+{hiddenCount})
            <ChevronDown size={16} />
          </button>
        )}

        {showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(false)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-[#6D6C6C] bg-[#F5F5F5] hover:bg-[#EBEAEA] transition-colors"
          >
            收合
            <ChevronUp size={16} />
          </button>
        )}
      </div>
    </section>
  )
}

export default BiographyTags
