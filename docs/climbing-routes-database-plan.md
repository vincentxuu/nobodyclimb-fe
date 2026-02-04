# 岩場與路線資料庫規劃

## 現況分析

### 現有架構

| 層級 | 狀態 | 說明 |
|------|------|------|
| **資料庫 Schema** | ✅ 已完成 | `crags` 和 `routes` 表已存在於 D1 |
| **Backend API** | ✅ 已完成 | CRUD API 已實作 (`/api/v1/crags`) |
| **Admin 系統** | ✅ 已完成 | 完整的權限檢查、UI 組件、7 個管理頁面 |
| **前端資料** | ⚠️ 靜態 JSON | 目前使用 `apps/web/src/data/crags/*.json` |
| **資料來源** | ❌ 未整合 | 需要 Google Sheets → DB 流程 |

### 現有 Admin 頁面
- `/admin` - 總覽儀表板
- `/admin/users` - 用戶管理（搜尋、角色、狀態）
- `/admin/content` - 內容管理（顯示岩場/路線統計）
- `/admin/analytics` - 數據分析（DAU/WAU/MAU）
- `/admin/broadcast` - 廣播通知
- `/admin/notifications` - 通知監控
- `/admin/logs` - 訪問日誌

### 現有靜態資料
- `longdong.json` - 龍洞 (616 routes)
- `defulan.json` - 德夫蘭
- `guanziling.json` - 關子嶺
- `shoushan.json` - 壽山
- `kenting.json` - 墾丁

---

## 資料流程設計

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           資料管理流程                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   社群貢獻    │───▶│ Google Sheet │───▶│   審核系統    │───▶│  D1 資料庫 │ │
│  │  (表單提交)   │    │  (資料暫存)   │    │  (管理後台)   │    │  (正式)    │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └───────────┘ │
│                             │                    │                   │      │
│                             ▼                    ▼                   ▼      │
│                      ┌─────────────┐      ┌───────────┐      ┌───────────┐  │
│                      │ 資料驗證腳本 │      │ 版本記錄   │      │ 前端 API  │  │
│                      └─────────────┘      └───────────┘      └───────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Google Sheets 結構設計

### Sheet 1: 岩場資料 (Crags)

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `status` | Enum | Y | `draft` / `pending` / `approved` / `rejected` |
| `id` | Text | N | 自動產生，審核通過後填入 |
| `name` | Text | Y | 岩場名稱（中文） |
| `name_en` | Text | N | 岩場名稱（英文） |
| `slug` | Text | Y | URL 路徑 (e.g., `longdong`) |
| `region` | Enum | Y | `北部` / `中部` / `南部` / `東部` / `離島` |
| `location` | Text | Y | 詳細地址 |
| `latitude` | Number | Y | 緯度 |
| `longitude` | Number | Y | 經度 |
| `altitude` | Number | N | 海拔（公尺） |
| `rock_type` | Text | N | 岩石類型 |
| `climbing_types` | Text | Y | `sport,trad,boulder` (逗號分隔) |
| `difficulty_range` | Text | N | e.g., `5.6-5.13a` |
| `description` | Text | N | 岩場介紹 |
| `access_info` | Text | N | 交通方式 |
| `parking_info` | Text | N | 停車資訊 |
| `approach_time` | Number | N | 步行時間（分鐘） |
| `best_seasons` | Text | N | `春,秋,冬` (逗號分隔) |
| `restrictions` | Text | N | 限制事項 |
| `cover_image` | URL | N | 封面圖片 |
| `is_featured` | Boolean | N | 是否精選 |
| `submitted_by` | Email | Y | 提交者 |
| `submitted_at` | DateTime | Y | 提交時間 |
| `reviewed_by` | Email | N | 審核者 |
| `reviewed_at` | DateTime | N | 審核時間 |
| `review_notes` | Text | N | 審核備註 |

### Sheet 2: 區域資料 (Areas)

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `status` | Enum | Y | `draft` / `pending` / `approved` / `rejected` |
| `id` | Text | N | 自動產生 |
| `crag_slug` | Text | Y | 對應岩場 slug |
| `name` | Text | Y | 區域名稱 |
| `name_en` | Text | N | 英文名稱 |
| `description` | Text | N | 區域介紹 |
| `difficulty_min` | Text | N | 最低難度 |
| `difficulty_max` | Text | N | 最高難度 |
| `bolt_count` | Number | N | Bolt 數量 |
| `image` | URL | N | 區域圖片 |

