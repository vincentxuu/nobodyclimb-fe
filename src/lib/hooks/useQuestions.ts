'use client'

import { useQuery } from '@tanstack/react-query'
import { biographyContentService } from '@/lib/api/services'

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
  emoji: string | null
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
          emoji: c.emoji ?? null,
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
