'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { biographyContentService } from '@/lib/api/services'

// ═══════════════════════════════════════════
// 選擇題類型定義
// ═══════════════════════════════════════════

export interface ChoiceOption {
  id: string
  label: string
  value: string
  isOther: boolean
  responseTemplate: string
  count: number
}

export interface ChoiceQuestion {
  id: string
  question: string
  hint: string | null
  followUpPrompt: string | null
  followUpPlaceholder: string | null
  options: ChoiceOption[]
}

export interface ChoiceAnswer {
  questionId: string
  optionId: string | null
  customText: string | null
  followUpText: string | null
  optionLabel?: string
  optionValue?: string
}

// ═══════════════════════════════════════════
// 題目類型定義
// ═══════════════════════════════════════════

export interface CoreStoryQuestion {
  id: string
  title: string
  subtitle: string | null
  placeholder: string | null
  display_order: number
}

export interface OneLinerQuestion {
  id: string
  question: string
  format_hint: string | null
  placeholder: string | null
  display_order: number
}

export interface StoryCategory {
  id: string
  name: string
  icon: string | null
  description: string | null
  display_order: number
}

export interface StoryQuestion {
  id: string
  category_id: string
  title: string
  subtitle: string | null
  placeholder: string | null
  difficulty: 'easy' | 'medium' | 'deep'
  display_order: number
}

export interface QuestionsData {
  coreStories: CoreStoryQuestion[]
  oneLiners: OneLinerQuestion[]
  categories: StoryCategory[]
  stories: StoryQuestion[]
}

// ═══════════════════════════════════════════
// Hook: useQuestions
// ═══════════════════════════════════════════

export function useQuestions() {
  return useQuery({
    queryKey: ['questions'],
    queryFn: async (): Promise<QuestionsData> => {
      const response = await biographyContentService.getQuestions()
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch questions')
      }
      // Map API response to our types (convert undefined to null)
      return {
        coreStories: (response.data.core_stories || []).map((q) => ({
          id: q.id,
          title: q.title,
          subtitle: q.subtitle ?? null,
          placeholder: q.placeholder ?? null,
          display_order: q.display_order,
        })),
        oneLiners: (response.data.one_liners || []).map((q) => ({
          id: q.id,
          question: q.question,
          format_hint: q.format_hint ?? null,
          placeholder: q.placeholder ?? null,
          display_order: q.display_order,
        })),
        categories: (response.data.story_categories || []).map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon ?? null,
          description: c.description ?? null,
          display_order: c.display_order,
        })),
        stories: (response.data.stories || []).map((q) => ({
          id: q.id,
          category_id: q.category_id,
          title: q.title,
          subtitle: q.subtitle ?? null,
          placeholder: q.placeholder ?? null,
          difficulty: q.difficulty as 'easy' | 'medium' | 'deep',
          display_order: q.display_order,
        })),
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour - questions rarely change
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

// ═══════════════════════════════════════════
// Helper Hooks
// ═══════════════════════════════════════════

/**
 * 根據 ID 取得核心故事問題
 */
export function useCoreStoryQuestion(questionId: string | undefined) {
  const { data } = useQuestions()
  if (!questionId || !data) return undefined
  return data.coreStories.find((q) => q.id === questionId)
}

/**
 * 根據 ID 取得一句話問題
 */
export function useOneLinerQuestion(questionId: string | undefined) {
  const { data } = useQuestions()
  if (!questionId || !data) return undefined
  return data.oneLiners.find((q) => q.id === questionId)
}

/**
 * 根據 ID 取得故事問題
 */
export function useStoryQuestion(questionId: string | undefined) {
  const { data } = useQuestions()
  if (!questionId || !data) return undefined
  return data.stories.find((q) => q.id === questionId)
}

/**
 * 根據 ID 取得故事分類
 */
export function useStoryCategory(categoryId: string | undefined) {
  const { data } = useQuestions()
  if (!categoryId || !data) return undefined
  return data.categories.find((c) => c.id === categoryId)
}

/**
 * 取得按分類分組的故事問題
 */
export function useStoriesByCategory() {
  const { data, isLoading, error } = useQuestions()

  if (!data) {
    return { groupedStories: [], isLoading, error }
  }

  const groupedStories = data.categories.map((category) => ({
    ...category,
    questions: data.stories.filter((q) => q.category_id === category.id),
  }))

  return { groupedStories, isLoading, error }
}

// ═══════════════════════════════════════════
// Utility Functions (不依賴 React hooks)
// ═══════════════════════════════════════════

/**
 * 從題目資料中找核心故事問題
 */
export function getCoreStoryQuestionFromData(
  data: QuestionsData | undefined,
  questionId: string
): CoreStoryQuestion | undefined {
  return data?.coreStories.find((q) => q.id === questionId)
}

/**
 * 從題目資料中找一句話問題
 */
export function getOneLinerQuestionFromData(
  data: QuestionsData | undefined,
  questionId: string
): OneLinerQuestion | undefined {
  return data?.oneLiners.find((q) => q.id === questionId)
}

/**
 * 從題目資料中找故事問題
 */
export function getStoryQuestionFromData(
  data: QuestionsData | undefined,
  questionId: string
): StoryQuestion | undefined {
  return data?.stories.find((q) => q.id === questionId)
}

/**
 * 從題目資料中找分類
 */
export function getStoryCategoryFromData(
  data: QuestionsData | undefined,
  categoryId: string
): StoryCategory | undefined {
  return data?.categories.find((c) => c.id === categoryId)
}

// ═══════════════════════════════════════════
// Story Prompt Modal 輔助函數
// ═══════════════════════════════════════════

/**
 * 用於推題 Modal 的故事問題格式
 */
export interface PromptStoryQuestion {
  field: string
  category: string
  title: string
  subtitle: string
  placeholder: string
  icon?: string
}

/**
 * 將 API 故事問題轉換為推題 Modal 格式
 */
export function convertToPromptQuestions(data: QuestionsData): PromptStoryQuestion[] {
  return data.stories.map((q) => ({
    field: q.id,
    category: q.category_id,
    title: q.title,
    subtitle: q.subtitle || '',
    placeholder: q.placeholder || '分享你的故事...',
    icon: 'MessageCircle',
  }))
}

/**
 * 取得未填寫的推題問題
 */
export function getUnfilledPromptQuestions(
  questions: PromptStoryQuestion[],
  biography: Record<string, unknown>
): PromptStoryQuestion[] {
  return questions.filter((q) => {
    const value = biography[q.field]
    return !value || (typeof value === 'string' && value.trim().length === 0)
  })
}

/**
 * 計算推題問題進度
 */
export function calculatePromptProgress(
  questions: PromptStoryQuestion[],
  biography: Record<string, unknown>
): {
  total: number
  completed: number
  percentage: number
  byCategory: Record<string, { total: number; completed: number }>
} {
  const byCategory: Record<string, { total: number; completed: number }> = {}
  let total = 0
  let completed = 0

  questions.forEach((q) => {
    total++
    if (!byCategory[q.category]) {
      byCategory[q.category] = { total: 0, completed: 0 }
    }
    byCategory[q.category].total++

    const value = biography[q.field]
    if (value && typeof value === 'string' && value.trim().length > 0) {
      completed++
      byCategory[q.category].completed++
    }
  })

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    byCategory,
  }
}

