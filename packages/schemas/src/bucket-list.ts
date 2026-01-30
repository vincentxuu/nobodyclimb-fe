/**
 * 人生清單相關 Zod Schemas
 */
import { z } from 'zod'

/**
 * 人生清單分類
 */
export const BUCKET_LIST_CATEGORIES = [
  'outdoor_route',
  'indoor_grade',
  'competition',
  'training',
  'adventure',
  'skill',
  'injury_recovery',
  'other',
] as const

export type BucketListCategoryValue = (typeof BUCKET_LIST_CATEGORIES)[number]

/**
 * 里程碑 Schema
 */
export const milestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1, '標題不能為空').max(100, '標題過長'),
  percentage: z.number().min(0).max(100),
  completed: z.boolean(),
  completed_at: z.string().nullable(),
  note: z.string().max(500).nullable(),
})

export type MilestoneInput = z.infer<typeof milestoneSchema>

/**
 * 建立人生清單項目 Schema
 */
export const createBucketListSchema = z.object({
  title: z.string().min(1, '標題不能為空').max(200, '標題過長'),
  category: z.enum(BUCKET_LIST_CATEGORIES).optional().default('other'),
  description: z.string().max(2000, '描述過長').optional(),
  target_grade: z.string().max(20).optional(),
  target_location: z.string().max(200).optional(),
  target_date: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional().default('active'),
  enable_progress: z.boolean().optional().default(false),
  progress_mode: z.enum(['manual', 'milestone']).nullable().optional(),
  progress: z.number().min(0).max(100).optional().default(0),
  milestones: z.array(milestoneSchema).optional(),
  is_public: z.boolean().optional().default(true),
  sort_order: z.number().int().optional(),
})

export type CreateBucketListInput = z.infer<typeof createBucketListSchema>

/**
 * 更新人生清單項目 Schema
 */
export const updateBucketListSchema = createBucketListSchema.partial()

export type UpdateBucketListInput = z.infer<typeof updateBucketListSchema>

/**
 * 完成人生清單目標 Schema
 */
export const completeBucketListSchema = z.object({
  completion_story: z.string().max(5000, '故事過長').optional(),
  psychological_insights: z.string().max(2000, '內容過長').optional(),
  technical_insights: z.string().max(2000, '內容過長').optional(),
  completion_media: z
    .object({
      youtube_videos: z.array(z.string().url()).optional(),
      instagram_posts: z.array(z.string().url()).optional(),
      photos: z.array(z.string().url()).optional(),
    })
    .optional(),
})

export type CompleteBucketListInput = z.infer<typeof completeBucketListSchema>
