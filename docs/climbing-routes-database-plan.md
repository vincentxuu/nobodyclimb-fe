# 岩場與路線資料庫規劃

## 現況分析

### 現有架構

| 層級 | 狀態 | 說明 |
|------|------|------|
| **資料庫 Schema** | ✅ 已完成 | `crags` 和 `routes` 表已存在 |
| **Backend API** | ✅ 已完成 | CRUD API 已實作 (需 Admin 權限) |
| **前端資料** | ⚠️ 靜態 JSON | 目前使用 `apps/web/src/data/crags/*.json` |
| **資料來源** | ❌ 未整合 | 需要 Google Sheets → DB 流程 |

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

## Phase 3: 審核流程

### 狀態流轉

```
draft ──▶ pending ──▶ approved ──▶ [同步到 DB]
                  │
                  └──▶ rejected ──▶ [修改後重新提交]
```

### 審核介面 (Admin Dashboard)

建議新增 Admin 頁面：`/admin/crags`

```
apps/web/src/app/admin/
├── layout.tsx           # Admin layout with auth check
├── crags/
│   ├── page.tsx         # 岩場審核列表
│   ├── [id]/
│   │   └── page.tsx     # 岩場審核詳情
│   └── pending/
│       └── page.tsx     # 待審核列表
├── routes/
│   ├── page.tsx         # 路線審核列表
│   └── pending/
│       └── page.tsx     # 待審核路線
└── sync/
    └── page.tsx         # 同步控制台
```

### 審核 API

新增 Backend endpoints：

```typescript
// backend/src/routes/admin/crags.ts

// GET /admin/crags/pending - 取得待審核岩場
adminCragsRoutes.get('/pending', authMiddleware, adminMiddleware, async (c) => {
  // 從 Google Sheets 或暫存表讀取
});

// POST /admin/crags/:id/approve - 審核通過
adminCragsRoutes.post('/:id/approve', authMiddleware, adminMiddleware, async (c) => {
  const { id } = c.req.param();
  const { notes } = await c.req.json();

  // 1. 更新 Sheet status 為 approved
  // 2. 觸發同步到 D1
  // 3. 記錄審核日誌
});

// POST /admin/crags/:id/reject - 審核拒絕
adminCragsRoutes.post('/:id/reject', authMiddleware, adminMiddleware, async (c) => {
  const { id } = c.req.param();
  const { reason } = await c.req.json();

  // 1. 更新 Sheet status 為 rejected
  // 2. 記錄拒絕原因
  // 3. 發送通知給提交者
});
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
- [ ] 建立 Google Sheets 模板
- [ ] 設定 Google Sheets API 權限
- [ ] 撰寫資料驗證腳本
- [ ] 將現有 JSON 資料匯入 Sheets

### Week 3-4: 同步機制
- [ ] 實作 sync-from-sheets.ts
- [ ] 實作 migrate-json-to-db.ts
- [ ] 測試 D1 資料寫入
- [ ] 設定 CI/CD 自動化

### Week 5-6: 審核系統
- [ ] 建立 Admin Dashboard
- [ ] 實作審核 API
- [ ] 整合通知系統

### Week 7-8: 前端整合
- [ ] 切換前端資料來源
- [ ] 實作 React Query hooks
- [ ] 移除靜態 JSON 依賴
- [ ] 效能優化（快取策略）

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