// ═══════════════════════════════════════════
// 選擇題 Hooks
// ═══════════════════════════════════════════

/**
 * 取得選擇題（含選項統計）
 */
export function useChoiceQuestions(stage: string = 'onboarding') {
  return useQuery({
    queryKey: ['choice-questions', stage],
    queryFn: async (): Promise<ChoiceQuestion[]> => {
      const response = await biographyContentService.getChoiceQuestions(stage)
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch choice questions')
      }
      // Map API response to our types
      return response.data.map((q) => ({
        id: q.id,
        question: q.question,
        hint: q.hint ?? null,
        followUpPrompt: q.follow_up_prompt ?? null,
        followUpPlaceholder: q.follow_up_placeholder ?? null,
        options: (q.options || []).map((opt) => ({
          id: opt.id,
          label: opt.label,
          value: opt.value,
          isOther: opt.is_other,
          responseTemplate: opt.response_template || '',
          count: opt.count || 0,
        })),
      }))
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}

/**
 * 提交選擇題回答
 */
export function useSubmitChoiceAnswer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      biographyId,
      questionId,
      optionId,
      customText,
      followUpText,
    }: {
      biographyId: string
      questionId: string
      optionId?: string
      customText?: string
      followUpText?: string
    }) => {
      const response = await biographyContentService.submitChoiceAnswer(
        biographyId,
        questionId,
        optionId,
        customText,
        followUpText
      )
      if (!response.success) {
        throw new Error(response.error || 'Failed to submit answer')
      }
      return response.data
    },
    onSuccess: () => {
      // 重新載入選擇題以更新統計數字
      queryClient.invalidateQueries({ queryKey: ['choice-questions'] })
    },
  })
}

/**
 * 取得用戶的選擇題回答
 */
export function useChoiceAnswers(biographyId: string | undefined) {
  return useQuery({
    queryKey: ['choice-answers', biographyId],
    queryFn: async (): Promise<ChoiceAnswer[]> => {
      if (!biographyId) return []
      const response = await biographyContentService.getChoiceAnswers(biographyId)
      if (!response.success || !response.data) {
        return []
      }
      return response.data.map((a) => ({
        questionId: a.question_id,
        optionId: a.option_id ?? null,
        customText: a.custom_text ?? null,
        followUpText: a.follow_up_text ?? null,
        optionLabel: a.option_label,
        optionValue: a.option_value,
      }))
    },
    enabled: !!biographyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