### Sheet 3: 路線資料 (Routes)

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `status` | Enum | Y | `draft` / `pending` / `approved` / `rejected` |
| `id` | Text | N | 自動產生 |
| `crag_slug` | Text | Y | 對應岩場 slug |
| `area_id` | Text | N | 對應區域 ID |
| `sector` | Text | N | 扇區名稱 |
| `name` | Text | Y | 路線名稱 |
| `grade` | Text | Y | 難度等級 |
| `grade_system` | Enum | Y | `yds` / `french` / `v-scale` |
| `route_type` | Enum | Y | `sport` / `trad` / `boulder` / `mixed` |
| `length` | Number | N | 路線長度（公尺） |
| `bolt_count` | Number | N | Bolt 數量 |
| `bolt_type` | Text | N | Bolt 類型 |
| `anchor_type` | Text | N | 固定點類型 |
| `description` | Text | N | 路線描述 |
| `first_ascent` | Text | N | 首攀者 |
| `first_ascent_date` | Date | N | 首攀日期 |
| `protection` | Text | N | 保護裝備建議 |
| `tips` | Text | N | 攀爬提示 |
| `submitted_by` | Email | Y | 提交者 |
| `submitted_at` | DateTime | Y | 提交時間 |

### Sheet 4: 審核記錄 (Audit Log)

| 欄位 | 類型 | 說明 |
|------|------|------|
| `timestamp` | DateTime | 操作時間 |
| `action` | Enum | `create` / `update` / `approve` / `reject` / `delete` |
| `entity_type` | Enum | `crag` / `area` / `route` |
| `entity_id` | Text | 實體 ID |
| `entity_name` | Text | 實體名稱 |
| `operator` | Email | 操作者 |
| `changes` | JSON | 變更內容 |
| `notes` | Text | 備註 |

---

## Phase 2: 資料同步腳本

### 目錄結構

```
scripts/
├── crag-data/
│   ├── sync-from-sheets.ts      # 從 Sheets 同步到 DB
│   ├── export-to-sheets.ts      # 從 DB 匯出到 Sheets
│   ├── validate-data.ts         # 資料驗證
│   ├── migrate-json-to-db.ts    # 現有 JSON 遷移到 DB
│   └── config.ts                # 設定檔
├── package.json
└── README.md
```

### 核心腳本: sync-from-sheets.ts

```typescript
import { google } from 'googleapis';
import { D1Database } from '@cloudflare/workers-types';

interface SyncConfig {
  spreadsheetId: string;
  credentials: string;
  dryRun: boolean;
}

interface CragRow {
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  id: string;
  name: string;
  slug: string;
  // ... other fields
}

async function syncCrags(config: SyncConfig, db: D1Database) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(config.credentials),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // 讀取已審核通過的資料
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: 'Crags!A2:Z',
  });

  const rows = response.data.values || [];
  const approvedRows = rows.filter(row => row[0] === 'approved');

  console.log(`Found ${approvedRows.length} approved crags`);

  for (const row of approvedRows) {
    const crag = parseCragRow(row);

    if (config.dryRun) {
      console.log(`[DRY RUN] Would upsert crag: ${crag.name}`);
      continue;
    }

    // Upsert to database
    await db.prepare(`
      INSERT INTO crags (id, name, slug, region, location, latitude, longitude, ...)
      VALUES (?, ?, ?, ?, ?, ?, ?, ...)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        slug = excluded.slug,
        updated_at = datetime('now')
    `).bind(crag.id, crag.name, crag.slug, ...).run();

    console.log(`Synced crag: ${crag.name}`);
  }
}

async function syncRoutes(config: SyncConfig, db: D1Database) {
  // Similar logic for routes
}

// 執行同步
export async function runSync(config: SyncConfig) {
  // 1. Validate data first
  const errors = await validateSheetData(config);
  if (errors.length > 0) {
    console.error('Validation errors:', errors);
    return { success: false, errors };
  }

  // 2. Sync crags
  await syncCrags(config, db);

  // 3. Sync areas
  await syncAreas(config, db);

  // 4. Sync routes
  await syncRoutes(config, db);

  // 5. Update route counts
  await updateCragStatistics(db);

  return { success: true };
}
```

### 資料驗證規則

