# Biographies Route 重構計畫

> **版本**: v2.0
> **更新日期**: 2026-01-22
> **基於**: [REFACTORING-PLAN-FINAL.md](./REFACTORING-PLAN-FINAL.md)
> **狀態**: 待實施

## 概述

`src/routes/biographies.ts` 目前有 **2127 行**，包含了太多不屬於人物誌核心的功能。本文件規劃將路由重構為多個獨立模組,並採用**統一的互動功能架構**。

## 核心變更

相較於原始計劃,本次重構採用更全面的架構升級策略:

| 項目 | 原計劃 | 新策略 | 理由 |
|------|--------|--------|------|
| **路由設計** | 資源分組<br>`/likes/biographies/:id` | **功能分組**<br>`/likes/:entityType/:entityId` | 統一管理,易擴展 |
| **資料表** | 保持專門表 | **統一通用表**<br>`biography_likes` → `likes` | 簡化架構 |
| **Service 層** | 分散 Service | **統一 InteractionService** | 一致性更好 |
| **拆分範圍** | 互動功能獨立 | **全面重構** | 徹底解決技術債 |

## 當前狀態

- **檔案大小**: 2127 行
- **路由數量**: 26 個
- **問題**:
  - 單一檔案過大，難以維護
  - 混合了多個領域邏輯（人物誌、追蹤、徽章、社群統計、留言等）
  - 部分功能已重構到 Service 層，部分仍使用直接 SQL
  - 互動功能散落各處,缺乏統一架構

---

## 重構目標架構

### 檔案拆分總覽

```
src/routes/
├── biographies.ts              (~750 行) - 人物誌 CRUD
├── likes.ts                    (~250 行) - 統一按讚功能 ⭐ 新架構
├── comments.ts                 (~300 行) - 統一留言功能 ⭐ 新架構
├── follows.ts                  (~350 行) - 統一追蹤功能 ⭐ 新架構
├── bookmarks.ts                (~200 行) - 統一收藏功能 ⭐ 新架構
├── references.ts               (~200 行) - 引用清單功能 ⭐ 新功能
├── biography-badges.ts         (~200 行) - 徽章系統
├── climbing-footprints.ts      (~250 行) - 攀岩足跡
└── community-stats.ts          (~250 行) - 社群統計
```

⭐ **關鍵變更**: 互動功能 (likes, comments, follows, bookmarks) 採用統一架構,支援多種實體類型

---

## 重構分類

### ✅ 保留在 `biographies.ts` 的核心功能

這些是直接屬於人物誌 CRUD 和基本瀏覽的功能：

| 路由 | 功能 | 行數 | 重構狀態 |
|------|------|------|----------|
| `GET /biographies` | 列表查詢（分頁、精選、搜尋） | 159-191 | ✅ 已重構到 Service |
| `GET /biographies/featured` | 精選人物誌（首頁用） | 195-230 | ✅ 已重構到 Service |
| `GET /biographies/me` | 取得當前用戶人物誌 | 233-247 | ✅ 已重構到 Service |
| `GET /biographies/:id` | 根據 ID 查詢人物誌 | 250-276 | ✅ 已重構到 Service |
| `GET /biographies/slug/:slug` | 根據 slug 查詢（含快取） | 280-337 | ✅ 已重構到 Service |
| `POST /biographies` | 新增人物誌 | 340-408 | ✅ 已重構到 Service |
| `PUT /biographies/me` | 更新人物誌（Upsert） | 412-463 | ✅ 已重構到 Service |
| `PUT /biographies/me/autosave` | 自動儲存（含 one_liners、stories 同步） | 468-678 | ❌ 需重構 |
| `DELETE /biographies/me` | 刪除人物誌 | 681-715 | ❌ 需重構 |
| `GET /biographies/:id/adjacent` | 相鄰人物誌導覽 | 718-774 | ❌ 需重構 |
| `GET /biographies/:id/stats` | 人物誌統計資料 | 777-861 | ❌ 需重構 |
| `PUT /biographies/:id/view` | 記錄瀏覽數 | 864-908 | ❌ 需重構 |

