import { D1Database } from '@cloudflare/workers-types'
import {
  BroadcastItem,
  DailyTrend,
  HourlyTrend,
  NotificationItem,
  NotificationQueryOptions,
  NotificationRepository,
  NotificationType,
  TopRecipient,
  TypeStats,
} from '../repositories/notification-repository'
import { sendExpoPush } from '../utils/expo-push'
import { generateId } from '../utils/id'
import { buildNotificationPath } from '../utils/notification-url'

/**
 * 可延後執行的 context（Cloudflare Workers executionCtx）
 * 有傳入時推播以 waitUntil 在回應送出後執行，避免拖慢觸發請求
 */
export type WaitUntilCtx = { waitUntil(promise: Promise<unknown>): void }

/**
 * 通知偏好回應格式
 */
export interface NotificationPreferencesResponse {
  goal_liked: boolean
  goal_commented: boolean
  goal_referenced: boolean
  post_liked: boolean
  post_commented: boolean
  biography_commented: boolean
  new_follower: boolean
  story_featured: boolean
  goal_completed: boolean
  email_digest: boolean
}

/**
 * 分頁回應格式
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

/**
 * 統計資料回應格式
 */
export interface NotificationStatsResponse {
  overview: {
    total: number
    unread: number
    read: number
    readRate: number
  }
  byType: TypeStats[]
  dailyTrend: DailyTrend[]
}

/**
 * 管理員統計回應格式
 */
export interface AdminStatsResponse {
  period: string
  overview: {
    total: number
    unread: number
    usersWithNotifications: number
  }
  byType: TypeStats[]
  hourlyTrend: HourlyTrend[]
  topRecipients: TopRecipient[]
}

/**
 * 廣播結果
 */
export interface BroadcastResult {
  totalUsers: number
  successCount: number
  failedCount: number
}

/**
 * Notification Service - 業務邏輯層
 *
 * 職責：
 * - 處理業務邏輯
 * - 資料轉換與格式化
 * - 權限檢查
 * - 去重與聚合
 * - 偏好設定檢查
 */
export class NotificationService {
  constructor(
    private repository: NotificationRepository,
    private db: D1Database
  ) {}

  // ═══════════════════════════════════════════════════════════
  // 使用者通知 CRUD
  // ═══════════════════════════════════════════════════════════

  /**
   * 取得使用者通知列表（分頁）
   */
  async getList(
    userId: string,
    options: NotificationQueryOptions
  ): Promise<PaginatedResponse<NotificationItem>> {
    const { page, limit } = options

    // 並行查詢資料與總數
    const [notifications, total] = await Promise.all([
      this.repository.findByUserId(userId, options),
      this.repository.countByUserId(userId, options.unreadOnly),
    ])

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * 取得未讀通知數量
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.repository.countByUserId(userId, true)
  }

  /**
   * 標記通知為已讀
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    // 驗證所有權
    const notification = await this.repository.findByIdAndUserId(notificationId, userId)
    if (!notification) {
      throw new Error('Notification not found')
    }

    await this.repository.markAsRead(notificationId)
  }

  /**
   * 標記所有通知為已讀
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.repository.markAllAsRead(userId)
  }

  /**
   * 刪除通知
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    // 驗證所有權
    const notification = await this.repository.findByIdAndUserId(notificationId, userId)
    if (!notification) {
      throw new Error('Notification not found')
    }

    await this.repository.delete(notificationId)
  }

  /**
   * 刪除所有通知
   */
  async deleteAllNotifications(userId: string): Promise<void> {
    await this.repository.deleteAllByUserId(userId)
  }

  // ═══════════════════════════════════════════════════════════
  // 統計與分析
  // ═══════════════════════════════════════════════════════════

