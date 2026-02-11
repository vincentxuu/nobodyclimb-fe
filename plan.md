# Admin Crag 匯入匯出功能規劃

## 現況分析

### 已有功能
- ✅ Crag 批次匯入 (`POST /admin/crags/batch-import`) - 支援 JSON，有 skipExisting 選項
- ✅ Route 批次匯入 (`POST /admin/crags/:cragId/routes/batch-import`)
- ✅ 前端 Admin UI - 樹狀層級編輯器
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
  │   └── Route（區域級路線）
  └── Route（岩場級路線）
```

---

## 實作規劃

### Phase 1：匯出功能（Export）

#### 1.1 Backend - 匯出 API 端點

**新增端點：**

| 端點 | 說明 |
|------|------|
| `GET /admin/crags/export` | 匯出所有岩場（支援篩選） |
| `GET /admin/crags/:id/export` | 匯出單一岩場完整資料（含 areas/sectors/routes） |
| `GET /admin/crags/:cragId/routes/export` | 匯出特定岩場的路線 |

**查詢參數：**
- `format`: `json`（預設）或 `csv`
- `include`: `all`（預設）、`crags-only`、`routes-only`
- `region`: 篩選特定區域（選填）

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
      "latitude": 25.1,
      "longitude": 121.9,
      "altitude": 30,
      "rock_type": "砂岩",
      "climbing_types": ["sport", "trad"],
      "difficulty_range": "5.5-5.14",
      "cover_image": "...",
      "images": [],
      "is_featured": 1,
      "access_info": "...",
      "parking_info": "...",
      "approach_time": 10,
      "best_seasons": ["spring", "fall"],
      "restrictions": "...",
      "areas": [
        {
          "name": "校門口",
          "name_en": "Gate",
          "description": "...",
          "sort_order": 0,
          "sectors": [
            {
              "name": "人面岩",
              "name_en": "Face Rock",
              "sort_order": 0,
              "routes": [
                {
                  "name": "黃乃輝",
                  "grade": "5.8",
                  "grade_system": "yds",
                  "height": 15,
                  "bolt_count": 6,
                  "route_type": "sport",
                  "description": "...",
                  "first_ascent": "..."
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

**匯出 CSV 格式：**
- 岩場 CSV：扁平化欄位，JSON 陣列欄位轉為逗號分隔字串
- 路線 CSV：包含 `crag_name`、`area_name`、`sector_name` 欄位供辨識層級

**檔案位置：**
- `backend/src/routes/admin-crags.ts` - 新增匯出端點

#### 1.2 Frontend - 匯出 UI

**新增元件：**
- `CragExportButton.tsx` - 匯出按鈕元件（含格式選擇下拉）

**匯出流程：**
1. 管理者在岩場列表頁點擊「匯出」按鈕
2. 選擇匯出範圍：全部 / 單一岩場
3. 選擇格式：JSON / CSV
4. 選擇包含內容：僅岩場 / 含路線 / 完整（含 areas/sectors/routes）
5. 觸發下載

**UI 位置：**
- 全域匯出按鈕：放在 `AdminCragManagement.tsx` 頂部工具列
- 單一岩場匯出：在樹狀選單的岩場節點右鍵選單或操作按鈕中

---

### Phase 2：匯入功能增強（Import Enhancement）

#### 2.1 Backend - 完整層級匯入

**新增/修改端點：**

| 端點 | 說明 |
|------|------|
| `POST /admin/crags/import` | 完整層級匯入（取代現有 batch-import） |
| `POST /admin/crags/import/validate` | 匯入前驗證（不寫入資料庫） |

**完整層級匯入邏輯：**
```
1. 解析 JSON 資料
2. 驗證資料格式和必填欄位
3. 針對每個 crag：
   a. 建立/更新 crag
   b. 建立/更新 areas（含 sort_order）
   c. 建立/更新 sectors（含 sort_order）
   d. 建立/更新 routes（關聯到正確的 area/sector）
4. 重新計算 route_count / bolt_count
5. 回傳匯入結果統計
```

**匯入選項：**
- `mode`: `create`（僅建立新的）、`upsert`（建立或更新）、`replace`（刪除後重建）
- `skipExisting`: 向下相容舊有 batch-import 參數
- `dryRun`: 只驗證不實際寫入

**驗證端點回應：**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "summary": {
      "crags": { "new": 2, "existing": 1, "total": 3 },
      "areas": { "new": 5, "existing": 0, "total": 5 },
      "sectors": { "new": 8, "existing": 0, "total": 8 },
      "routes": { "new": 45, "existing": 10, "total": 55 }
    },
    "warnings": [
      "Crag 'longdong' already exists, will be skipped (mode: create)"
    ],
    "errors": []
  }
}
```