**預計保留行數**: ~750 行（重構後）

---

### ⭐ 新架構：統一互動功能

以下功能將採用**統一的互動功能架構**,支援多種實體類型：

#### 1. 統一按讚功能 (`likes.ts`)

| 舊路由 | 新路由 | 功能 |
|--------|--------|------|
| `POST /biographies/:id/like` | `POST /likes/:entityType/:entityId` | Toggle 按讚 |
| `GET /biographies/:id/like` | `GET /likes/:entityType/:entityId` | 取得按讚狀態 |

**新檔案**: `src/routes/likes.ts`
**對應 Service**: `InteractionService` (統一服務)
**預計行數**: ~250 行

**支援的實體類型** (entityType):
- `biographies` - 人物誌
- `posts` - 文章
- `bucket-list` - 人生清單
- `core-stories` - 核心故事
- `one-liners` - 一句話
- `stories` - 小故事
- `galleries` - 相簿
- `videos` - 影片
- `gyms` - 室內岩館
- `crags` - 戶外岩場
- `routes` - 攀岩路線

**資料表遷移**:
```sql
-- 將專門表遷移到通用表
biography_likes       → likes (entity_type='biography')
bucket_list_likes     → likes (entity_type='bucket_list_item')
core_story_likes      → likes (entity_type='core_story')
one_liner_likes       → likes (entity_type='one_liner')
story_likes           → likes (entity_type='story')
```

**重要**: API 路徑使用複數/kebab-case (如 `bucket-list`),資料庫使用單數/snake_case (如 `bucket_list_item`)。詳見 [Entity Type 命名規範](./ENTITY-TYPE-MAPPING.md)

---

#### 2. 統一留言功能 (`comments.ts`)

| 舊路由 | 新路由 | 功能 |
|--------|--------|------|
| `GET /biographies/:id/comments` | `GET /comments/:entityType/:entityId` | 取得留言列表 |
| `POST /biographies/:id/comments` | `POST /comments/:entityType/:entityId` | 新增留言 |
| `DELETE /biographies/comments/:id` | `DELETE /comments/:commentId` | 刪除留言 |

**新檔案**: `src/routes/comments.ts`
**對應 Service**: `InteractionService`
**預計行數**: ~300 行

**資料表遷移**:
```sql
bucket_list_comments  → comments (entity_type='bucket_list_item')
core_story_comments   → comments (entity_type='core_story')
one_liner_comments    → comments (entity_type='one_liner')
story_comments        → comments (entity_type='story')
```

---

#### 3. 統一追蹤功能 (`follows.ts`)

| 舊路由 | 新路由 | 功能 |
|--------|--------|------|
| `POST /biographies/:id/follow` | `POST /follows/:entityType/:entityId` | 追蹤 |
| `GET /biographies/:id/follow` | `GET /follows/:entityType/:entityId` | 檢查追蹤狀態 |
| `DELETE /biographies/:id/follow` | `DELETE /follows/:entityType/:entityId` | 取消追蹤 |
| `GET /biographies/:id/followers` | `GET /follows/:entityType/:entityId/followers` | 追蹤者列表 |
| `GET /biographies/:id/following` | `GET /follows/:entityType/:entityId/following` | 追蹤中列表 |

**新檔案**: `src/routes/follows.ts`
**對應 Service**: `InteractionService`
**預計行數**: ~350 行

**相關資料表**:
- `follows` (follower_id, following_id) - 保持使用者對使用者的追蹤關係

---

#### 4. 統一收藏功能 (`bookmarks.ts`)

| 新路由 | 功能 |
|--------|------|
| `POST /bookmarks/:entityType/:entityId` | Toggle 收藏 |
| `GET /bookmarks/:entityType/:entityId` | 取得收藏狀態 |
| `GET /bookmarks` | 取得使用者收藏列表 |

