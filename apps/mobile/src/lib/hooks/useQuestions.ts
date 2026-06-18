/**
 * useQuestions Hook
 *
 * 對應 apps/web/src/lib/hooks/useQuestions.ts
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

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

export interface PromptStoryQuestion {
  id: string
  field: string
  category: string
  title: string
  subtitle: string
  placeholder: string
  difficulty?: StoryQuestion['difficulty']
}

// ═══════════════════════════════════════════
// Hook: useQuestions
// ═══════════════════════════════════════════

export function useQuestions() {
  return useQuery({
    queryKey: ['questions'],
    queryFn: async (): Promise<QuestionsData> => {
      const response = await apiClient.get('/biography/questions')
      const data = response.data

      if (!data) {
        throw new Error('Failed to fetch questions')
      }

      // Map API response to our types (convert undefined to null)
      return {
        coreStories: (data.core_stories || []).map((q: any) => ({
          id: q.id,
          title: q.title,
          subtitle: q.subtitle ?? null,
          placeholder: q.placeholder ?? null,
          display_order: q.display_order,
        })),
        oneLiners: (data.one_liners || []).map((q: any) => ({
          id: q.id,
          question: q.question,
          format_hint: q.format_hint ?? null,
          placeholder: q.placeholder ?? null,
          display_order: q.display_order,
        })),
        categories: (data.story_categories || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: c.icon ?? null,
          description: c.description ?? null,
          display_order: c.display_order,
        })),
        stories: (data.stories || []).map((q: any) => ({
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

/**
 * 將故事題目轉成登入推題可用格式
 */
export function convertToPromptQuestions(data: QuestionsData): PromptStoryQuestion[] {
  return data.stories.map((question) => ({
    id: question.id,
    field: question.id,
    category: question.category_id,
    title: question.title,
    subtitle: question.subtitle ?? '',
    placeholder: question.placeholder ?? '寫下你的攀岩故事...',
    difficulty: question.difficulty,
  }))
}

/**
 * 找出人物誌尚未填寫的推題
 */
export function getUnfilledPromptQuestions(
  questions: PromptStoryQuestion[],
  biography: Record<string, unknown>
): PromptStoryQuestion[] {
  return questions.filter((question) => {
    const value = biography[question.field]
    return typeof value !== 'string' || value.trim().length === 0
  })
}

/**
 * 計算推題完成進度
 */
export function calculatePromptProgress(
  questions: PromptStoryQuestion[],
  biography: Record<string, unknown>
) {
  const completed = questions.filter((question) => {
    const value = biography[question.field]
    return typeof value === 'string' && value.trim().length > 0
  }).length
  const total = questions.length

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
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
      const response = await apiClient.get(`/biography/choice-questions?stage=${stage}`)
      const data = response.data

      if (!data) {
        throw new Error('Failed to fetch choice questions')
      }

      // Map API response to our types
      return data.map((q: any) => ({
        id: q.id,
        question: q.question,
        hint: q.hint ?? null,
        followUpPrompt: q.follow_up_prompt ?? null,
        followUpPlaceholder: q.follow_up_placeholder ?? null,
        options: (q.options || []).map((opt: any) => ({
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
      const response = await apiClient.post(`/biography/${biographyId}/choice-answers`, {
        question_id: questionId,
        option_id: optionId,
        custom_text: customText,
        follow_up_text: followUpText,
      })

      if (!response.data) {
        throw new Error('Failed to submit answer')
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

      const response = await apiClient.get(`/biography/${biographyId}/choice-answers`)

      if (!response.data) {
        return []
      }

      return response.data.map((a: any) => ({
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
