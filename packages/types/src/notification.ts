/**
 * 通知相關類型定義
 */

/**
 * 通知類型枚舉
 */
export enum NotificationType {
  GOAL_LIKED = 'goal_liked',
  GOAL_COMMENTED = 'goal_commented',
  GOAL_REFERENCED = 'goal_referenced',
  NEW_FOLLOWER = 'new_follower',
  STORY_FEATURED = 'story_featured',
  BIOGRAPHY_COMMENTED = 'biography_commented',
  POST_LIKED = 'post_liked',
  POST_COMMENTED = 'post_commented',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}

/**
 * 通知介面
 */
export interface Notification {
  id: string
  user_id: string
  type: NotificationType | string
  actor_id: string | null
  target_id: string | null
  title: string
  message: string
  is_read: number
  created_at: string
  actor_name?: string
  actor_avatar?: string
}