#### 2.2 Frontend - 匯入 UI 增強

**新增元件：**
- `CragImportDialog.tsx` - 匯入對話框（含步驟引導）
- `ImportPreview.tsx` - 匯入預覽元件（顯示驗證結果）

**匯入流程（改善版）：**
```
Step 1: 上傳檔案
  - 支援 JSON 檔案拖拽上傳
  - 支援 CSV 檔案上傳（自動轉換為 JSON）
  - 顯示檔案資訊（大小、資料筆數）

Step 2: 預覽與驗證
  - 呼叫 validate 端點
  - 顯示即將匯入的資料摘要（新增/更新/跳過數量）
  - 顯示警告和錯誤
  - 選擇匯入模式（create / upsert / replace）

Step 3: 執行匯入
  - 顯示進度
  - 匯入完成後顯示結果統計
  - 自動重新載入岩場列表
```

**UI 位置：**
- 匯入按鈕：放在 `AdminCragManagement.tsx` 頂部工具列（與匯出按鈕並列）

---

### Phase 3：CSV 格式支援

#### 3.1 CSV 匯出格式定義

**岩場 CSV（crags.csv）：**
```csv
name,slug,description,location,region,latitude,longitude,altitude,rock_type,climbing_types,difficulty_range,is_featured,access_info,parking_info,approach_time,best_seasons,restrictions
龍洞,longdong,北台灣最大天然攀岩場,新北市貢寮區,north,25.1,121.9,30,砂岩,"sport,trad",5.5-5.14,1,...,...,10,"spring,fall",...
```

**路線 CSV（routes.csv）：**
```csv
crag_slug,area_name,sector_name,name,grade,grade_system,height,bolt_count,route_type,description,first_ascent
longdong,校門口,人面岩,黃乃輝,5.8,yds,15,6,sport,...,...
longdong,鐘塔,,鐘塔直上,5.10a,yds,20,8,sport,...,...
```

#### 3.2 CSV 匯入轉換
- 前端解析 CSV 為 JSON（使用 PapaParse 或手動解析）
- 將扁平 CSV 還原為層級結構再送出

---

## 實作步驟（依序）

### Step 1：Backend 匯出端點
- [ ] `GET /admin/crags/export` - 全部岩場匯出（JSON）
- [ ] `GET /admin/crags/:id/export` - 單一岩場完整匯出（JSON，含 areas/sectors/routes）
- [ ] `GET /admin/crags/:cragId/routes/export` - 路線匯出（JSON）
- [ ] CSV 格式支援（在以上端點加入 `format=csv` 參數）

### Step 2：Frontend 匯出 UI
- [ ] `CragExportButton.tsx` 元件（格式選擇 + 範圍選擇）
- [ ] 整合到 `AdminCragManagement.tsx` 工具列
- [ ] 檔案下載觸發邏輯

### Step 3：Backend 匯入增強
- [ ] `POST /admin/crags/import/validate` - 驗證端點
- [ ] `POST /admin/crags/import` - 完整層級匯入端點（支援 upsert 模式）
- [ ] 向下相容現有 `batch-import` 端點

### Step 4：Frontend 匯入 UI 增強
- [ ] `CragImportDialog.tsx` - 步驟式匯入對話框
- [ ] `ImportPreview.tsx` - 預覽與驗證結果顯示
- [ ] CSV 檔案解析與轉換
- [ ] 整合到 `AdminCragManagement.tsx`

---

## 檔案異動清單

### 新增檔案
| 檔案 | 說明 |
|------|------|
| `apps/web/src/components/admin/crag/CragExportButton.tsx` | 匯出按鈕元件 |
| `apps/web/src/components/admin/crag/CragImportDialog.tsx` | 匯入對話框元件 |
| `apps/web/src/components/admin/crag/ImportPreview.tsx` | 匯入預覽元件 |

### 修改檔案
| 檔案 | 異動說明 |
|------|----------|
| `backend/src/routes/admin-crags.ts` | 新增匯出端點、新增完整匯入端點 |
| `apps/web/src/lib/api/services.ts` | 新增匯出/匯入 API 呼叫方法 |
| `apps/web/src/components/admin/AdminCragManagement.tsx` | 整合匯入匯出按鈕到工具列 |

---

## 安全考量

1. **檔案大小限制**：匯入檔案限制最大 10MB
2. **資料驗證**：匯入前嚴格驗證所有欄位格式和必填
3. **權限控制**：所有匯入匯出端點需要 admin 權限
4. **速率限制**：匯入端點加入速率限制，避免濫用
5. **交易安全**：完整層級匯入使用 D1 batch 確保原子性
