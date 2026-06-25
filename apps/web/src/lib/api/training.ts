import type { PersonalityTypeCode, TrainingPlan, TrainingProgressRecord } from '@nobodyclimb/types'
import type { ApiResponse } from '@/lib/types'
import apiClient from './client'

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
