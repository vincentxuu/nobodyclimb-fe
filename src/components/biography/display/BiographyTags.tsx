'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { BiographyV2, BiographyTagsV2 } from '@/lib/types/biography-v2'
import { renderDynamicTag } from '@/lib/types/biography-v2'
import {
  SYSTEM_TAG_DIMENSION_LIST,
  getTagOptionById,
  getTagDimensionById,
} from '@/lib/constants/biography-tags'
import { TagChip } from '../shared/TagChip'

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

  // 將選中的標籤整理為扁平列表
  const selectedTags = useMemo(() => {
    if (!biography.tags?.selections) return []

    const tags: Array<{
      id: string
      label: string
      isCustom: boolean
      dimensionId: string
    }> = []

    // 處理系統維度的選擇
    for (const [dimensionId, selectedIds] of Object.entries(
      biography.tags.selections
    )) {
      for (const optionId of selectedIds) {
        const option = getTagOptionById(optionId)
        if (option) {
          // 處理動態標籤
          if (option.is_dynamic) {
            const renderedLabels = renderDynamicTag(option, biography)
            if (Array.isArray(renderedLabels)) {
              for (const label of renderedLabels) {
                tags.push({
                  id: `${optionId}_${label}`,
                  label,
                  isCustom: false,
                  dimensionId,
                })
              }
            } else {
              tags.push({
                id: optionId,
                label: renderedLabels,
                isCustom: false,
                dimensionId,
              })
            }
          } else {
            tags.push({
              id: optionId,
              label: option.label,
              isCustom: option.source === 'user',
              dimensionId,
            })
          }
        }
      }
    }

    // 處理用戶自訂標籤
    if (biography.tags.custom_options) {
      for (const customOption of biography.tags.custom_options) {
        // 確認這個自訂標籤被選中
        const selectedInDimension =
          biography.tags.selections[customOption.dimension_id] || []
        if (selectedInDimension.includes(customOption.id)) {
          tags.push({
            id: customOption.id,
            label: customOption.label,
            isCustom: true,
            dimensionId: customOption.dimension_id,
          })
        }
      }
    }

    return tags
  }, [biography])

  if (selectedTags.length === 0) {
    return null
  }

  const visibleTags = showAll ? selectedTags : selectedTags.slice(0, mobileLimit)
  const hiddenCount = selectedTags.length - mobileLimit

  return (
    <section className={cn('py-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🏷️</span>
        <h2 className="text-lg font-semibold text-gray-900">攀岩人格</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleTags.map((tag) => (
          <span
            key={tag.id}
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              tag.isCustom
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {tag.isCustom && <span className="text-amber-500">✨</span>}
            {tag.label}
          </span>
        ))}

        {/* Show more button (mobile) */}
        {!showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            展開更多標籤 (+{hiddenCount})
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        {showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(false)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            收合
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </section>
  )
}

export default BiographyTags
