import { Hono } from 'hono';
import { Env } from '../types';
import { generateId, parsePagination } from '../utils/id';
import { authMiddleware } from '../middleware/auth';

export const notificationsRoutes = new Hono<{ Bindings: Env }>();

// ═══════════════════════════════════════════════════════════
// 通知 API
// ═══════════════════════════════════════════════════════════

// GET /notifications - Get user's notifications
notificationsRoutes.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );
  const unreadOnly = c.req.query('unread') === 'true';

  let whereClause = 'n.user_id = ?';
  const params: (string | number)[] = [userId];

  if (unreadOnly) {
    whereClause += ' AND n.is_read = 0';
  }

  // Get total count
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM notifications n WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get notifications with actor info
  const notifications = await c.env.DB.prepare(
    `SELECT n.*, u.username as actor_name, u.avatar_url as actor_avatar
     FROM notifications n
     LEFT JOIN users u ON n.actor_id = u.id
     WHERE ${whereClause}
     ORDER BY n.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all();

  return c.json({
    success: true,
    data: notifications.results,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// GET /notifications/unread-count - Get unread notification count
notificationsRoutes.get('/unread-count', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const result = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
  )
    .bind(userId)
    .first<{ count: number }>();

  return c.json({
    success: true,
    data: {
      count: result?.count || 0,
    },
  });
});

// PUT /notifications/:id/read - Mark notification as read
notificationsRoutes.put('/:id/read', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  // Verify ownership
  const notification = await c.env.DB.prepare(
    'SELECT id FROM notifications WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first<{ id: string }>();

  if (!notification) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Notification not found',
      },
      404
    );
  }

  await c.env.DB.prepare(
    'UPDATE notifications SET is_read = 1 WHERE id = ?'
  )
    .bind(id)
    .run();

  return c.json({
    success: true,
    message: 'Notification marked as read',
  });
});

// PUT /notifications/read-all - Mark all notifications as read
notificationsRoutes.put('/read-all', authMiddleware, async (c) => {
  const userId = c.get('userId');

  await c.env.DB.prepare(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
  )
    .bind(userId)
    .run();

  return c.json({
    success: true,
    message: 'All notifications marked as read',
  });
});

// DELETE /notifications/:id - Delete notification
notificationsRoutes.delete('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  // Verify ownership
  const notification = await c.env.DB.prepare(
    'SELECT id FROM notifications WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first<{ id: string }>();

  if (!notification) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Notification not found',
      },
      404
    );
  }

  await c.env.DB.prepare('DELETE FROM notifications WHERE id = ?')
    .bind(id)
    .run();

  return c.json({
    success: true,
    message: 'Notification deleted',
  });
});

// DELETE /notifications - Delete all notifications
notificationsRoutes.delete('/', authMiddleware, async (c) => {
  const userId = c.get('userId');

  await c.env.DB.prepare('DELETE FROM notifications WHERE user_id = ?')
    .bind(userId)
    .run();

  return c.json({
    success: true,
    message: 'All notifications deleted',
  });
});

// ═══════════════════════════════════════════════════════════
// 通知偏好設定 API
// ═══════════════════════════════════════════════════════════

interface NotificationPreferences {
  goal_liked: boolean;
  goal_commented: boolean;
  goal_referenced: boolean;
  post_liked: boolean;
  post_commented: boolean;
  biography_commented: boolean;
  new_follower: boolean;
  story_featured: boolean;
  goal_completed: boolean;
  email_digest: boolean;
}

// GET /notifications/preferences - Get user's notification preferences
notificationsRoutes.get('/preferences', authMiddleware, async (c) => {
  const userId = c.get('userId');

  let prefs = await c.env.DB.prepare(
    'SELECT * FROM notification_preferences WHERE user_id = ?'
  )
    .bind(userId)
    .first<NotificationPreferences & { user_id: string }>();

  // If no preferences exist, create default ones
  if (!prefs) {
    await c.env.DB.prepare(
      'INSERT INTO notification_preferences (user_id) VALUES (?)'
    )
      .bind(userId)
      .run();

    prefs = await c.env.DB.prepare(
      'SELECT * FROM notification_preferences WHERE user_id = ?'
    )
      .bind(userId)
      .first<NotificationPreferences & { user_id: string }>();
  }

  return c.json({
    success: true,
    data: {
      goal_liked: !!prefs?.goal_liked,
      goal_commented: !!prefs?.goal_commented,
      goal_referenced: !!prefs?.goal_referenced,
      post_liked: !!prefs?.post_liked,
      post_commented: !!prefs?.post_commented,
      biography_commented: !!prefs?.biography_commented,
      new_follower: !!prefs?.new_follower,
      story_featured: !!prefs?.story_featured,
      goal_completed: !!prefs?.goal_completed,
      email_digest: !!prefs?.email_digest,
    },
  });
});

// PUT /notifications/preferences - Update user's notification preferences
notificationsRoutes.put('/preferences', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<Partial<NotificationPreferences>>();

  // Validate input
  const validKeys: (keyof NotificationPreferences)[] = [
    'goal_liked',
    'goal_commented',
    'goal_referenced',
    'post_liked',
    'post_commented',
    'biography_commented',
    'new_follower',
    'story_featured',
    'goal_completed',
    'email_digest',
  ];

  const updates: string[] = [];
  const values: (number | string)[] = [];

  for (const key of validKeys) {
    if (key in body) {
      updates.push(`${key} = ?`);
      values.push(body[key] ? 1 : 0);
    }
  }

  if (updates.length === 0) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'No valid preferences provided',
      },
      400
    );
  }

  // Ensure preferences row exists
  await c.env.DB.prepare(
    'INSERT OR IGNORE INTO notification_preferences (user_id) VALUES (?)'
  )
    .bind(userId)
    .run();

  // Update preferences
  await c.env.DB.prepare(
    `UPDATE notification_preferences
     SET ${updates.join(', ')}, updated_at = datetime('now')
     WHERE user_id = ?`
  )
    .bind(...values, userId)
    .run();

  return c.json({
    success: true,
    message: 'Preferences updated',
  });
});

// ═══════════════════════════════════════════════════════════
// Notification Types
// ═══════════════════════════════════════════════════════════

export type NotificationType =
  | 'goal_completed'
  | 'goal_liked'
  | 'goal_commented'
  | 'goal_referenced'
  | 'new_follower'
  | 'story_featured'
  | 'biography_commented'
  | 'post_liked'
  | 'post_commented';

// ═══════════════════════════════════════════════════════════
// Helper function to create notifications (with deduplication)
// ═══════════════════════════════════════════════════════════

/**
 * 創建通知（支援去重和偏好設定）
 *
 * 功能：
 * 1. 偏好設定檢查：如果用戶已關閉該類型通知，則不創建
 * 2. 去重：相同的 userId + actorId + targetId + type 在 5 分鐘內只會創建一則通知
 *
 * @param db - D1 資料庫實例
 * @param data - 通知資料
 * @param options - 選項（可選）
 * @returns 通知 ID，如果被跳過則返回 null
 */
export async function createNotification(
  db: D1Database,
  data: {
    userId: string;
    type: NotificationType;
    actorId?: string;
    targetId?: string;
    title: string;
    message: string;
  },
  options?: {
    skipDedup?: boolean; // 跳過去重檢查
    skipPrefsCheck?: boolean; // 跳過偏好設定檢查
    dedupMinutes?: number; // 去重時間範圍（分鐘），預設 5
  }
): Promise<string | null> {
  const dedupMinutes = options?.dedupMinutes ?? 5;

  // 偏好設定檢查：如果用戶已關閉該類型通知，則不創建
  if (!options?.skipPrefsCheck) {
    const prefs = await db.prepare(
      `SELECT ${data.type} as enabled FROM notification_preferences WHERE user_id = ?`
    )
      .bind(data.userId)
      .first<{ enabled: number }>();

    // 如果有設定且已關閉，則跳過
    if (prefs && prefs.enabled === 0) {
      return null;
    }
  }

  // 去重檢查：相同的 actor + target + type 在指定時間內只創建一則通知
  if (!options?.skipDedup && data.actorId && data.targetId) {
    const existing = await db.prepare(
      `SELECT id FROM notifications
       WHERE user_id = ? AND actor_id = ? AND target_id = ? AND type = ?
       AND created_at > datetime('now', '-' || ? || ' minutes')`
    )
      .bind(data.userId, data.actorId, data.targetId, data.type, dedupMinutes)
      .first<{ id: string }>();

    if (existing) {
      // 已存在相同通知，跳過創建
      return null;
    }
  }

  const id = generateId();

  await db.prepare(
    `INSERT INTO notifications (id, user_id, type, actor_id, target_id, title, message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      data.userId,
      data.type,
      data.actorId || null,
      data.targetId || null,
      data.title,
      data.message
    )
    .run();

  return id;
}

