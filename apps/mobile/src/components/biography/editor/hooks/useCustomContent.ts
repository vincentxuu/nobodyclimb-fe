import { useState, useEffect, useMemo, useCallback } from 'react'
import type {
  BiographyV2,
  TagDimension,
  TagOption,
  OneLinerQuestion,
  StoryQuestion,
  StoryCategoryId,
} from '@nobodyclimb/types'

interface UseCustomContentOptions {
  biography: BiographyV2
  tagDimensions: TagDimension[]
  oneLinerQuestions: OneLinerQuestion[]
  storyQuestionsByCategory: Record<StoryCategoryId, StoryQuestion[]>
  onSaveCustomTag: (tag: TagOption, isUserDimension: boolean, newCustomDimensions?: TagDimension[], newCustomTags?: TagOption[]) => void
  onSaveCustomDimension: (dimension: TagDimension, newCustomDimensions: TagDimension[]) => void
}

/**
 * 自訂內容管理 Hook
 *
 * 管理用戶自訂的維度、標籤、問題等
 */
export function useCustomContent({
  biography,
  tagDimensions,
  oneLinerQuestions,
  storyQuestionsByCategory,
  onSaveCustomTag,
  onSaveCustomDimension,
}: UseCustomContentOptions) {
  // 合併系統維度和用戶自訂維度（從 biography.custom_dimensions 初始化）
  const [customDimensions, setCustomDimensions] = useState<TagDimension[]>(
    () => biography.custom_dimensions || []
  )

  // 用戶為系統維度新增的自訂標籤（從 biography.custom_tags 初始化）
  const [customTagsForSystemDimensions, setCustomTagsForSystemDimensions] = useState<TagOption[]>(
    () => biography.custom_tags || []
  )

  const [customOneLinerQuestions, setCustomOneLinerQuestions] = useState<OneLinerQuestion[]>([])
  const [customStoryQuestions, setCustomStoryQuestions] = useState<StoryQuestion[]>([])

  // 同步 biography.custom_tags 到 customTagsForSystemDimensions
  const customTagsJson = JSON.stringify(biography.custom_tags || [])
  useEffect(() => {
    const parsed = JSON.parse(customTagsJson) as TagOption[]
    setCustomTagsForSystemDimensions(parsed)
  }, [customTagsJson])

  // 同步 biography.custom_dimensions 到 customDimensions
  const customDimensionsJson = JSON.stringify(biography.custom_dimensions || [])
  useEffect(() => {
    const parsed = JSON.parse(customDimensionsJson) as TagDimension[]
    setCustomDimensions(parsed)
  }, [customDimensionsJson])

  // 所有維度（系統 + 自訂），並將用戶為系統維度新增的自訂標籤合併進去
  const allTagDimensions = useMemo(() => {
    // 將用戶自訂標籤合併到對應的系統維度
    const mergedSystemDimensions = tagDimensions.map((dim) => {
      const customTags = customTagsForSystemDimensions.filter(
        (tag) => tag.dimension_id === dim.id
      )
      if (customTags.length > 0) {
        return {
          ...dim,
          options: [...customTags, ...dim.options],
        }
      }
      return dim
    })
    return [...mergedSystemDimensions, ...customDimensions]
  }, [tagDimensions, customDimensions, customTagsForSystemDimensions])

  // 所有一句話問題（系統 + 自訂）
  const allOneLinerQuestions = useMemo(
    () => [...oneLinerQuestions, ...customOneLinerQuestions],
    [oneLinerQuestions, customOneLinerQuestions]
  )

  // 所有故事問題（系統 + 自訂）
  const allStoryQuestionsByCategory = useMemo(() => {
    const result = { ...storyQuestionsByCategory }
    customStoryQuestions.forEach((q) => {
      const category = q.category_id as StoryCategoryId
      if (result[category]) {
        result[category] = [...result[category], q]
      }
    })
    return result
  }, [storyQuestionsByCategory, customStoryQuestions])

  // 處理新增自訂標籤
  const handleSaveCustomTag = useCallback(
    (tag: TagOption) => {
      const dimensionId = tag.dimension_id
      const dimension = allTagDimensions.find((d) => d.id === dimensionId)

      if (!dimension) return

      if (dimension.source === 'user') {
        // 用戶自訂維度：更新該維度的 options
        const newCustomDimensions = customDimensions.map((d) =>
          d.id === dimensionId ? { ...d, options: [...d.options, tag] } : d
        )
        setCustomDimensions(newCustomDimensions)
        onSaveCustomTag(tag, true, newCustomDimensions, undefined)
      } else {
        // 系統維度：將標籤加入 customTagsForSystemDimensions
        const newCustomTags = [...customTagsForSystemDimensions, tag]
        setCustomTagsForSystemDimensions(newCustomTags)
        onSaveCustomTag(tag, false, undefined, newCustomTags)
      }
    },
    [allTagDimensions, customDimensions, customTagsForSystemDimensions, onSaveCustomTag]
  )

  // 處理新增自訂維度
  const handleSaveCustomDimension = useCallback(
    (dimension: TagDimension) => {
      const newCustomDimensions = [...customDimensions, dimension]
      setCustomDimensions(newCustomDimensions)
      onSaveCustomDimension(dimension, newCustomDimensions)
    },
    [customDimensions, onSaveCustomDimension]
  )

  // 處理新增自訂一句話問題
  const handleSaveCustomOneLiner = useCallback((question: OneLinerQuestion) => {
    setCustomOneLinerQuestions((prev) => [...prev, question])
  }, [])

  // 處理新增自訂故事問題
  const handleSaveCustomStory = useCallback((question: StoryQuestion) => {
    setCustomStoryQuestions((prev) => [...prev, question])
  }, [])

  return {
    // 合併後的資料
    allTagDimensions,
    allOneLinerQuestions,
    allStoryQuestionsByCategory,

    // 自訂內容
    customDimensions,
    customTagsForSystemDimensions,

    // 處理方法
    handleSaveCustomTag,
    handleSaveCustomDimension,
    handleSaveCustomOneLiner,
    handleSaveCustomStory,
  }
}
