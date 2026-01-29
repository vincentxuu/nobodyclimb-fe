# Migration 0027 完整範圍說明

> **Migration 檔案**: `backend/migrations/0027_consolidated_schema_updates.sql`
> **版本**: v3 重構版本
> **建立日期**: 2026-01-22
> **關聯文件**: [REFACTORING-PLAN-FINAL.md](./REFACTORING-PLAN-FINAL.md)

## 總覽

Migration 0027 是一個**綜合性的 schema 更新**,整合了多個功能需求:

1. **使用者追蹤功能** (User Activity Tracking)
2. **通知系統完善** (Notification System Enhancement)
3. **人物誌內容架構** (Biography Content Structure)
4. **統一互動功能** ⭐ **重構計劃核心** (Unified Interaction System)

## 與重構計劃的關係

### 重構計劃涵蓋範圍 (REFACTORING-PLAN-FINAL.md)

重構計劃專注於**互動功能的架構升級**:
- API 路徑重構(功能分組)
- 資料表統一(通用 likes/comments 表)
- Service 層完善
- 前端適配

### Migration 0027 涵蓋範圍(更廣)

Migration 0027 包含了**重構計劃 + 其他功能需求**:

| 功能模組 | 是否屬於重構計劃 | 說明 |
|---------|----------------|------|
| 統一互動表 (likes, comments) | ✅ 是 | 重構計劃核心 |
| 使用者活動追蹤 | ❌ 否 | 獨立功能需求 |
| 通知系統完善 | ✅ 部分 | 支援新的互動類型 |
| 人物誌內容架構 | ❌ 否 | 獨立功能需求 |
| 問題定義表 | ❌ 否 | 人物誌功能依賴 |
| JSON 資料遷移 | ❌ 否 | 資料結構優化 |

## 詳細內容

### PART 1: 使用者表重構

**目的**: 支援使用者活動追蹤和推薦來源分析

**變更**:
```sql
-- 新增欄位
last_active_at TEXT        -- 最後活動時間
last_login_at TEXT         -- 最後登入時間
login_count INTEGER        -- 登入次數
referral_source TEXT       -- 推薦來源
```

**影響**:
- 支援 DAU/WAU/MAU 統計
- 支援推薦來源分析

**相關文件**: CLAUDE.md - Active User Definition

---

### PART 2: 通知表更新

**目的**: 支援所有互動類型的通知

**變更**:
```sql
-- 新增通知類型
type TEXT NOT NULL CHECK (type IN (
  -- 原有
  'goal_completed', 'goal_liked', 'goal_commented', 'goal_referenced',
  'new_follower', 'story_featured',
  -- 新增
  'biography_liked', 'biography_commented',
  'post_liked', 'post_commented',
  'core_story_liked', 'core_story_commented',
  'one_liner_liked', 'one_liner_commented',
  'story_liked', 'story_commented',
  'system_announcement'
))
```

**影響**:
- 支援人物誌內容的互動通知
- 為統一互動系統做準備

---

### PART 3: 通知偏好設定表

**目的**: 允許使用者自訂接收哪些通知

**新增表格**: `notification_preferences`

**欄位**: 每種通知類型一個開關 + email_digest

---

### PART 4-5: 問題定義表 + 人物誌內容表

**目的**: 將人物誌的 JSON 資料結構化,支援更豐富的互動

**新增表格**:
- `core_story_questions` - 核心故事問題定義
- `story_categories` - 故事分類
- `one_liner_questions` - 一句話問題定義
- `story_questions` - 小故事問題定義
- `biography_core_stories` - 核心故事內容
- `biography_one_liners` - 一句話內容
- `biography_stories` - 小故事內容

**影響**:
- 支援對個別故事按讚/留言
- 資料查詢更靈活
- 為未來功能擴展做準備

---

### PART 6: 統一互動功能表 ⭐ 重構計劃核心

**目的**: 實現統一的互動功能架構

#### 6.1 重建 likes 表

**原有表格** (migration 0002):
```sql
CREATE TABLE likes (
  entity_type CHECK (entity_type IN ('post', 'gallery', 'video', 'gym', 'crag'))
)
```

**新表格**:
```sql
CREATE TABLE likes (
  entity_type CHECK (entity_type IN (
    'biography', 'post', 'bucket_list_item',
    'core_story', 'one_liner', 'story',
    'gallery', 'video', 'gym', 'crag', 'route'
  ))
)
```

**遷移策略**:
1. 保留原有資料 (post, gallery, video, gym, crag)
2. 遷移 `biography_likes` → `likes` (entity_type='biography')
3. 遷移 `bucket_list_likes` → `likes` (entity_type='bucket_list_item')
4. 舊表保留 7 天作為備份

#### 6.2 重建 comments 表

**原有表格** (migration 0016):
```sql
CREATE TABLE comments (
  entity_type CHECK (entity_type IN ('post', 'gallery', 'video', 'biography'))
)
```

**新表格**:
```sql
CREATE TABLE comments (
  entity_type CHECK (entity_type IN (
    'biography', 'post', 'bucket_list_item',
    'core_story', 'one_liner', 'story',
    'gallery', 'video', 'gym', 'crag', 'route'
  ))
)
```

**遷移策略**:
1. 保留原有資料 (post, gallery, video, biography)
2. 遷移 `bucket_list_comments` → `comments` (entity_type='bucket_list_item')
3. 舊表保留 7 天作為備份

---

### PART 11-13: 人物誌資料遷移

**目的**: 將 JSON 資料遷移到關聯式表格