```typescript
// validate-data.ts

interface ValidationRule {
  field: string;
  check: (value: any) => boolean;
  message: string;
}

const cragRules: ValidationRule[] = [
  { field: 'name', check: v => !!v && v.length > 0, message: 'Name is required' },
  { field: 'slug', check: v => /^[a-z0-9-]+$/.test(v), message: 'Slug must be lowercase alphanumeric with hyphens' },
  { field: 'latitude', check: v => v >= 21 && v <= 26, message: 'Latitude must be within Taiwan range (21-26)' },
  { field: 'longitude', check: v => v >= 119 && v <= 123, message: 'Longitude must be within Taiwan range (119-123)' },
  { field: 'climbing_types', check: v => v.split(',').every(t => ['sport', 'trad', 'boulder', 'mixed'].includes(t.trim())), message: 'Invalid climbing type' },
];

const routeRules: ValidationRule[] = [
  { field: 'name', check: v => !!v, message: 'Route name is required' },
  { field: 'grade', check: v => !!v, message: 'Grade is required' },
  { field: 'grade_system', check: v => ['yds', 'french', 'v-scale'].includes(v), message: 'Invalid grade system' },
  { field: 'route_type', check: v => ['sport', 'trad', 'boulder', 'mixed'].includes(v), message: 'Invalid route type' },
];
```

---

## Phase 3: 審核流程（整合現有 Admin 系統）

### 現有 Admin 架構

專案已有完整的 Admin 系統：

```
apps/web/src/app/admin/
├── layout.tsx              # Admin 佈局和權限檢查 (role === 'admin')
├── page.tsx                # 總覽儀表板
├── users/page.tsx          # 用戶管理
├── analytics/page.tsx      # 數據分析（DAU/WAU/MAU）
├── content/page.tsx        # 內容管理 ← 岩場/路線統計已在此
├── broadcast/page.tsx      # 廣播通知
├── notifications/page.tsx  # 通知監控
└── logs/page.tsx           # 訪問日誌
```

**相關組件**：`apps/web/src/components/admin/`

### 狀態流轉

```
draft ──▶ pending ──▶ approved ──▶ [同步到 DB]
                  │
                  └──▶ rejected ──▶ [修改後重新提交]
```

### 擴展現有 Admin 頁面

在現有架構下新增岩場管理功能：

```
apps/web/src/app/admin/
├── ...existing pages...
├── crags/                           # 新增：岩場管理
│   ├── page.tsx                     # 岩場列表 + 待審核
│   ├── [id]/
│   │   └── page.tsx                 # 岩場詳情/編輯
│   └── sync/
│       └── page.tsx                 # 同步控制台
└── routes/                          # 新增：路線管理
    ├── page.tsx                     # 路線列表 + 待審核
    └── [id]/
        └── page.tsx                 # 路線詳情/編輯
```

**更新導航列** (`layout.tsx`)：

```typescript
const navLinks = [
  { href: '/admin', label: '總覽', icon: Home },
  { href: '/admin/notifications', label: '通知監控', icon: Bell },
  { href: '/admin/users', label: '用戶管理', icon: Users },
  { href: '/admin/content', label: '內容管理', icon: FolderOpen },
  { href: '/admin/crags', label: '岩場管理', icon: Mountain },      // 新增
  { href: '/admin/routes', label: '路線管理', icon: Route },        // 新增
  { href: '/admin/broadcast', label: '廣播通知', icon: Megaphone },
  { href: '/admin/analytics', label: '數據分析', icon: BarChart3 },
  { href: '/admin/logs', label: '訪問日誌', icon: FileText },
]
```

### 岩場管理頁面設計

**`AdminCragManagement.tsx`** 功能：

```typescript
// 參考現有 AdminUserManagement.tsx 的設計模式

// 1. 統計卡片
- 總岩場數
- 待審核數
- 本月新增
- 總路線數

// 2. Tab 切換
- 所有岩場
- 待審核（從 Sheet 讀取 status=pending）
- 同步記錄

// 3. 岩場表格
| 岩場名稱 | 區域 | 路線數 | 狀態 | 更新時間 | 操作 |
|----------|------|--------|------|----------|------|
| 龍洞     | 北部 | 616    | ✓    | 2024-01  | ... |

// 4. 操作菜單
- 查看詳情
- 編輯資料
- 同步到 DB（待審核項目）
- 拒絕（待審核項目）
```

### 審核 API

擴展現有 backend routes：

