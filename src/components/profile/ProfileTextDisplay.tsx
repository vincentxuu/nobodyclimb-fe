'use client'

import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ProfileTextDisplayProps {
  text: string
  minHeight?: string
  isMobile: boolean
  /** 是否將逗號分隔的文字顯示為標籤 */
  asTags?: boolean
  /** 收合時最多顯示幾個標籤（僅在 asTags 為 true 時有效） */
  maxVisibleTags?: number
}

export default function ProfileTextDisplay({
  text,
  minHeight = 'auto',
  isMobile,
  asTags = false,
  maxVisibleTags = 6,
}: ProfileTextDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 將逗號分隔的文字轉為標籤陣列
  const tags = useMemo(() => {
    if (!asTags || !text) return []
    return text
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
  }, [text, asTags])

  // 決定要顯示的標籤
  const visibleTags = useMemo(() => {
    if (!asTags) return []
    if (isExpanded || tags.length <= maxVisibleTags) return tags
    return tags.slice(0, maxVisibleTags)
  }, [asTags, tags, isExpanded, maxVisibleTags])

  const hasMore = tags.length > maxVisibleTags

  // 標籤式顯示
  if (asTags && tags.length > 0) {
    return (
      <div
        className={`w-full rounded-sm border border-[#B6B3B3] bg-white p-3 ${minHeight}`}
      >
        <div className="flex flex-wrap gap-1.5">
          {visibleTags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className={`inline-block rounded-full bg-gray-100 px-2.5 py-1 text-gray-700 ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}
            >
              {tag}
            </span>
          ))}
          {hasMore && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`inline-flex items-center gap-0.5 rounded-full bg-gray-200 px-2.5 py-1 text-gray-600 transition-colors hover:bg-gray-300 ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}
            >
              {isExpanded ? (
                <>
                  收起
                  <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  +{tags.length - maxVisibleTags}
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  // 一般文字顯示
  return (
    <div
      className={`w-full rounded-sm border border-[#B6B3B3] bg-white p-3 ${minHeight} ${
        isMobile ? 'text-sm' : 'text-base'
      } break-words`}
    >
      {text}
    </div>
  )
}
