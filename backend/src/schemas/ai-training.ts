import { z } from 'zod'

// AI response validation
export const AIExerciseSchema = z.object({
  name: z.string(),
  sets: z.union([z.number(), z.string()]).optional(),
  reps: z.union([z.number(), z.string()]).optional(),
  notes: z.string(),
})

export const AIDayPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.number(),
  exercises: z.array(AIExerciseSchema).min(1),
})

export const AIWeekPlanSchema = z.object({
  days: z.array(AIDayPlanSchema).length(3),
})

// API request schemas
const VALID_PERSONALITY_TYPES = ['PGB', 'PGS', 'PFB', 'PFS', 'TGB', 'TGS', 'TFB', 'TFS'] as const

export const GenerateRequestSchema = z.object({
  personality_type: z.enum(VALID_PERSONALITY_TYPES),
  week_number: z.number().int().min(1).max(4),
  force: z.boolean().optional().default(false),
})

export const FeedbackRequestSchema = z.object({
  plan_id: z.string().min(1),
  rating: z.enum(['too_easy', 'just_right', 'too_hard']),
  comment: z.string().max(500).optional(),
})

export type AIExercise = z.infer<typeof AIExerciseSchema>
export type AIDayPlan = z.infer<typeof AIDayPlanSchema>
export type AIWeekPlan = z.infer<typeof AIWeekPlanSchema>
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>