```typescript
// backend/src/routes/admin-crags.ts (新增)

import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const adminCragsRoutes = new Hono();

// 取得待審核岩場（從 Google Sheets）
adminCragsRoutes.get('/pending', authMiddleware, adminMiddleware, async (c) => {
  // 呼叫 Google Sheets API 取得 status=pending 的資料
  const pending = await fetchPendingFromSheets();
  return c.json({ success: true, data: pending });
});

// 取得所有岩場（從 D1）
adminCragsRoutes.get('/', authMiddleware, adminMiddleware, async (c) => {
  const db = c.env.DB;
  const result = await db.prepare('SELECT * FROM crags ORDER BY updated_at DESC').all();
  return c.json({ success: true, data: result.results });
});

// 審核通過並同步到 DB
adminCragsRoutes.post('/:id/approve', authMiddleware, adminMiddleware, async (c) => {
  const { id } = c.req.param();
  const { notes } = await c.req.json();

  // 1. 從 Sheet 讀取該筆資料
  // 2. 寫入 D1 database
  // 3. 更新 Sheet status 為 approved
  // 4. 記錄審核日誌

  return c.json({ success: true, message: 'Crag approved and synced' });
});

// 審核拒絕
adminCragsRoutes.post('/:id/reject', authMiddleware, adminMiddleware, async (c) => {
  const { id } = c.req.param();
  const { reason } = await c.req.json();

  // 1. 更新 Sheet status 為 rejected
  // 2. 記錄拒絕原因
  // 3. 發送通知給提交者（如果有 email）

  return c.json({ success: true, message: 'Crag rejected' });
});

// 手動觸發全量同步
adminCragsRoutes.post('/sync', authMiddleware, adminMiddleware, async (c) => {
  // 同步所有 approved 資料到 D1
  const result = await syncApprovedCrags(c.env.DB);
  return c.json({ success: true, ...result });
});

export { adminCragsRoutes };
```

**註冊路由** (`backend/src/index.ts`)：

```typescript
import { adminCragsRoutes } from './routes/admin-crags';

app.route('/api/v1/admin/crags', adminCragsRoutes);
```

### 前端 Service

```typescript
// apps/web/src/lib/api/services.ts 新增

export const adminCragService = {
  // 取得待審核
  getPending: async () => {
    const response = await apiClient.get('/admin/crags/pending');
    return response.data;
  },

  // 取得所有岩場
  getAll: async () => {
    const response = await apiClient.get('/admin/crags');
    return response.data;
  },

  // 審核通過
  approve: async (id: string, notes?: string) => {
    const response = await apiClient.post(`/admin/crags/${id}/approve`, { notes });
    return response.data;
  },

  // 審核拒絕
  reject: async (id: string, reason: string) => {
    const response = await apiClient.post(`/admin/crags/${id}/reject`, { reason });
    return response.data;
  },

  // 手動同步
  sync: async () => {
    const response = await apiClient.post('/admin/crags/sync');
    return response.data;
  },
};
```

---

## Phase 4: 前端整合

### 資料來源切換

將前端從靜態 JSON 切換到 API：

```typescript
// apps/web/src/lib/api/crags.ts

import { apiClient } from './client';

export const cragsApi = {
  // 取得所有岩場
  getAll: async (params?: { region?: string; featured?: boolean }) => {
    const response = await apiClient.get('/crags', { params });
    return response.data;
  },

  // 取得單一岩場
  getById: async (id: string) => {
    const response = await apiClient.get(`/crags/${id}`);
    return response.data;
  },

  // 取得岩場路線
  getRoutes: async (cragId: string) => {
    const response = await apiClient.get(`/crags/${cragId}/routes`);
    return response.data;
  },
};
```

### React Query 整合

```typescript
// apps/web/src/lib/hooks/use-crags.ts

import { useQuery } from '@tanstack/react-query';
import { cragsApi } from '../api/crags';

export function useCrags(options?: { region?: string }) {
  return useQuery({
    queryKey: ['crags', options],
    queryFn: () => cragsApi.getAll(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCrag(id: string) {
  return useQuery({
    queryKey: ['crag', id],
    queryFn: () => cragsApi.getById(id),
    enabled: !!id,
  });
}

export function useCragRoutes(cragId: string) {
  return useQuery({
    queryKey: ['crag-routes', cragId],
    queryFn: () => cragsApi.getRoutes(cragId),
    enabled: !!cragId,
  });
}
```

---

## Phase 5: 維護流程

### 日常維護

