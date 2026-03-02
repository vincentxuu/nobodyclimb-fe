# 快速評論功能設計文件

> **版本**：v1.1
> **更新日期**：2026-01-27
> **狀態**：設計已完成，實作可選

> ⚠️ **注意**：目前系統已有「按讚」功能（ContentLikeButton）可滿足基本互動需求。
> 此快速反應功能（「我也是」「+1」「說得好」）為可選的體驗增強，優先級較低。

---

## 一、功能概述

在故事內容（core_story, one_liner, story）下方加入快速評論功能，讓用戶能一鍵表達共鳴：

| 快速評論 | Key | 說明 |
|---------|-----|------|
| 我也是 | `me_too` | 表達相同經歷或感受 |
| +1 | `plus_one` | 表示認同 |
| 說得好 | `well_said` | 讚賞表達方式 |

### UI 示意

```
┌──────────────────────────────────────────────────────────────┐
│  [故事內容]                                                   │
│  「大學社團體驗，一爬就愛上了...」                              │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                │
│  │ 我也是(12) │  │  +1 (5)   │  │ 說得好(8) │                │
│  └───────────┘  └───────────┘  └───────────┘                │
│   [高亮=已按]                                                 │
│                                                              │
│  ❤️ 23    💬 5                                                │
└──────────────────────────────────────────────────────────────┘
```

### 功能規則

- 一鍵點擊即可發送/取消
- 同一用戶對同一故事可同時按多種快速評論（如同時按「我也是」和「說得好」）
- 同一用戶對同一故事的同一類型只能按一次
- 顯示每種快速評論的數量統計
- 用戶已點擊的按鈕有視覺反饋（高亮）

---

## 二、設計決策

### 為什麼新增 `reactions` 表？

| 方案 | 優點 | 缺點 |
|------|------|------|
| **新增 reactions 表** ✅ | 語意清晰、不影響現有系統、支援多類型反應 | 多一個表 |
| 擴展 likes 表 | 複用現有表 | likes 語意是單一按讚，不適合多類型 |
| 擴展 comments 表 | 複用現有表 | 快速評論沒有文字內容，不適合 |

**結論**：參考現有 `likes` 表的模式，新增專用的 `reactions` 表。

---

## 三、資料庫設計

### 新增表：reactions

```sql
-- Migration: 0028_create_reactions_table.sql

CREATE TABLE IF NOT EXISTS reactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('core_story', 'one_liner', 'story')),
  entity_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('me_too', 'plus_one', 'well_said')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  -- 同一用戶對同一內容的同一反應類型只能有一筆
  UNIQUE (user_id, entity_type, entity_id, reaction_type)
);

CREATE INDEX idx_reactions_entity ON reactions(entity_type, entity_id);
CREATE INDEX idx_reactions_user ON reactions(user_id);
```

### 與現有表的關係

```
reactions 表
├── entity_type: 'core_story' | 'one_liner' | 'story'
├── entity_id: 對應各故事表的 id
└── reaction_type: 'me_too' | 'plus_one' | 'well_said'

關聯：
├── biography_core_stories.id ← reactions.entity_id (when entity_type='core_story')
├── biography_one_liners.id   ← reactions.entity_id (when entity_type='one_liner')
└── biography_stories.id      ← reactions.entity_id (when entity_type='story')
```

---

## 四、API 設計

### 端點

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/content/core-stories/:id/reactions` | 取得快速評論統計 |
| POST | `/content/core-stories/:id/reactions` | 新增/取消快速評論 |
| GET | `/content/one-liners/:id/reactions` | 取得快速評論統計 |
| POST | `/content/one-liners/:id/reactions` | 新增/取消快速評論 |
| GET | `/content/stories/:id/reactions` | 取得快速評論統計 |
| POST | `/content/stories/:id/reactions` | 新增/取消快速評論 |

### Request/Response

```typescript
// POST /content/core-stories/:id/reactions
// Request
{
  "reaction_type": "me_too" | "plus_one" | "well_said"
}

// Response（toggle 行為：有則刪除，無則新增）
{
  "success": true,
  "data": {
    "reacted": true,  // true=已新增, false=已取消
    "reaction_counts": {
      "me_too": 13,
      "plus_one": 5,
      "well_said": 8
    }
  }
}

// GET /content/core-stories/:id/reactions
// Response
{
  "success": true,
  "data": {
    "reaction_counts": {
      "me_too": 12,
      "plus_one": 5,
      "well_said": 8
    },
    "user_reactions": ["me_too", "well_said"]  // 當前用戶已按的類型（需登入）
  }
}
```

---

## 五、後端實作

### 修改檔案清單

| 檔案 | 修改內容 |
|------|---------|
| `backend/migrations/0028_create_reactions_table.sql` | 新增 |
| `backend/src/repositories/content-interactions-repository.ts` | 新增 reaction 相關方法 |
| `backend/src/services/biography-content-interactions-service.ts` | 新增 reaction 服務方法 |
| `backend/src/routes/biography-content.ts` | 新增 reaction 路由 |

### Repository 新增方法

```typescript
// content-interactions-repository.ts

// 檢查用戶是否已按特定反應
async hasReaction(contentType, contentId, userId, reactionType): Promise<boolean>

