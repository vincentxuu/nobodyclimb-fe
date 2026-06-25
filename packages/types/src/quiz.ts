/**
 * 攀岩人格測驗相關類型定義
 */

export type QuizAxis = 'body' | 'motive' | 'mind'
export type QuizDirection = 'left' | 'right'
export type PersonalityTypeCode = 'PGB' | 'PGS' | 'PFB' | 'PFS' | 'TGB' | 'TGS' | 'TFB' | 'TFS'

export interface QuizQuestion {
  id: string
  axis: QuizAxis
  direction: QuizDirection
  textZh: string
  order: number
}

export interface QuizAnswer {
  questionId: string
  value: 1 | 2 | 3 | 4 | 5
}

export interface AxisScore {
  axis: QuizAxis
  score: number
  direction: string
}

export interface QuizResult {
  typeCode: PersonalityTypeCode
  axisScores: AxisScore[]
  bodyPercent: number
  motivePercent: number
  mindPercent: number
  gritIndex: number
  flowIndex: number
}

export interface PersonalityType {
  code: PersonalityTypeCode
  nameZh: string
  nameEn: string
  color: string
  tagline: string
  description: string
  keywords: string[]
  strengths: string[]
  blindSpots: string[]
  bestPartner: PersonalityTypeCode
  worstMatch: PersonalityTypeCode
  flowState: string
  clutchState: string
}

export interface TrainingExercise {
  name: string
  description: string
}

export interface TrainingDay {
  dayNumber: number
  title: string
  description: string
  duration: number
  exercises: TrainingExercise[]
}

export interface TrainingWeek {
  weekNumber: number
  theme: string
  days: TrainingDay[]
}

export interface TrainingPlan {
  typeCode: PersonalityTypeCode
  weeks: TrainingWeek[]
}

export interface TrainingProgressRecord {
  id: string
  user_id: string
  personality_type: PersonalityTypeCode
  week: number
  day: number
  completed: boolean
  notes: string | null
  created_at: string
}
