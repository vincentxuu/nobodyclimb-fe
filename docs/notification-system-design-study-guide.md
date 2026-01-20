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

#### NobodyClimb 建議改進

目前沒有去重機制，可考慮：

```typescript
// 建議：在創建通知前檢查
async function createNotificationIfNotExists(db: D1Database, data: NotificationData) {
  // 檢查是否已存在相同的通知（相同 actor、target、type，且在短時間內）
  const existing = await db.prepare(
    `SELECT id FROM notifications
     WHERE user_id = ? AND actor_id = ? AND target_id = ? AND type = ?
     AND created_at > datetime('now', '-5 minutes')`
  ).bind(data.userId, data.actorId, data.targetId, data.type).first();

  if (existing) return null; // 已存在，跳過

  return createNotification(db, data);
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

#### NobodyClimb 建議新增

```sql
-- 建議的 migration
CREATE TABLE notification_preferences (
  user_id TEXT PRIMARY KEY,
  -- 通知類型開關
  goal_liked BOOLEAN DEFAULT true,
  goal_commented BOOLEAN DEFAULT true,
  new_follower BOOLEAN DEFAULT true,
  -- 通知方式
  web_push BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT false,  -- 每日摘要
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

### 3.5 速率限制

#### 經典做法

```
規則：每個用戶每小時最多收到 10 則同類型通知

實作：
- 使用 Redis 計數器
- Key: rate_limit:{user_id}:{notification_type}:{hour}
- 超過限制時聚合成摘要通知
```

#### NobodyClimb 應用場景

```
場景：某篇文章很紅，短時間內收到 100 個讚

不好的體驗：收到 100 則「XXX 對你的文章按讚」

好的體驗：收到 1 則「你的文章獲得 100 個讚！」
```

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

## 參考資料

- [系統設計面試指南 - 第10章](https://github.com/Admol/SystemDesign/blob/main/CHAPTER%2010%EF%BC%9ADESIGN%20A%20NOTIFICATION%20SYSTEM.md)
- [Cloudflare Queues 文件](https://developers.cloudflare.com/queues/)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