// 新增反應
async addReaction(contentType, contentId, userId, reactionType): Promise<void>

// 移除反應
async removeReaction(contentType, contentId, userId, reactionType): Promise<void>

// 取得反應統計
async getReactionCounts(contentType, contentId): Promise<{me_too: number, plus_one: number, well_said: number}>

// 取得用戶已按的反應類型
async getUserReactions(contentType, contentId, userId): Promise<string[]>

// 批次取得用戶反應（用於列表頁面）
async batchGetUserReactions(contentType, contentIds, userId): Promise<Map<string, string[]>>
```

### Service 新增方法

```typescript
// biography-content-interactions-service.ts

// Toggle 反應（有則刪除，無則新增）
async toggleReaction(contentType, contentId, userId, reactionType): Promise<{
  reacted: boolean,
  reaction_counts: ReactionCounts
}>

// 取得反應統計（含用戶狀態）
async getReactionsWithUserStatus(contentType, contentId, userId?): Promise<{
  reaction_counts: ReactionCounts,
  user_reactions: string[]
}>
```

---

## 六、前端實作

### 修改檔案清單

| 檔案 | 修改內容 |
|------|---------|
| `src/lib/api/services.ts` | 新增 reaction API 方法 |
| `src/components/biography/display/QuickReactionBar.tsx` | 新增組件 |
| `src/components/biography/display/BiographyCoreStories.tsx` | 整合 QuickReactionBar |
| `src/components/biography/display/BiographyOneLiners.tsx` | 整合 QuickReactionBar |
| `src/components/biography/display/BiographyStories.tsx` | 整合 QuickReactionBar |

### QuickReactionBar 組件設計

```typescript
// QuickReactionBar.tsx

interface QuickReactionBarProps {
  /** 各類型反應數量 */
  reactionCounts: {
    me_too: number
    plus_one: number
    well_said: number
  }
  /** 當前用戶已按的反應類型 */
  userReactions: string[]
  /** Toggle 反應回調 */
  onToggle: (type: 'me_too' | 'plus_one' | 'well_said') => Promise<void>
  /** 大小 */
  size?: 'sm' | 'md'
  /** 自訂樣式 */
  className?: string
}

// 參考 ContentLikeButton.tsx 實作 optimistic update 模式
```

### API Service 新增方法

```typescript
// services.ts - biographyContentService

// Core Story
getCoreStoryReactions: async (storyId: string) => { ... }
toggleCoreStoryReaction: async (storyId: string, reactionType: string) => { ... }

// One Liner
getOneLinerReactions: async (oneLinerId: string) => { ... }
toggleOneLinerReaction: async (oneLinerId: string, reactionType: string) => { ... }

// Story
getStoryReactions: async (storyId: string) => { ... }
toggleStoryReaction: async (storyId: string, reactionType: string) => { ... }
```

---

## 七、實作順序

```
Phase 1: 資料庫
├── 建立 migration 檔案
└── 執行 migration

Phase 2: 後端 Repository
├── 新增 reaction CRUD 方法
└── 新增批次查詢方法

Phase 3: 後端 Service
├── 新增 toggleReaction 方法
└── 新增 getReactionsWithUserStatus 方法

Phase 4: 後端 Routes
├── 新增 GET /reactions 端點
└── 新增 POST /reactions 端點

Phase 5: 前端 API
├── 新增 reaction API 方法
└── 新增 TypeScript 類型定義

Phase 6: 前端組件
├── 建立 QuickReactionBar 組件
├── 實作 optimistic update
└── 處理登入狀態

Phase 7: 整合
├── 整合到 BiographyCoreStories
├── 整合到 BiographyOneLiners
└── 整合到 BiographyStories
```

---

## 八、驗證方式

### 資料庫驗證

```bash
cd backend
pnpm db:migrate
```

### 後端 API 測試

```bash
# 取得反應（不需登入）
curl http://localhost:8787/api/v1/content/core-stories/{id}/reactions

# 新增反應（需登入）
curl -X POST http://localhost:8787/api/v1/content/core-stories/{id}/reactions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"reaction_type": "me_too"}'

# 再次呼叫應該取消反應
curl -X POST http://localhost:8787/api/v1/content/core-stories/{id}/reactions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"reaction_type": "me_too"}'
```

### 前端整合測試

1. 訪問人物誌展示頁面 `/biography/profile/{slug}`
2. 找到有故事內容的區塊
3. 測試點擊快速評論按鈕
4. 確認數字即時更新（optimistic update）
5. 確認已按狀態有視覺反饋（高亮）
6. 重新整理頁面後狀態保持
7. 測試未登入狀態提示登入

---

## 九、相關文件

| 文件 | 說明 |
|------|------|
| [current-status.md](./current-status.md) | MVP 功能實作狀態 |
| [development-timeline.md](./development-timeline.md) | 開發時程表 |

---

## 更新記錄

| 日期 | 版本 | 更新內容 |
|------|------|----------|
| 2026-01-25 | v1.0 | 初始版本 |
| 2026-01-27 | v1.1 | 更新狀態：設計已完成，實作可選。目前按讚功能已可滿足基本互動需求。 |
