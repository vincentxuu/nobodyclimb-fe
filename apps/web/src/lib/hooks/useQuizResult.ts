import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'

interface QuizResultData {
  id: string
  user_id: string | null
  personality_type: string
  power_pct: number
  goal_pct: number
  bold_pct: number
  grit_index: number | null
  flow_index: number | null
  version: number
  created_at: string
  answers?: number[]
}

interface QuizResultResponse {
  latest: QuizResultData | null
  history: QuizResultData[]
}

export function useQuizResult(enabled = true) {
  return useQuery({
    queryKey: ['quiz', 'results', 'me'],
    queryFn: async (): Promise<QuizResultResponse> => {
      const { data } = await apiClient.get<{ success: boolean; data: QuizResultResponse }>(
        '/quiz/results/me'
      )
      return data.data
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useUserQuizResult(userId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['quiz', 'results', 'user', userId],
    queryFn: async (): Promise<QuizResultData | null> => {
      const url = '/quiz/results/user/' + userId
      const { data } = await apiClient.get<{ success: boolean; data: QuizResultData | null }>(url)
      return data.data
    },
    enabled: enabled && !!userId,
    staleTime: 10 * 60 * 1000,
    retry: false,
  })
}
