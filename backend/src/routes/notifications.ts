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
// Helper function to create notifications
// ═══════════════════════════════════════════════════════════

export async function createNotification(
  db: D1Database,
  data: {
    userId: string;
    type: 'goal_completed' | 'goal_liked' | 'goal_commented' | 'goal_referenced' | 'new_follower' | 'story_featured';
    actorId?: string;
    targetId?: string;
    title: string;
    message: string;
  }
) {
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
