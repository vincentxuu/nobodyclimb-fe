'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/page-transition'
import { useToast } from '@/components/ui/use-toast'
import { biographyService } from '@/lib/api/services'
import { SYSTEM_TAG_DIMENSION_LIST, SYSTEM_TAG_DIMENSIONS } from '@/lib/constants/biography-tags'

// 註冊流程精選的標籤維度（3 個）
const REGISTRATION_TAG_DIMENSIONS: string[] = [
  SYSTEM_TAG_DIMENSIONS.STYLE_CULT,      // 風格邪教
  SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,    // 傷痛勳章
  SYSTEM_TAG_DIMENSIONS.SOCIAL_TYPE,     // 社交類型
]
import { cn } from '@/lib/utils'
import {
  Check,
  ChevronDown,
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
  Tag,
  type LucideIcon,
} from 'lucide-react'
import type { TagDimension } from '@/lib/types/biography-v2'

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

export default function TagsPage() {
  const router = useRouter()
  const { status, isLoading } = useAuth()
  const { toast } = useToast()

  // 只使用精選的維度
  const selectedDimensions = SYSTEM_TAG_DIMENSION_LIST.filter((d) =>
    REGISTRATION_TAG_DIMENSIONS.includes(d.id)
  )

  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(
    new Set(selectedDimensions.map((d) => d.id))
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // 如果使用者未登入，重定向至登入頁面
    if (!isLoading && status !== 'signIn') {
      router.push('/auth/login')
    }
  }, [status, isLoading, router])

  // 處理標籤點擊
  const handleTagClick = (dimension: TagDimension, tagId: string) => {
    const currentSelection = selections[dimension.id] || []
    const isMultiSelect = dimension.selection_mode === 'multiple'

    if (isMultiSelect) {
      if (currentSelection.includes(tagId)) {
        setSelections({
          ...selections,
          [dimension.id]: currentSelection.filter((id) => id !== tagId),
        })
      } else {
        setSelections({
          ...selections,
          [dimension.id]: [...currentSelection, tagId],
        })
      }
    } else {
      if (currentSelection.includes(tagId)) {
        setSelections({
          ...selections,
          [dimension.id]: [],
        })
      } else {
        setSelections({
          ...selections,
          [dimension.id]: [tagId],
        })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 將標籤選擇轉換為 API 格式
      const tagsData = Object.entries(selections).flatMap(([_dimensionId, tagIds]) =>
        tagIds.map((tagId) => ({
          tag_id: tagId,
          source: 'system' as const,
        }))
      )

      // 更新人物誌標籤
      await biographyService.updateBiography({
        tags_data: JSON.stringify(tagsData),
      })

      toast({
        title: '標籤已儲存',
        description: `已選擇 ${totalSelected} 個標籤`,
        variant: 'default',
      })

      // 導航到下一步
      router.push('/auth/profile-setup/self-intro')
    } catch (error) {
      console.error('儲存標籤失敗', error)
      toast({
        title: '儲存失敗',
        description: '儲存標籤時發生錯誤，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* 步驟指示器 */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  1
                </div>
                <span className="mt-2 text-xs sm:text-sm">基本資料</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-primary"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  2
                </div>
                <span className="mt-2 text-xs sm:text-sm">標籤</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-gray-600">
                  3
                </div>
                <span className="mt-2 text-xs sm:text-sm text-gray-500">一句話</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-gray-600">
                  4
                </div>
                <span className="mt-2 text-xs sm:text-sm text-gray-500">完成</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">幫自己貼標籤</h1>
          <p className="mt-2 text-gray-600">
            選擇能代表你的標籤，讓其他岩友更容易認識你
          </p>
          {totalSelected > 0 && (
            <span className="mt-2 inline-block text-sm text-primary">
              已選 {totalSelected} 個標籤
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 標籤維度列表（精選 4 個維度） */}
          <div className="space-y-3">
            {selectedDimensions.map((dimension) => {
              const isExpanded = expandedDimensions.has(dimension.id)
              const selectedCount = (selections[dimension.id] || []).length
              const IconComponent = iconMap[dimension.icon]

              return (
                <div
                  key={dimension.id}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  {/* 維度標題 */}
                  <button
                    type="button"
                    onClick={() => toggleDimension(dimension.id)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {IconComponent && (
                        <IconComponent size={20} className="text-primary" />
                      )}
                      {!IconComponent && (
                        <Tag size={20} className="text-primary" />
                      )}
                      <span className="font-medium text-gray-900">
                        {dimension.name}
                      </span>
                      {selectedCount > 0 && (
                        <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                          {selectedCount}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      size={20}
                      className={cn(
                        'text-gray-500 transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </button>

                  {/* 標籤選項 */}
                  {isExpanded && (
                    <div className="p-4 space-y-3 bg-white">
                      <p className="text-sm text-gray-500">
                        {dimension.description}
                        {dimension.selection_mode === 'multiple' ? ' (可複選)' : ' (單選)'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {dimension.options.map((option) => {
                          const isSelected = (selections[dimension.id] || []).includes(option.id)
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => handleTagClick(dimension, option.id)}
                              className={cn(
                                'px-3 py-2 rounded-full text-sm font-medium transition-all',
                                'border',
                                isSelected
                                  ? 'bg-primary text-white border-primary'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:text-primary'
                              )}
                            >
                              {isSelected && <Check size={14} className="inline mr-1" />}
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 按鈕區 */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full rounded-lg py-3 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? '處理中...' : '下一步'}
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  )
}
