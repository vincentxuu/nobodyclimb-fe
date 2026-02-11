# Admin Crag 匯入匯出功能規劃

## 現況分析

### 已有功能
- ✅ Crag 批次匯入 (`POST /admin/crags/batch-import`) - 支援 JSON，有 skipExisting 選項
- ✅ Route 批次匯入 (`POST /admin/crags/:cragId/routes/batch-import`)
- ✅ Area / Sector CRUD (`admin-areas.ts`) - 含 reorder、update-counts
- ✅ 前端 Admin UI - 樹狀層級編輯器（CragTree + InlineForm）
- ✅ 完整 CRUD - Crag / Area / Sector / Route

### 缺少功能
- ❌ 匯出（Export）功能 - 無 API 端點、無前端 UI
- ❌ Area / Sector 批次匯入
- ❌ 完整層級匯入（一次匯入 Crag + Areas + Sectors + Routes）
- ❌ CSV 格式支援
- ❌ 匯入前資料預覽 / 驗證

---

## 資料層級結構

```
Crag（岩場）
  ├── Area（區域，如：校門口、鐘塔）
  │   ├── Sector（分區，如：人面岩、門簷）
  │   │   └── Route（路線）
  │   └── Route（區域級路線，area_id 有值但 sector_id 為 NULL）
  └── Route（岩場級路線，area_id 和 sector_id 皆為 NULL）
```

---

## 完整資料欄位對照（DB Schema）

### Crags（37 欄位）

| 欄位 | 類型 | 匯出 | 匯入 | 說明 |
|------|------|:----:|:----:|------|
| id | TEXT PK | ✅ | ⚪ 選填 | 匯入時可自動生成 |
| name | TEXT NOT NULL | ✅ | ✅ 必填 | |
| slug | TEXT UNIQUE NOT NULL | ✅ | ✅ 必填 | conflict key |
| description | TEXT | ✅ | ⚪ | |
| location | TEXT | ✅ | ⚪ | |
| region | TEXT | ✅ | ⚪ | |
| latitude | REAL | ✅ | ⚪ | |
| longitude | REAL | ✅ | ⚪ | |
| altitude | INTEGER | ✅ | ⚪ | |
| rock_type | TEXT | ✅ | ⚪ | |
| climbing_types | TEXT (JSON array) | ✅ | ⚪ | |
| difficulty_range | TEXT | ✅ | ⚪ | |
| route_count | INTEGER DEFAULT 0 | ✅ | 🚫 忽略 | 匯入後自動重算 |
| bolt_count | INTEGER DEFAULT 0 | ✅ | 🚫 忽略 | 匯入後自動重算 |
| cover_image | TEXT | ✅ | ⚪ | |
| images | TEXT (JSON array) | ✅ | ⚪ | |
| is_featured | INTEGER DEFAULT 0 | ✅ | ⚪ | |
| access_info | TEXT | ✅ | ⚪ | |
| parking_info | TEXT | ✅ | ⚪ | |
| approach_time | INTEGER | ✅ | ⚪ | |
| best_seasons | TEXT (JSON array) | ✅ | ⚪ | |
| restrictions | TEXT | ✅ | ⚪ | |
| rating_avg | REAL DEFAULT 0 | ✅ | 🚫 忽略 | 社群資料，不可覆蓋 |
| review_count | INTEGER DEFAULT 0 | ✅ | 🚫 忽略 | 社群資料 |
| metadata_source | TEXT | ✅ | ⚪ | migration 0033 |
| metadata_source_url | TEXT | ✅ | ⚪ | migration 0033 |
| metadata_maintainer | TEXT | ✅ | ⚪ | migration 0033 |
| metadata_maintainer_url | TEXT | ✅ | ⚪ | migration 0033 |
| live_video_id | TEXT | ✅ | ⚪ | migration 0033 |
| live_video_title | TEXT | ✅ | ⚪ | migration 0033 |
| live_video_description | TEXT | ✅ | ⚪ | migration 0033 |
| transportation | TEXT (JSON) | ✅ | ⚪ | migration 0033 |
| amenities | TEXT (JSON) | ✅ | ⚪ | migration 0033 |
| google_maps_url | TEXT | ✅ | ⚪ | migration 0033 |
| height_min | INTEGER | ✅ | ⚪ | migration 0034 |
| height_max | INTEGER | ✅ | ⚪ | migration 0034 |
| created_at | TEXT | ✅ | 🚫 忽略 | 自動設定 |
| updated_at | TEXT | ✅ | 🚫 忽略 | 自動設定 |

