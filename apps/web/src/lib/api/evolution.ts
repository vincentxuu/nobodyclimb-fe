import apiClient from '@/lib/api/client'

// Types
export interface EvolutionResult {
  changed: boolean
  reason?: string
  personality_type?: string
  power_pct?: number
  goal_pct?: number
  bold_pct?: number
  style_spectrum?: number | null
  consecutive_count?: number
  weeks_stable?: number
}

export interface EvolutionRecord {
  id: string
  user_id: string
  from_type: string | null
  to_type: string
  power_pct: number
  goal_pct: number
  bold_pct: number
  style_spectrum: number | null
  trigger: string
  consecutive_count: number
  calculated_at: string
}

export interface StyleSpectrumData {
  spectrum: number | null
  position: SpectrumPosition | null
  onsight_max_grade: string | null
  onsight_max_numeric: number | null
  redpoint_max_grade: string | null
  redpoint_max_numeric: number | null
}

export interface SpectrumPosition {
  position: string
  nameZh: string
  name: string
  description: string
  growthDirection: string
}

export interface EvolutionNotification {
  has_notification: boolean
  evolution?: EvolutionRecord
}

// Evolution API methods
export const evolutionApi = {
  calculateEvolution: () =>
    apiClient.post<{ success: boolean; data: EvolutionResult }>('/quiz/evolution/calculate'),

  getTimeline: () =>
    apiClient.get<{ success: boolean; data: EvolutionRecord[] }>('/quiz/evolution/timeline'),

  getStyleSpectrum: () =>
    apiClient.get<{ success: boolean; data: StyleSpectrumData }>('/quiz/evolution/style-spectrum'),

  getNotification: () =>
    apiClient.get<{ success: boolean; data: EvolutionNotification }>(
      '/quiz/evolution/notification'
    ),

  markNotificationRead: () =>
    apiClient.post<{ success: boolean }>('/quiz/evolution/notification/read'),
}
