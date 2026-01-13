import { z } from 'zod'

/**
 * 人生清單分類列舉
 */
export const bucketListCategorySchema = z.enum([
  'outdoor_route',
  'indoor_grade',
  'competition',
  'training',
  'adventure',
  'skill',
  'injury_recovery',
  'other',
])

/**
 * 里程碑 schema
 */
export const milestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1, '里程碑名稱不能為空'),
  percentage: z.number().min(0).max(100),
  completed: z.boolean(),
  completed_at: z.string().nullable(),
  note: z.string().nullable(),
})

/**
 * 人生清單項目輸入 schema (創建/更新)
 */
export const bucketListItemInputSchema = z.object({
  title: z.string().min(1, '目標名稱不能為空').max(100, '目標名稱不能超過 100 字'),
  category: bucketListCategorySchema.optional().default('other'),
  description: z.string().max(1000, '描述不能超過 1000 字').optional(),
  target_grade: z.string().max(50, '目標難度不能超過 50 字').optional(),
  target_location: z.string().max(100, '目標地點不能超過 100 字').optional(),
  target_date: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional().default('active'),
  enable_progress: z.boolean().optional().default(false),
  progress_mode: z.enum(['manual', 'milestone']).nullable().optional(),
  progress: z.number().min(0).max(100).optional().default(0),
  milestones: z.array(milestoneSchema).optional(),
  is_public: z.boolean().optional().default(true),
  sort_order: z.number().optional(),
})

/**
 * 完成人生清單目標 schema
 */
export const bucketListCompleteSchema = z.object({
  completion_story: z.string().max(5000, '完成故事不能超過 5000 字').optional(),
  psychological_insights: z.string().max(2000, '心理層面心得不能超過 2000 字').optional(),
  technical_insights: z.string().max(2000, '技術層面心得不能超過 2000 字').optional(),
  completion_media: z
    .object({
      youtube_videos: z.array(z.string()).optional(),
      instagram_posts: z.array(z.string()).optional(),
      photos: z.array(z.string()).optional(),
    })
    .optional(),
})

/**
 * 進度更新 schema
 */
export const progressUpdateSchema = z.object({
  progress: z.number().min(0, '進度不能小於 0').max(100, '進度不能超過 100'),
})

/**
 * 里程碑更新 schema
 */
export const milestoneUpdateSchema = z.object({
  milestone_id: z.string(),
  completed: z.boolean().optional(),
  note: z.string().max(500, '筆記不能超過 500 字').optional(),
})

/**
 * 留言 schema
 */
export const commentSchema = z.object({
  content: z.string().min(1, '留言不能為空').max(500, '留言不能超過 500 字'),
})

// 匯出類型
export type BucketListCategorySchema = z.infer<typeof bucketListCategorySchema>
export type MilestoneSchema = z.infer<typeof milestoneSchema>
export type BucketListItemInputSchema = z.infer<typeof bucketListItemInputSchema>
export type BucketListCompleteSchema = z.infer<typeof bucketListCompleteSchema>
export type ProgressUpdateSchema = z.infer<typeof progressUpdateSchema>
export type MilestoneUpdateSchema = z.infer<typeof milestoneUpdateSchema>
export type CommentSchema = z.infer<typeof commentSchema>