| 頻率 | 任務 | 負責人 |
|------|------|--------|
| 每日 | 檢查待審核資料 | Admin |
| 每週 | 審核新提交資料 | Admin |
| 每月 | 資料品質檢查 | Admin |
| 季度 | 全面資料驗證 | Tech |

### 自動化檢查

```yaml
# .github/workflows/crag-data-check.yml

name: Crag Data Validation

on:
  schedule:
    - cron: '0 0 * * 1'  # 每週一
  workflow_dispatch:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: cd scripts/crag-data && pnpm install

      - name: Validate Sheet Data
        env:
          GOOGLE_SHEETS_CREDENTIALS: ${{ secrets.GOOGLE_SHEETS_CREDENTIALS }}
          SPREADSHEET_ID: ${{ secrets.CRAG_SPREADSHEET_ID }}
        run: cd scripts/crag-data && pnpm validate

      - name: Report Issues
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '岩場資料驗證失敗',
              body: '請檢查 Google Sheets 資料',
              labels: ['data-issue']
            })
```

### 資料修正流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     資料修正流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 發現問題                                                     │
│     ├── 使用者回報                                               │
│     ├── 自動驗證發現                                             │
│     └── 管理員檢查                                               │
│                                                                 │
│  2. 在 Sheet 修正                                                │
│     ├── 找到對應 row                                             │
│     ├── 修改資料                                                 │
│     └── 標記 status = pending                                    │
│                                                                 │
│  3. 重新審核                                                     │
│     ├── 驗證修正內容                                             │
│     ├── 審核通過 → approved                                      │
│     └── 記錄變更                                                 │
│                                                                 │
│  4. 同步到 DB                                                    │
│     ├── 手動觸發同步                                             │
│     └── 或等待定期同步                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 實作優先順序

### Week 1-2: 基礎建設
- [ ] 建立 Google Sheets 模板（Crags、Areas、Routes、Audit Log）
- [ ] 設定 Google Sheets API 權限（Service Account）
- [ ] 撰寫資料驗證腳本 (`scripts/crag-data/validate-data.ts`)
- [ ] 將現有 5 個 JSON 檔案資料匯入 Sheets

### Week 3-4: 同步機制
- [ ] 實作 `sync-from-sheets.ts`（Sheets → D1）
- [ ] 實作 `migrate-json-to-db.ts`（現有 JSON → D1 一次性遷移）
- [ ] 測試 D1 資料寫入（preview 環境）
- [ ] 設定 GitHub Actions 自動化驗證

### Week 5-6: 審核系統（整合現有 Admin）
- [ ] 新增 `/admin/crags` 頁面（參考 `AdminUserManagement.tsx`）
- [ ] 新增 `/admin/routes` 頁面
- [ ] 實作 `backend/src/routes/admin-crags.ts` API
- [ ] 更新 Admin layout 導航列
- [ ] 實作同步控制台 UI

### Week 7-8: 前端整合
- [ ] 切換前端資料來源（JSON → API）
- [ ] 實作 React Query hooks (`useCrags`, `useCragRoutes`)
- [ ] 移除靜態 JSON 依賴 (`apps/web/src/data/crags/`)
- [ ] 效能優化（快取策略、SSG/ISR）

---

## 技術決策

### 為什麼用 Google Sheets？

| 方案 | 優點 | 缺點 |
|------|------|------|
| **Google Sheets** | 協作方便、無需開發介面、免費 | API 限制、需同步機制 |
| Airtable | UI 更好、API 更穩定 | 付費、資料量限制 |
| 直接 Admin UI | 完全控制、即時同步 | 開發成本高 |

**選擇 Google Sheets 原因**：
1. 非技術人員也能操作
2. 多人協作審核方便
3. 天然的版本控制
4. 零開發成本的表單功能

### 同步策略

| 策略 | 說明 |
|------|------|
| **Pull-based** | 定期從 Sheets 拉取 (推薦) |
| Push-based | Sheets 變更時推送 (需 Apps Script) |
| 混合 | 定期拉取 + 手動觸發 |

---

## 附錄

### Google Sheets 模板連結
> TODO: 建立模板後填入連結

### 相關文件
- [Backend API 文件](/backend/README.md)
- [前端架構說明](/apps/web/README.md)
- [D1 Schema](/backend/src/db/schema.sql)

### 聯絡方式
- 技術問題：開 GitHub Issue
- 資料問題：聯繫 Admin