### Areas（13 欄位）

| 欄位 | 類型 | 匯出 | 匯入 | 說明 |
|------|------|:----:|:----:|------|
| id | TEXT PK | ✅ | ⚪ 選填 | |
| crag_id | TEXT FK NOT NULL | 🚫 | 🚫 | 由層級結構推導 |
| name | TEXT NOT NULL | ✅ | ✅ 必填 | conflict key (+ crag_id) |
| name_en | TEXT | ✅ | ⚪ | |
| slug | TEXT | ✅ | ⚪ | |
| description | TEXT | ✅ | ⚪ | |
| description_en | TEXT | ✅ | ⚪ | |
| image | TEXT | ✅ | ⚪ | |
| bolt_count | INTEGER DEFAULT 0 | ✅ | 🚫 忽略 | 匯入後重算 |
| route_count | INTEGER DEFAULT 0 | ✅ | 🚫 忽略 | 匯入後重算 |
| sort_order | INTEGER DEFAULT 0 | ✅ | ⚪ | 匯入時依陣列順序自動設定 |
| created_at | TEXT | ✅ | 🚫 | |
| updated_at | TEXT | ✅ | 🚫 | |

### Sectors（7 欄位）

| 欄位 | 類型 | 匯出 | 匯入 | 說明 |
|------|------|:----:|:----:|------|
| id | TEXT PK | ✅ | ⚪ 選填 | |
| area_id | TEXT FK NOT NULL | 🚫 | 🚫 | 由層級結構推導 |
| name | TEXT NOT NULL | ✅ | ✅ 必填 | conflict key (+ area_id) |
| name_en | TEXT | ✅ | ⚪ | |
| sort_order | INTEGER DEFAULT 0 | ✅ | ⚪ | |
| created_at | TEXT | ✅ | 🚫 | |
| updated_at | TEXT | ✅ | 🚫 | |

### Routes（17 欄位）

| 欄位 | 類型 | 匯出 | 匯入 | 說明 |
|------|------|:----:|:----:|------|
| id | TEXT PK | ✅ | ⚪ 選填 | |
| crag_id | TEXT FK NOT NULL | 🚫 | 🚫 | 由層級結構推導 |
| area_id | TEXT FK | 🚫 | 🚫 | 由層級結構推導 |
| sector_id | TEXT FK | 🚫 | 🚫 | 由層級結構推導 |
| name | TEXT NOT NULL | ✅ | ✅ 必填 | |
| grade | TEXT | ✅ | ⚪ | |
| grade_system | TEXT DEFAULT 'yds' | ✅ | ⚪ | |
| height | INTEGER | ✅ | ⚪ | |
| bolt_count | INTEGER | ✅ | ⚪ | |
| route_type | TEXT CHECK(...) | ✅ | ⚪ | sport/trad/boulder/mixed |
| description | TEXT | ✅ | ⚪ | |
| first_ascent | TEXT | ✅ | ⚪ | |
| ascent_count | INTEGER DEFAULT 0 | ✅ | 🚫 忽略 | 社群資料 |
| story_count | INTEGER DEFAULT 0 | ✅ | 🚫 忽略 | 社群資料 |
| community_rating_avg | REAL DEFAULT 0 | ✅ | 🚫 忽略 | 社群資料 |
| community_rating_count | INTEGER DEFAULT 0 | ✅ | 🚫 忽略 | 社群資料 |
| created_at | TEXT | ✅ | 🚫 | |

---

## 實作規劃

### Phase 1：匯出功能（Export）

#### 1.1 Backend - 匯出 API 端點

**新增端點：**

| 端點 | 說明 |
|------|------|
| `GET /admin/crags/export` | 匯出全部或指定岩場（支援篩選與格式選擇） |
| `GET /admin/crags/:id/export` | 匯出單一岩場完整資料（含 areas/sectors/routes） |

> 原規劃有第三個端點 `GET /admin/crags/:cragId/routes/export`，
> 但這是 `/:id/export?include=routes-only` 的子集，故合併。

