# 通知系統設計 - 讀書會導讀

## 導讀大綱

本次導讀結合《系統設計面試指南》第 10 章與 NobodyClimb 攀岩社群平台的實際案例，深入探討通知系統的設計。

---

## 第一部分：需求確認 (Step 1)

### 經典面試問題

在設計通知系統前，需要釐清以下問題：

| 問題 | 標準答案 | NobodyClimb 需求 |
|------|----------|------------------|
| 支援哪些通知類型？ | Push、SMS、Email | Web Push（目前）|
| 是實時系統嗎？ | 軟實時（允許輕微延遲） | 軟實時 |
| 支援哪些設備？ | iOS、Android、Desktop | Web 瀏覽器 |
| 什麼觸發通知？ | 客戶端應用或伺服器排程 | 用戶互動事件 |
| 用戶能退訂嗎？ | 是 | 計畫中 |
| 每日通知量？ | 1000萬+ | 小規模（數千） |

### NobodyClimb 通知類型

```typescript
// 來自 src/lib/types.ts
export type NotificationType =
  | 'goal_completed'      // 目標完成
  | 'goal_liked'          // 目標被按讚
  | 'goal_commented'      // 目標被留言
  | 'goal_referenced'     // 目標被引用
  | 'new_follower'        // 新追蹤者
  | 'story_featured'      // 故事被精選
  | 'biography_commented' // 人物誌被留言
  | 'post_liked'          // 文章被按讚 ✨ 新增
  | 'post_commented'      // 文章被留言 ✨ 新增
```

---

## 第二部分：高層設計 (Step 2)

### 經典架構

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Service    │───▶│ Notification │───▶│    Queue     │
│  (Trigger)   │    │   Service    │    │  (Kafka等)   │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
            ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
            │  iOS Worker  │          │Android Worker│          │ Email Worker │
            │    (APNS)    │          │    (FCM)     │          │  (Sendgrid)  │
            └──────────────┘          └──────────────┘          └──────────────┘
                    │                          │                          │
                    ▼                          ▼                          ▼
               iOS 設備               Android 設備                 Email 收件匣
```

### NobodyClimb 當前架構（簡化版）

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  用戶互動    │───▶│   Backend    │───▶│   D1 DB      │
│  (按讚等)    │    │   (Hono)     │    │(notifications)│
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │   Frontend   │
                                        │   Polling    │
                                        │  (60秒一次)   │
                                        └──────────────┘
```

### 關鍵差異

| 層面 | 大型系統 | NobodyClimb |
|------|----------|-------------|
| 訊息佇列 | Kafka/RabbitMQ | 無（直接寫 DB）|
| 推送方式 | APNS/FCM/Email | 前端輪詢 |
| 擴展性 | 水平擴展 Worker | 單一服務 |
| 延遲 | 毫秒級 | 最高 60 秒 |

---

## 第三部分：深入設計 (Step 3)

### 3.1 可靠性機制

#### 經典做法：防止資料丟失

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Service   │────▶│  Database   │────▶│   Queue     │
│             │     │ (持久化)    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │ Retry Logic │
                    │ (指數退避)  │
                    └─────────────┘
