import { D1Database } from '@cloudflare/workers-types';

/**
 * 通知類型定義
 */
export type NotificationType =
  | 'goal_completed'
  | 'goal_liked'
  | 'goal_commented'
  | 'goal_referenced'
  | 'new_follower'
  | 'story_featured'
  | 'biography_commented'
  | 'post_liked'
  | 'post_commented'
  | 'core_story_liked'
  | 'core_story_commented'
  | 'one_liner_liked'
  | 'one_liner_commented'
  | 'story_liked'
  | 'story_commented'
  | 'system_announcement';

/**
 * 通知項目（包含 actor 資訊）
 */
export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string | null;
  target_id: string | null;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
  actor_name: string | null;
  actor_avatar: string | null;
}

/**
 * 通知查詢選項
 */
export interface NotificationQueryOptions {
  page: number;
  limit: number;
  unreadOnly?: boolean;
}

/**
 * 通知偏好設定
 */
export interface NotificationPreferences {
  user_id: string;
  goal_liked: number;
  goal_commented: number;
  goal_referenced: number;
  post_liked: number;
  post_commented: number;
  biography_commented: number;
  new_follower: number;
  story_featured: number;
  goal_completed: number;
  email_digest: number;
}

/**
 * 基本統計資料
 */
export interface BasicStats {
  total: number;
  unread: number;
  read: number;
}

/**
 * 類型統計
 */
export interface TypeStats {
  type: string;
  count: number;
}

/**
 * 每日趨勢
 */
export interface DailyTrend {
  date: string;
  count: number;
}

/**
 * 廣播通知項目
 */
export interface BroadcastItem {
  id: string;
  title: string;
  message: string;
  actor_id: string;
  actor_name: string;
  created_at: string;
  recipient_count: number;
  read_count: number;
}

/**
 * 系統統計（24 小時）
 */
export interface SystemStats {
  total_24h: number;
  unread_24h: number;
  users_with_notifications: number;
}

/**
 * 每小時趨勢
 */
export interface HourlyTrend {
  hour: string;
  count: number;
}

/**
 * Top 收件者
 */
export interface TopRecipient {
  user_id: string;
  username: string;
  display_name: string | null;
  notification_count: number;
}

/**
 * Notification Repository - 資料存取層
 *
 * 職責：
 * - 執行資料庫查詢
 * - 處理資料庫結果轉換
 * - 不包含業務邏輯
 */
export class NotificationRepository {
  constructor(private db: D1Database) {}

  // ═══════════════════════════════════════════════════════════
  // 基本 CRUD 操作
  // ═══════════════════════════════════════════════════════════

