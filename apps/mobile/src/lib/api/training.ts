/**
 * 訓練計畫 API
 *
 * 對應 apps/web/src/lib/api/training.ts
 */

import type { PersonalityTypeCode, TrainingPlan, TrainingProgressRecord } from '@nobodyclimb/types'
import { apiClient } from '@/lib/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

export const trainingService = {
  fetchTrainingPlan: async (type: PersonalityTypeCode) => {
    const response = await apiClient.get<ApiResponse<TrainingPlan>>(`/training/plan/${type}`)
    return response.data
  },

  fetchTrainingProgress: async (type: PersonalityTypeCode) => {
    const response = await apiClient.get<ApiResponse<TrainingProgressRecord[]>>(
      '/training/progress/me',
      { params: { type } }
    )
    return response.data
  },

  updateTrainingProgress: async (payload: {
    personality_type: PersonalityTypeCode
    week: number
    day: number
    completed: boolean
    notes?: string | null
  }) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/training/progress',
      payload
    )
    return response.data
  },
}