**路由順序（重要）：** 靜態路由必須在動態路由之前註冊，避免 `export` 被當成 `:id` 參數：
```
GET /admin/crags/export       ← 必須在 /:id 之前
GET /admin/crags/stats        ← 已有，已在 /:id 之前
POST /admin/crags/batch-import ← 已有，已在 /:id 之前
GET /admin/crags/:id          ← 動態路由
GET /admin/crags/:id/export   ← 巢狀動態路由
```

**查詢參數：**
- `format`: `json`（預設）或 `csv`
- `include`: `all`（預設）、`crags-only`、`routes-only`
- `region`: 篩選特定區域（選填）
- `ids`: 指定多個岩場匯出（逗號分隔，選填）

**HTTP Response Headers：**
```
# JSON 匯出
Content-Type: application/json; charset=utf-8
Content-Disposition: attachment; filename="nobodyclimb-crags-2026-02-11.json"

# CSV 匯出
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="nobodyclimb-routes-2026-02-11.csv"
```

> CSV 檔案開頭加入 UTF-8 BOM (`\uFEFF`)，確保 Excel 開啟不亂碼。

**匯出 JSON 格式 - 完整層級：**
```json
{
  "version": "1.0",
  "exported_at": "2026-02-11T12:00:00Z",
  "crags": [
    {
      "name": "龍洞",
      "slug": "longdong",
      "description": "...",
      "location": "新北市貢寮區",
      "region": "north",
      "latitude": 25.1085,
      "longitude": 121.9215,
      "altitude": 30,
      "rock_type": "四稜砂岩",
      "climbing_types": ["sport", "trad"],
      "difficulty_range": "5.3-5.14a",
      "cover_image": "...",
      "images": [],
      "is_featured": 1,
      "access_info": "5-30分鐘步行",
      "parking_info": "龍洞灣公園停車場",
      "approach_time": 15,
      "best_seasons": ["春", "秋", "冬"],
      "restrictions": null,
      "height_min": 5,
      "height_max": 100,
      "metadata_source": null,
      "metadata_source_url": null,
      "metadata_maintainer": null,
      "metadata_maintainer_url": null,
      "live_video_id": "8-xSAfWwh10",
      "live_video_title": "龍洞即時影像",
      "live_video_description": "...",
      "transportation": "[{\"type\":\"開車\",\"description\":\"...\"}]",
      "amenities": "[\"停車場\",\"廁所\",\"海灘\"]",
      "google_maps_url": "https://maps.app.goo.gl/...",
      "_readonly": {
        "rating_avg": 4.8,
        "review_count": 12,
        "route_count": 616,
        "bolt_count": 1669
      },
      "areas": [
        {
          "name": "校門口",
          "name_en": "School Gate",
          "slug": "school-gate",
          "description": "校門口攀登區域",
          "description_en": "School Gate climbing area",
          "image": null,
          "sort_order": 0,
          "_readonly": {
            "bolt_count": 197,
            "route_count": 51
          },
          "sectors": [
            {
              "name": "人面岩",
              "name_en": "Disco",
              "sort_order": 0,
              "routes": [
                {
                  "name": "乘乘女",
                  "grade": "5.7",
                  "grade_system": "yds",
                  "height": 12,
                  "bolt_count": 5,
                  "route_type": "sport",
                  "description": "...",
                  "first_ascent": "...",
                  "_readonly": {
                    "ascent_count": 3,
                    "story_count": 1,
                    "community_rating_avg": 4.2,
                    "community_rating_count": 5
                  }
                }
              ]
            }
          ],
          "routes": []
        }
      ],
      "routes": []
    }
  ]
}
```

> `_readonly` 區塊：匯出時包含供參考，匯入時自動忽略。這樣匯出的檔案可以直接回匯入，不會因為社群資料被覆蓋。

**匯出 CSV 格式（路線扁平化）：**
```csv
crag_name,crag_slug,area_name,sector_name,route_name,grade,grade_system,height,bolt_count,route_type,description,first_ascent
龍洞,longdong,校門口,人面岩,乘乘女,5.7,yds,12,5,sport,...,...
龍洞,longdong,校門口,門簷,入門,5.5,yds,10,4,sport,...,...
龍洞,longdong,鐘塔,,鐘塔直上,5.10a,yds,20,8,sport,...,...
```

