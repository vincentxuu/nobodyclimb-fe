/**
 * Guest Session 相關 Zod Schemas
 */
import { z } from 'zod'

/**
 * 建立 Guest Session Schema
 */
export const createSessionSchema = z.object({
  session_id: z.string().uuid().optional(),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>

/**
 * 追蹤活動 Schema
 */
export const trackActivitySchema = z.object({
  session_id: z.string().uuid('無效的 session ID'),
  page_views: z.number().int().min(0).optional(),
  time_spent_seconds: z.number().int().min(0).optional(),
  biography_views: z.number().int().min(0).optional(),
})

export type TrackActivityInput = z.infer<typeof trackActivitySchema>

/**
 * 建立匿名人物誌 Schema
 */
export const createAnonymousBiographySchema = z
  .object({
    session_id: z.string().uuid('無效的 session ID'),
    core_stories: z
      .array(
        z.object({
          question_id: z.string(),
          content: z.string().min(1, '內容不能為空').max(5000, '內容過長'),
        })
      )
      .optional()
      .default([]),
    one_liners: z
      .array(
        z.object({
          question_id: z.string(),
          answer: z.string().min(1, '回答不能為空').max(500, '回答過長'),
          question_text: z.string().optional(),
        })
      )
      .optional()
      .default([]),
    stories: z
      .array(
        z.object({
          question_id: z.string(),
          content: z.string().min(1, '內容不能為空').max(10000, '內容過長'),
          question_text: z.string().optional(),
          category_id: z.string().optional(),
        })
      )
      .optional()
      .default([]),
    contact_email: z.string().email('請輸入有效的電子郵件').optional(),
  })
  .refine(
    (data) =>
      data.core_stories.length > 0 ||
      data.one_liners.length > 0 ||
      data.stories.length > 0,
    { message: '請至少填寫一個故事' }
  )

export type CreateAnonymousBiographyInput = z.infer<typeof createAnonymousBiographySchema>

/**
 * 認領人物誌 Schema
 */
export const claimBiographySchema = z.object({
  keep_anonymous: z.boolean().optional().default(false),
})

export type ClaimBiographyInput = z.infer<typeof claimBiographySchema>
