'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Activity, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BiographyV2 } from '@/lib/types/biography-v2'
import { renderDynamicTag } from '@/lib/types/biography-v2'
import { getTagOptionById } from '@/lib/constants/biography-tags'

interface QuickFactsSectionProps {
  person: BiographyV2 | null
  /** 標籤最多顯示數量（手機版） */
  mobileTagLimit?: number
}

/**
 * Quick Facts - 快速了解
 * 整合基本資訊卡片與關鍵字標籤
 */
export function QuickFactsSection({ person, mobileTagLimit = 8 }: QuickFactsSectionProps) {
  const [showAllTags, setShowAllTags] = useState(false)

  // 計算攀岩年資
  const climbingYears = useMemo(() => {
    if (!person?.climbing_start_year) return null
    const currentYear = new Date().getFullYear()
    return currentYear - person.climbing_start_year
  }, [person?.climbing_start_year])

  // 處理常出沒地點
  const locations = useMemo(() => {
    if (!person?.frequent_locations) return []
    return person.frequent_locations.filter(l => l.trim())
  }, [person?.frequent_locations])

  // 將選中的標籤整理為扁平列表，自訂標籤優先顯示
  const selectedTags = useMemo(() => {
    if (!person?.tags || person.tags.length === 0) return []

    // 建立自訂標籤查找表
    const customTagsMap = new Map<string, any>()

    // 加入用戶為系統維度新增的自訂標籤
    if (person.custom_tags) {
      for (const tag of person.custom_tags) {
        customTagsMap.set(tag.id, tag)
      }
    }

    // 加入用戶自訂維度中的所有標籤
    if (person.custom_dimensions) {
      for (const dimension of person.custom_dimensions) {
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
    const isCustomTag = (tagSelection: any) => {
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

    for (const tagSelection of person.tags) {
      const option = findTagOption(tagSelection.tag_id)

      if (option) {
        // 處理動態標籤
        if (option.is_dynamic) {
          const renderedLabels = renderDynamicTag(option, person)
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

    // 自訂標籤優先，然後是系統標籤
    return [...customTags, ...systemTags]
  }, [person])

  if (!person) return null

  const quickFacts = [
    {
      icon: <Calendar className="h-6 w-6 text-gray-600" />,
      label: '開始攀岩',
      value: person.climbing_start_year
        ? `${person.climbing_start_year}${climbingYears !== null ? ` (${climbingYears} 年)` : ''}`
        : '從入坑那天起算',
      isEmpty: !person.climbing_start_year
    },
    {
      icon: <MapPin className="h-6 w-6 text-gray-600" />,
      label: '常出沒地點',
      value: locations.length > 0 ? locations.join('、') : '哪裡有牆哪裡去',
      isEmpty: locations.length === 0
    },
    {
      icon: <Activity className="h-6 w-6 text-gray-600" />,
      label: '喜歡的類型',
      value: person.favorite_route_types && person.favorite_route_types.length > 0
        ? person.favorite_route_types.join('、')
        : '能爬的都是好路線',
      isEmpty: !person.favorite_route_types || person.favorite_route_types.length === 0
    }
  ]

  // 計算標籤顯示
  const visibleTags = showAllTags ? selectedTags : selectedTags.slice(0, mobileTagLimit)
  const hiddenTagCount = selectedTags.length - mobileTagLimit

  return (
    <section className="bg-white py-12">
      <div className="container mx-auto max-w-5xl px-4">
        <h2 className="mb-8 text-center text-2xl font-semibold text-gray-900">
          快速了解 {person.name}
        </h2>

        {/* 基本資訊卡片 */}
        <div className="grid gap-6 md:grid-cols-3">
          {quickFacts.map((fact, index) => (
            <motion.div
              key={fact.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="rounded-lg bg-gray-50 p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Icon */}
              <div className="mb-3 flex justify-center">
                {fact.icon}
              </div>
              <p className="text-sm text-gray-500">{fact.label}</p>
              <p className={cn(
                'mt-1 font-medium',
                fact.isEmpty ? 'text-gray-400' : 'text-gray-900'
              )}>
                {fact.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* 關鍵字 標籤 */}
        {selectedTags.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-center text-lg font-medium text-gray-700 mb-4">
              關鍵字
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
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

              {/* Show more button */}
              {!showAllTags && hiddenTagCount > 0 && (
                <button
                  onClick={() => setShowAllTags(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-[#6D6C6C] bg-[#F5F5F5] hover:bg-[#EBEAEA] transition-colors"
                >
                  展開更多 (+{hiddenTagCount})
                  <ChevronDown size={16} />
                </button>
              )}

              {showAllTags && hiddenTagCount > 0 && (
                <button
                  onClick={() => setShowAllTags(false)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-[#6D6C6C] bg-[#F5F5F5] hover:bg-[#EBEAEA] transition-colors"
                >
                  收合
                  <ChevronUp size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