> `sector_name` 為空表示此路線直接掛在 Area 下（area_id 有值，sector_id 為 NULL）。
> `area_name` 也為空表示路線直接掛在 Crag 下。

**檔案位置：**
- `backend/src/routes/admin-crags.ts` - 新增匯出端點

#### 1.2 Frontend - 匯出 UI

**新增元件：**
- `CragExportButton.tsx` - 匯出按鈕元件（含 Popover 格式選擇）

**匯出流程：**
1. 管理者在岩場列表頁點擊「匯出」按鈕
2. Popover 彈出格式選項：JSON（完整層級）/ CSV（路線清單）
3. 可選範圍：全部 / 目前選取的岩場
4. 點擊下載

**檔案下載實作方式（Blob API）：**
```typescript
const handleDownload = async (format: 'json' | 'csv') => {
  const response = await apiClient.get('/admin/crags/export', {
    params: { format },
    responseType: 'blob',
  })
  const blob = new Blob([response.data], {
    type: format === 'json' ? 'application/json' : 'text/csv',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nobodyclimb-crags-${new Date().toISOString().slice(0, 10)}.${format}`
  a.click()
  URL.revokeObjectURL(url)
}
```

**UI 位置 - 在 AdminCragManagement.tsx 工具列：**
```
現有：[+ 新增岩場] [⟳]
改為：[↓ 匯出] [↑ 匯入] │ [+ 新增岩場] [⟳]
```

按鈕使用次要樣式（`bg-wb-10 text-wb-70`），與主要的「新增岩場」按鈕區分。

**State Management：** 沿用現有模式（useState + useCallback + apiClient），不引入 TanStack Query。

---

### Phase 2：匯入功能增強（Import Enhancement）

#### 2.1 Backend - 完整層級匯入

**新增端點：**

| 端點 | 說明 |
|------|------|
| `POST /admin/crags/import` | 完整層級匯入（含驗證模式） |

> 原規劃有獨立的 `/import/validate` 端點，改為用 `dryRun: true` 參數合併。
> 減少一個端點的維護成本，驗證邏輯不會分散在兩處。

**路由順序：** `POST /admin/crags/import` 必須在 `POST /admin/crags/:id/...` 之前。

**匯入選項：**
- `mode`: `create`（僅建立新的）、`upsert`（建立或更新）
- `dryRun`: `true` 時只驗證不實際寫入（取代獨立 validate 端點）
- `skipExisting`: 向下相容舊有 batch-import 參數（等同 `mode: create`）

> 移除 `replace`（刪除後重建）模式。原因：
> 1. DB 缺少 CASCADE（areas、sectors 沒有 ON DELETE CASCADE）
> 2. 會意外刪除社群資料（ascent_count、story_count 等）
> 3. 風險太高，管理者很難確認影響範圍
> 若真的需要 replace，應先用 Admin UI 手動刪除再匯入。

**Conflict Resolution 策略：**

| 層級 | Conflict Key | Upsert 行為 |
|------|-------------|-------------|
| Crag | `slug` (UNIQUE) | 更新所有非 readonly 欄位 |
| Area | `crag_id + name` | 更新 name_en、description 等 |
| Sector | `area_id + name` | 更新 name_en |
| Route | `crag_id + area_id + sector_id + name` | 更新 grade、height 等 |

> 用「名稱」作為 conflict key（而非 id），因為匯出的 JSON 可能被人工編輯過，
> id 可能不存在或已改變。這樣也允許從外部來源（如 Excel）匯入。

**完整層級匯入邏輯：**
```
1. 解析 JSON 資料（接受與匯出相同的格式）
2. 驗證資料格式和必填欄位（name、slug）
3. 自動忽略 _readonly 區塊
4. 針對每個 crag：
   a. INSERT OR UPDATE crag（by slug）
   b. 針對每個 area：
      - INSERT OR UPDATE area（by crag_id + name）
      - sort_order 按陣列順序自動設定
      c. 針對每個 sector：
         - INSERT OR UPDATE sector（by area_id + name）
         d. 針對每個 route：
            - INSERT OR UPDATE route（by name + 位置）
