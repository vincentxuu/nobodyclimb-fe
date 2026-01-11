# 統計系統規劃文件 (Statistics System Plan)

**專案**: nobodyclimb-fe
**建立日期**: 2025-01-11
**狀態**: Draft
**相關文件**:
- [路線資料管理規劃](./route-data/data-management-plan.md)
- [後端 API 文件](./backend/)

---

## 📋 目錄

1. [概述](#概述)
2. [現況分析](#現況分析)
3. [統計欄位總覽](#統計欄位總覽)
4. [瀏覽量追蹤系統](#瀏覽量追蹤系統)
5. [人氣計算機制](#人氣計算機制)
6. [API 端點設計](#api-端點設計)
7. [前端顯示規範](#前端顯示規範)
8. [未來擴展規劃](#未來擴展規劃)

---

## 概述

### 目標

建立完整的統計系統，用於：

1. **追蹤用戶行為**: 瀏覽次數、點擊、互動
2. **計算內容熱度**: 人氣排行、熱門推薦
3. **提供數據分析**: 內容表現、用戶偏好
4. **優化用戶體驗**: 個人化推薦、熱門內容展示

### 涵蓋範圍

| 內容類型 | 統計功能狀態 |
|----------|-------------|
| 部落格文章 (Posts) | ✅ 已實現 |
| 影片 (Videos) | ✅ 已實現 |
| 相簿 (Galleries) | ✅ 已實現 |
| 攀岩館 (Gyms) | ⚠️ 部分實現 |
| 岩場 (Crags) | ⚠️ 部分實現 |
| 路線 (Routes) | ❌ 待實現 |

---

## 現況分析

### 已實現功能

#### 1. 瀏覽次數追蹤 (View Tracking)

**檔案位置**: `backend/src/utils/viewTracker.ts`

```typescript
// 核心功能
- getClientIP()              // 獲取客戶端 IP
- hashIP()                   // IP 哈希處理 (隱私保護)
- trackUniqueView()          // 唯一訪客追蹤 (24h 去重)
- trackAndUpdateViewCount()  // 更新瀏覽計數
```

**防刷機制**:
- 使用 Cloudflare KV 儲存訪客記錄
- 24 小時 TTL 過期時間
- Key 格式: `view:{entityType}:{entityId}:{ipHash}`

#### 2. 點讚系統 (Like System)

**資料表**: `likes`

```sql
CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  target_type TEXT NOT NULL,  -- 'post', 'gallery', 'video', 'gym', 'crag'
  target_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, target_type, target_id)
);
```

**支援內容類型**: 文章、相簿、影片、攀岩館、岩場

---

## 統計欄位總覽

### 資料庫欄位定義

#### Posts (文章)

| 欄位 | 類型 | 說明 | 來源 |
|------|------|------|------|
| `view_count` | INTEGER | 瀏覽次數 | 自動追蹤 |

**位置**: `backend/src/db/schema.sql:54`

#### Videos (影片)

| 欄位 | 類型 | 說明 | 來源 |
|------|------|------|------|
| `view_count` | INTEGER | 瀏覽次數 | 自動追蹤 |

**位置**: `backend/src/db/schema.sql:212`

#### Galleries (相簿)

| 欄位 | 類型 | 說明 | 來源 |
|------|------|------|------|
| `view_count` | INTEGER | 瀏覽次數 | 自動追蹤 |

**位置**: `backend/src/db/schema.sql:174`

#### Gyms (攀岩館)

| 欄位 | 類型 | 說明 | 來源 |
|------|------|------|------|
| `rating_avg` | REAL | 平均評分 | 用戶評價 |
| `review_count` | INTEGER | 評論數量 | 用戶評論 |

**位置**: `backend/src/db/schema.sql:97-98`

#### Crags (岩場)

| 欄位 | 類型 | 說明 | 來源 |
|------|------|------|------|
| `rating_avg` | REAL | 平均評分 | 用戶評價 |
| `review_count` | INTEGER | 評論數量 | 用戶評論 |
| `route_count` | INTEGER | 路線總數 | 自動計算 |
| `bolt_count` | INTEGER | 錨點總數 | 自動計算 |

**位置**: `backend/src/db/schema.sql:124-135`

#### Routes (路線) - 待實現

| 欄位 | 類型 | 說明 | 狀態 |
|------|------|------|------|
| `popularity` | INTEGER | 人氣值 (0-5) | ❌ 僅靜態資料 |
| `views` | INTEGER | 瀏覽次數 | ❌ 未實現 |

**靜態資料位置**: `src/lib/crag-data.ts:117-118`

---

## 瀏覽量追蹤系統

### 技術架構

```
用戶訪問內容頁面
       ↓
API 接收請求 (GET /posts/:id)
       ↓
getClientIP() 獲取真實 IP
       ↓
hashIP() 對 IP 進行 SHA-256 哈希
       ↓
trackUniqueView() 檢查 KV 是否存在記錄
       ↓
    ┌──────────────────┐
    │  24h 內是否已訪問? │
    └──────────────────┘
           │
     ┌─────┴─────┐
     │ 是        │ 否
     ↓           ↓
   返回          寫入 KV 記錄
   (不計數)      UPDATE view_count += 1
                       ↓
                 返回更新後計數
```

### KV 儲存結構

```
Key: view:post:123:a1b2c3d4
Value: "1"
TTL: 86400 (24 小時)
```

### 實作細節

**檔案**: `backend/src/utils/viewTracker.ts`

```typescript
export async function trackAndUpdateViewCount(
  db: D1Database,
  kv: KVNamespace,
  request: Request,
  entityType: 'post' | 'video' | 'gallery',
  entityId: string,
  currentViewCount: number
): Promise<number> {
  const isUnique = await trackUniqueView(kv, request, entityType, entityId);

  if (isUnique) {
    const newCount = currentViewCount + 1;
    await db.prepare(
      `UPDATE ${entityType}s SET view_count = ? WHERE id = ?`
    ).bind(newCount, entityId).run();
    return newCount;
  }

  return currentViewCount;
}
```

---

## 人氣計算機制

### 現況：靜態人氣值

目前路線的 `popularity` 欄位是手動設定的靜態值：

```json
// src/data/crags/kenting.json
{
  "id": "KT-MF-001",
  "name": "遺落海岸",
  "popularity": 2  // 手動設定 0-5
}
```

### 規劃：動態人氣計算

#### 計算公式建議

**方案 A：簡單加權**

```
popularity_score = views + (saves × 3) + (completions × 5)
```

**方案 B：時間衰減**

```
popularity_score = Σ (action_weight × decay_factor)

其中:
- decay_factor = 0.95 ^ (days_since_action)
- action_weight:
  - view = 1
  - save = 3
  - completion = 5
  - rating = 10
```

**方案 C：綜合評分 (推薦)**

```
popularity_score = (
  views × 0.1 +
  recent_views_7d × 0.3 +
  saves × 2 +
  completions × 3 +
  avg_rating × 10
) / normalization_factor
```

#### 實作步驟

1. **資料庫遷移**

```sql
-- 新增 routes 表的統計欄位
ALTER TABLE routes ADD COLUMN views INTEGER DEFAULT 0;
ALTER TABLE routes ADD COLUMN popularity_score REAL DEFAULT 0;
ALTER TABLE routes ADD COLUMN saves_count INTEGER DEFAULT 0;
ALTER TABLE routes ADD COLUMN completions_count INTEGER DEFAULT 0;
ALTER TABLE routes ADD COLUMN last_calculated_at TEXT;
```

2. **新增瀏覽記錄表**

```sql
CREATE TABLE IF NOT EXISTS route_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id TEXT NOT NULL,
  user_id TEXT,
  ip_hash TEXT NOT NULL,
  viewed_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

CREATE INDEX idx_route_views_route_id ON route_views(route_id);
CREATE INDEX idx_route_views_viewed_at ON route_views(viewed_at);
```

3. **定時計算任務 (Cron Trigger)**

```typescript
// backend/src/scheduled/calculatePopularity.ts

export async function calculateRoutePopularity(env: Env) {
  const routes = await env.DB.prepare('SELECT id FROM routes').all();

  for (const route of routes.results) {
    // 取得 7 天內瀏覽數
    const recentViews = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM route_views
      WHERE route_id = ?
      AND viewed_at > datetime('now', '-7 days')
    `).bind(route.id).first();

    // 取得總數據
    const stats = await env.DB.prepare(`
      SELECT views, saves_count, completions_count
      FROM routes WHERE id = ?
    `).bind(route.id).first();

    // 計算人氣分數
    const score = (
      (stats.views || 0) * 0.1 +
      (recentViews.count || 0) * 0.3 +
      (stats.saves_count || 0) * 2 +
      (stats.completions_count || 0) * 3
    );

    // 更新分數
    await env.DB.prepare(`
      UPDATE routes
      SET popularity_score = ?, last_calculated_at = datetime('now')
      WHERE id = ?
    `).bind(score, route.id).run();
  }
}
```

---

## API 端點設計

### 現有端點

#### 文章 (Posts)

| 端點 | 方法 | 功能 | 統計行為 |
|------|------|------|----------|
| `GET /posts/:id` | GET | 取得文章 | 自動追蹤 view_count |
| `GET /posts/slug/:slug` | GET | 按 slug 取得 | 自動追蹤 view_count |
| `GET /posts/popular` | GET | 熱門文章 | 按 view_count DESC 排序 |
| `POST /posts/:id/like` | POST | 點讚/取消 | 更新點讚數 |
| `GET /posts/:id/like` | GET | 點讚狀態 | 返回 liked + 總數 |

**檔案**: `backend/src/routes/posts.ts`

#### 影片 (Videos)

| 端點 | 方法 | 功能 | 統計行為 |
|------|------|------|----------|
| `GET /videos/:id` | GET | 取得影片 | 自動追蹤 view_count |
| `GET /videos/slug/:slug` | GET | 按 slug 取得 | 自動追蹤 view_count |
| `GET /videos/categories` | GET | 分類統計 | 返回各分類數量 |

**檔案**: `backend/src/routes/videos.ts`

#### 相簿 (Galleries)

| 端點 | 方法 | 功能 | 統計行為 |
|------|------|------|----------|
| `GET /galleries/:id` | GET | 取得相簿 | 自動追蹤 view_count |
| `GET /galleries/popular` | GET | 熱門相簿 | 按 view_count DESC 排序 |

**檔案**: `backend/src/routes/galleries.ts`

#### 攀岩館 (Gyms)

| 端點 | 方法 | 功能 | 統計行為 |
|------|------|------|----------|
| `GET /gyms` | GET | 列表 | 按 is_featured, rating_avg 排序 |
| `GET /gyms/featured` | GET | 精選 | 按 rating_avg DESC 排序 |

**檔案**: `backend/src/routes/gyms.ts`

### 規劃新增端點

#### 路線 (Routes)

| 端點 | 方法 | 功能 | 說明 |
|------|------|------|------|
| `POST /routes/:id/view` | POST | 記錄瀏覽 | 追蹤瀏覽次數 |
| `GET /routes/popular` | GET | 熱門路線 | 按 popularity_score 排序 |
| `POST /routes/:id/save` | POST | 收藏路線 | 增加 saves_count |
| `POST /routes/:id/complete` | POST | 完成路線 | 增加 completions_count |
| `GET /routes/:id/stats` | GET | 路線統計 | 返回完整統計數據 |

---

## 前端顯示規範

### 統計數據顯示組件

#### 1. 瀏覽數顯示

**檔案**: `src/components/videos/video-card.tsx`

```tsx
<div className="flex items-center text-gray-500">
  <Eye size={16} className="mr-1" />
  <span>{formatViewCount(video.viewCount)}</span>
</div>
```

**格式化規則**:
- < 1,000: 顯示原數字 (如 `856`)
- 1,000 - 9,999: 顯示一位小數 (如 `1.2k`)
- 10,000 - 999,999: 顯示整數 k (如 `15k`)
- ≥ 1,000,000: 顯示 M (如 `1.5M`)

#### 2. 人氣顯示

**檔案**: `src/components/crag/route-section.tsx`

```tsx
// 表格標題
<th>人氣</th>

// 表格內容
<td>
  <div className="flex items-center">
    <Eye size={16} className="mr-1 text-gray-400" />
    <span>{route.views}</span>
  </div>
</td>
```

#### 3. 評分顯示

**格式**: 星星圖標 + 數字

```tsx
<div className="flex items-center">
  <Star className="text-yellow-400" />
  <span>{rating.toFixed(1)}</span>
  <span className="text-gray-400">({reviewCount})</span>
</div>
```

### 排序選項

**檔案**: `src/lib/types.ts:421`

```typescript
sortBy?: 'date' | 'popularity' | 'latest' | 'popular' | 'rating'
```

| 選項 | 說明 | 排序欄位 |
|------|------|----------|
| `date` | 按日期 | created_at DESC |
| `latest` | 最新 | created_at DESC |
| `popularity` | 人氣 | view_count DESC |
| `popular` | 熱門 | view_count DESC |
| `rating` | 評分 | rating_avg DESC |

---

## 未來擴展規劃

### Phase 1: 路線統計系統 (優先)

**目標**: 為路線新增完整的統計追蹤功能

**工作項目**:

1. [ ] 資料庫遷移：新增 views, popularity_score 欄位
2. [ ] 實作瀏覽追蹤 API
3. [ ] 實作人氣計算邏輯
4. [ ] 前端整合顯示
5. [ ] 新增熱門路線排行

**預估工作量**: 1-2 週

### Phase 2: 用戶行為追蹤

**目標**: 追蹤更豐富的用戶行為數據

**新增功能**:

1. [ ] 收藏/書籤功能
2. [ ] 完攀記錄
3. [ ] 路線評分
4. [ ] 用戶評論

**資料表設計**:

```sql
-- 收藏記錄
CREATE TABLE route_saves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  route_id TEXT NOT NULL,
  saved_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, route_id)
);

-- 完攀記錄
CREATE TABLE route_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  route_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  style TEXT,  -- 'onsight', 'flash', 'redpoint', 'toprope'
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 路線評分
CREATE TABLE route_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  route_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, route_id)
);
```

### Phase 3: 數據分析儀表板

**目標**: 提供後台數據分析功能

**功能**:

1. [ ] 內容熱度趨勢圖
2. [ ] 用戶活躍度統計
3. [ ] 熱門時段分析
4. [ ] 地區分布統計
5. [ ] 匯出報表功能

### Phase 4: 個人化推薦

**目標**: 基於統計數據提供個人化推薦

**功能**:

1. [ ] 相似路線推薦
2. [ ] 基於難度偏好推薦
3. [ ] 基於地區推薦
4. [ ] 熱門趨勢推薦

---

## 附錄

### A. 統計相關檔案索引

| 檔案路徑 | 說明 |
|----------|------|
| `backend/src/utils/viewTracker.ts` | 瀏覽追蹤工具函數 |
| `backend/src/db/schema.sql` | 資料庫結構定義 |
| `backend/src/routes/posts.ts` | 文章 API (含統計) |
| `backend/src/routes/videos.ts` | 影片 API (含統計) |
| `backend/src/routes/galleries.ts` | 相簿 API (含統計) |
| `backend/src/routes/gyms.ts` | 攀岩館 API (含統計) |
| `backend/src/routes/crags.ts` | 岩場 API (含統計) |
| `src/lib/crag-data.ts` | 岩場靜態資料 (含 popularity) |
| `src/components/crag/route-section.tsx` | 路線顯示組件 |
| `src/components/videos/video-card.tsx` | 影片卡片組件 |
| `src/lib/types.ts` | 前端類型定義 |
| `src/lib/api/services.ts` | API 服務層 |

### B. 統計欄位命名規範

| 欄位類型 | 命名規範 | 範例 |
|----------|----------|------|
| 計數 | `*_count` | `view_count`, `review_count` |
| 平均值 | `*_avg` | `rating_avg` |
| 分數 | `*_score` | `popularity_score` |
| 時間戳 | `*_at` | `last_viewed_at` |

### C. API 回應格式

```typescript
// 統計數據回應格式
interface StatsResponse {
  success: boolean;
  data: {
    views: number;
    likes: number;
    saves?: number;
    rating?: {
      average: number;
      count: number;
    };
    popularity?: number;
  };
}
```

---

**文件版本**: v1.0
**最後更新**: 2025-01-11
**負責人**: Development Team
**審核狀態**: 待審核