**新檔案**: `src/routes/bookmarks.ts`
**對應 Service**: `InteractionService`
**預計行數**: ~200 行

**相關資料表**:
- `bookmarks` (已經是通用表設計)

---

#### 5. 引用清單功能 (`references.ts`) ⭐ 新增

| 新路由 | 功能 |
|--------|------|
| `GET /references/:entityType/:entityId` | 取得引用清單 |
| `POST /references` | 新增引用 |
| `DELETE /references/:id` | 刪除引用 |

**新檔案**: `src/routes/references.ts`
**對應 Service**: `ReferenceService`
**預計行數**: ~200 行

**相關資料表**:
- `bucket_list_references` (保留,特殊業務邏輯)

---

### 🎯 特定領域功能

以下功能保持為人物誌專屬,不需要泛化：

#### 6. 攀岩足跡探索 (`climbing-footprints.ts`)

攀岩足跡探索功能，這是一個獨立的社群探索功能：

| 路由 | 功能 | 行數 | 建議路徑 |
|------|------|------|----------|
| `GET /biographies/explore/locations` | 所有攀岩地點列表（含訪客統計） | 1245-1356 | `GET /climbing-footprints/locations` |
| `GET /biographies/explore/locations/:name` | 地點詳細資料（所有訪客） | 1359-1422 | `GET /climbing-footprints/locations/:name` |
| `GET /biographies/explore/countries` | 國家列表（含地點數統計） | 1425-1449 | `GET /climbing-footprints/countries` |

**新檔案**: `src/routes/climbing-footprints.ts`
**對應 Service**: `ClimbingFootprintService`
**預計行數**: ~250 行

**相關資料表**:
- `climbing_locations` (location, country, biography_id, visit_year, is_public)

**特色**:
- 這是社群探索功能，不限於個人人物誌
- 適合作為獨立的「攀岩地圖」或「足跡探索」模組
- 可以獨立擴展為地圖視覺化、熱門景點推薦等功能

---

#### 7. 徽章系統 (`biography-badges.ts`)

徽章系統，使用者成就與遊戲化機制：

| 路由 | 功能 | 行數 | 建議路徑 |
|------|------|------|----------|
| `GET /biographies/:id/badges` | 取得徽章與進度 | 1476-1630 | `GET /badges/biographies/:id` |

**新檔案**: `src/routes/biography-badges.ts`
**對應 Service**: `BadgeService`
**預計行數**: ~200 行

**徽章類型**:
- 故事分享徽章 (story_beginner, story_writer, inspirator, trending)
- 目標追蹤徽章 (goal_setter, achiever, consistent)
- 社群互動徽章 (supportive, conversationalist, explorer)
- 攀岩足跡徽章 (traveler, international)

**相關資料表**:
- `user_badges` (user_id, badge_id, unlocked_at)
- 徽章計算需查詢多個表 (biography_core_stories, biography_stories, bucket_list_items, biography_views 等)

---

#### 8. 社群統計 (`community-stats.ts`)

社群統計與排行榜功能：

| 路由 | 功能 | 行數 | 建議路徑 |
|------|------|------|----------|
| `GET /biographies/community/stats` | 社群總體統計 | 1637-1727 | `GET /community/stats` |
| `GET /biographies/leaderboard/:type` | 排行榜（完成目標、追蹤者、按讚） | 1730-1822 | `GET /community/leaderboard/:type` |

**新檔案**: `src/routes/community-stats.ts`
**對應 Service**: `CommunityStatsService`
**預計行數**: ~250 行

**統計項目**:
- 人物誌總數
- 目標總數與完成數
- 故事總數
- 本週活躍用戶
- 熱門類別

**排行榜類型**:
- `goals_completed` - 完成目標數排行
- `followers` - 追蹤者數排行
- `likes_received` - 獲讚數排行

---

## 重構優先順序

基於 [REFACTORING-PLAN-FINAL.md](./REFACTORING-PLAN-FINAL.md) 的全面重構策略：

