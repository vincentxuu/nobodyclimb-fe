import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env } from '../types';
import { parsePagination } from '../utils/id';
import { authMiddleware } from '../middleware/auth';
import { NotificationRepository, NotificationType } from '../repositories/notification-repository';
import { NotificationService } from '../services/notification-service';

export const notificationsRoutes = new Hono<{ Bindings: Env }>();

/**
 * 初始化 Service
 */
function initService(c: any): NotificationService {
  const repository = new NotificationRepository(c.env.DB);
  return new NotificationService(repository, c.env.DB);
}

// ═══════════════════════════════════════════════════════════
// 通知 API
// ═══════════════════════════════════════════════════════════

// GET /notifications - Get user's notifications
notificationsRoutes.get(
  '/',
  describeRoute({
    tags: ['Notifications'],
    summary: '取得通知列表',
    description: '取得當前用戶的通知列表，支援分頁和篩選未讀通知，需要 Bearer token 認證',
    responses: {
      200: { description: '成功取得通知列表' },
      401: { description: '未認證' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');
    const { page, limit } = parsePagination(
      c.req.query('page'),
      c.req.query('limit')
    );
    const unreadOnly = c.req.query('unread') === 'true';

    const service = initService(c);
    const result = await service.getList(userId, { page, limit, unreadOnly });

    return c.json({
      success: true,
      ...result,
    });
  }
);

// GET /notifications/unread-count - Get unread notification count
notificationsRoutes.get(
  '/unread-count',
  describeRoute({
    tags: ['Notifications'],
    summary: '取得未讀通知數量',
    description: '取得當前用戶的未讀通知數量，需要 Bearer token 認證',
    responses: {
      200: { description: '成功取得未讀通知數量' },
      401: { description: '未認證' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');

    const service = initService(c);
    const count = await service.getUnreadCount(userId);

    return c.json({
      success: true,
      data: {
        count,
      },
    });
  }
);

// PUT /notifications/:id/read - Mark notification as read
notificationsRoutes.put(
  '/:id/read',
  describeRoute({
    tags: ['Notifications'],
    summary: '標記通知為已讀',
    description: '將指定通知標記為已讀狀態，需要 Bearer token 認證',
    responses: {
      200: { description: '成功標記為已讀' },
      401: { description: '未認證' },
      404: { description: '找不到通知' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const service = initService(c);

    try {
      await service.markAsRead(userId, id);

      return c.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Notification not found',
        },
        404
      );
    }
  }
);

// PUT /notifications/read-all - Mark all notifications as read
notificationsRoutes.put(
  '/read-all',
  describeRoute({
    tags: ['Notifications'],
    summary: '標記所有通知為已讀',
    description: '將當前用戶的所有通知標記為已讀狀態，需要 Bearer token 認證',
    responses: {
      200: { description: '成功標記所有通知為已讀' },
      401: { description: '未認證' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');

    const service = initService(c);
    await service.markAllAsRead(userId);

    return c.json({
      success: true,
      message: 'All notifications marked as read',
    });
  }
);

// DELETE /notifications/:id - Delete notification
notificationsRoutes.delete(
  '/:id',
  describeRoute({
    tags: ['Notifications'],
    summary: '刪除通知',
    description: '刪除指定的通知，需要 Bearer token 認證',
    responses: {
      200: { description: '成功刪除通知' },
      401: { description: '未認證' },
      404: { description: '找不到通知' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const service = initService(c);

    try {
      await service.deleteNotification(userId, id);

      return c.json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Notification not found',
        },
        404
      );
    }
  }
);

// DELETE /notifications - Delete all notifications
notificationsRoutes.delete(
  '/',
  describeRoute({
    tags: ['Notifications'],
    summary: '刪除所有通知',
    description: '刪除當前用戶的所有通知，需要 Bearer token 認證',
    responses: {
      200: { description: '成功刪除所有通知' },
      401: { description: '未認證' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');

    const service = initService(c);
    await service.deleteAllNotifications(userId);

    return c.json({
      success: true,
      message: 'All notifications deleted',
    });
  }
);

// ═══════════════════════════════════════════════════════════
// 通知統計與分析 API
// ═══════════════════════════════════════════════════════════

// GET /notifications/stats - Get user's notification statistics
notificationsRoutes.get(
  '/stats',
  describeRoute({
    tags: ['Notifications'],
    summary: '取得通知統計',
    description: '取得當前用戶的通知統計資料，包括各類型通知數量等，需要 Bearer token 認證',
    responses: {
      200: { description: '成功取得通知統計' },
      401: { description: '未認證' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');

    const service = initService(c);
    const stats = await service.getStats(userId);

    return c.json({
      success: true,
      data: stats,
    });
  }
);

// ═══════════════════════════════════════════════════════════
// Admin 廣播通知 API
// ═══════════════════════════════════════════════════════════

// Broadcast notification schema
const broadcastSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  targetRole: z.enum(['all', 'user', 'moderator', 'admin']).optional(),
});

// POST /notifications/admin/broadcast - Send broadcast notification (Admin only)
notificationsRoutes.post(
  '/admin/broadcast',
  describeRoute({
    tags: ['Notifications'],
    summary: '發送廣播通知（管理員）',
    description: '向指定角色的所有用戶發送廣播通知，僅限管理員使用',
    responses: {
      200: { description: '成功發送廣播通知' },
      400: { description: '請求格式錯誤' },
      401: { description: '未認證' },
      403: { description: '權限不足，需要管理員權限' },
    },
  }),
  authMiddleware,
  validator('json', broadcastSchema),
  async (c) => {
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

    const { title, message, targetRole } = c.req.valid('json');

    const service = initService(c);
    const actorId = c.get('userId');

    try {
      const result = await service.sendBroadcast(actorId, title, message, targetRole);

      return c.json({
        success: true,
        data: result,
        message: `已發送 ${result.successCount} 則廣播通知`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: errorMessage,
        },
        400
      );
    }
  }
);

// GET /notifications/admin/broadcasts - Get broadcast history (Admin only)
notificationsRoutes.get(
  '/admin/broadcasts',
  describeRoute({
    tags: ['Notifications'],
    summary: '取得廣播歷史記錄（管理員）',
    description: '取得所有廣播通知的歷史記錄，支援分頁，僅限管理員使用',
    responses: {
      200: { description: '成功取得廣播歷史記錄' },
      401: { description: '未認證' },
      403: { description: '權限不足，需要管理員權限' },
    },
  }),
  authMiddleware,
  async (c) => {
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

    const service = initService(c);
    const result = await service.getBroadcastHistory(page, limit);

    return c.json({
      success: true,
      ...result,
    });
  }
);

// GET /notifications/admin/stats - Admin statistics (requires admin role)
notificationsRoutes.get(
  '/admin/stats',
  describeRoute({
    tags: ['Notifications'],
    summary: '取得通知系統統計（管理員）',
    description: '取得整個通知系統的統計資料，包括總通知數、未讀率等，僅限管理員使用',
    responses: {
      200: { description: '成功取得通知系統統計' },
      401: { description: '未認證' },
      403: { description: '權限不足，需要管理員權限' },
    },
  }),
  authMiddleware,
  async (c) => {
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

    const service = initService(c);
    const stats = await service.getAdminStats();

    return c.json({
      success: true,
      data: stats,
    });
  }
);

// ═══════════════════════════════════════════════════════════
// 通知偏好設定 API
// ═══════════════════════════════════════════════════════════

// GET /notifications/preferences - Get user's notification preferences
notificationsRoutes.get(
  '/preferences',
  describeRoute({
    tags: ['Notifications'],
    summary: '取得通知偏好設定',
    description: '取得當前用戶的通知偏好設定，包括各類型通知的開關狀態，需要 Bearer token 認證',
    responses: {
      200: { description: '成功取得通知偏好設定' },
      401: { description: '未認證' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');

    const service = initService(c);
    const preferences = await service.getPreferences(userId);

    return c.json({
      success: true,
      data: preferences,
    });
  }
);

// Notification preferences schema
const preferencesSchema = z.object({
  goal_liked: z.boolean().optional(),
  goal_commented: z.boolean().optional(),
  goal_referenced: z.boolean().optional(),
  post_liked: z.boolean().optional(),
  post_commented: z.boolean().optional(),
  biography_commented: z.boolean().optional(),
  new_follower: z.boolean().optional(),
  story_featured: z.boolean().optional(),
  goal_completed: z.boolean().optional(),
  email_digest: z.boolean().optional(),
});

// PUT /notifications/preferences - Update user's notification preferences
notificationsRoutes.put(
  '/preferences',
  describeRoute({
    tags: ['Notifications'],
    summary: '更新通知偏好設定',
    description: '更新當前用戶的通知偏好設定，可設定各類型通知的開關狀態，需要 Bearer token 認證',
    responses: {
      200: { description: '成功更新通知偏好設定' },
      400: { description: '請求格式錯誤' },
      401: { description: '未認證' },
    },
  }),
  authMiddleware,
  validator('json', preferencesSchema),
  async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');

    const service = initService(c);

    try {
      await service.updatePreferences(userId, body);

      return c.json({
        success: true,
        message: 'Preferences updated',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: errorMessage,
        },
        400
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════
// Notification Types (re-exported for backwards compatibility)
// ═══════════════════════════════════════════════════════════

export type { NotificationType };

// ═══════════════════════════════════════════════════════════
// Helper functions to create notifications (便利函數)
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
  const repository = new NotificationRepository(db);
  const service = new NotificationService(repository, db);

  return service.createNotification(data, options);
}

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
  const repository = new NotificationRepository(db);
  const service = new NotificationService(repository, db);

  return service.createLikeNotificationWithAggregation(data);
}