5. 重新計算 route_count / bolt_count（crag 和 area 層級）
6. 回傳匯入結果統計
```

**D1 Batch 限制處理：**

D1 `batch()` 單次最多 100 statements。大量匯入（如龍洞 616 條路線）需要分批：

```typescript
const BATCH_SIZE = 80 // 保守值，預留給 count 更新等操作

async function executeBatched(db: D1Database, stmts: D1PreparedStatement[]) {
  for (let i = 0; i < stmts.length; i += BATCH_SIZE) {
    const batch = stmts.slice(i, i + BATCH_SIZE)
    await db.batch(batch)
  }
}
```

> 注意：分批後無法保證整體原子性。如果中途失敗，已執行的批次不會回滾。
> 匯入結果需要記錄每批的成功/失敗狀態。

**驗證（dryRun）回應格式：**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "dryRun": true,
    "summary": {
      "crags": { "new": 2, "existing": 1, "total": 3 },
      "areas": { "new": 5, "existing": 3, "total": 8 },
      "sectors": { "new": 8, "existing": 2, "total": 10 },
      "routes": { "new": 45, "existing": 10, "total": 55 }
    },
    "warnings": [
      "Crag 'longdong' already exists, will be updated (mode: upsert)",
      "Route '黃乃輝' in sector '人面岩' already exists, will be updated"
    ],
    "errors": []
  }
}
```

**實際匯入回應格式：**
```json
{
  "success": true,
  "data": {
    "dryRun": false,
    "summary": {
      "crags": { "created": 2, "updated": 1, "skipped": 0, "failed": 0 },
      "areas": { "created": 5, "updated": 3, "skipped": 0, "failed": 0 },
      "sectors": { "created": 8, "updated": 2, "skipped": 0, "failed": 0 },
      "routes": { "created": 45, "updated": 10, "skipped": 0, "failed": 0 }
    },
    "errors": []
  }
}
```

#### 2.2 Frontend - 匯入 UI 增強

**新增元件：**
- `CragImportDialog.tsx` - 匯入對話框（含步驟引導與預覽）

> 原規劃有獨立 `ImportPreview.tsx`，但預覽邏輯不複雜，
> 合併到 CragImportDialog 內以減少檔案數。

**匯入流程（三步驟）：**
```
Step 1: 上傳檔案
  - 支援 JSON 拖拽上傳
  - 顯示檔案資訊（大小、資料筆數）
  - 前端預解析 JSON 確認格式正確
  - 檔案大小限制：10MB

Step 2: 預覽與確認
  - 呼叫 API（dryRun: true）取得驗證結果
  - 顯示即將匯入的資料摘要（新增/更新/跳過數量）
  - 顯示警告和錯誤
  - 選擇匯入模式（create / upsert）

Step 3: 執行匯入
  - 呼叫 API（dryRun: false）
  - 顯示 loading 狀態
  - 匯入完成後顯示結果統計
  - 按「完成」後 setRefreshTrigger(prev => prev + 1) 重新載入列表
```

---

### Phase 3：CSV 格式支援

#### 3.1 CSV 匯出格式定義

**路線 CSV（主要用途）：**
```csv
crag_slug,crag_name,area_name,sector_name,route_name,grade,grade_system,height,bolt_count,route_type,description,first_ascent
longdong,龍洞,校門口,人面岩,乘乘女,5.7,yds,12,5,sport,...,...
longdong,龍洞,鐘塔,,鐘塔直上,5.10a,yds,20,8,sport,...,...
```

> 岩場級 CSV 匯出意義不大（欄位太多、JSON 陣列難以用 CSV 表達）。
> CSV 主要用於路線清單的匯出，方便在 Excel/Google Sheets 中查看和編輯。

#### 3.2 CSV 匯入

CSV 匯入在**後端**進行解析（不在前端）：

```typescript
// POST /admin/crags/import
// Content-Type: multipart/form-data 或 application/json

// 前端偵測副檔名，若為 .csv 則用 FormData 上傳
// 後端解析 CSV → JSON → 走原有匯入邏輯
```

> 原規劃用 PapaParse 在前端解析。改為後端解析的原因：
> 1. CSV 特殊字元處理更可靠（逗號、換行、引號）
> 2. 不增加前端 bundle size
> 3. 驗證邏輯集中在後端