### Phase 1: 準備階段 (1-2 天)
1. ✅ 建立資料遷移腳本 (`0028_unify_interaction_tables.sql`)
2. ✅ 建立驗證腳本 (`verify-migration.ts`)
3. ✅ 完整備份 Production 資料庫
4. ✅ 在 Preview 環境測試遷移

### Phase 2: 後端重構 (3-5 天)

#### 2.1 統一互動功能架構
1. 建立 `InteractionRepository` (統一的資料存取層)
2. 建立 `InteractionService` (統一的業務邏輯層)
3. 建立統一路由檔案:
   - `likes.ts` (按讚功能)
   - `comments.ts` (留言功能)
   - `follows.ts` (追蹤功能)
   - `bookmarks.ts` (收藏功能)
   - `references.ts` (引用清單)

#### 2.2 特定領域功能
4. 建立 `climbing-footprints.ts` (攀岩足跡)
5. 建立 `biography-badges.ts` (徽章系統)
6. 建立 `community-stats.ts` (社群統計)

#### 2.3 核心人物誌重構
7. 完成 `biographies.ts` 剩餘功能重構:
   - `autosave` 功能
   - `delete` 功能
   - `adjacent`、`stats`、`view` 功能

### Phase 3: 前端適配 (2-3 天)
1. 更新 API Client (`src/lib/api/interactions.ts`)
2. 建立統一的 Hooks (`src/lib/hooks/useInteractions.ts`)
3. 更新 UI 元件:
   - `LikeButton` 元件
   - `CommentSection` 元件
   - `FollowButton` 元件
   - `BookmarkButton` 元件

### Phase 4: 測試與驗證 (2-3 天)
1. 單元測試 (覆蓋率 > 80%)
2. 整合測試
3. E2E 測試
4. 效能測試
5. Preview 環境驗證

### Phase 5: 部署與監控 (1 天)
1. Production 資料遷移
2. 後端部署
3. 前端部署
4. 監控系統運行狀況

---

## 重構後的目錄結構

```
backend/src/
├── repositories/
│   ├── interaction-repository.ts    - 統一的互動功能資料存取層
│   ├── biography-repository.ts      - 人物誌資料存取
│   └── ...
├── services/
│   ├── interaction-service.ts       - 統一的互動功能業務邏輯 ⭐
│   ├── biography-service.ts         - 人物誌業務邏輯
│   ├── badge-service.ts             - 徽章系統
│   ├── climbing-footprint-service.ts - 攀岩足跡
│   ├── community-stats-service.ts   - 社群統計
│   └── ...
├── routes/
│   ├── biographies.ts              (~750 行) - 人物誌 CRUD
│   ├── biography-content.ts        (現有) - 人物誌內容互動
│   ├── likes.ts                    (~250 行) - 統一按讚功能 ⭐
│   ├── comments.ts                 (~300 行) - 統一留言功能 ⭐
│   ├── follows.ts                  (~350 行) - 統一追蹤功能 ⭐
│   ├── bookmarks.ts                (~200 行) - 統一收藏功能 ⭐
│   ├── references.ts               (~200 行) - 引用清單功能 ⭐
│   ├── biography-badges.ts         (~200 行) - 徽章系統
│   ├── climbing-footprints.ts      (~250 行) - 攀岩足跡
│   └── community-stats.ts          (~250 行) - 社群統計
└── index.ts                         - 主路由設定
```

⭐ **核心創新**: Repository-Service-Route 三層架構,統一的互動功能設計

---

## API 路徑變更對照表

### 人物誌核心功能（保持不變）
✅ 向下相容,無需變更:
- `GET /api/v1/biographies` - 列表
- `GET /api/v1/biographies/featured` - 精選
- `GET /api/v1/biographies/me` - 我的人物誌
- `GET /api/v1/biographies/:id` - 查詢
- `POST /api/v1/biographies` - 新增
- `PUT /api/v1/biographies/me` - 更新
- `DELETE /api/v1/biographies/me` - 刪除
- 等...