// ═══════════════════════════════════════════════════════════
// 通知聚合功能
// ═══════════════════════════════════════════════════════════

/**
 * 聚合按讚類通知
 *
 * 當某個目標在短時間內收到多個按讚時，更新現有通知而非創建新通知
 * 例如：「小明 和其他 5 人對你的文章按讚」
 *
 * 聚合規則：
 * - 按讚類型：goal_liked, post_liked
 * - 聚合時間範圍：1 小時內
 * - 同一個目標的按讚會聚合成一則通知
 */
export async function createLikeNotificationWithAggregation(
  db: D1Database,
  data: {
    userId: string;
    type: 'goal_liked' | 'post_liked';
    actorId: string;
    actorName: string;
    targetId: string;
    targetTitle: string;
  }
): Promise<string | null> {
  // 偏好設定檢查：如果用戶已關閉該類型通知，則不創建
  const prefs = await db.prepare(
    `SELECT ${data.type} as enabled FROM notification_preferences WHERE user_id = ?`
  )
    .bind(data.userId)
    .first<{ enabled: number }>();

  if (prefs && prefs.enabled === 0) {
    return null;
  }

  // 檢查 1 小時內是否已有同一目標的按讚通知
  const existing = await db.prepare(
    `SELECT id, message FROM notifications
     WHERE user_id = ? AND target_id = ? AND type = ?
     AND created_at > datetime('now', '-1 hour')
     ORDER BY created_at DESC
     LIMIT 1`
  )
    .bind(data.userId, data.targetId, data.type)
    .first<{ id: string; message: string }>();

  if (existing) {
    // 聚合：統計這 1 小時內有多少不同的人按讚
    const countResult = await db.prepare(
      `SELECT COUNT(DISTINCT actor_id) as count FROM notifications
       WHERE user_id = ? AND target_id = ? AND type = ?
       AND created_at > datetime('now', '-1 hour')`
    )
      .bind(data.userId, data.targetId, data.type)
      .first<{ count: number }>();

    const totalLikers = (countResult?.count || 0) + 1; // 加上這次的按讚者

    // 更新現有通知的訊息
    const targetType = data.type === 'post_liked' ? '文章' : '目標';
    const newMessage =
      totalLikers > 1
        ? `${data.actorName} 和其他 ${totalLikers - 1} 人對你的${targetType}「${data.targetTitle}」按讚`
        : `${data.actorName} 對你的${targetType}「${data.targetTitle}」按讚`;

    await db.prepare(
      `UPDATE notifications SET message = ?, actor_id = ?, created_at = datetime('now')
       WHERE id = ?`
    )
      .bind(newMessage, data.actorId, existing.id)
      .run();

    return existing.id;
  }

  // 沒有現有通知，創建新的
  const targetType = data.type === 'post_liked' ? '文章' : '目標';
  return createNotification(db, {
    userId: data.userId,
    type: data.type,
    actorId: data.actorId,
    targetId: data.targetId,
    title: `你的${targetType}獲得按讚`,
    message: `${data.actorName} 對你的${targetType}「${data.targetTitle}」按讚`,
  }, { skipDedup: true });
}