**步驟**:
1. 更新 slug 使用 username
2. 標準化 visibility 欄位
3. 重建 biographies 表(移除多餘欄位,保留 JSON 作為備份)
4. 遷移 `one_liners_data` → `biography_core_stories` + `biography_one_liners`
5. 遷移 `stories_data` → `biography_stories`

---

## 資料遷移清單

### 已遷移的專門表

| 舊表 | 新表 | entity_type | 狀態 |
|------|------|-------------|------|
| `biography_likes` | `likes` | `biography` | ✅ 已遷移 |
| `bucket_list_likes` | `likes` | `bucket_list_item` | ✅ 已遷移 |
| `bucket_list_comments` | `comments` | `bucket_list_item` | ✅ 已遷移 |

### 不需要遷移的表(新建)

| 表名 | 說明 | 使用方式 |
|------|------|---------|
| `biography_core_stories` | 核心故事 | 直接使用通用 `likes`/`comments` (entity_type='core_story') |
| `biography_one_liners` | 一句話 | 直接使用通用 `likes`/`comments` (entity_type='one_liner') |
| `biography_stories` | 小故事 | 直接使用通用 `likes`/`comments` (entity_type='story') |

### 保留的專門表

| 表名 | 原因 |
|------|------|
| `follows` | 使用者對使用者的追蹤關係,與 entity-based 互動不同 |
| `bookmarks` | 已經是通用設計 |
| `bucket_list_references` | 特殊業務邏輯(我也想做) |

---

## Entity Type 命名規範

⚠️ **重要**: API 路徑與資料庫欄位使用不同的命名規範

### API 路徑(RESTful)
- 使用**複數形式**
- 使用 **kebab-case**
- 範例: `/api/v1/likes/bucket-list/123`

### 資料庫欄位
- 使用**單數形式**
- 使用 **snake_case**
- 範例: `entity_type = 'bucket_list_item'`

**詳細映射**: 請參考 [Entity Type 命名規範](./ENTITY-TYPE-MAPPING.md)

---

## 風險評估

### 高風險項目

| 風險 | 緩解措施 |
|------|---------|
| 資料遷移失敗 | 1. Preview 環境測試<br>2. 保留舊表 7 天<br>3. 完整備份 |
| entity_type 映射錯誤 | 1. 建立明確的映射規範<br>2. API 層統一轉換<br>3. 單元測試 |
| 舊 API 中斷 | 1. 保留舊 API 端點<br>2. 逐步遷移<br>3. 版本控制 |

### 資料完整性檢查

**執行 Migration 後需要驗證**:

```sql
-- 驗證 likes 遷移
SELECT 'biography_likes' as source,
       COUNT(*) as old_count,
       (SELECT COUNT(*) FROM likes WHERE entity_type = 'biography') as new_count
FROM biography_likes
UNION ALL
SELECT 'bucket_list_likes',
       COUNT(*),
       (SELECT COUNT(*) FROM likes WHERE entity_type = 'bucket_list_item')
FROM bucket_list_likes;

-- 驗證 comments 遷移
SELECT 'bucket_list_comments' as source,
       COUNT(*) as old_count,
       (SELECT COUNT(*) FROM comments WHERE entity_type = 'bucket_list_item') as new_count
FROM bucket_list_comments;
```

**預期結果**: old_count = new_count

---

## 後續步驟

### Phase 2: 後端重構

參考 [REFACTORING-PLAN-FINAL.md](./REFACTORING-PLAN-FINAL.md) Phase 2:

1. 建立 `utils/entity-type-mapper.ts`
2. 建立 `repositories/interaction-repository.ts`
3. 建立 `services/interaction-service.ts`
4. 建立新路由 (`likes.ts`, `comments.ts`)
5. 更新主路由

### Phase 3: 前端適配

1. 更新 API Client
2. 建立統一 Hooks
3. 更新 UI 元件

### Phase 4: 舊表清理

**7 天後執行**(Production 環境):

```sql
-- 確認資料遷移無誤後
DROP TABLE IF EXISTS biography_likes;
DROP TABLE IF EXISTS bucket_list_likes;
DROP TABLE IF EXISTS bucket_list_comments;
```

---

## 常見問題

### Q1: 為什麼 Migration 0027 包含這麼多功能?

A: 這些功能有相互依賴關係:
- 人物誌內容架構需要統一互動系統
- 統一互動系統需要更新通知類型
- 通知類型需要偏好設定

### Q2: entity_type 為什麼不直接用 API 的命名?

A: 遵循各層級的慣例:
- API: RESTful 慣例(複數)
- DB: 資料建模慣例(單數)
- 透過映射層轉換

### Q3: 舊的專門表什麼時候刪除?

A: 建議流程:
1. Migration 執行後保留 7 天
2. 監控新系統運作
3. 驗證資料完整性
4. 執行刪除 SQL

### Q4: 這個 Migration 是否向下相容?

A:
- ✅ 資料層: 完全相容(舊表保留)
- ⚠️ API 層: 需要逐步遷移
- ✅ 前端: 透過 API Client 隔離變更

---

## 相關文件

- [重構計劃](./REFACTORING-PLAN-FINAL.md) - 互動功能重構的整體規劃
- [Entity Type 命名規範](./ENTITY-TYPE-MAPPING.md) - API/DB/前端的命名映射
- [Migration 0027](../../backend/migrations/0027_consolidated_schema_updates.sql) - SQL 檔案
- [CLAUDE.md](../../CLAUDE.md) - 專案整體說明

---

**建立日期**: 2026-01-22
**最後更新**: 2026-01-22
**版本**: 1.0
**維護者**: 開發團隊