### 統一互動功能（新架構）⭐

#### 按讚系統
| 舊路徑 | 新路徑 (統一架構) | 說明 |
|--------|------------------|------|
| `POST /biographies/:id/like` | `POST /likes/:entityType/:entityId` | Toggle 按讚 |
| `GET /biographies/:id/like` | `GET /likes/:entityType/:entityId` | 取得按讚狀態 |
| `DELETE /biographies/:id/like` | `DELETE /likes/:entityType/:entityId` | 取消讚 |

**範例**:
- `POST /api/v1/likes/biographies/123` - 為人物誌按讚
- `POST /api/v1/likes/posts/456` - 為文章按讚
- `POST /api/v1/likes/bucket-list/789` - 為清單項目按讚

#### 留言系統
| 舊路徑 | 新路徑 (統一架構) | 說明 |
|--------|------------------|------|
| `GET /biographies/:id/comments` | `GET /comments/:entityType/:entityId` | 取得留言 |
| `POST /biographies/:id/comments` | `POST /comments/:entityType/:entityId` | 新增留言 |
| `DELETE /biographies/comments/:id` | `DELETE /comments/:commentId` | 刪除留言 |

**範例**:
- `GET /api/v1/comments/biographies/123?page=1&limit=20`
- `POST /api/v1/comments/posts/456` (body: `{content: "..."}`)
- `DELETE /api/v1/comments/789`

#### 追蹤系統
| 舊路徑 | 新路徑 (統一架構) | 說明 |
|--------|------------------|------|
| `POST /biographies/:id/follow` | `POST /follows/:entityType/:entityId` | 追蹤 |
| `GET /biographies/:id/follow` | `GET /follows/:entityType/:entityId` | 追蹤狀態 |
| `DELETE /biographies/:id/follow` | `DELETE /follows/:entityType/:entityId` | 取消追蹤 |
| `GET /biographies/:id/followers` | `GET /follows/:entityType/:entityId/followers` | 追蹤者列表 |
| `GET /biographies/:id/following` | `GET /follows/:entityType/:entityId/following` | 追蹤中列表 |

**範例**:
- `POST /api/v1/follows/users/123` - 追蹤使用者
- `GET /api/v1/follows/users/123` - 檢查追蹤狀態

#### 收藏系統
| 新路徑 | 說明 |
|--------|------|
| `POST /bookmarks/:entityType/:entityId` | Toggle 收藏 |
| `GET /bookmarks/:entityType/:entityId` | 收藏狀態 |
| `GET /bookmarks?entityType=biographies` | 我的收藏列表 |

#### 引用清單
| 新路徑 | 說明 |
|--------|------|
| `GET /references/:entityType/:entityId` | 取得引用清單 |
| `POST /references` | 新增引用 |
| `DELETE /references/:id` | 刪除引用 |

### 特定領域功能（新路徑）

#### 攀岩足跡
| 舊路徑 | 新路徑 | 說明 |
|--------|--------|------|
| `GET /biographies/explore/locations` | `GET /climbing-footprints/locations` | 所有地點 |
| `GET /biographies/explore/locations/:name` | `GET /climbing-footprints/locations/:name` | 地點詳情 |
| `GET /biographies/explore/countries` | `GET /climbing-footprints/countries` | 國家列表 |

#### 徽章系統
| 舊路徑 | 新路徑 | 說明 |
|--------|--------|------|
| `GET /biographies/:id/badges` | `GET /badges/biographies/:id` | 取得徽章 |
| - | `GET /badges/users/:userId` | 使用者徽章 (新增) |

#### 社群統計
| 舊路徑 | 新路徑 | 說明 |
|--------|--------|------|
| `GET /biographies/community/stats` | `GET /community/stats` | 社群統計 |
| `GET /biographies/leaderboard/:type` | `GET /community/leaderboard/:type` | 排行榜 |

### Entity Type 命名規範

**重要**: API 路徑使用**複數/kebab-case**,資料庫使用**單數/snake_case**

