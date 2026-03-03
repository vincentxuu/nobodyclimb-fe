# 攀爬記錄 × 人生清單 整合計畫

> 將「攀爬記錄 (Ascents)」、「人生清單 (Bucket List)」、「年度目標 (Grade Targets)」三個系統打通，實現資料自動連動、路線專案追蹤、以及路線頁面個人狀態顯示。

## 目錄

- [現狀分析](#現狀分析)
- [目標](#目標)
- [Phase 1：資料層打通](#phase-1資料層打通)
- [Phase 2：路線專案模式](#phase-2路線專案模式)
- [Phase 3：路線頁面個人狀態（紅綠燈）](#phase-3路線頁面個人狀態紅綠燈)
- [Phase 4：年度目標自動連動](#phase-4年度目標自動連動)
- [資料庫變更總覽](#資料庫變更總覽)
- [API 變更總覽](#api-變更總覽)
- [前端變更總覽](#前端變更總覽)
- [風險與取捨](#風險與取捨)

---

## 現狀分析

### 三個獨立系統

| 系統 | 頁面 | DB 表 | 資料歸屬 | 用途 |
|------|------|-------|---------|------|
| 攀爬記錄 | `/profile/ascents` | `user_route_ascents` | `user_id` + `route_id` | 單次攀爬事實記錄 |
| 人生清單 | `/profile/bucket-list` | `bucket_list_items` | `biography_id` | 目標管理 + 進度追蹤 |
| 年度目標 | Biography 編輯器 | biography JSON `grade_targets` | `biography_id` | 年度級數完攀目標 |

### 現有問題

1. **Bucket List 已有 `route_id` FK**（migration 0037 PART 6 已加 column），但 TypeScript type 沒有 `route_id` 欄位，前端完全沒用到
2. **進度不連動** — 人生清單 progress 靠手動輸入，不會因為記了 ascent 而自動更新
3. **缺少「路線專案」概念** — 攀爬進程（摸動作 → Top Rope → 先鋒嘗試 → RP）兩個系統都沒完整支援
4. **年度目標 `completed_count` 手動輸入** — 不會根據 ascent 記錄自動累計
5. **路線頁面沒有個人狀態** — 看路線列表時無法知道哪些路線已爬過、哪些正在 project

### 現有資料關係

```
users ─┬─→ user_route_ascents ──→ routes ──→ crags
       │                           ↑
       │                           │ route_id (FK 已存在，前端未用)
       │                           │
       └─→ biographies ──→ bucket_list_items
                           │
                           ├─→ grade_targets (JSON field)
                           ├─→ bucket_list_likes
                           └─→ bucket_list_comments
```

---

## 目標

整合後的資料流：

```
                    ┌─────────────────────────────┐
                    │     路線頁面 (Route Page)     │
                    │  🟢 已完攀 / 🟡 進行中 / ⚪ 未爬 │
                    └──────────┬──────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ↓                    ↓                    ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   攀爬記錄       │  │  路線專案        │  │  年度目標        │
│  (每次嘗試)      │  │ (Bucket List    │  │ (Grade Target)  │
│                 │  │  route project) │  │                 │
│ 3/1 attempt     │→ │ 進度: 75%       │  │ 2026 5.12 x10  │
│ 3/5 toprope     │  │ ✅摸動作        │  │ completed: 3    │
│ 3/10 lead       │  │ ✅TR完攀        │  │ (自動計算)       │
│ 3/15 redpoint ──┼──│→✅先鋒 → RP!    │──┼→ +1             │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                     │
         └────────── 自動連動 ─┴──── 自動連動 ────────┘
```

---

## Phase 1：資料層打通

> 最小改動，讓現有系統能互相感知。

### 1.1 Type 定義補齊 `route_id`

**檔案**: `packages/types/src/biography.ts`

在 `BucketListItem` interface 加入已存在於 DB 的 `route_id`：

```typescript
export interface BucketListItem {
  id: string
  biography_id: string
  route_id: string | null     // ← 新增，DB 已有此 column
  title: string
  // ... 其餘不變
}
```

**檔案**: `apps/web/src/lib/schemas/bucket-list.ts`

在 `bucketListItemInputSchema` 加入 `route_id`：

```typescript
export const bucketListItemInputSchema = z.object({
  route_id: z.string().nullable().optional(),  // ← 新增
  title: z.string().min(1).max(100),
  // ... 其餘不變
})
```

### 1.2 Bucket List 表單支援選擇路線

**檔案**: `apps/web/src/components/bucket-list/bucket-list-form.tsx`

- 當 category 為 `outdoor_route` 時，顯示「選擇路線」下拉選單
- 選中路線後自動帶入 `target_grade`（路線難度）和 `target_location`（岩場名稱）
- 路線選單：先選岩場 → 再選路線（cascading select）

### 1.3 Backend Bucket List 回傳 `route_id` 及路線資訊

**檔案**: `backend/src/routes/bucket-list.ts`

- GET 端點 JOIN `routes` 和 `crags` 表，回傳 `route_name`, `route_grade`, `crag_name`
- POST/PUT 端點接受 `route_id` 參數

### 1.4 新增 API：查詢使用者在特定路線的狀態

**檔案**: `backend/src/routes/ascents.ts`（擴充）

新增端點：

```
GET /ascents/my-route-status?route_ids=id1,id2,id3
```

回傳：

```json
{
  "data": {
    "route_id_1": {
      "status": "completed",       // "none" | "attempted" | "in_progress" | "completed"
      "best_ascent_type": "redpoint",
      "attempts_count": 5,
      "first_attempt_date": "2026-01-15",
      "completion_date": "2026-03-15",
      "has_project": true           // 是否有對應的 bucket list item
    },
    "route_id_2": {
      "status": "attempted",
      "best_ascent_type": "attempt",
      "attempts_count": 2,
      "first_attempt_date": "2026-02-20",
      "completion_date": null,
      "has_project": false
    }
  }
}
```

**狀態判定邏輯**：

```
completed  = 有 redpoint / flash / onsight 記錄
in_progress = 有 attempt / toprope / lead / seconding 記錄（但無 completed 類型）
attempted  = 只有 attempt 記錄
none       = 無任何記錄
```

### 異動清單

| 檔案 | 改動類型 | 說明 |
|------|---------|------|
| `packages/types/src/biography.ts` | 修改 | `BucketListItem` 加 `route_id` |
| `apps/web/src/lib/schemas/bucket-list.ts` | 修改 | schema 加 `route_id` |
| `packages/schemas/src/bucket-list.ts` | 修改 | 共享 schema 加 `route_id` |
| `apps/web/src/components/bucket-list/bucket-list-form.tsx` | 修改 | 表單加路線選擇 |
| `backend/src/routes/bucket-list.ts` | 修改 | JOIN route info, 接受 route_id |
| `backend/src/routes/ascents.ts` | 修改 | 新增 `my-route-status` 端點 |
| `apps/web/src/lib/hooks/useAscents.ts` | 修改 | 新增 `getMyRouteStatus` 方法 |

---

## Phase 2：路線專案模式

> 在人生清單中加入「路線專案」專屬流程，自動從 ascent 記錄追蹤進度。

### 2.1 新增 Bucket List Category: `route_project`

**檔案**: `packages/types/src/biography.ts` + `packages/constants/src/climbing.ts`

```typescript
export type BucketListCategory =
  | 'outdoor_route'
  | 'indoor_grade'
  | 'competition'
  | 'training'
  | 'adventure'
  | 'skill'
  | 'injury_recovery'
  | 'route_project'    // ← 新增：路線專案
  | 'other'
```

### 2.2 預設里程碑模板

當使用者建立 `route_project` 類型的清單項目時，自動帶入預設里程碑：

```typescript
const ROUTE_PROJECT_MILESTONES: Milestone[] = [
  {
    id: 'touch_moves',
    title: '摸動作',            // 到場看路線、嘗試個別動作
    percentage: 15,
    completed: false,
    completed_at: null,
    note: null,
  },
  {
    id: 'section_climb',
    title: '分段完攀',           // 分段爬完全程
    percentage: 35,
    completed: false,
    completed_at: null,
    note: null,
  },
  {
    id: 'toprope_send',
    title: 'Top Rope 完攀',     // TR 方式完攀全程
    percentage: 55,
    completed: false,
    completed_at: null,
    note: null,
  },
  {
    id: 'lead_attempt',
    title: '先鋒嘗試',           // Lead 方式嘗試
    percentage: 75,
    completed: false,
    completed_at: null,
    note: null,
  },
  {
    id: 'redpoint',
    title: 'Redpoint 完攀',     // 紅點完攀 = 目標達成
    percentage: 100,
    completed: false,
    completed_at: null,
    note: null,
  },
]
```

使用者可自訂（刪除、新增、修改）預設里程碑，例如：
- 簡化為：嘗試 → TR → RP
- 細化為：摸動作 → 分段 → TR → Lead fall 第3bolt → Lead fall 第5bolt → Lead 完攀 → RP

### 2.3 Ascent 記錄新增欄位

**新 Migration**: `backend/migrations/0039_ascent_bolt_progress.sql`

```sql
ALTER TABLE user_route_ascents ADD COLUMN max_bolt_reached INTEGER;
-- 這次爬到第幾個 bolt（先鋒時特別有用）

ALTER TABLE user_route_ascents ADD COLUMN beta_notes TEXT;
-- 動作筆記（獨立於 notes，專記 beta）

ALTER TABLE user_route_ascents ADD COLUMN session_type TEXT
  CHECK (session_type IN ('project', 'casual', 'warmup', 'cooldown'));
-- 這次攀爬的性質
```

**Type 更新**: `apps/web/src/lib/types/ascent.ts`

```typescript
export interface UserRouteAscent {
  // ... 現有欄位
  max_bolt_reached: number | null    // 新增
  beta_notes: string | null          // 新增
  session_type: SessionType | null   // 新增
}

export type SessionType = 'project' | 'casual' | 'warmup' | 'cooldown'
```

### 2.4 Ascent → Bucket List 自動連動

**實作位置**: `backend/src/routes/ascents.ts` — POST /ascents 成功後

邏輯：

```
記錄新 ascent 時：
1. 查找是否有對應的 bucket_list_item (route_id = ascent.route_id)
2. 如果有，根據 ascent_type 自動勾選對應里程碑：
   - attempt → 勾選「摸動作」
   - toprope → 勾選「Top Rope 完攀」
   - lead + not completed → 勾選「先鋒嘗試」
   - redpoint/flash/onsight → 勾選「Redpoint 完攀」→ 標記 bucket list 為 completed
3. 更新 progress 百分比
4. 如果 RP/flash/onsight → 觸發 bucket list 完成流程
```

### 2.5 路線專案詳情頁面

**新增組件**: `apps/web/src/components/bucket-list/route-project-detail.tsx`

顯示：
- 路線基本資訊（名稱、級數、岩場、bolt 數）
- 里程碑進度（視覺化時間線）
- 所有相關 ascent 記錄（時間順序排列）
- 每次 ascent 的 bolt 進度（如果有記錄 `max_bolt_reached`）
- Beta 筆記整合（收集所有 ascent 的 `beta_notes`）
- 完攀故事（完成後）

### 異動清單

| 檔案 | 改動類型 | 說明 |
|------|---------|------|
| `packages/types/src/biography.ts` | 修改 | category 加 `route_project` |
| `packages/constants/src/climbing.ts` | 修改 | 新增 `ROUTE_PROJECT_MILESTONES` 常數 |
| `apps/web/src/lib/schemas/bucket-list.ts` | 修改 | category enum 加 `route_project` |
| `backend/migrations/0039_ascent_bolt_progress.sql` | 新增 | ascent 新欄位 |
| `apps/web/src/lib/types/ascent.ts` | 修改 | 新增 `max_bolt_reached`, `beta_notes`, `session_type` |
| `apps/web/src/components/ascent/AscentForm.tsx` | 修改 | 表單加新欄位 |
| `backend/src/routes/ascents.ts` | 修改 | POST 後自動更新 bucket list |
| `apps/web/src/components/bucket-list/route-project-detail.tsx` | 新增 | 路線專案詳情組件 |
| `apps/web/src/components/bucket-list/bucket-list-form.tsx` | 修改 | route_project 預設里程碑 |

---

## Phase 3：路線頁面個人狀態（紅綠燈）

> 在路線列表和路線詳情頁面顯示個人攀爬狀態。

### 3.1 狀態定義

```typescript
type RoutePersonalStatus = 'none' | 'attempted' | 'in_progress' | 'completed'
```

顏色對應：
| 狀態 | 顏色 | 意義 | 判定條件 |
|------|------|------|---------|
| `none` | ⚪ 灰色 | 未嘗試 | 無任何 ascent 記錄 |
| `attempted` | 🔴 紅色 | 有嘗試但未成功 | 只有 `attempt` 記錄 |
| `in_progress` | 🟡 黃色 | 進行中 | 有 toprope/lead/seconding 但無完攀 |
| `completed` | 🟢 綠色 | 已完攀 | 有 redpoint/flash/onsight |

### 3.2 路線列表狀態指示器

**檔案**: `apps/web/src/components/crag/route-list-item.tsx`

在路線名稱左側加入小圓點指示器：

```tsx
// 路線列表項目中
<div className="flex items-center gap-2">
  {personalStatus && personalStatus !== 'none' && (
    <RouteStatusDot status={personalStatus} />
  )}
  <span>{route.name}</span>
</div>
```

**新增組件**: `apps/web/src/components/crag/route-status-dot.tsx`

```tsx
const STATUS_COLORS = {
  none: 'bg-gray-300',
  attempted: 'bg-red-400',
  in_progress: 'bg-yellow-400',
  completed: 'bg-emerald-500',
}

export function RouteStatusDot({ status }: { status: RoutePersonalStatus }) {
  return (
    <span
      className={cn('inline-block w-2.5 h-2.5 rounded-full', STATUS_COLORS[status])}
      title={STATUS_LABELS[status]}
    />
  )
}
```

### 3.3 路線列表批次查詢

**載入流程**：

```
1. 使用者進入岩場頁面
2. 載入路線列表（現有邏輯）
3. 如果使用者已登入，呼叫 GET /ascents/my-route-status?route_ids=...
4. 批次回傳該岩場所有路線的個人狀態
5. 在路線列表項目上顯示狀態圓點
```

**檔案**: `apps/web/src/components/crag/route-section.tsx`

```typescript
// 已登入時，批次查詢路線狀態
const routeIds = filteredRoutes.map(r => r.id)
const { data: routeStatuses } = useQuery({
  queryKey: ['my-route-status', routeIds],
  queryFn: () => getMyRouteStatus(routeIds),
  enabled: !!user && routeIds.length > 0,
})
```

### 3.4 路線詳情頁個人狀態

**檔案**: `apps/web/src/app/crag/[id]/route/[routeId]/RouteDetailClient.tsx`

在 `RouteHeader` 下方加入個人狀態區塊：

```tsx
{user && (
  <RoutePersonalStatusBar
    routeId={routeId}
    status={personalStatus}
    attemptsCount={attemptsCount}
    bestAscentType={bestAscentType}
    hasProject={hasProject}
    onCreateProject={handleCreateProject}
    onRecordAscent={handleRecordAscent}
  />
)}
```

顯示：
- 個人狀態標記（紅綠燈）
- 嘗試次數
- 最佳完攀類型
- 「記錄攀爬」按鈕
- 「建立路線專案」按鈕（如果還沒有）
- 到第幾個 bolt 的進度（如果有記錄）

### 3.5 紅綠燈模式開關

在路線列表 header 加入 toggle：

```tsx
<div className="flex items-center gap-2">
  <Switch checked={showPersonalStatus} onCheckedChange={setShowPersonalStatus} />
  <span className="text-sm text-muted-foreground">個人狀態</span>
</div>
```

只有登入使用者才看得到此開關。預設開啟。

### 異動清單

| 檔案 | 改動類型 | 說明 |
|------|---------|------|
| `apps/web/src/components/crag/route-status-dot.tsx` | 新增 | 狀態圓點組件 |
| `apps/web/src/components/crag/route-personal-status-bar.tsx` | 新增 | 路線詳情個人狀態列 |
| `apps/web/src/components/crag/route-list-item.tsx` | 修改 | 加入狀態圓點 |
| `apps/web/src/components/crag/route-section.tsx` | 修改 | 批次查詢 + toggle |
| `apps/web/src/app/crag/[id]/route/[routeId]/RouteDetailClient.tsx` | 修改 | 加入個人狀態列 |
| `apps/web/src/lib/types/route-status.ts` | 新增 | 路線個人狀態 type |

---

## Phase 4：年度目標自動連動

> Grade Targets 的 `completed_count` 自動從 ascent 記錄計算。

### 4.1 後端自動計算

**實作位置**: `backend/src/routes/ascents.ts` — POST /ascents

當記錄新 ascent 且為完攀類型（redpoint/flash/onsight）時：

```
1. 查詢該 user 的 biography
2. 取得 grade_targets JSON
3. 找到匹配的年度目標（年份 + grade_system + grade 匹配）
4. 自動 +1 completed_count
5. 更新 biography 的 grade_targets
```

**Grade 匹配邏輯**：

```typescript
// 目標: 2026 sport 5.12
// 路線難度: 5.12a → 匹配 5.12 大級數
// 路線難度: 5.12c → 匹配 5.12 大級數
// 路線難度: 5.11d → 不匹配

function matchesGradeTarget(routeGrade: string, targetGrade: string): boolean {
  // 把 5.12a, 5.12b, 5.12c, 5.12d 都歸到 5.12
  const major = routeGrade.replace(/[abcd+\-]$/, '')
  return major === targetGrade
}
```

### 4.2 前端顯示更新

**檔案**: `apps/web/src/components/biography/editor/GradeTargetsSection.tsx`

- 顯示 `completed_count / target_count` 進度條
- 連結到 ascent 記錄（點擊可查看哪些路線計入此目標）
- `completed_count` 為唯讀（自動計算），移除手動輸入

### 4.3 新增 API：查詢年度目標進度

**端點**: `GET /ascents/grade-progress?year=2026`

```json
{
  "data": [
    {
      "grade_system": "sport",
      "grade": "5.12",
      "target_count": 10,
      "completed_count": 3,
      "ascents": [
        { "id": "...", "route_name": "XXX", "grade": "5.12a", "ascent_date": "2026-01-15" },
        { "id": "...", "route_name": "YYY", "grade": "5.12c", "ascent_date": "2026-02-20" }
      ]
    }
  ]
}
```

### 異動清單

| 檔案 | 改動類型 | 說明 |
|------|---------|------|
| `backend/src/routes/ascents.ts` | 修改 | POST 後自動更新 grade targets |
| `backend/src/routes/ascents.ts` | 修改 | 新增 `grade-progress` 端點 |
| `apps/web/src/components/biography/editor/GradeTargetsSection.tsx` | 修改 | 顯示自動計算進度 |
| `apps/web/src/lib/hooks/useAscents.ts` | 修改 | 新增 `getGradeProgress` 方法 |
| `apps/web/src/lib/types/biography-v2.ts` | 修改 | `GradeTarget` 加 `completed_count` |

---

## 資料庫變更總覽

### Migration 0039: ascent_bolt_progress

```sql
-- Phase 2: Ascent 新增欄位
ALTER TABLE user_route_ascents ADD COLUMN max_bolt_reached INTEGER;
ALTER TABLE user_route_ascents ADD COLUMN beta_notes TEXT;
ALTER TABLE user_route_ascents ADD COLUMN session_type TEXT
  CHECK (session_type IN ('project', 'casual', 'warmup', 'cooldown'));
```

### 無需新 Migration 的部分

- `bucket_list_items.route_id` — **已存在**（migration 0037 PART 6）
- `bucket_list_items.category` — 已是 TEXT，不需 ALTER（加新值只需程式層面修改）
- `grade_targets` — 存在 biography JSON 欄位中，不需 schema 改動

---

## API 變更總覽

| 端點 | Method | Phase | 說明 |
|------|--------|-------|------|
| `/ascents/my-route-status` | GET | 1 | 批次查詢個人路線狀態 |
| `/bucket-list` (POST/PUT) | POST/PUT | 1 | 接受 `route_id` 參數 |
| `/bucket-list/:biographyId` | GET | 1 | 回傳含路線資訊 |
| `/ascents` | POST | 2 | 新增 bolt/beta/session 欄位，自動連動 bucket list |
| `/ascents/grade-progress` | GET | 4 | 查詢年度目標進度 |

---

## 前端變更總覽

### 新增檔案

| 檔案 | Phase | 說明 |
|------|-------|------|
| `components/crag/route-status-dot.tsx` | 3 | 紅綠燈圓點組件 |
| `components/crag/route-personal-status-bar.tsx` | 3 | 路線詳情個人狀態列 |
| `components/bucket-list/route-project-detail.tsx` | 2 | 路線專案詳情 |
| `lib/types/route-status.ts` | 1 | 路線狀態 type 定義 |

### 修改檔案

| 檔案 | Phase | 說明 |
|------|-------|------|
| `packages/types/src/biography.ts` | 1 | BucketListItem 加 route_id |
| `packages/constants/src/climbing.ts` | 2 | 路線專案里程碑模板 |
| `lib/schemas/bucket-list.ts` | 1 | schema 加 route_id |
| `components/bucket-list/bucket-list-form.tsx` | 1,2 | 路線選擇 + 預設里程碑 |
| `components/ascent/AscentForm.tsx` | 2 | 新增 bolt/beta/session 欄位 |
| `components/crag/route-list-item.tsx` | 3 | 加入狀態圓點 |
| `components/crag/route-section.tsx` | 3 | 批次查詢 + toggle |
| `components/biography/editor/GradeTargetsSection.tsx` | 4 | 自動計算進度 |
| `lib/hooks/useAscents.ts` | 1,4 | 新增 hook 方法 |
| `lib/types/ascent.ts` | 2 | 新增欄位 type |
| `app/crag/[id]/route/[routeId]/RouteDetailClient.tsx` | 3 | 個人狀態列 |

---

## 風險與取捨

### 效能考量

- **路線列表批次查詢**：一個岩場可能有 600+ 路線（如龍洞），需注意 `my-route-status` 查詢效能
  - 方案：利用現有 `idx_ascents_user_route` 索引，一次查詢使用者所有 route_id
  - 只查詢已登入使用者，訪客不觸發
- **Ascent 建立時的連動**：POST ascent 後要查 bucket list + grade targets，增加寫入延遲
  - 方案：非同步處理（Cloudflare Workers 可用 `waitUntil` 在回應後執行）

### 向下相容

- Bucket List 的 `route_id` 為 nullable，現有項目不受影響
- Ascent 新增欄位均為 nullable，現有記錄不受影響
- 路線狀態只在登入時顯示，不影響訪客體驗
- `route_project` 為新 category，不影響現有類別

### 實作順序建議

```
Phase 1 (1-2 週) → Phase 3 (1 週) → Phase 2 (2 週) → Phase 4 (1 週)
```

建議先做 Phase 1 + Phase 3（資料打通 + 紅綠燈），因為：
1. Phase 1 是基礎，所有後續都依賴它
2. Phase 3（紅綠燈）使用者感知最明顯，投入產出比最高
3. Phase 2（路線專案）功能最豐富但也最複雜，可以後做
4. Phase 4（年度目標連動）改動最小，隨時可加

### 未來擴展

- **難度熱力圖**：根據 ascent 記錄生成使用者的難度分布圖（在 profile 或 biography 展示）
- **社群路線狀態**：顯示一條路線有多少人完攀、多少人在 project
- **路線推薦**：根據使用者完攀記錄推薦適合的下一條路線
- **Bolt 進度視覺化**：在路線圖上標記使用者到達的最高 bolt 位置