  /**
   * 取得使用者通知統計
   */
  async getStats(userId: string): Promise<NotificationStatsResponse> {
    // 並行查詢各項統計
    const [basicStats, typeStats, dailyTrend] = await Promise.all([
      this.repository.getBasicStats(userId),
      this.repository.getTypeStats(userId),
      this.repository.getDailyTrend(userId),
    ])

    // 計算已讀率
    const readRate = basicStats.total ? Math.round((basicStats.read / basicStats.total) * 100) : 0

    return {
      overview: {
        total: basicStats.total,
        unread: basicStats.unread,
        read: basicStats.read,
        readRate,
      },
      byType: typeStats,
      dailyTrend: dailyTrend,
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 管理員功能
  // ═══════════════════════════════════════════════════════════

  /**
   * 發送廣播通知
   */
  async sendBroadcast(
    actorId: string,
    title: string,
    message: string,
    targetRole?: 'all' | 'user' | 'moderator' | 'admin'
  ): Promise<BroadcastResult> {
    // 驗證輸入
    if (!title || !message) {
      throw new Error('Title and message are required')
    }

    // 獲取目標用戶
    const users = await this.repository.findTargetUsers(targetRole)

    if (users.length === 0) {
      throw new Error('No users found matching criteria')
    }

    // 批次創建通知
    let successCount = 0

    for (const targetUser of users) {
      const notifId = generateId()
      try {
        await this.repository.create({
          id: notifId,
          userId: targetUser.id,
          type: 'system_announcement',
          actorId: actorId,
          targetId: null,
          title,
          message,
        })
        successCount++
      } catch (err) {
        console.error(`Failed to create notification for user ${targetUser.id}:`, err)
      }
    }

    // 發送原生推播（best-effort，失敗不影響廣播結果）
    await this.sendBroadcastPush(title, message, targetRole)

    return {
      totalUsers: users.length,
      successCount,
      failedCount: users.length - successCount,
    }
  }

  /**
   * 對目標用戶的裝置發送 Expo 推播，並清理已失效的 token
   */
  private async sendBroadcastPush(
    title: string,
    message: string,
    targetRole?: 'all' | 'user' | 'moderator' | 'admin'
  ): Promise<void> {
    try {
      const tokens = await this.repository.findDeviceTokensByRole(targetRole)
      if (tokens.length === 0) return

      const { invalidTokens } = await sendExpoPush(tokens, title, message, {
        type: 'system_announcement',
      })

      if (invalidTokens.length > 0) {
        await this.repository.deleteDeviceTokens(invalidTokens)
      }
    } catch (err) {
      console.error('Failed to send broadcast push:', err)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Device Token（mobile 原生推播）
  // ═══════════════════════════════════════════════════════════

  /**
   * 註冊 device token
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android'
  ): Promise<void> {
    await this.repository.upsertDeviceToken({
      id: generateId(),
      userId,
      token,
      platform,
    })
  }

  /**
   * 解除註冊 device token
   */
  async unregisterDeviceToken(userId: string, token: string): Promise<void> {
    await this.repository.deleteDeviceToken(userId, token)
  }

  /**
   * 對單一用戶的裝置發送個人通知推播，並清理失效 token
   *
   * best-effort：查無 token 直接略過，發送失敗不影響通知本體
   */
  private async pushToUser(params: {
    userId: string
    type: NotificationType
    title: string
    message: string
    actorId?: string | null
    targetId?: string | null
  }): Promise<void> {
    const { userId, type, title, message, actorId, targetId } = params
    try {
      const tokens = await this.repository.findDeviceTokensByUserId(userId)
      if (tokens.length === 0) return

      const url = await this.resolveNotificationUrl(type, actorId, targetId)
      const data: Record<string, string> = { type }
      if (url) data.url = url

      const { invalidTokens } = await sendExpoPush(tokens, title, message, data)

      if (invalidTokens.length > 0) {
        await this.repository.deleteDeviceTokens(invalidTokens)
      }
    } catch (err) {
      console.error('Failed to send notification push:', err)
    }
  }

  /**
   * 依通知類型解析 deep-link 路徑
   * 需要 slug 的類型（new_follower / biography_commented）額外查詢
   */
  private async resolveNotificationUrl(
    type: NotificationType,
    actorId?: string | null,
    targetId?: string | null
  ): Promise<string | null> {
    let actorSlug: string | null = null
    let targetSlug: string | null = null

    if (type === 'new_follower' && actorId) {
      actorSlug = await this.repository.findBiographySlugByUserId(actorId)
    } else if (type === 'biography_commented' && targetId) {
      targetSlug = await this.repository.findBiographySlugById(targetId)
    }

    return buildNotificationPath(type, { targetId, actorSlug, targetSlug })
  }

  /**
   * 取得廣播歷史
   */
  async getBroadcastHistory(
    page: number,
    limit: number
  ): Promise<PaginatedResponse<BroadcastItem>> {
    const offset = (page - 1) * limit

    // 並行查詢資料與總數
    const [broadcasts, total] = await Promise.all([
      this.repository.findBroadcasts(limit, offset),
      this.repository.countBroadcasts(),
    ])

    return {
      data: broadcasts,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * 取得管理員統計
   */
  async getAdminStats(): Promise<AdminStatsResponse> {
    // 並行查詢各項統計
    const [systemStats, typeStats24h, hourlyTrend, topRecipients] = await Promise.all([
      this.repository.getSystemStats(),
      this.repository.getTypeStats24h(),
      this.repository.getHourlyTrend(),
      this.repository.getTopRecipients(),
    ])

    return {
      period: '24h',
      overview: {
        total: systemStats.total_24h,
        unread: systemStats.unread_24h,
        usersWithNotifications: systemStats.users_with_notifications,
      },
      byType: typeStats24h,
      hourlyTrend: hourlyTrend,
      topRecipients: topRecipients,
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 偏好設定
  // ═══════════════════════════════════════════════════════════

  /**
   * 取得使用者通知偏好設定
   */
  async getPreferences(userId: string): Promise<NotificationPreferencesResponse> {
    let prefs = await this.repository.findPreferences(userId)

    // 如果沒有偏好設定，創建預設的
    if (!prefs) {
      await this.repository.createDefaultPreferences(userId)
      prefs = await this.repository.findPreferences(userId)
    }

    return {
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
    }
  }

  /**
   * 更新使用者通知偏好設定
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferencesResponse>
  ): Promise<void> {
    const validKeys = [
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
    ]

    const updates: Array<{ key: string; value: number }> = []

    for (const key of validKeys) {
      if (key in preferences) {
        updates.push({
          key,
          value: preferences[key as keyof NotificationPreferencesResponse] ? 1 : 0,
        })
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid preferences provided')
    }

    // 確保偏好設定存在
    await this.repository.createDefaultPreferences(userId)

    // 更新偏好設定
    await this.repository.updatePreferences(userId, updates)
  }

  // ═══════════════════════════════════════════════════════════
  // 通知創建（帶去重和偏好檢查）
  // ═══════════════════════════════════════════════════════════

  /**
   * 創建通知（支援去重和偏好設定）
   *
   * 功能：
   * 1. 偏好設定檢查：如果用戶已關閉該類型通知，則不創建
   * 2. 去重：相同的 userId + actorId + targetId + type 在指定時間內只會創建一則通知
   *
   * @param data - 通知資料
   * @param options - 選項（可選）
   * @returns 通知 ID，如果被跳過則返回 null
   */
  async createNotification(
    data: {
      userId: string
      type: NotificationType
      actorId?: string
      targetId?: string
      title: string
      message: string
    },
    options?: {
      skipDedup?: boolean // 跳過去重檢查
      skipPrefsCheck?: boolean // 跳過偏好設定檢查
      dedupMinutes?: number // 去重時間範圍（分鐘），預設 5
    },
    waitUntilCtx?: WaitUntilCtx
  ): Promise<string | null> {
    const dedupMinutes = options?.dedupMinutes ?? 5

    // 偏好設定檢查：如果用戶已關閉該類型通知，則不創建
    if (!options?.skipPrefsCheck) {
      const enabled = await this.repository.isNotificationTypeEnabled(data.userId, data.type)

      if (!enabled) {
        return null
      }
    }

    // 去重檢查：相同的 actor + target + type 在指定時間內只創建一則通知
    if (!options?.skipDedup && data.actorId && data.targetId) {
      const existing = await this.repository.findDuplicateNotification(
        data.userId,
        data.actorId,
        data.targetId,
        data.type,
        dedupMinutes
      )

      if (existing) {
        // 已存在相同通知，跳過創建
        return null
      }
    }

    const id = generateId()

    await this.repository.create({
      id,
      userId: data.userId,
      type: data.type,
      actorId: data.actorId || null,
      targetId: data.targetId || null,
      title: data.title,
      message: data.message,
    })

    // 發送原生推播（有 executionCtx 則於回應後執行，否則直接 await）
    await this.dispatchPush(
      {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actorId: data.actorId,
        targetId: data.targetId,
      },
      waitUntilCtx
    )

    return id
  }

  /**
   * 派發個人通知推播
   * - 有 waitUntilCtx：交給它於回應送出後執行，不阻塞觸發請求
   * - 無 waitUntilCtx：直接 await 送出，確保 Workers 不會在回應後中斷未追蹤的 promise
   */
  private async dispatchPush(
    params: {
      userId: string
      type: NotificationType
      title: string
      message: string
      actorId?: string | null
      targetId?: string | null
    },
    waitUntilCtx?: WaitUntilCtx
  ): Promise<void> {
    if (waitUntilCtx) {
      waitUntilCtx.waitUntil(this.pushToUser(params))
    } else {
      await this.pushToUser(params)
    }
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
  async createLikeNotificationWithAggregation(
    data: {
      userId: string
      type: 'goal_liked' | 'post_liked'
      actorId: string
      actorName: string
      targetId: string
      targetTitle: string
    },
    waitUntilCtx?: WaitUntilCtx
  ): Promise<string | null> {
    // 偏好設定檢查：如果用戶已關閉該類型通知，則不創建
    const enabled = await this.repository.isNotificationTypeEnabled(data.userId, data.type)

    if (!enabled) {
      return null
    }

    // 檢查 1 小時內是否已有同一目標的按讚通知
    const existing = await this.repository.findRecentNotificationByTarget(
      data.userId,
      data.targetId,
      data.type,
      1
    )

    if (existing) {
      // 聚合：統計這 1 小時內有多少不同的人按讚
      const totalLikers = await this.repository.countDistinctActorsByTarget(
        data.userId,
        data.targetId,
        data.type,
        1
      )

      const totalWithCurrent = totalLikers + 1 // 加上這次的按讚者

      // 更新現有通知的訊息
      const targetType = data.type === 'post_liked' ? '文章' : '目標'
      const newMessage =
        totalWithCurrent > 1
          ? `${data.actorName} 和其他 ${totalWithCurrent - 1} 人對你的${targetType}「${data.targetTitle}」按讚`
          : `${data.actorName} 對你的${targetType}「${data.targetTitle}」按讚`

      await this.repository.updateNotification(existing.id, newMessage, data.actorId)

      // 聚合更新後也推播（訊息已更新為「X 和其他 N 人…」）
      await this.dispatchPush(
        {
          userId: data.userId,
          type: data.type,
          title: `你的${targetType}獲得按讚`,
          message: newMessage,
          actorId: data.actorId,
          targetId: data.targetId,
        },
        waitUntilCtx
      )

      return existing.id
    }

    // 沒有現有通知，創建新的
    const targetType = data.type === 'post_liked' ? '文章' : '目標'
    return this.createNotification(
      {
        userId: data.userId,
        type: data.type,
        actorId: data.actorId,
        targetId: data.targetId,
        title: `你的${targetType}獲得按讚`,
        message: `${data.actorName} 對你的${targetType}「${data.targetTitle}」按讚`,
      },
      { skipDedup: true },
      waitUntilCtx
    )
  }
}