| API 路徑 (entityType) | 資料庫 (entity_type) | 說明 |
|-----------------------|---------------------|------|
| `biographies` | `biography` | 人物誌 |
| `posts` | `post` | 文章 |
| `bucket-list` | `bucket_list_item` | 人生清單項目 |
| `core-stories` | `core_story` | 核心故事 |
| `one-liners` | `one_liner` | 一句話 |
| `stories` | `story` | 小故事 |
| `galleries` | `gallery` | 相簿 |
| `videos` | `video` | 影片 |
| `gyms` | `gym` | 室內岩館 |
| `crags` | `crag` | 戶外岩場 |
| `routes` | `route` | 攀岩路線 |

詳見 [Entity Type 命名規範](./ENTITY-TYPE-MAPPING.md)

---

## 重構效益

### 1. 架構層面
✅ **三層架構清晰**:
- Repository 層: 統一資料存取
- Service 層: 統一業務邏輯
- Route 層: 統一 API 介面

✅ **統一互動功能**:
- 一套程式碼支援所有實體類型
- 新增內容類型只需配置,無需重寫邏輯
- API 設計一致,前端整合更簡單

### 2. 可維護性提升
✅ **檔案大小控制**:
- 主檔案從 2127 行降至 750 行
- 每個模組 200-350 行,易於理解
- 減少 70% 的合併衝突風險

✅ **職責分離**:
- 人物誌專注於 CRUD
- 互動功能統一管理
- 特定領域功能獨立

### 3. 程式碼重用性
✅ **高度可擴展**:
- `InteractionService` 統一處理所有互動
- 新增實體類型僅需 entity_type 配置
- 前端 Hooks 可重用於任何內容類型

✅ **資料表統一**:
- 從 9 個專門表整合為 2 個通用表
- 簡化資料庫維護
- 統一查詢邏輯

### 4. 測試覆蓋率
✅ **測試更完善**:
- Service 層可獨立測試 (目標 > 80%)
- Repository 層可 mock 測試
- 小模組更容易達到高覆蓋率

### 5. 效能優化
✅ **優化空間大**:
- 統一的資料表索引策略
- 批次查詢更高效
- 獨立快取策略

### 6. 團隊協作
✅ **並行開發**:
- 不同開發者可同時開發不同模組
- 減少程式碼衝突
- 更快的迭代速度

### 7. 長期效益
✅ **技術債降低**:
- 統一架構減少重複程式碼
- 更容易重構和升級
- 新功能開發速度提升 30-50%

---

## 資料遷移策略

### 遷移腳本
📁 `backend/migrations/0028_unify_interaction_tables.sql`

**遷移內容**:
1. `biography_likes` → `likes` (entity_type='biography')
2. `bucket_list_likes` → `likes` (entity_type='bucket_list_item')
3. `core_story_likes` → `likes` (entity_type='core_story')
4. `one_liner_likes` → `likes` (entity_type='one_liner')
5. `story_likes` → `likes` (entity_type='story')
6. `bucket_list_comments` → `comments` (entity_type='bucket_list_item')
7. `core_story_comments` → `comments` (entity_type='core_story')
8. `one_liner_comments` → `comments` (entity_type='one_liner')
9. `story_comments` → `comments` (entity_type='story')

**保留的專門表**:
- `follows` - 追蹤關係 (使用者對使用者)
- `bookmarks` - 收藏 (已經是通用表設計)
- `bucket_list_references` - 引用清單 (特殊業務邏輯)

### 驗證腳本
📁 `backend/scripts/verify-migration.ts`

確保資料遷移的完整性和正確性。

---

## 實施檢查清單

### 準備階段
- [ ] 建立資料遷移腳本
- [ ] 建立驗證腳本
- [ ] 完整備份 Production 資料庫
- [ ] 在 Preview 環境測試遷移