  /**
   * 查詢使用者的通知列表
   */
  async findByUserId(
    userId: string,
    options: NotificationQueryOptions
  ): Promise<NotificationItem[]> {
    const { page, limit, unreadOnly } = options;
    const offset = (page - 1) * limit;
    const params: (string | number)[] = [userId];

    let whereClause = 'n.user_id = ?';
    if (unreadOnly) {
      whereClause += ' AND n.is_read = 0';
    }

    const result = await this.db
      .prepare(
        `SELECT n.*, u.username as actor_name, u.avatar_url as actor_avatar
         FROM notifications n
         LEFT JOIN users u ON n.actor_id = u.id
         WHERE ${whereClause}
         ORDER BY n.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, limit, offset)
      .all<NotificationItem>();

    return result.results || [];
  }

  /**
   * 計算使用者的通知總數
   */
  async countByUserId(userId: string, unreadOnly?: boolean): Promise<number> {
    const params: (string | number)[] = [userId];
    let whereClause = 'n.user_id = ?';

    if (unreadOnly) {
      whereClause += ' AND n.is_read = 0';
    }

    const result = await this.db
      .prepare(`SELECT COUNT(*) as count FROM notifications n WHERE ${whereClause}`)
      .bind(...params)
      .first<{ count: number }>();

    return result?.count || 0;
  }

  /**
   * 查詢單一通知（檢查所有權）
   */
  async findByIdAndUserId(id: string, userId: string): Promise<{ id: string } | null> {
    const result = await this.db
      .prepare('SELECT id FROM notifications WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first<{ id: string }>();

    return result || null;
  }

  /**
   * 創建通知
   */
  async create(data: {
    id: string;
    userId: string;
    type: NotificationType;
    actorId: string | null;
    targetId: string | null;
    title: string;
    message: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO notifications (id, user_id, type, actor_id, target_id, title, message)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.id,
        data.userId,
        data.type,
        data.actorId,
        data.targetId,
        data.title,
        data.message
      )
      .run();
  }

  /**
   * 標記通知為已讀
   */
  async markAsRead(id: string): Promise<void> {
    await this.db
      .prepare('UPDATE notifications SET is_read = 1 WHERE id = ?')
      .bind(id)
      .run();
  }

  /**
   * 標記使用者所有未讀通知為已讀
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.db
      .prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
      .bind(userId)
      .run();
  }

  /**
   * 刪除通知
   */
  async delete(id: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM notifications WHERE id = ?')
      .bind(id)
      .run();
  }

  /**
   * 刪除使用者所有通知
   */
  async deleteAllByUserId(userId: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM notifications WHERE user_id = ?')
      .bind(userId)
      .run();
  }

  // ═══════════════════════════════════════════════════════════
  // 去重與聚合查詢
  // ═══════════════════════════════════════════════════════════

  /**
   * 檢查是否存在重複通知（用於去重）
   */
  async findDuplicateNotification(
    userId: string,
    actorId: string,
    targetId: string,
    type: NotificationType,
    minutesAgo: number
  ): Promise<{ id: string } | null> {
    const result = await this.db
      .prepare(
        `SELECT id FROM notifications
         WHERE user_id = ? AND actor_id = ? AND target_id = ? AND type = ?
         AND created_at > datetime('now', '-' || ? || ' minutes')`
      )
      .bind(userId, actorId, targetId, type, minutesAgo)
      .first<{ id: string }>();

    return result || null;
  }

  /**
   * 查詢最近的同目標通知（用於聚合）
   */
  async findRecentNotificationByTarget(
    userId: string,
    targetId: string,
    type: NotificationType,
    hoursAgo: number
  ): Promise<{ id: string; message: string } | null> {
    const result = await this.db
      .prepare(
        `SELECT id, message FROM notifications
         WHERE user_id = ? AND target_id = ? AND type = ?
         AND created_at > datetime('now', '-' || ? || ' hour')
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .bind(userId, targetId, type, hoursAgo)
      .first<{ id: string; message: string }>();

    return result || null;
  }

  /**
   * 統計時間範圍內不同 actor 的數量（用於聚合）
   */
  async countDistinctActorsByTarget(
    userId: string,
    targetId: string,
    type: NotificationType,
    hoursAgo: number
  ): Promise<number> {
    const result = await this.db
      .prepare(
        `SELECT COUNT(DISTINCT actor_id) as count FROM notifications
         WHERE user_id = ? AND target_id = ? AND type = ?
         AND created_at > datetime('now', '-' || ? || ' hour')`
      )
      .bind(userId, targetId, type, hoursAgo)
      .first<{ count: number }>();

    return result?.count || 0;
  }

  /**
   * 更新通知內容（用於聚合）
   */
  async updateNotification(
    id: string,
    message: string,
    actorId: string
  ): Promise<void> {
    await this.db
      .prepare(
        `UPDATE notifications SET message = ?, actor_id = ?, created_at = datetime('now')
         WHERE id = ?`
      )
      .bind(message, actorId, id)
      .run();
  }

  // ═══════════════════════════════════════════════════════════
  // 統計查詢
  // ═══════════════════════════════════════════════════════════

  /**
   * 查詢使用者通知基本統計
   */
  async getBasicStats(userId: string): Promise<BasicStats> {
    const result = await this.db
      .prepare(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
          SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read
        FROM notifications
        WHERE user_id = ?`
      )
      .bind(userId)
      .first<BasicStats>();

    return result || { total: 0, unread: 0, read: 0 };
  }

  /**
   * 查詢使用者通知按類型統計
   */
  async getTypeStats(userId: string): Promise<TypeStats[]> {
    const result = await this.db
      .prepare(
        `SELECT type, COUNT(*) as count
        FROM notifications
        WHERE user_id = ?
        GROUP BY type
        ORDER BY count DESC`
      )
      .bind(userId)
      .all<TypeStats>();

    return result.results || [];
  }

  /**
   * 查詢最近 7 天每日趨勢
   */
  async getDailyTrend(userId: string): Promise<DailyTrend[]> {
    const result = await this.db
      .prepare(
        `SELECT
          date(created_at) as date,
          COUNT(*) as count
        FROM notifications
        WHERE user_id = ?
        AND created_at >= date('now', '-7 days')
        GROUP BY date(created_at)
        ORDER BY date ASC`
      )
      .bind(userId)
      .all<DailyTrend>();

    return result.results || [];
  }

  // ═══════════════════════════════════════════════════════════
  // 管理員功能
  // ═══════════════════════════════════════════════════════════

  /**
   * 查詢目標用戶（用於廣播）
   */
  async findTargetUsers(targetRole?: 'all' | 'user' | 'moderator' | 'admin'): Promise<{ id: string }[]> {
    let query = 'SELECT id FROM users WHERE is_active = 1';
    const params: string[] = [];

    if (targetRole && targetRole !== 'all') {
      query += ' AND role = ?';
      params.push(targetRole);
    }

    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all<{ id: string }>();

    return result.results || [];
  }

  /**
   * 查詢廣播歷史
   */
  async findBroadcasts(limit: number, offset: number): Promise<BroadcastItem[]> {
    const result = await this.db
      .prepare(
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
      .all<BroadcastItem>();

    return result.results || [];
  }

  /**
   * 計算廣播總數
   */
  async countBroadcasts(): Promise<number> {
    const result = await this.db
      .prepare(
        `SELECT COUNT(DISTINCT title || message || DATE(created_at)) as count
         FROM notifications
         WHERE type = 'system_announcement'`
      )
      .first<{ count: number }>();

    return result?.count || 0;
  }

  /**
   * 查詢系統統計（過去 24 小時）
   */
  async getSystemStats(): Promise<SystemStats> {
    const result = await this.db
      .prepare(
        `SELECT
          COUNT(*) as total_24h,
          SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_24h,
          COUNT(DISTINCT user_id) as users_with_notifications
        FROM notifications
        WHERE created_at > datetime('now', '-24 hours')`
      )
      .first<SystemStats>();

    return result || { total_24h: 0, unread_24h: 0, users_with_notifications: 0 };
  }

  /**
   * 查詢按類型統計（過去 24 小時）
   */
  async getTypeStats24h(): Promise<TypeStats[]> {
    const result = await this.db
      .prepare(
        `SELECT type, COUNT(*) as count
        FROM notifications
        WHERE created_at > datetime('now', '-24 hours')
        GROUP BY type
        ORDER BY count DESC`
      )
      .all<TypeStats>();

    return result.results || [];
  }

  /**
   * 查詢每小時趨勢（過去 24 小時）
   */
  async getHourlyTrend(): Promise<HourlyTrend[]> {
    const result = await this.db
      .prepare(
        `SELECT
          strftime('%Y-%m-%d %H:00', created_at) as hour,
          COUNT(*) as count
        FROM notifications
        WHERE created_at > datetime('now', '-24 hours')
        GROUP BY strftime('%Y-%m-%d %H:00', created_at)
        ORDER BY hour ASC`
      )
      .all<HourlyTrend>();

    return result.results || [];
  }

  /**
   * 查詢 Top 收件者（過去 24 小時，前 10 名）
   */
  async getTopRecipients(): Promise<TopRecipient[]> {
    const result = await this.db
      .prepare(
        `SELECT
          n.user_id,
          u.username,
          u.display_name,
          COUNT(*) as notification_count
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE n.created_at > datetime('now', '-24 hours')
        GROUP BY n.user_id
        ORDER BY notification_count DESC
        LIMIT 10`
      )
      .all<TopRecipient>();

    return result.results || [];
  }

  // ═══════════════════════════════════════════════════════════
  // 偏好設定
  // ═══════════════════════════════════════════════════════════

  /**
   * 查詢使用者的通知偏好設定
   */
  async findPreferences(userId: string): Promise<NotificationPreferences | null> {
    const result = await this.db
      .prepare('SELECT * FROM notification_preferences WHERE user_id = ?')
      .bind(userId)
      .first<NotificationPreferences>();

    return result || null;
  }

  /**
   * 創建預設偏好設定
   */
  async createDefaultPreferences(userId: string): Promise<void> {
    await this.db
      .prepare('INSERT OR IGNORE INTO notification_preferences (user_id) VALUES (?)')
      .bind(userId)
      .run();
  }

  /**
   * 更新偏好設定
   */
  async updatePreferences(
    userId: string,
    updates: Array<{ key: string; value: number }>
  ): Promise<void> {
    const setClauses = updates.map((u) => `${u.key} = ?`).join(', ');
    const values = updates.map((u) => u.value);

    await this.db
      .prepare(
        `UPDATE notification_preferences
         SET ${setClauses}, updated_at = datetime('now')
         WHERE user_id = ?`
      )
      .bind(...values, userId)
      .run();
  }

  /**
   * 檢查特定類型通知是否已啟用
   */
  async isNotificationTypeEnabled(
    userId: string,
    type: NotificationType
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `SELECT ${type} as enabled FROM notification_preferences WHERE user_id = ?`
      )
      .bind(userId)
      .first<{ enabled: number }>();

    // 如果沒有設定，預設為啟用
    if (!result) {
      return true;
    }

    return result.enabled === 1;
  }
}