**CSV → JSON 轉換邏輯（後端）：**
```
1. 按 crag_slug group by → crags 陣列
2. 每個 crag 內按 area_name group by → areas 陣列
3. 每個 area 內按 sector_name group by → sectors 陣列
4. 空的 area_name → 路線掛在 crag 下（routes 陣列）
5. 空的 sector_name → 路線掛在 area 下（area.routes 陣列）
```

---

## 實作步驟（依序）

### Step 1：Backend 匯出端點
- [ ] 在 `admin-crags.ts` 新增 `GET /admin/crags/export`（路由須在 `/:id` 之前）
- [ ] 新增 `GET /admin/crags/:id/export`（完整層級 JSON 匯出）
- [ ] 加入 `format=csv` 參數支援路線 CSV 匯出
- [ ] 設定正確的 Content-Type 和 Content-Disposition header
- [ ] CSV 檔案加入 UTF-8 BOM

### Step 2：Frontend 匯出 UI
- [ ] 新增 `CragExportButton.tsx`（Popover + 格式選擇 + Blob 下載）
- [ ] 整合到 `AdminCragManagement.tsx` 工具列（次要按鈕樣式）
- [ ] 在 `services.ts` 新增 `adminCragService.exportCrags()` 方法

### Step 3：Backend 匯入增強
- [ ] 新增 `POST /admin/crags/import`（完整層級匯入 + dryRun 模式）
- [ ] 實作 conflict resolution（by slug/name）
- [ ] D1 batch 分批處理（每批 80 statements）
- [ ] 匯入後自動重算 route_count / bolt_count
- [ ] 向下相容現有 `batch-import` 端點（不改動）

### Step 4：Frontend 匯入 UI
- [ ] 新增 `CragImportDialog.tsx`（三步驟：上傳 → 預覽 → 執行）
- [ ] 在 `services.ts` 新增 `adminCragService.importCrags()` 方法
- [ ] 整合到 `AdminCragManagement.tsx` 工具列

### Step 5：CSV 匯入支援（後端）
- [ ] 後端 CSV 解析邏輯（CSV → JSON 層級還原）
- [ ] `POST /admin/crags/import` 支援 `Content-Type: multipart/form-data`
- [ ] 前端 CragImportDialog 支援 .csv 檔案上傳

---

## 檔案異動清單

### 新增檔案
| 檔案 | 說明 |
|------|------|
| `apps/web/src/components/admin/crag/CragExportButton.tsx` | 匯出按鈕元件 |
| `apps/web/src/components/admin/crag/CragImportDialog.tsx` | 匯入對話框元件（含預覽） |

### 修改檔案
| 檔案 | 異動說明 |
|------|----------|
| `backend/src/routes/admin-crags.ts` | 新增匯出端點 + 完整匯入端點 |
| `apps/web/src/lib/api/services.ts` | 新增 exportCrags / importCrags 方法 |
| `apps/web/src/components/admin/AdminCragManagement.tsx` | 整合匯入匯出按鈕到工具列 |

---

## 安全與效能考量

### 安全性
1. **權限控制**：所有端點需 `authMiddleware` + `adminMiddleware`（已有）
2. **檔案大小限制**：匯入限制 10MB（在 code 層面檢查，Cloudflare Workers 預設 100MB）
3. **資料驗證**：Zod schema 驗證所有必填欄位和格式
4. **社群資料保護**：匯入時自動忽略 `_readonly` 區塊（rating、ascent_count 等）
5. **XSS 防護**：匯入文字欄位不進行 HTML sanitize（DB 儲存原始值，前端渲染時由 React 自動 escape）

### 效能
1. **D1 Batch 限制**：單次最多 100 statements，分批處理（每批 80）
2. **大量匯出**：全部岩場匯出可能很大，但目前只有 5 個岩場，短期內不是問題
3. **非原子性匯入**：分批後無法保證整體原子性，需在回應中明確告知每批結果

### 邊界案例處理
1. **Slug 衝突**：匯入時 slug 已存在 → create 模式跳過、upsert 模式更新
2. **空岩場**：0 routes 的岩場正常匯出空陣列
3. **重複名稱**：不同 Area 下可能有同名 Sector → 用 `area_id + name` 組合鍵區分
4. **CSV 中文**：加 UTF-8 BOM 確保 Excel 正確開啟
5. **匯入中途失敗**：回應中包含已完成批次數和失敗批次的錯誤訊息
