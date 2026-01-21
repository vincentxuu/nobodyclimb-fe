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
// 通知統計與分析 API
// ═══════════════════════════════════════════════════════════

// GET /notifications/stats - Get user's notification statistics
notificationsRoutes.get('/stats', authMiddleware, async (c) => {
  const userId = c.get('userId');

  // 基本統計
  const basicStats = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
      SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read
    FROM notifications
    WHERE user_id = ?
  `)
    .bind(userId)
    .first<{ total: number; unread: number; read: number }>();

  // 按類型統計
  const typeStats = await c.env.DB.prepare(`
    SELECT type, COUNT(*) as count
    FROM notifications
    WHERE user_id = ?
    GROUP BY type
    ORDER BY count DESC
  `)
    .bind(userId)
    .all<{ type: string; count: number }>();

  // 最近 7 天趨勢
  const dailyTrend = await c.env.DB.prepare(`
    SELECT
      date(created_at) as date,
      COUNT(*) as count
    FROM notifications
    WHERE user_id = ?
    AND created_at >= date('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `)
    .bind(userId)
    .all<{ date: string; count: number }>();

  // 已讀率計算
  const readRate = basicStats?.total
    ? Math.round(((basicStats.read || 0) / basicStats.total) * 100)
    : 0;

  return c.json({
    success: true,
    data: {
      overview: {
        total: basicStats?.total || 0,
        unread: basicStats?.unread || 0,
        read: basicStats?.read || 0,
        readRate,
      },
      byType: typeStats.results || [],
      dailyTrend: dailyTrend.results || [],
    },
  });
});

// ═══════════════════════════════════════════════════════════
// Admin 廣播通知 API
// ═══════════════════════════════════════════════════════════

// POST /notifications/admin/broadcast - Send broadcast notification (Admin only)
notificationsRoutes.post('/admin/broadcast', authMiddleware, async (c) => {
  const user = c.get('user');

  if (user?.role !== 'admin') {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'Admin access required',
      },
      403
    );
  }

  const { title, message, targetRole } = await c.req.json<{
    title: string;
    message: string;
    targetRole?: 'all' | 'user' | 'moderator' | 'admin';
  }>();

  if (!title || !message) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: '標題和內容為必填',
      },
      400
    );
  }

  // 獲取目標用戶
  let whereClause = 'is_active = 1';
  if (targetRole && targetRole !== 'all') {
    whereClause += ` AND role = '${targetRole}'`;
  }

  const users = await c.env.DB.prepare(
    `SELECT id FROM users WHERE ${whereClause}`
  ).all<{ id: string }>();

  if (!users.results || users.results.length === 0) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: '沒有找到符合條件的用戶',
      },
      404
    );
  }

  // 批次創建通知
  const actorId = c.get('userId');
  let successCount = 0;

  for (const targetUser of users.results) {
    const notifId = generateId();
    try {
      await c.env.DB.prepare(
        `INSERT INTO notifications (id, user_id, type, actor_id, title, message)
         VALUES (?, ?, 'system_announcement', ?, ?, ?)`
      )
        .bind(notifId, targetUser.id, actorId, title, message)
        .run();
      successCount++;
    } catch (err) {
      console.error(`Failed to create notification for user ${targetUser.id}:`, err);
    }
  }

  return c.json({
    success: true,
    data: {
      totalUsers: users.results.length,
      successCount,
      failedCount: users.results.length - successCount,
    },
    message: `已發送 ${successCount} 則廣播通知`,
  });
});

// GET /notifications/admin/broadcasts - Get broadcast history (Admin only)
notificationsRoutes.get('/admin/broadcasts', authMiddleware, async (c) => {
  const user = c.get('user');

  if (user?.role !== 'admin') {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'Admin access required',
      },
      403
    );
  }

  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  // 獲取廣播通知（按標題和時間分組）
  const broadcasts = await c.env.DB.prepare(
    `SELECT
      MIN(n.id) as id,
      n.title,
      n.message,
      n.actor_id,
      u.username as actor_name,
      MIN(n.created_at) as created_at,
      COUNT(*) as recipient_count,
      SUM(CASE WHEN n.is_read = 1 THEN 1 ELSE 0 END) as read_count
    FROM notifications n
    LEFT JOIN users u ON n.actor_id = u.id
    WHERE n.type = 'system_announcement'
    GROUP BY n.title, n.message, DATE(n.created_at)
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all<{
      id: string;
      title: string;
      message: string;
      actor_id: string;
      actor_name: string;
      created_at: string;
      recipient_count: number;
      read_count: number;
    }>();

  // 獲取總數
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(DISTINCT title || message || DATE(created_at)) as count
     FROM notifications
     WHERE type = 'system_announcement'`
  ).first<{ count: number }>();

  return c.json({
    success: true,
    data: broadcasts.results || [],
    pagination: {
      page,
      limit,
      total: countResult?.count || 0,
      total_pages: Math.ceil((countResult?.count || 0) / limit),
    },
  });
});

// GET /notifications/admin/stats - Admin statistics (requires admin role)
notificationsRoutes.get('/admin/stats', authMiddleware, async (c) => {
  const user = c.get('user');

  // 簡單的管理員檢查（可根據實際需求調整）
  if (user?.role !== 'admin') {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'Admin access required',
      },
      403
    );
  }

  // 系統級統計（過去 24 小時）
  const systemStats = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as total_24h,
      SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_24h,
      COUNT(DISTINCT user_id) as users_with_notifications
    FROM notifications
    WHERE created_at > datetime('now', '-24 hours')
  `).first<{
    total_24h: number;
    unread_24h: number;
    users_with_notifications: number;
  }>();

  // 按類型統計（過去 24 小時）
  const typeStats24h = await c.env.DB.prepare(`
    SELECT type, COUNT(*) as count
    FROM notifications
    WHERE created_at > datetime('now', '-24 hours')
    GROUP BY type
    ORDER BY count DESC
  `).all<{ type: string; count: number }>();

  // 每小時趨勢（過去 24 小時）
  const hourlyTrend = await c.env.DB.prepare(`
    SELECT
      strftime('%Y-%m-%d %H:00', created_at) as hour,
      COUNT(*) as count
    FROM notifications
    WHERE created_at > datetime('now', '-24 hours')
    GROUP BY strftime('%Y-%m-%d %H:00', created_at)
    ORDER BY hour ASC
  `).all<{ hour: string; count: number }>();

  // 通知最多的用戶（過去 24 小時，前 10 名）
  const topRecipients = await c.env.DB.prepare(`
    SELECT
      n.user_id,
      u.username,
      u.display_name,
      COUNT(*) as notification_count
    FROM notifications n
    LEFT JOIN users u ON n.user_id = u.id
    WHERE n.created_at > datetime('now', '-24 hours')
    GROUP BY n.user_id
    ORDER BY notification_count DESC
    LIMIT 10
  `).all<{
    user_id: string;
    username: string;
    display_name: string | null;
    notification_count: number;
  }>();

  return c.json({
    success: true,
    data: {
      period: '24h',
      overview: {
        total: systemStats?.total_24h || 0,
        unread: systemStats?.unread_24h || 0,
        usersWithNotifications: systemStats?.users_with_notifications || 0,
      },
      byType: typeStats24h.results || [],
      hourlyTrend: hourlyTrend.results || [],
      topRecipients: topRecipients.results || [],
    },
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