```

#### NobodyClimb 實作

```typescript
// backend/src/routes/notifications.ts
export async function createNotification(
  db: D1Database,
  data: {
    userId: string;
    type: NotificationType;
    actorId?: string;
    targetId?: string;
    title: string;
    message: string;
  }
) {
  const id = generateId();

  // 直接持久化到 D1 Database
  await db.prepare(
    `INSERT INTO notifications (id, user_id, type, actor_id, target_id, title, message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, data.userId, data.type, data.actorId || null,
         data.targetId || null, data.title, data.message)
   .run();

  return id;
}
```

**優點**：簡單可靠，資料不會丟失
**缺點**：無法支援即時推送、高併發場景

---

### 3.2 去重策略

#### 經典做法

```
if (cache.exists(notification_id)) {
    return; // 已發送，跳過
}
send(notification);
cache.set(notification_id, TTL=24h);
```

#### NobodyClimb 實作 ✅

**已實作去重機制**：相同的 userId + actorId + targetId + type 在 5 分鐘內只會創建一則通知。

```typescript
// backend/src/routes/notifications.ts
export async function createNotification(
  db: D1Database,
  data: { userId, type, actorId?, targetId?, title, message },
  options?: { skipDedup?: boolean; dedupMinutes?: number }
): Promise<string | null> {
  const dedupMinutes = options?.dedupMinutes ?? 5;

  // 去重檢查
  if (!options?.skipDedup && data.actorId && data.targetId) {
    const existing = await db.prepare(
      `SELECT id FROM notifications
       WHERE user_id = ? AND actor_id = ? AND target_id = ? AND type = ?
       AND created_at > datetime('now', '-' || ? || ' minutes')`
    ).bind(data.userId, data.actorId, data.targetId, data.type, dedupMinutes)
     .first<{ id: string }>();

    if (existing) return null; // 已存在相同通知，跳過
  }

  // ... 創建通知
}
```

---

### 3.3 通知模板

#### 經典做法

```
模板：{actor} 對你的 {target_type} 按了讚

變數替換：
- actor = "小明"
- target_type = "攀岩目標"

結果：小明 對你的 攀岩目標 按了讚
```

#### NobodyClimb 實作

```typescript
// 前端 UI 元件對應
const notificationIcons: Record<string, React.ElementType> = {
  goal_liked: Mountain,        // 🏔️ 按讚
  goal_commented: MessageCircle, // 💬 留言
  goal_referenced: Sparkles,   // ✨ 引用
  new_follower: UserPlus,      // 👤 追蹤
  story_featured: Sparkles,    // ✨ 精選
}

const notificationColors: Record<string, string> = {
  goal_liked: 'text-red-500 bg-red-50',
  goal_commented: 'text-blue-500 bg-blue-50',
  // ...
}
```

---

### 3.4 用戶設定

#### 經典設計

```sql
CREATE TABLE user_notification_settings (
  user_id BIGINT PRIMARY KEY,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  -- 細分設定
  marketing_email BOOLEAN DEFAULT true,
  social_push BOOLEAN DEFAULT true
);
```

#### NobodyClimb 實作 ✅

**已實作用戶偏好設定**，可在「帳號設定 > 通知設定」頁面調整。

```sql
-- backend/migrations/0028_add_notification_preferences.sql
CREATE TABLE notification_preferences (
  user_id TEXT PRIMARY KEY,
  -- 互動通知
  goal_liked BOOLEAN DEFAULT 1,
  goal_commented BOOLEAN DEFAULT 1,
  goal_referenced BOOLEAN DEFAULT 1,
  post_liked BOOLEAN DEFAULT 1,
  post_commented BOOLEAN DEFAULT 1,
  biography_commented BOOLEAN DEFAULT 1,
  -- 社交通知
  new_follower BOOLEAN DEFAULT 1,
  -- 系統通知
  story_featured BOOLEAN DEFAULT 1,
  goal_completed BOOLEAN DEFAULT 1,
  -- Email（開發中）
  email_digest BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**API 端點**：
- `GET /notifications/preferences` - 獲取偏好設定
- `PUT /notifications/preferences` - 更新偏好設定

**整合方式**：創建通知時會自動檢查用戶偏好，若已關閉則不創建。

---

### 3.5 速率限制與通知聚合

#### 經典做法

```
規則：每個用戶每小時最多收到 10 則同類型通知

實作：
- 使用 Redis 計數器
- Key: rate_limit:{user_id}:{notification_type}:{hour}
- 超過限制時聚合成摘要通知
```

#### NobodyClimb 實作 ✅

**已實作通知聚合**：1 小時內同一目標的按讚會合併成一則通知。

```typescript
// backend/src/routes/notifications.ts
export async function createLikeNotificationWithAggregation(
  db: D1Database,
  data: { userId, type, actorId, actorName, targetId, targetTitle }
): Promise<string | null> {
  // 檢查 1 小時內是否已有同一目標的按讚通知
  const existing = await db.prepare(
    `SELECT id, message FROM notifications
     WHERE user_id = ? AND target_id = ? AND type = ?
     AND created_at > datetime('now', '-1 hour')
     ORDER BY created_at DESC LIMIT 1`
  ).bind(data.userId, data.targetId, data.type).first();

  if (existing) {
    // 聚合：統計不同按讚者數量
    const countResult = await db.prepare(
      `SELECT COUNT(DISTINCT actor_id) as count FROM notifications
       WHERE user_id = ? AND target_id = ? AND type = ?
       AND created_at > datetime('now', '-1 hour')`
    ).bind(data.userId, data.targetId, data.type).first();

    const totalLikers = (countResult?.count || 0) + 1;
    const newMessage = totalLikers > 1
      ? `${data.actorName} 和其他 ${totalLikers - 1} 人對你的文章按讚`
      : `${data.actorName} 對你的文章按讚`;

    // 更新現有通知
    await db.prepare(`UPDATE notifications SET message = ?, actor_id = ?, created_at = datetime('now') WHERE id = ?`)
      .bind(newMessage, data.actorId, existing.id).run();

    return existing.id;
  }

  // 沒有現有通知，創建新的
  return createNotification(db, { ... });
}
```

**效果**：
- 原本：收到 100 則「XXX 對你的文章按讚」
- 現在：收到 1 則「小明 和其他 99 人對你的文章按讚」

---

### 3.6 事件追蹤

#### 經典指標

```
┌────────────────────────────────────────────────┐
│              通知漏斗分析                        │
├────────────────────────────────────────────────┤
│  Sent        ████████████████████  100,000     │
│  Delivered   ████████████████░░░░   95,000     │
│  Opened      ████████░░░░░░░░░░░░   40,000     │
│  Clicked     ████░░░░░░░░░░░░░░░░   15,000     │
└────────────────────────────────────────────────┘
```

#### NobodyClimb 可追蹤指標

```typescript
// 建議的追蹤事件
interface NotificationAnalytics {
  total_sent: number;
  total_read: number;        // is_read = 1
  total_deleted: number;
  read_rate: number;         // total_read / total_sent
  avg_time_to_read: number;  // 從 created_at 到標記已讀的時間
}
```

---

## 第四部分：架構演進建議

### 階段一：當前狀態 ✅

```
用戶操作 → Backend → DB → 前端輪詢 (60秒)
```

**適用場景**：小規模、低即時性需求

### 階段二：WebSocket 即時推送

```
用戶操作 → Backend → DB
                ↓
           WebSocket Server → 瀏覽器即時更新
```

**實作建議**：
- 使用 Cloudflare Durable Objects 維護 WebSocket 連線
- 或使用 Pusher/Ably 等第三方服務

### 階段三：完整訊息佇列架構

```
用戶操作 → Backend → Cloudflare Queue
                          ↓
                    Notification Worker
                          ↓
              ┌───────────┼───────────┐
              ▼           ▼           ▼
           Web Push    Email       儲存
```

**適用場景**：高併發、需要多管道推送

---

## 第五部分：面試常見問題

### Q1: 如何保證通知不丟失？

**答**：
1. 先持久化到資料庫（NobodyClimb 做法）
2. 使用持久化訊息佇列（如 Kafka）
3. 實作確認機制（ACK）
4. 重試機制（指數退避）

### Q2: 如何處理大量通知？

**答**：
1. 訊息佇列解耦
2. 批次處理
3. 速率限制
4. 通知聚合（100 人按讚 → 1 則通知）

### Q3: 如何保證即時性？

**答**：
1. WebSocket/SSE 推送
2. 減少輪詢間隔
3. 長輪詢 (Long Polling)
4. 第三方推送服務（FCM、APNS）

### Q4: 如何設計通知優先級？

**答**：
```
高優先級：安全警告、交易確認
中優先級：社交互動、留言回覆
低優先級：行銷推廣、系統更新

實作：多個佇列 + 不同處理速率
```

---

## 第六部分：程式碼導讀

### 前端：通知中心元件

```typescript
// src/components/shared/notification-center.tsx

// 1. 輪詢機制：每 60 秒檢查未讀數量
useEffect(() => {
  loadUnreadCount()
  const interval = setInterval(loadUnreadCount, 60000)
  return () => clearInterval(interval)
}, [loadUnreadCount])

// 2. 未讀徽章顯示
{unreadCount > 0 && (
  <span className="bg-red-500 text-white rounded-full">
    {unreadCount > 99 ? '99+' : unreadCount}
  </span>
)}

// 3. 樂觀更新：先更新 UI，再發 API
const handleMarkAsRead = async (id: string) => {
  await notificationService.markAsRead(id)
  setNotifications(prev =>
    prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
  )
  setUnreadCount(prev => Math.max(0, prev - 1))
}
```

### 後端：通知 API

```typescript
// backend/src/routes/notifications.ts

// 1. 取得通知（含分頁）
notificationsRoutes.get('/', authMiddleware, async (c) => {
  const { page, limit, offset } = parsePagination(...)

  // JOIN 取得觸發者資訊
  const notifications = await c.env.DB.prepare(`
    SELECT n.*, u.username as actor_name, u.avatar_url as actor_avatar
    FROM notifications n
    LEFT JOIN users u ON n.actor_id = u.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(userId, limit, offset).all()
})

// 2. 權限檢查：確保只能操作自己的通知
const notification = await c.env.DB.prepare(
  'SELECT id FROM notifications WHERE id = ? AND user_id = ?'
).bind(id, userId).first()

if (!notification) {
  return c.json({ error: 'Not Found' }, 404)
}
```

---

## 討論問題

1. **NobodyClimb 是否需要即時通知？**
   - 社群互動（按讚、留言）的即時性需求是什麼？
   - 60 秒的延遲對用戶體驗影響有多大？

2. **如何處理「通知轟炸」？**
   - 當一篇文章爆紅，如何避免用戶收到數百則通知？

3. **多管道通知的優先級？**
   - Web Push vs Email 摘要，該如何選擇？

4. **Cloudflare 生態系統的選擇？**
   - Durable Objects (WebSocket) vs Queues vs Workers
   - 成本與複雜度的權衡

---

---

## 第七部分：NobodyClimb 實作總結

### 本次實作項目

在讀書會準備過程中，我們實際實作了以下功能：

| 功能 | 狀態 | 檔案位置 |
|------|------|----------|
| 文章按讚/留言通知 | ✅ 完成 | `backend/src/routes/posts.ts` |
| 通知去重（5 分鐘內） | ✅ 完成 | `backend/src/routes/notifications.ts` |
| 通知聚合（1 小時內按讚合併） | ✅ 完成 | `backend/src/routes/notifications.ts` |
| 用戶偏好設定 API | ✅ 完成 | `backend/src/routes/notifications.ts` |
| 前端偏好設定頁面 | ✅ 完成 | `src/app/profile/settings/page.tsx` |
| 資料庫 Migration | ✅ 完成 | `backend/migrations/0027_*.sql`, `0028_*.sql` |

### 新增的 API 端點

```
GET  /notifications/preferences     # 獲取偏好設定
PUT  /notifications/preferences     # 更新偏好設定
```

### 資料庫變更

```sql
-- Migration 0027: 新增通知類型
ALTER TABLE notifications ADD CONSTRAINT type_check
  CHECK (type IN (..., 'post_liked', 'post_commented'));

-- Migration 0028: 新增偏好設定表
CREATE TABLE notification_preferences (...);
```

### 架構流程圖

```
┌─────────────────────────────────────────────────────────────────┐
│                    通知系統完整流程                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  用戶操作 ──▶ 偏好檢查 ──▶ 去重檢查 ──▶ 聚合判斷 ──▶ 建立/更新通知  │
│    │            │            │            │            │         │
│    │         關閉?        重複?        可聚合?        │         │
│    │           ↓            ↓            ↓            ↓         │
│    │        跳過          跳過        更新現有     新建通知       │
│    │                                                    │         │
│    └────────────────────────────────────────────────────┘         │
│                                                                    │
│  前端輪詢 (60秒) ◀─────────────────────────── D1 Database          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 待優化項目

1. **即時推送**：目前使用 60 秒輪詢，可考慮 WebSocket
2. **Email 摘要**：每日通知彙整 Email（已預留欄位）
3. **通知分析**：追蹤已讀率、點擊率等指標
4. **批次刪除**：提供清除舊通知的功能

---

## 參考資料

- [系統設計面試指南 - 第10章](https://github.com/Admol/SystemDesign/blob/main/CHAPTER%2010%EF%BC%9ADESIGN%20A%20NOTIFICATION%20SYSTEM.md)
- [Cloudflare Queues 文件](https://developers.cloudflare.com/queues/)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