### 後端開發
- [ ] 建立 `InteractionRepository`
- [ ] 建立 `InteractionService`
- [ ] 建立 `likes.ts` 路由
- [ ] 建立 `comments.ts` 路由
- [ ] 建立 `follows.ts` 路由
- [ ] 建立 `bookmarks.ts` 路由
- [ ] 建立 `references.ts` 路由
- [ ] 建立 `climbing-footprints.ts` 路由
- [ ] 建立 `biography-badges.ts` 路由
- [ ] 建立 `community-stats.ts` 路由
- [ ] 更新 `index.ts` 主路由
- [ ] 撰寫單元測試 (覆蓋率 > 80%)

### 前端開發
- [ ] 更新 API Client (`src/lib/api/interactions.ts`)
- [ ] 建立統一的 Hooks (`src/lib/hooks/useInteractions.ts`)
- [ ] 更新 `LikeButton` 元件
- [ ] 更新 `CommentSection` 元件
- [ ] 更新 `FollowButton` 元件
- [ ] 更新 `BookmarkButton` 元件
- [ ] 撰寫元件測試

### 測試
- [ ] 單元測試通過
- [ ] 整合測試通過
- [ ] E2E 測試通過
- [ ] 效能測試通過
- [ ] Preview 環境驗證通過

### 部署
- [ ] Production 資料遷移
- [ ] 後端部署
- [ ] 前端部署
- [ ] 監控系統正常
- [ ] 錯誤率在可接受範圍

### 後續
- [ ] 監控 7 天無重大問題
- [ ] 刪除舊資料表
- [ ] 移除舊 API 端點
- [ ] 更新文件

---

## 相關檔案

- ⭐ [最終重構計畫](./REFACTORING-PLAN-FINAL.md) - 完整實施策略
- [Entity Type 命名規範](./ENTITY-TYPE-MAPPING.md) - API 與資料庫命名對照
- [互動功能實作文件](../interact/interaction-features.md) - 功能需求
- [Migration V2 變更摘要](../MIGRATION-V2-CHANGES.md) - 資料庫變更
- [Database Schema](../../backend/src/db/schema.sql) - 資料庫架構

---

## 成功指標

| 指標 | 目標值 | 測量方式 |
|------|--------|----------|
| 單元測試覆蓋率 | > 80% | 測試報告 |
| API 回應時間 | < 200ms | APM 監控 |
| 錯誤率 | < 0.1% | 錯誤追蹤系統 |
| 資料完整性 | 100% | 遷移驗證腳本 |
| 前端互動正常率 | > 99.9% | 使用者行為追蹤 |
| 程式碼可維護性 | A 級 | Code Review |

---

## 風險與緩解措施

| 風險 | 影響 | 緩解措施 |
|------|------|----------|
| **資料遷移失敗** | 嚴重 | 完整備份 + Preview 環境測試 + 保留舊表 |
| **API 不相容** | 中等 | 同時維護舊 API + 分階段切換 |
| **效能下降** | 中等 | 效能測試 + 資料庫索引優化 |
| **前端 Cache 問題** | 低 | 清除快取策略 + 版本號控制 |

---

## 下一步

### 立即行動
1. ✅ 審核本重構計畫
2. ✅ 確認資源分配 (後端、前端、測試人力)
3. ✅ 建立專案看板追蹤進度
4. ✅ 設定 Preview 環境

### 開發準備
1. 建立資料遷移腳本
2. 建立 `InteractionRepository` 和 `InteractionService`
3. 撰寫單元測試框架
4. 設定 CI/CD 流程

### 實施策略
- **時間表**: 預計 2-3 週完成
- **策略**: 一次性全面重構
- **驗證**: 多階段測試 (單元 → 整合 → E2E → Preview)
- **部署**: 分階段部署 (資料遷移 → 後端 → 前端)

---

**文件版本**: v2.0
**建立日期**: 2026-01-22
**最後更新**: 2026-01-22
**基於**: [REFACTORING-PLAN-FINAL.md](./REFACTORING-PLAN-FINAL.md)
**狀態**: 待審核與實施
