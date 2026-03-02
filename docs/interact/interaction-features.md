# NobodyClimb 互動功能實作文件

> 本文件詳細說明 NobodyClimb 平台後端的互動功能實作，包括按讚、留言、追蹤、收藏和引用清單等功能。

**文件版本**: 1.0
**最後更新**: 2026-01-22

---

## 目錄

1. [系統架構概覽](#系統架構概覽)
2. [按讚功能](#按讚功能)
3. [留言功能](#留言功能)
4. [追蹤功能](#追蹤功能)
5. [收藏功能](#收藏功能)
6. [引用清單功能](#引用清單功能)
7. [權限驗證機制](#權限驗證機制)
8. [通知系統整合](#通知系統整合)
9. [Repository & Service 架構](#repository--service-架構)
10. [API 設計模式](#api-設計模式)
11. [關鍵檔案路徑](#關鍵檔案路徑)

---

## 系統架構概覽

NobodyClimb 的互動功能採用分層架構設計：

```
┌─────────────────┐
│   API Routes    │ ← 路由層：處理 HTTP 請求、參數驗證
├─────────────────┤
│   Middleware    │ ← 中介層：JWT 驗證、權限控制
├─────────────────┤
│   Services      │ ← 業務邏輯層：複雜業務處理、通知發送
├─────────────────┤
│  Repositories   │ ← 資料存取層：資料庫操作抽象
├─────────────────┤
│  D1 Database    │ ← 資料持久層：Cloudflare D1 (SQLite)
└─────────────────┘
```

### 核心特性

- **通用互動表設計**：使用 `entity_type` + `entity_id` 支援多種內容類型
- **專門互動表**：針對特定功能（如人物誌內容）建立獨立表以優化查詢
- **通知系統整合**：所有互動行為自動觸發通知
- **權限分層控制**：Middleware 層級 + 資料層級雙重驗證
- **RESTful API 設計**：統一的端點命名和回應格式

---

## 按讚功能

### 概述

按讚功能支援文章、人物誌、人生清單、核心故事、一句話、小故事等多種內容類型。採用 Toggle 模式，單一端點處理按讚與取消按讚。

### 資料庫 Schema

#### 1. 通用按讚表 (`likes`)

```sql
CREATE TABLE likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, entity_type, entity_id)
);
```

**支援的 entity_type**：
- `post` - 文章
- `gallery` - 相簿
- `video` - 影片
- `gym` - 室內岩館
- `crag` - 戶外岩場

**Migration 檔案**: `backend/migrations/0002_add_likes_table.sql`

#### 2. 專門按讚表

為了優化查詢效能和支援特定業務邏輯，部分功能使用獨立的按讚表：

**人物誌按讚** (`biography_likes`):
```sql
CREATE TABLE biography_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    biography_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
    UNIQUE(user_id, biography_id)
);
```

**人生清單按讚** (`bucket_list_likes`):
```sql
CREATE TABLE bucket_list_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES bucket_list_items(id) ON DELETE CASCADE,
    UNIQUE(user_id, item_id)
);
```

**人物誌內容按讚表**：
- `core_story_likes` - 核心故事按讚
- `one_liner_likes` - 一句話按讚
- `story_likes` - 小故事按讚

### API 端點

#### 文章按讚

**Toggle 按讚狀態**
```http
POST /api/v1/posts/:id/like
Authorization: Bearer <token>
```

**回應範例**：
```json
{
  "success": true,
  "data": {
    "liked": true,
    "count": 42
  }
}
```

**檢查按讚狀態**
```http
GET /api/v1/posts/:id/like
Authorization: Bearer <token> (optional)
```

**回應範例**：
```json
{
  "success": true,
  "data": {
    "liked": true,
    "count": 42
  }
}
```

#### 人物誌按讚

**Toggle 按讚狀態**
```http
POST /api/v1/biographies/:id/like
Authorization: Bearer <token>
```

**路由實作位置**: `backend/src/routes/biographies.ts:754-817`

#### 人生清單按讚

**新增按讚**
```http
POST /api/v1/bucket-list/:id/like
Authorization: Bearer <token>
```

**取消按讚**
```http
DELETE /api/v1/bucket-list/:id/like
Authorization: Bearer <token>
```

**路由實作位置**: `backend/src/routes/bucket-list.ts:649-759`

#### 人物誌內容按讚

**核心故事按讚**
```http
POST /api/v1/biography-content/core-stories/:id/like
Authorization: Bearer <token>
```

**一句話按讚**
```http
POST /api/v1/biography-content/one-liners/:id/like
Authorization: Bearer <token>
```

**小故事按讚**
```http
POST /api/v1/biography-content/stories/:id/like
Authorization: Bearer <token>
```

**路由實作位置**: `backend/src/routes/biography-content.ts`

### 業務邏輯實作

#### Repository 層

**檔案**: `backend/src/repositories/content-interactions-repository.ts`

**核心方法**：

```typescript
class ContentInteractionsRepository {
  // 檢查使用者是否已按讚
  async hasLiked(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    userId: number
  ): Promise<boolean>

  // 批次檢查按讚狀態（用於列表頁）
  async batchCheckLikes(
    db: D1Database,
    contentType: ContentType,
    contentIds: number[],
    userId: number | null
  ): Promise<Map<number, boolean>>

  // 新增按讚
  async addLike(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    userId: number
  ): Promise<void>

  // 移除按讚
  async removeLike(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    userId: number
  ): Promise<void>

  // 取得按讚數
  async getLikeCount(
    db: D1Database,
    contentType: ContentType,
    contentId: number
  ): Promise<number>

  // 更新內容的按讚數
  async updateLikeCount(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    delta: number
  ): Promise<void>
}
```

#### Service 層

**檔案**: `backend/src/services/biography-content-interactions-service.ts`

**核心方法**：

```typescript
class BiographyContentInteractionsService {
  // Toggle 按讚狀態並發送通知
  async toggleLike(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    userId: number
  ): Promise<{ liked: boolean; count: number }>
}
```

**Toggle 按讚流程**：

1. 檢查內容是否存在
2. 檢查使用者當前按讚狀態
3. 執行按讚或取消按讚操作
4. 更新按讚計數
5. 如果是新增按讚且不是按讚自己的內容，發送通知

**通知內容範例**：
```typescript
{
  userId: content.author_id,
  type: 'core_story_liked',
  actorId: userId,
  targetId: contentId,
  title: '有人喜歡你的核心故事',
  message: `${userName} 喜歡了你的核心故事`
}
```

#### 按讚通知聚合

**功能**: 1 小時內同一目標的按讚會合併成一則通知

**實作位置**: `backend/src/routes/bucket-list.ts:677-739`

**聚合邏輯**：
```typescript
async function createLikeNotificationWithAggregation(
  db: D1Database,
  itemId: number,
  actorId: number,
  recipientId: number
) {
  // 檢查最近 1 小時內是否有相同目標的通知
  const recent = await db.prepare(`
    SELECT id, actor_count
    FROM notifications
    WHERE user_id = ?
      AND type = 'goal_liked'
      AND target_id = ?
      AND created_at > datetime('now', '-1 hour')
      AND is_read = 0
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(recipientId, itemId).first();

  if (recent) {
    // 更新現有通知
    const newCount = (recent.actor_count || 1) + 1;
    await db.prepare(`
      UPDATE notifications
      SET actor_count = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newCount, recent.id).run();
  } else {
    // 建立新通知
    await db.prepare(`
      INSERT INTO notifications (...)
      VALUES (...)
    `).bind(...).run();
  }
}
```

### 權限驗證

- **新增/取消按讚**：需要登入（`authMiddleware`）
- **查看按讚狀態**：可選登入（`optionalAuthMiddleware`）
  - 未登入：只返回總數
  - 已登入：返回總數 + 使用者是否已按讚
- **防止重複按讚**：資料庫 UNIQUE 約束
- **自己按讚不通知**：業務邏輯層檢查 `actorId !== recipientId`

### 效能優化

1. **批次查詢按讚狀態**：使用 `batchCheckLikes` 方法在列表頁一次查詢多個內容的按讚狀態
2. **資料庫索引**：在 `user_id`, `entity_type`, `entity_id` 上建立索引
3. **計數快取**：在內容表中儲存 `like_count` 欄位，避免每次都 COUNT

---

## 留言功能

### 概述

留言功能支援文章、人物誌、人生清單、核心故事、一句話、小故事等多種內容類型。支援巢狀留言（回覆功能）。

### 資料庫 Schema

#### 1. 通用留言表 (`comments`)

```sql
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    parent_id INTEGER,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
```

**支援的 entity_type**：
- `post` - 文章
- `gallery` - 相簿
- `video` - 影片
- `biography` - 人物誌

**Schema 檔案**: `backend/src/db/schema.sql`

#### 2. 專門留言表

**人生清單留言** (`bucket_list_comments`):
```sql
CREATE TABLE bucket_list_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES bucket_list_items(id) ON DELETE CASCADE
);
```

**人物誌內容留言表**：
- `core_story_comments` - 核心故事留言
- `one_liner_comments` - 一句話留言
- `story_comments` - 小故事留言

### API 端點

#### 文章留言

**取得留言列表（分頁）**
```http
GET /api/v1/posts/:id/comments?page=1&limit=20
```

**回應範例**：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "username": "climber_john",
      "display_name": "John Doe",
      "avatar_url": "https://...",
      "content": "很棒的文章！",
      "created_at": "2024-01-20T10:30:00Z",
      "updated_at": "2024-01-20T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**新增留言**
```http
POST /api/v1/posts/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "很棒的文章！"
}
```

**刪除留言**
```http
DELETE /api/v1/posts/:postId/comments/:commentId
Authorization: Bearer <token>
```

**路由實作位置**: `backend/src/routes/posts.ts:466-584`

#### 人物誌留言

**取得留言列表**
```http
GET /api/v1/biographies/:id/comments?page=1&limit=20
```

**新增留言**
```http
POST /api/v1/biographies/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "很喜歡你的故事"
}
```

**刪除留言**
```http
DELETE /api/v1/biographies/comments/:id
Authorization: Bearer <token>
```

**路由實作位置**: `backend/src/routes/biographies.ts:819-912`

#### 人生清單留言

**取得留言列表**
```http
GET /api/v1/bucket-list/:id/comments?page=1&limit=20
```

**新增留言**
```http
POST /api/v1/bucket-list/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "加油！你一定可以完成的"
}
```

**刪除留言**
```http
DELETE /api/v1/bucket-list/comments/:id
Authorization: Bearer <token>
```

**路由實作位置**: `backend/src/routes/bucket-list.ts:761-890`

#### 人物誌內容留言

**核心故事留言**
```http
GET /api/v1/biography-content/core-stories/:id/comments
POST /api/v1/biography-content/core-stories/:id/comments
DELETE /api/v1/biography-content/core-story-comments/:id
```

**一句話留言**
```http
GET /api/v1/biography-content/one-liners/:id/comments
POST /api/v1/biography-content/one-liners/:id/comments
DELETE /api/v1/biography-content/one-liner-comments/:id
```

**小故事留言**
```http
GET /api/v1/biography-content/stories/:id/comments
POST /api/v1/biography-content/stories/:id/comments
DELETE /api/v1/biography-content/story-comments/:id
```

**路由實作位置**: `backend/src/routes/biography-content.ts`

### 業務邏輯實作

#### Repository 層

**檔案**: `backend/src/repositories/content-interactions-repository.ts`

**核心方法**：

```typescript
class ContentInteractionsRepository {
  // 取得留言列表（含使用者資訊）
  async getComments(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    page: number,
    limit: number
  ): Promise<{ comments: Comment[]; total: number }>

  // 新增留言
  async addComment(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    userId: number,
    content: string
  ): Promise<number>

  // 刪除留言
  async deleteComment(
    db: D1Database,
    contentType: ContentType,
    commentId: number
  ): Promise<void>

  // 取得留言數
  async getCommentCount(
    db: D1Database,
    contentType: ContentType,
    contentId: number
  ): Promise<number>

  // 更新內容的留言數
  async updateCommentCount(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    delta: number
  ): Promise<void>
}
```

#### Service 層

**新增留言流程**（以人物誌為例）：

```typescript
// 1. 驗證內容不為空
if (!content || content.trim().length === 0) {
  return c.json({ success: false, error: '留言內容不能為空' }, 400);
}

// 2. 檢查人物誌是否存在
const biography = await db.prepare(
  'SELECT * FROM biographies WHERE id = ?'
).bind(id).first();

if (!biography) {
  return c.json({ success: false, error: '人物誌不存在' }, 404);
}

// 3. 新增留言
await db.prepare(`
  INSERT INTO comments (user_id, entity_type, entity_id, content)
  VALUES (?, 'biography', ?, ?)
`).bind(userId, id, content).run();

// 4. 更新留言計數
await db.prepare(`
  UPDATE biographies
  SET comment_count = comment_count + 1
  WHERE id = ?
`).bind(id).run();

// 5. 發送通知（不通知自己）
if (userId !== biography.user_id) {
  const user = await db.prepare(
    'SELECT display_name FROM users WHERE id = ?'
  ).bind(userId).first();

  await db.prepare(`
    INSERT INTO notifications (user_id, type, actor_id, target_id, title, message)
    VALUES (?, 'biography_commented', ?, ?, ?, ?)
  `).bind(
    biography.user_id,
    userId,
    id,
    '有人留言了',
    `${user.display_name} 留言了你的人物誌`
  ).run();
}
```

**刪除留言流程**：

```typescript
// 1. 取得留言資訊
const comment = await db.prepare(`
  SELECT c.*, b.user_id as biography_owner_id
  FROM comments c
  JOIN biographies b ON c.entity_id = b.id
  WHERE c.id = ? AND c.entity_type = 'biography'
`).bind(commentId).first();

// 2. 權限檢查（只能刪除自己的留言）
if (comment.user_id !== userId) {
  return c.json({ success: false, error: '無權限刪除此留言' }, 403);
}

// 3. 刪除留言
await db.prepare('DELETE FROM comments WHERE id = ?').bind(commentId).run();

// 4. 更新留言計數
await db.prepare(`
  UPDATE biographies
  SET comment_count = comment_count - 1
  WHERE id = ?
`).bind(comment.entity_id).run();
```

### 權限驗證

- **新增留言**：需要登入（`authMiddleware`）
- **刪除留言**：只能刪除自己的留言（業務邏輯檢查）
- **管理員權限**：管理員可以刪除任何留言（需配合 `adminMiddleware`）
- **內容驗證**：留言內容不能為空

### 留言列表優化

**JOIN 使用者表**：一次查詢取得留言和留言者資訊

```sql
SELECT
  c.id,
  c.user_id,
  c.content,
  c.created_at,
  c.updated_at,
  u.username,
  u.display_name,
  u.avatar_url
FROM comments c
LEFT JOIN users u ON c.user_id = u.id
WHERE c.entity_type = ? AND c.entity_id = ?
ORDER BY c.created_at DESC
LIMIT ? OFFSET ?
```

**分頁設計**：
- 預設每頁 20 筆
- 最大每頁 100 筆
- 返回總筆數和總頁數

---

## 追蹤功能

### 概述

追蹤功能允許使用者追蹤其他使用者的人物誌，獲取他們的最新動態。目前主要應用於人物誌頁面。

### 資料庫 Schema

```sql
CREATE TABLE follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

**Migration 檔案**: `backend/migrations/0012_create_interaction_tables.sql`

**關聯欄位**：
- `follower_id`: 追蹤者（主動方）
- `following_id`: 被追蹤者（被動方）

### API 端點

#### 追蹤人物誌

**追蹤**
```http
POST /api/v1/biographies/:id/follow
Authorization: Bearer <token>
```

**回應範例**：
```json
{
  "success": true,
  "message": "已追蹤"
}
```

**取消追蹤**
```http
DELETE /api/v1/biographies/:id/follow
Authorization: Bearer <token>
```

**回應範例**：
```json
{
  "success": true,
  "message": "已取消追蹤"
}
```

**檢查追蹤狀態**
```http
GET /api/v1/biographies/:id/follow
Authorization: Bearer <token>
```

**回應範例**：
```json
{
  "success": true,
  "data": {
    "isFollowing": true,
    "followerCount": 1234
  }
}
```

**取得追蹤者列表**
```http
GET /api/v1/biographies/:id/followers?page=1&limit=20
```

**回應範例**：
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "username": "climber_john",
      "display_name": "John Doe",
      "avatar_url": "https://...",
      "bio": "熱愛攀岩的冒險者",
      "followed_at": "2024-01-20T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1234,
    "total_pages": 62
  }
}
```

**取得追蹤中列表**
```http
GET /api/v1/biographies/:id/following?page=1&limit=20
```

**路由實作位置**: `backend/src/routes/biographies.ts:914-1110`

### 業務邏輯實作

#### 追蹤流程

```typescript
// 1. 檢查人物誌是否存在
const biography = await db.prepare(`
  SELECT b.*, u.display_name
  FROM biographies b
  JOIN users u ON b.user_id = u.id
  WHERE b.id = ?
`).bind(id).first();

if (!biography) {
  return c.json({ success: false, error: '人物誌不存在' }, 404);
}

// 2. 防止追蹤自己
if (biography.user_id === userId) {
  return c.json({ success: false, error: '無法追蹤自己' }, 400);
}

// 3. 可見性檢查
const visibilityClause = getVisibilityWhereClause(userId);
if (biography.visibility === 'private' && biography.user_id !== userId) {
  return c.json({ success: false, error: '此人物誌不公開' }, 403);
}

// 4. 檢查是否已追蹤
const existing = await db.prepare(`
  SELECT id FROM follows
  WHERE follower_id = ? AND following_id = ?
`).bind(userId, biography.user_id).first();

if (existing) {
  return c.json({ success: false, error: '已經追蹤過了' }, 409);
}

// 5. 新增追蹤記錄
await db.prepare(`
  INSERT INTO follows (follower_id, following_id)
  VALUES (?, ?)
`).bind(userId, biography.user_id).run();

// 6. 更新追蹤者計數
await db.prepare(`
  UPDATE biographies
  SET follower_count = follower_count + 1
  WHERE id = ?
`).bind(id).run();

// 7. 發送通知
const follower = await db.prepare(
  'SELECT display_name FROM users WHERE id = ?'
).bind(userId).first();

await db.prepare(`
  INSERT INTO notifications (user_id, type, actor_id, target_id, title, message)
  VALUES (?, 'new_follower', ?, ?, ?, ?)
`).bind(
  biography.user_id,
  userId,
  id,
  '有人追蹤了你',
  `${follower.display_name} 開始追蹤你了`
).run();
```

#### 取消追蹤流程

```typescript
// 1. 檢查追蹤記錄是否存在
const follow = await db.prepare(`
  SELECT f.*, b.id as biography_id
  FROM follows f
  JOIN biographies b ON f.following_id = b.user_id
  WHERE f.follower_id = ? AND b.id = ?
`).bind(userId, id).first();

if (!follow) {
  return c.json({ success: false, error: '未追蹤此人物誌' }, 404);
}

// 2. 刪除追蹤記錄
await db.prepare(`
  DELETE FROM follows
  WHERE follower_id = ? AND following_id = ?
`).bind(userId, follow.following_id).run();

// 3. 更新追蹤者計數
await db.prepare(`
  UPDATE biographies
  SET follower_count = follower_count - 1
  WHERE id = ?
`).bind(id).run();
```

### 權限驗證

- **追蹤/取消追蹤**：需要登入（`authMiddleware`）
- **可見性檢查**：只能追蹤 `public` 或 `community` 的人物誌
- **防止自己追蹤自己**：業務邏輯檢查
- **防止重複追蹤**：資料庫 UNIQUE 約束 + 業務邏輯檢查（返回 409 Conflict）

### 通知內容

```typescript
{
  userId: biography.user_id,        // 被追蹤者
  type: 'new_follower',
  actorId: userId,                  // 追蹤者
  targetId: biographyId,            // 人物誌 ID
  title: '有人追蹤了你',
  message: '${followerName} 開始追蹤你了'
}
```

---

## 收藏功能

### 概述

收藏功能允許使用者收藏喜歡的內容，方便日後查看。採用 Toggle 模式，單一端點處理收藏與取消收藏。

### 資料庫 Schema

```sql
CREATE TABLE bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_entity ON bookmarks(entity_type, entity_id);
```

**支援的 entity_type**：
- `post` - 文章
- `gallery` - 相簿
- `video` - 影片
- `gym` - 室內岩館
- `crag` - 戶外岩場
- `biography` - 人物誌

**Migration 檔案**: `backend/migrations/0019_create_bookmarks_table.sql`

### API 端點

#### 文章收藏

**Toggle 收藏狀態**
```http
POST /api/v1/posts/:id/bookmark
Authorization: Bearer <token>
```

**回應範例**：
```json
{
  "success": true,
  "data": {
    "bookmarked": true,
    "count": 89
  }
}
```

**檢查收藏狀態**
```http
GET /api/v1/posts/:id/bookmark
Authorization: Bearer <token> (optional)
```

**取得使用者收藏的文章列表**
```http
GET /api/v1/posts/liked?page=1&limit=20
Authorization: Bearer <token>
```

**路由實作位置**: `backend/src/routes/posts.ts:586-618`

### 業務邏輯實作

#### 共用 Toggle 函數

**檔案**: `backend/src/routes/posts.ts`

```typescript
// 通用的 Toggle 操作輔助函數
async function toggleAction(
  db: D1Database,
  table: 'likes' | 'bookmarks',
  entityType: string,
  entityId: number,
  userId: number
): Promise<{ toggled: boolean; count: number }> {
  // 檢查當前狀態
  const existing = await db.prepare(`
    SELECT id FROM ${table}
    WHERE user_id = ? AND entity_type = ? AND entity_id = ?
  `).bind(userId, entityType, entityId).first();

  if (existing) {
    // 已存在，執行刪除
    await db.prepare(`
      DELETE FROM ${table}
      WHERE user_id = ? AND entity_type = ? AND entity_id = ?
    `).bind(userId, entityType, entityId).run();
  } else {
    // 不存在，執行新增
    await db.prepare(`
      INSERT INTO ${table} (user_id, entity_type, entity_id)
      VALUES (?, ?, ?)
    `).bind(userId, entityType, entityId).run();
  }

  // 計算總數
  const countResult = await db.prepare(`
    SELECT COUNT(*) as count
    FROM ${table}
    WHERE entity_type = ? AND entity_id = ?
  `).bind(entityType, entityId).first();

  return {
    toggled: !existing,  // true: 新增, false: 刪除
    count: countResult.count
  };
}
```

#### 使用範例

```typescript
// Toggle 收藏
app.post('/api/v1/posts/:id/bookmark', authMiddleware, async (c) => {
  const postId = parseInt(c.req.param('id'));
  const userId = c.get('userId');

  const { toggled, count } = await toggleAction(
    c.env.DB,
    'bookmarks',
    'post',
    postId,
    userId
  );

  return c.json({
    success: true,
    data: {
      bookmarked: toggled,
      count
    }
  });
});
```

### 權限驗證

- **新增/取消收藏**：需要登入（`authMiddleware`）
- **查看收藏狀態**：可選登入（`optionalAuthMiddleware`）
- **查看收藏列表**：需要登入，只能查看自己的收藏

### 收藏列表查詢

```typescript
app.get('/api/v1/posts/liked', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  // 取得收藏的文章
  const posts = await c.env.DB.prepare(`
    SELECT
      p.*,
      u.username,
      u.display_name,
      u.avatar_url,
      b.created_at as bookmarked_at
    FROM bookmarks b
    JOIN posts p ON b.entity_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE b.user_id = ? AND b.entity_type = 'post'
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(userId, limit, offset).all();

  // 取得總數
  const totalResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total
    FROM bookmarks
    WHERE user_id = ? AND entity_type = 'post'
  `).bind(userId).first();

  return c.json({
    success: true,
    data: posts.results,
    pagination: {
      page,
      limit,
      total: totalResult.total,
      total_pages: Math.ceil(totalResult.total / limit)
    }
  });
});
```

---

## 引用清單功能

### 概述

引用清單功能（「我也想做」）允許使用者將他人的人生清單項目引用到自己的清單中，並自動通知原作者。這是一個獨特的社群互動功能。

### 資料庫 Schema

```sql
CREATE TABLE bucket_list_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_item_id INTEGER NOT NULL,
    target_biography_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_item_id) REFERENCES bucket_list_items(id) ON DELETE CASCADE,
    FOREIGN KEY (target_biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
    UNIQUE(source_item_id, target_biography_id)
);

CREATE INDEX idx_bucket_list_references_source ON bucket_list_references(source_item_id);
CREATE INDEX idx_bucket_list_references_target ON bucket_list_references(target_biography_id);
```

**Migration 檔案**: `backend/migrations/0012_create_interaction_tables.sql`

**欄位說明**：
- `source_item_id`: 來源人生清單項目 ID
- `target_biography_id`: 引用者的人物誌 ID

### API 端點

**引用人生清單項目**
```http
POST /api/v1/bucket-list/:id/reference
Authorization: Bearer <token>
```

**回應範例**：
```json
{
  "success": true,
  "message": "已成功引用到你的人生清單",
  "data": {
    "newItemId": 456
  }
}
```

**路由實作位置**: `backend/src/routes/bucket-list.ts:1027-1160`

### 業務邏輯實作

#### 引用流程

```typescript
// 1. 檢查使用者是否有人物誌
const userBiography = await db.prepare(`
  SELECT id FROM biographies WHERE user_id = ?
`).bind(userId).first();

if (!userBiography) {
  return c.json({
    success: false,
    error: '你需要先建立人物誌才能引用他人的目標'
  }, 400);
}

// 2. 取得來源項目
const sourceItem = await db.prepare(`
  SELECT
    bli.*,
    b.visibility,
    b.user_id as owner_id
  FROM bucket_list_items bli
  JOIN biographies b ON bli.biography_id = b.id
  WHERE bli.id = ?
`).bind(id).first();

if (!sourceItem) {
  return c.json({ success: false, error: '項目不存在' }, 404);
}

// 3. 檢查可見性（只能引用公開項目）
if (sourceItem.visibility !== 'public') {
  return c.json({
    success: false,
    error: '只能引用公開的目標'
  }, 403);
}

// 4. 檢查是否已引用過
const existingRef = await db.prepare(`
  SELECT id FROM bucket_list_references
  WHERE source_item_id = ? AND target_biography_id = ?
`).bind(id, userBiography.id).first();

if (existingRef) {
  return c.json({
    success: false,
    error: '你已經引用過這個目標了'
  }, 409);
}

// 5. 建立引用記錄
await db.prepare(`
  INSERT INTO bucket_list_references (source_item_id, target_biography_id)
  VALUES (?, ?)
`).bind(id, userBiography.id).run();

// 6. 複製項目到使用者的清單
const newItem = await db.prepare(`
  INSERT INTO bucket_list_items (
    biography_id,
    title,
    description,
    category,
    priority,
    status
  ) VALUES (?, ?, ?, ?, ?, 'not_started')
  RETURNING id
`).bind(
  userBiography.id,
  sourceItem.title,
  sourceItem.description,
  sourceItem.category,
  sourceItem.priority
).first();

// 7. 更新來源項目的啟發數
await db.prepare(`
  UPDATE bucket_list_items
  SET inspired_count = inspired_count + 1
  WHERE id = ?
`).bind(id).run();

// 8. 發送通知給原作者
const referencer = await db.prepare(
  'SELECT display_name FROM users WHERE id = ?'
).bind(userId).first();

await db.prepare(`
  INSERT INTO notifications (user_id, type, actor_id, target_id, title, message)
  VALUES (?, 'goal_referenced', ?, ?, ?, ?)
`).bind(
  sourceItem.owner_id,
  userId,
  id,
  '有人被你的目標啟發了',
  `${referencer.display_name} 也想完成「${sourceItem.title}」`
).run();

return c.json({
  success: true,
  message: '已成功引用到你的人生清單',
  data: {
    newItemId: newItem.id
  }
});
```

### 權限驗證

- **引用項目**：需要登入（`authMiddleware`）
- **必須有人物誌**：使用者必須先建立人物誌才能引用
- **可見性檢查**：只能引用 `visibility = 'public'` 的項目
- **防止重複引用**：資料庫 UNIQUE 約束 + 業務邏輯檢查（返回 409 Conflict）

### 通知內容

```typescript
{
  userId: sourceItem.owner_id,      // 原作者
  type: 'goal_referenced',
  actorId: userId,                  // 引用者
  targetId: sourceItemId,           // 來源項目 ID
  title: '有人被你的目標啟發了',
  message: '${referencerName} 也想完成「${itemTitle}」'
}
```

### 統計資料

**啟發數 (inspired_count)**：
- 儲存在 `bucket_list_items.inspired_count`
- 每次被引用時自動 +1
- 用於顯示該目標啟發了多少人

---

## 權限驗證機制

### Middleware 層級

#### 1. authMiddleware

**檔案**: `backend/src/middleware/auth.ts`

**功能**：
- 驗證 JWT token（從 Authorization header 或 Cookie）
- 解析使用者 ID 和角色
- 設定 `userId` 和 `user` 到 context
- 更新使用者活動時間（throttled，24小時一次）

**實作邏輯**：

```typescript
export async function authMiddleware(c: Context, next: Function) {
  // 取得 token
  let token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    token = c.req.cookie('token');
  }

  if (!token) {
    return c.json({ success: false, error: '未授權' }, 401);
  }

  try {
    // 驗證 JWT
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(c.env.JWT_SECRET)
    );

    // 設定到 context
    c.set('userId', payload.userId as number);
    c.set('user', payload);

    // 更新活動時間（throttled）
    const shouldUpdate = await shouldUpdateActivity(c.env.DB, payload.userId);
    if (shouldUpdate) {
      await updateUserActivity(c.env.DB, payload.userId);
    }

    await next();
  } catch (err) {
    return c.json({ success: false, error: '無效的 token' }, 401);
  }
}
```

**活動追蹤**：

```typescript
// 檢查是否需要更新（24小時節流）
async function shouldUpdateActivity(db: D1Database, userId: number): Promise<boolean> {
  const user = await db.prepare(`
    SELECT last_active_at FROM users WHERE id = ?
  `).bind(userId).first();

  if (!user || !user.last_active_at) {
    return true;
  }

  const lastActive = new Date(user.last_active_at);
  const now = new Date();
  const hoursSinceLastUpdate = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastUpdate >= 24;
}

// 更新活動時間
async function updateUserActivity(db: D1Database, userId: number): Promise<void> {
  await db.prepare(`
    UPDATE users
    SET last_active_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(userId).run();
}
```

#### 2. optionalAuthMiddleware

**功能**：
- 可選的登入驗證
- 若有 token 則設定 userId，否則繼續執行
- 不會因為未登入而返回 401

**使用場景**：
- 檢查按讚/收藏狀態（登入顯示使用者狀態，未登入只顯示總數）
- 取得內容列表（登入顯示個人化資料，未登入顯示公開資料）

**實作邏輯**：

```typescript
export async function optionalAuthMiddleware(c: Context, next: Function) {
  let token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    token = c.req.cookie('token');
  }

  if (token) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(c.env.JWT_SECRET)
      );
      c.set('userId', payload.userId as number);
      c.set('user', payload);
    } catch (err) {
      // Token 無效，但不返回錯誤，繼續執行
    }
  }

  await next();
}
```

#### 3. adminMiddleware

**功能**：
- 檢查使用者角色是否為 admin
- 需配合 authMiddleware 使用（先驗證身份）

**實作邏輯**：

```typescript
export async function adminMiddleware(c: Context, next: Function) {
  const user = c.get('user');

  if (!user || user.role !== 'admin') {
    return c.json({ success: false, error: '需要管理員權限' }, 403);
  }

  await next();
}
```

### 資料層級權限

#### 可見性控制

**功能**: 根據使用者登入狀態和內容可見性設定，控制資料查詢範圍

**可見性級別**：
- `public` - 所有人可見
- `community` - 社群成員可見（需登入）
- `private` - 僅作者可見

**輔助函數**：

```typescript
function getVisibilityWhereClause(userId: number | null): string {
  if (!userId) {
    // 未登入：只能看到 public
    return "visibility = 'public'";
  } else {
    // 已登入：可以看到 public, community, 和自己的內容
    return `(visibility = 'public' OR visibility = 'community' OR user_id = ${userId})`;
  }
}
```

**使用範例**：

```typescript
// 取得人物誌列表
const visibilityClause = getVisibilityWhereClause(userId);

const biographies = await db.prepare(`
  SELECT *
  FROM biographies
  WHERE ${visibilityClause}
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`).bind(limit, offset).all();
```

#### 所有權檢查

**功能**: 確保使用者只能修改/刪除自己的內容

**實作模式**：

```typescript
// 1. 取得內容
const content = await db.prepare(`
  SELECT * FROM posts WHERE id = ?
`).bind(postId).first();

// 2. 檢查所有權
if (content.user_id !== userId) {
  return c.json({
    success: false,
    error: '無權限修改此內容'
  }, 403);
}

// 3. 執行操作
await db.prepare(`
  UPDATE posts SET ... WHERE id = ?
`).bind(postId).run();
```

### 權限檢查總結表

| 功能 | 查看 | 新增 | 修改/刪除 | 特殊規則 |
|------|------|------|-----------|----------|
| **按讚** | optionalAuth | auth | auth | 自己按讚不通知 |
| **留言** | public | auth | auth + ownership | 只能刪除自己的留言 |
| **追蹤** | optionalAuth | auth | auth | 不能追蹤自己 |
| **收藏** | optionalAuth | auth | auth | - |
| **引用清單** | public | auth + hasBiography | - | 只能引用公開項目 |

---

## 通知系統整合

### 概述

所有互動功能都整合了通知系統，當使用者的內容被互動時會收到即時通知。通知系統支援多種類型、通知偏好設定和聚合功能。

### 通知類型

**Schema 檔案**: `backend/migrations/0027_consolidated_schema_updates.sql`

```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'goal_completed',
        'goal_liked',
        'goal_commented',
        'goal_referenced',
        'new_follower',
        'biography_liked',
        'biography_commented',
        'post_liked',
        'post_commented',
        'core_story_liked',
        'core_story_commented',
        'one_liner_liked',
        'one_liner_commented',
        'story_liked',
        'story_commented',
        'story_featured',
        'system_announcement'
    )),
    actor_id INTEGER,
    target_id INTEGER,
    title TEXT NOT NULL,
    message TEXT,
    is_read INTEGER DEFAULT 0,
    actor_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
```

**欄位說明**：
- `user_id`: 接收通知的使用者
- `type`: 通知類型
- `actor_id`: 執行動作的使用者（誰按讚/留言/追蹤）
- `target_id`: 目標內容 ID（被按讚/留言的內容）
- `title`: 通知標題
- `message`: 通知訊息
- `is_read`: 是否已讀
- `actor_count`: 聚合計數（多人按讚時顯示人數）

### 通知類型說明

| Type | 中文 | 觸發場景 | 訊息範例 |
|------|------|----------|----------|
| `goal_completed` | 目標完成 | 完成人生清單項目 | "恭喜你完成了目標！" |
| `goal_liked` | 目標被按讚 | 人生清單項目被按讚 | "John 喜歡了你的目標「完攀龍洞」" |
| `goal_commented` | 目標被留言 | 人生清單項目被留言 | "John 留言了你的目標" |
| `goal_referenced` | 目標被引用 | 他人引用你的目標 | "John 也想完成「完攀龍洞」" |
| `new_follower` | 新追蹤者 | 被他人追蹤 | "John 開始追蹤你了" |
| `biography_liked` | 人物誌被按讚 | 人物誌被按讚 | "John 喜歡了你的人物誌" |
| `biography_commented` | 人物誌被留言 | 人物誌被留言 | "John 留言了你的人物誌" |
| `post_liked` | 文章被按讚 | 文章被按讚 | "John 喜歡了你的文章" |
| `post_commented` | 文章被留言 | 文章被留言 | "John 留言了你的文章" |
| `core_story_liked` | 核心故事被按讚 | 核心故事被按讚 | "John 喜歡了你的核心故事" |
| `core_story_commented` | 核心故事被留言 | 核心故事被留言 | "John 留言了你的核心故事" |
| `one_liner_liked` | 一句話被按讚 | 一句話被按讚 | "John 喜歡了你的一句話" |
| `one_liner_commented` | 一句話被留言 | 一句話被留言 | "John 留言了你的一句話" |
| `story_liked` | 故事被按讚 | 小故事被按讚 | "John 喜歡了你的故事" |
| `story_commented` | 故事被留言 | 小故事被留言 | "John 留言了你的故事" |
| `story_featured` | 故事被精選 | 故事被管理員精選 | "你的故事被精選了！" |
| `system_announcement` | 系統公告 | 管理員發送公告 | "系統維護通知" |

### 通知偏好設定

**Schema**:

```sql
CREATE TABLE notification_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL,
    value INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, notification_type)
);
```

**功能**：
- 使用者可以針對每種通知類型開關通知
- `value = 1`: 開啟通知
- `value = 0`: 關閉通知
- 預設所有通知都開啟

**Email Digest 支援**：

```sql
ALTER TABLE users ADD COLUMN email_digest_frequency TEXT DEFAULT 'weekly'
CHECK (email_digest_frequency IN ('daily', 'weekly', 'never'));
```

### 通知發送邏輯

#### 1. 基本通知發送

**範例：按讚通知**

```typescript
// 檢查是否按讚自己的內容
if (userId !== content.author_id) {
  // 取得按讚者名稱
  const user = await db.prepare(
    'SELECT display_name FROM users WHERE id = ?'
  ).bind(userId).first();

  // 檢查通知偏好
  const pref = await db.prepare(`
    SELECT value FROM notification_preferences
    WHERE user_id = ? AND notification_type = 'core_story_liked'
  `).bind(content.author_id).first();

  if (!pref || pref.value === 1) {
    // 發送通知
    await db.prepare(`
      INSERT INTO notifications (user_id, type, actor_id, target_id, title, message)
      VALUES (?, 'core_story_liked', ?, ?, ?, ?)
    `).bind(
      content.author_id,
      userId,
      contentId,
      '有人喜歡你的核心故事',
      `${user.display_name} 喜歡了你的核心故事`
    ).run();
  }
}
```

#### 2. 聚合通知（防洗版）

**功能**: 1 小時內同一目標的多次按讚會合併成一則通知

**範例：人生清單按讚聚合**

```typescript
async function createLikeNotificationWithAggregation(
  db: D1Database,
  itemId: number,
  actorId: number,
  recipientId: number
) {
  // 1. 檢查最近 1 小時內是否有相同目標的通知
  const recent = await db.prepare(`
    SELECT id, actor_count
    FROM notifications
    WHERE user_id = ?
      AND type = 'goal_liked'
      AND target_id = ?
      AND created_at > datetime('now', '-1 hour')
      AND is_read = 0
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(recipientId, itemId).first();

  if (recent) {
    // 2. 更新現有通知
    const newCount = (recent.actor_count || 1) + 1;

    await db.prepare(`
      UPDATE notifications
      SET actor_count = ?,
          actor_id = ?,
          message = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      newCount,
      actorId,  // 更新為最新的按讚者
      `${newCount} 個人喜歡了你的目標`,
      recent.id
    ).run();
  } else {
    // 3. 建立新通知
    const actor = await db.prepare(
      'SELECT display_name FROM users WHERE id = ?'
    ).bind(actorId).first();

    await db.prepare(`
      INSERT INTO notifications (user_id, type, actor_id, target_id, title, message, actor_count)
      VALUES (?, 'goal_liked', ?, ?, ?, ?, 1)
    `).bind(
      recipientId,
      actorId,
      itemId,
      '有人喜歡你的目標',
      `${actor.display_name} 喜歡了你的目標`
    ).run();
  }
}
```

**優點**：
- 減少通知洗版問題
- 顯示真實互動數量
- 1 小時的時間窗口平衡了即時性和聚合效果

#### 3. 通知發送規則

**不發送通知的情況**：
1. 互動自己的內容（`actorId === recipientId`）
2. 使用者關閉了該類型通知（`notification_preferences.value = 0`）
3. 聚合通知的情況（更新現有通知而非建立新通知）

**發送通知的時機**：
- 按讚：立即發送（或更新聚合通知）
- 留言：立即發送
- 追蹤：立即發送
- 引用清單：立即發送
- 完成目標：使用者手動觸發時發送

### 通知 API 端點

**路由檔案**: `backend/src/routes/notifications.ts`

**取得通知列表**
```http
GET /api/v1/notifications?page=1&limit=20&unread_only=false
Authorization: Bearer <token>
```

**標記為已讀**
```http
POST /api/v1/notifications/:id/read
Authorization: Bearer <token>
```

**標記全部為已讀**
```http
POST /api/v1/notifications/read-all
Authorization: Bearer <token>
```

**取得未讀數量**
```http
GET /api/v1/notifications/unread-count
Authorization: Bearer <token>
```

**更新通知偏好**
```http
PUT /api/v1/notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "goal_liked": true,
  "goal_commented": false,
  "new_follower": true
}
```

---

## Repository & Service 架構

### 架構分層

```
┌─────────────────────────────────────────────────────┐
│                    Route Handlers                   │
│  處理 HTTP 請求、參數驗證、回應格式                      │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                      Services                       │
│  複雜業務邏輯、多資料表協調、通知發送                     │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                   Repositories                      │
│  資料庫操作抽象、SQL 查詢、型別轉換                       │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                   D1 Database                       │
│  Cloudflare D1 (SQLite)                            │
└─────────────────────────────────────────────────────┘
```

### Repository 層

#### 1. ContentInteractionsRepository

**檔案**: `backend/src/repositories/content-interactions-repository.ts`

**職責**：
- 通用的按讚和留言資料庫操作
- 支援內容類型：`core_story`, `one_liner`, `story`
- 提供型別安全的資料存取方法

**核心方法**：

```typescript
export class ContentInteractionsRepository {
  // === 按讚相關 ===

  // 檢查使用者是否已按讚
  async hasLiked(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    userId: number
  ): Promise<boolean>

  // 批次檢查按讚狀態（用於列表頁）
  async batchCheckLikes(
    db: D1Database,
    contentType: ContentType,
    contentIds: number[],
    userId: number | null
  ): Promise<Map<number, boolean>>

  // 新增按讚
  async addLike(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    userId: number
  ): Promise<void>

  // 移除按讚
  async removeLike(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    userId: number
  ): Promise<void>

  // 取得按讚數
  async getLikeCount(
    db: D1Database,
    contentType: ContentType,
    contentId: number
  ): Promise<number>

  // 更新內容的按讚數
  async updateLikeCount(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    delta: number
  ): Promise<void>

  // === 留言相關 ===

  // 取得留言列表（含使用者資訊）
  async getComments(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    page: number,
    limit: number
  ): Promise<{ comments: Comment[]; total: number }>

  // 新增留言
  async addComment(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    userId: number,
    content: string
  ): Promise<number>

  // 刪除留言
  async deleteComment(
    db: D1Database,
    contentType: ContentType,
    commentId: number
  ): Promise<void>

  // 取得留言數
  async getCommentCount(
    db: D1Database,
    contentType: ContentType,
    contentId: number
  ): Promise<number>

  // 更新內容的留言數
  async updateCommentCount(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    delta: number
  ): Promise<void>
}
```

**型別定義**：

```typescript
export type ContentType = 'core_story' | 'one_liner' | 'story';

export interface Comment {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}
```

#### 2. BiographyContentCrudRepository

**檔案**: `backend/src/repositories/*` (多個檔案)

**職責**：
- 人物誌內容的 CRUD 操作
- 支援核心故事、一句話、小故事的增刪改查

#### 3. PostRepository

**職責**：
- 文章的資料庫操作
- 文章列表查詢、分頁、篩選

#### 4. BiographyRepository

**職責**：
- 人物誌的資料庫操作
- 追蹤關係管理

### Service 層

#### 1. BiographyContentInteractionsService

**檔案**: `backend/src/services/biography-content-interactions-service.ts`

**職責**：
- 處理人物誌內容的按讚和留言業務邏輯
- 發送通知
- 批次加入按讚狀態
- 權限檢查

**核心方法**：

```typescript
export class BiographyContentInteractionsService {
  constructor(
    private contentRepo: BiographyContentCrudRepository,
    private interactionsRepo: ContentInteractionsRepository
  ) {}

  // Toggle 按讚狀態並發送通知
  async toggleLike(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    userId: number
  ): Promise<{ liked: boolean; count: number }>

  // 新增留言並發送通知
  async addComment(
    db: D1Database,
    contentType: ContentType,
    contentId: number,
    userId: number,
    content: string
  ): Promise<{ commentId: number }>

  // 批次加入按讚狀態到內容列表
  async enrichWithLikeStatus(
    db: D1Database,
    contentType: ContentType,
    contents: any[],
    userId: number | null
  ): Promise<any[]>
}
```

**Toggle 按讚實作**：

```typescript
async toggleLike(
  db: D1Database,
  contentType: ContentType,
  contentId: number,
  userId: number
): Promise<{ liked: boolean; count: number }> {
  // 1. 取得內容資訊（檢查是否存在）
  const content = await this.contentRepo.getById(db, contentType, contentId);
  if (!content) {
    throw new Error('內容不存在');
  }

  // 2. 檢查當前按讚狀態
  const hasLiked = await this.interactionsRepo.hasLiked(
    db,
    contentType,
    contentId,
    userId
  );

  // 3. Toggle 操作
  if (hasLiked) {
    // 取消按讚
    await this.interactionsRepo.removeLike(db, contentType, contentId, userId);
    await this.interactionsRepo.updateLikeCount(db, contentType, contentId, -1);
  } else {
    // 新增按讚
    await this.interactionsRepo.addLike(db, contentType, contentId, userId);
    await this.interactionsRepo.updateLikeCount(db, contentType, contentId, 1);

    // 發送通知（不通知自己）
    if (userId !== content.author_id) {
      await this.sendLikeNotification(db, contentType, contentId, userId, content.author_id);
    }
  }

  // 4. 取得最新按讚數
  const count = await this.interactionsRepo.getLikeCount(db, contentType, contentId);

  return { liked: !hasLiked, count };
}
```

#### 2. PostService

**檔案**: `backend/src/services/post-service.ts`

**職責**：
- 文章業務邏輯
- 快取管理（使用 Cloudflare KV）
- 瀏覽次數追蹤

**核心方法**：

```typescript
export class PostService {
  // 取得文章（含快取）
  async getPost(
    db: D1Database,
    kv: KVNamespace,
    postId: number,
    userId: number | null
  ): Promise<Post>

  // 更新瀏覽次數
  async incrementViewCount(
    db: D1Database,
    postId: number
  ): Promise<void>

  // 清除快取
  async invalidateCache(
    kv: KVNamespace,
    postId: number
  ): Promise<void>
}
```

#### 3. BiographyService

**檔案**: `backend/src/services/biography-service.ts`

**職責**：
- 人物誌業務邏輯
- 追蹤關係處理
- 可見性控制

### 使用範例

#### 在 Route Handler 中使用 Service

```typescript
import { BiographyContentInteractionsService } from '@/services/biography-content-interactions-service';
import { ContentInteractionsRepository } from '@/repositories/content-interactions-repository';
import { BiographyContentCrudRepository } from '@/repositories/biography-content-crud-repository';

// Toggle 按讚
app.post('/api/v1/biography-content/core-stories/:id/like', authMiddleware, async (c) => {
  const contentId = parseInt(c.req.param('id'));
  const userId = c.get('userId');

  // 初始化 Service
  const contentRepo = new BiographyContentCrudRepository();
  const interactionsRepo = new ContentInteractionsRepository();
  const service = new BiographyContentInteractionsService(contentRepo, interactionsRepo);

  try {
    const result = await service.toggleLike(
      c.env.DB,
      'core_story',
      contentId,
      userId
    );

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 400);
  }
});
```

### 架構優點

1. **關注點分離**：路由、業務邏輯、資料存取各司其職
2. **可測試性**：每層都可以獨立測試
3. **可重用性**：Repository 和 Service 可在多個路由中重用
4. **型別安全**：TypeScript 提供完整的型別檢查
5. **易於維護**：清晰的架構讓代碼易於理解和修改

---

## API 設計模式

### RESTful 風格

#### 1. 資源命名

**規則**：
- 使用複數名詞表示資源集合
- 使用 kebab-case（小寫加連字號）
- 避免動詞，用 HTTP 方法表達操作

**範例**：
```
✅ GET  /api/v1/posts
✅ POST /api/v1/posts
✅ GET  /api/v1/posts/:id
✅ PUT  /api/v1/posts/:id
✅ DELETE /api/v1/posts/:id

❌ GET  /api/v1/getPosts
❌ POST /api/v1/createPost
```

#### 2. 子資源命名

**格式**：`/資源/:id/子資源`

**範例**：
```
GET  /api/v1/posts/:id/comments       # 取得文章的留言
POST /api/v1/posts/:id/comments       # 新增留言到文章
GET  /api/v1/biographies/:id/followers # 取得人物誌的追蹤者
```

#### 3. 動作命名

**格式**：`/資源/:id/動作`

對於不適合用 REST 動詞表達的操作，使用動作名稱：

```
POST /api/v1/posts/:id/like          # 按讚（toggle）
POST /api/v1/posts/:id/bookmark      # 收藏（toggle）
POST /api/v1/biographies/:id/follow  # 追蹤
POST /api/v1/bucket-list/:id/reference # 引用
```

### HTTP 方法使用

| 方法 | 用途 | 冪等性 | 安全性 |
|------|------|--------|--------|
| GET | 取得資源 | ✅ | ✅ |
| POST | 建立資源 / 執行動作 | ❌ | ❌ |
| PUT | 完整更新資源 | ✅ | ❌ |
| PATCH | 部分更新資源 | ❌ | ❌ |
| DELETE | 刪除資源 | ✅ | ❌ |

### 回應格式統一

#### 1. 成功回應

**格式**：
```typescript
interface SuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

**範例**：

```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "我的攀岩日記",
    "content": "..."
  }
}
```

**列表回應**：

```json
{
  "success": true,
  "data": [
    { "id": 1, "title": "文章1" },
    { "id": 2, "title": "文章2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

#### 2. 錯誤回應

**格式**：
```typescript
interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}
```

**範例**：

```json
{
  "success": false,
  "error": "文章不存在"
}
```

**驗證錯誤**：

```json
{
  "success": false,
  "error": "驗證失敗",
  "details": {
    "title": "標題不能為空",
    "content": "內容不能為空"
  }
}
```

### HTTP 狀態碼使用

| 狀態碼 | 說明 | 使用時機 |
|--------|------|----------|
| 200 | OK | 成功取得資源 |
| 201 | Created | 成功建立資源 |
| 204 | No Content | 成功刪除資源（無內容返回） |
| 400 | Bad Request | 請求參數錯誤 |
| 401 | Unauthorized | 未授權（未登入或 token 無效） |
| 403 | Forbidden | 已登入但無權限 |
| 404 | Not Found | 資源不存在 |
| 409 | Conflict | 資源衝突（如重複按讚） |
| 500 | Internal Server Error | 伺服器錯誤 |

**範例**：

```typescript
// 200 - 成功取得
return c.json({ success: true, data: post }, 200);

// 201 - 成功建立
return c.json({ success: true, data: newPost }, 201);

// 400 - 參數錯誤
return c.json({ success: false, error: '缺少必填欄位' }, 400);

// 401 - 未授權
return c.json({ success: false, error: '請先登入' }, 401);

// 403 - 無權限
return c.json({ success: false, error: '無權限修改此資源' }, 403);

// 404 - 資源不存在
return c.json({ success: false, error: '文章不存在' }, 404);

// 409 - 衝突
return c.json({ success: false, error: '已經按讚過了' }, 409);
```

### 分頁設計

#### 查詢參數

```
GET /api/v1/posts?page=1&limit=20
```

**參數說明**：
- `page`: 頁碼（從 1 開始）
- `limit`: 每頁筆數（預設 20，最大 100）

#### 回應格式

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

#### 實作範例

```typescript
app.get('/api/v1/posts', optionalAuthMiddleware, async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  // 取得資料
  const posts = await c.env.DB.prepare(`
    SELECT * FROM posts
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  // 取得總數
  const totalResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM posts
  `).first();

  return c.json({
    success: true,
    data: posts.results,
    pagination: {
      page,
      limit,
      total: totalResult.total,
      total_pages: Math.ceil(totalResult.total / limit)
    }
  });
});
```

### Toggle 端點設計

**概念**：單一端點同時處理開啟和關閉操作

**優點**：
- 減少端點數量
- 前端只需呼叫一個 API
- 自動處理冪等性

**範例**：

```typescript
// Toggle 按讚
POST /api/v1/posts/:id/like

// 回應
{
  "success": true,
  "data": {
    "liked": true,  // true: 已按讚, false: 已取消
    "count": 42     // 總按讚數
  }
}
```

**實作邏輯**：

```typescript
app.post('/api/v1/posts/:id/like', authMiddleware, async (c) => {
  const postId = parseInt(c.req.param('id'));
  const userId = c.get('userId');

  // 檢查當前狀態
  const existing = await c.env.DB.prepare(`
    SELECT id FROM likes
    WHERE user_id = ? AND entity_type = 'post' AND entity_id = ?
  `).bind(userId, postId).first();

  if (existing) {
    // 已按讚 → 取消按讚
    await c.env.DB.prepare(`
      DELETE FROM likes
      WHERE user_id = ? AND entity_type = 'post' AND entity_id = ?
    `).bind(userId, postId).run();
  } else {
    // 未按讚 → 新增按讚
    await c.env.DB.prepare(`
      INSERT INTO likes (user_id, entity_type, entity_id)
      VALUES (?, 'post', ?)
    `).bind(userId, postId).run();
  }

  // 取得最新數量
  const count = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM likes
    WHERE entity_type = 'post' AND entity_id = ?
  `).bind(postId).first();

  return c.json({
    success: true,
    data: {
      liked: !existing,
      count: count.count
    }
  });
});
```

### API 版本控制

**當前版本**：`/api/v1/`

**未來版本**：
- `/api/v2/` - 重大改版
- 使用 Accept header 版本控制（進階）

**原則**：
- 向後兼容的修改不需要新版本
- 破壞性修改需要新版本
- 舊版本至少維護 6 個月

---

## 關鍵檔案路徑

### 路由處理器

| 檔案 | 功能 | 行數參考 |
|------|------|----------|
| `backend/src/routes/posts.ts` | 文章互動（按讚、留言、收藏） | 466-618 |
| `backend/src/routes/biographies.ts` | 人物誌互動與追蹤 | 754-1110 |
| `backend/src/routes/biography-content.ts` | 人物誌內容互動 | - |
| `backend/src/routes/bucket-list.ts` | 人生清單互動與引用 | 649-1160 |
| `backend/src/routes/notifications.ts` | 通知系統 | - |

### Repository & Service

| 檔案 | 功能 |
|------|------|
| `backend/src/repositories/content-interactions-repository.ts` | 通用按讚和留言資料存取 |
| `backend/src/services/biography-content-interactions-service.ts` | 人物誌內容互動業務邏輯 |
| `backend/src/services/post-service.ts` | 文章業務邏輯 |
| `backend/src/services/biography-service.ts` | 人物誌業務邏輯 |

### 資料庫 Schema

| 檔案 | 功能 |
|------|------|
| `backend/src/db/schema.sql` | 主要資料庫 schema |
| `backend/migrations/0002_add_likes_table.sql` | 通用按讚表 |
| `backend/migrations/0012_create_interaction_tables.sql` | 互動表（追蹤、引用） |
| `backend/migrations/0015_create_biography_likes_table.sql` | 人物誌按讚表 |
| `backend/migrations/0019_create_bookmarks_table.sql` | 收藏表 |
| `backend/migrations/0027_consolidated_schema_updates.sql` | 整合更新（通知系統） |

### 中介層

| 檔案 | 功能 |
|------|------|
| `backend/src/middleware/auth.ts` | JWT 驗證、權限控制 |

### 類型定義

| 檔案 | 功能 |
|------|------|
| `backend/src/types.ts` | TypeScript 類型定義 |

---

## 總結

NobodyClimb 的互動功能展現了以下特點：

### 技術架構
- ✅ 清晰的分層架構（Route → Service → Repository → Database）
- ✅ 完善的權限控制（Middleware + 資料層級雙重驗證）
- ✅ 通用資料表設計（entity_type + entity_id 支援多種內容類型）
- ✅ 通知系統整合（所有互動自動觸發通知）
- ✅ 良好的 RESTful API 設計

### 功能特點
- ✅ **按讚**：Toggle 模式、通知聚合、批次查詢
- ✅ **留言**：分頁列表、巢狀回覆、所有權檢查
- ✅ **追蹤**：可見性控制、追蹤者/追蹤中列表
- ✅ **收藏**：Toggle 模式、收藏列表
- ✅ **引用清單**：社群啟發功能、自動複製項目

### 開發最佳實踐
- ✅ 型別安全（TypeScript）
- ✅ 資料庫索引優化
- ✅ 計數快取（避免頻繁 COUNT）
- ✅ 通知聚合（防洗版）
- ✅ 統一的錯誤處理
- ✅ 完整的 API 文件

---

**維護者**：NobodyClimb 開發團隊
**聯絡方式**：https://github.com/nobodyclimb
**最後更新**：2026-01-22
