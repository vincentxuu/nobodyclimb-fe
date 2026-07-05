import { NotificationType } from '../repositories/notification-repository'

/**
 * 依通知類型組出前端導向路徑（供推播 deep-link 使用）
 *
 * 與 apps/mobile 的 getNotificationRoute、apps/web 的 getNotificationLink 對齊。
 * 多數類型可只靠 target_id 組出，需要 slug 的類型（new_follower、biography_commented）
 * 由呼叫端先解析好 slug 再傳入。
 */
export function buildNotificationPath(
  type: NotificationType,
  opts: { targetId?: string | null; actorSlug?: string | null; targetSlug?: string | null }
): string | null {
  const { targetId, actorSlug, targetSlug } = opts

  switch (type) {
    case 'post_liked':
    case 'post_commented':
      return targetId ? `/blog/${targetId}` : null
    case 'goal_liked':
    case 'goal_commented':
    case 'goal_referenced':
      return targetId ? `/bucket-list/${targetId}` : null
    case 'core_story_liked':
    case 'core_story_commented':
      return targetId ? `/story/core-stories/${targetId}` : null
    case 'one_liner_liked':
    case 'one_liner_commented':
      return targetId ? `/story/one-liners/${targetId}` : null
    case 'story_liked':
    case 'story_commented':
      return targetId ? `/story/stories/${targetId}` : null
    case 'biography_commented':
      return targetSlug ? `/biography/profile/${targetSlug}` : null
    case 'new_follower':
      return actorSlug ? `/biography/profile/${actorSlug}` : null
    default:
      return null
  }
}
