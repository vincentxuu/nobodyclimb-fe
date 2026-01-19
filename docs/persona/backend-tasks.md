# 人物誌後端任務清單

> 建立日期：2026-01-18
> 更新日期：2026-01-18
> 關聯文件：`persona-content-redesign.md`, `persona-creation-ux-improvement.md`, `persona-page-layout.md`

---

## 實作狀態總覽

| 類別 | 已完成 | 待完成 | 完成率 |
|-----|--------|--------|--------|
| 資料庫遷移 | 1 | 2 | 33% |
| 系統預設資料 | 0 | 3 | 0% |
| API 端點更新 | 4 | 4 | 50% |
| 用戶自訂內容 API | 0 | 6 | 0% |
| 統計與分析 | 1 | 3 | 25% |
| 進階功能 | 0 | 4 | 0% |

**整體完成率：約 30%**

---

## ✅ 已完成項目

### 資料庫遷移 (部分完成)

| 編號 | 任務 | 檔案 | 狀態 |
|-----|------|------|------|
| BE-001 | 新增 V2 JSON 欄位遷移 | `backend/migrations/0023_add_biography_v2_fields.sql` | ✅ 完成 |

**已新增欄位**：
- `visibility` TEXT (private/anonymous/community/public)
- `tags_data` TEXT (JSON)
- `one_liners_data` TEXT (JSON)
- `stories_data` TEXT (JSON)
- `basic_info_data` TEXT (JSON)
- `autosave_at` TEXT

### API 端點 (部分完成)

| 編號 | 任務 | 檔案 | 狀態 |
|-----|------|------|------|
| BE-002 | Biography 型別定義 (V2_FIELDS) | `backend/src/routes/biographies.ts` | ✅ 完成 |
| BE-003 | Biography PUT API (支援 V2 欄位) | `backend/src/routes/biographies.ts` | ✅ 完成 |
| BE-004 | Autosave API (支援 V2 欄位 + Rate limiting) | `backend/src/routes/biographies.ts` | ✅ 完成 |
| BE-005 | Visibility 過濾邏輯 (基本) | `backend/src/routes/biographies.ts` | ✅ 完成 |

**已實作 API**：
- `PUT /biographies/me` - 支援 tags_data, one_liners_data, stories_data, basic_info_data
- `PUT /biographies/me/autosave` - 支援 V2 欄位，2 秒 rate limiting
- `GET /biographies` - 基本 visibility 過濾 (public/is_public)

### 統計功能 (部分完成)

| 編號 | 任務 | 檔案 | 狀態 |
|-----|------|------|------|
| BE-006 | 社群統計 API (基本) | `backend/src/routes/biographies.ts` | ✅ 完成 |

**已實作**：
- `GET /biographies/community/stats` - 基本社群統計

---

## 🔲 待完成項目

### Phase 1: 資料庫遷移 (P0)

#### BE-P1-001: 新增系統預設標籤表
- **檔案**: `backend/migrations/0024_system_presets.sql` (新增)
- **優先級**: P0
- **說明**: 建立系統預設標籤維度與選項的資料表
- **驗收標準**:
  - [ ] `system_tag_dimensions` 表
  - [ ] `system_tag_options` 表
  - [ ] `system_oneliner_questions` 表
  - [ ] `system_story_categories` 表
  - [ ] `system_story_questions` 表

**SQL 範例**:
```sql
-- 系統預設標籤維度
CREATE TABLE IF NOT EXISTS system_tag_dimensions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  icon TEXT NOT NULL,
  description TEXT,
  selection_mode TEXT NOT NULL DEFAULT 'multiple',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 系統預設標籤選項
CREATE TABLE IF NOT EXISTS system_tag_options (
  id TEXT PRIMARY KEY,
  dimension_id TEXT NOT NULL REFERENCES system_tag_dimensions(id),
  label TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_dynamic INTEGER NOT NULL DEFAULT 0,
  template TEXT,
  source_field TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 其他表... (見原始設計)
```

#### BE-P1-002: 新增用戶自訂內容表
- **檔案**: `backend/migrations/0025_user_custom_content.sql` (新增)
- **優先級**: P1
- **說明**: 建立用戶自訂標籤、問題的資料表
- **驗收標準**:
  - [ ] `user_custom_tag_dimensions` 表
  - [ ] `user_custom_tag_options` 表
  - [ ] `user_custom_oneliner_questions` 表
  - [ ] `user_custom_story_categories` 表
  - [ ] `user_custom_story_questions` 表

---

### Phase 2: 系統預設資料 (P0)

#### BE-P2-001: 建立系統預設標籤種子資料
- **檔案**: `backend/scripts/seed-system-tags.ts` (新增)
- **優先級**: P0
- **說明**: 插入 11 個標籤維度與 70+ 選項的種子資料
- **驗收標準**:
  - [ ] 風格邪教維度 (7 選項)
  - [ ] 傷痛勳章維度 (14 選項)
  - [ ] 鞋子門派維度 (7 選項)
  - [ ] 時間型態維度 (6 選項)
  - [ ] 生活方式維度 (6 選項)
  - [ ] 爬牆 BGM 維度 (7 選項)
  - [ ] 面對失敗維度 (6 選項)
  - [ ] 社交類型維度 (6 選項)
  - [ ] 抹粉習慣維度 (5 選項)
  - [ ] 訓練取向維度 (7 選項)
  - [ ] 在地認同維度 (5 選項 + 動態標籤)

> **備註**：前端已有完整常量定義在 `src/lib/constants/biography-tags.ts`，可作為種子資料來源

#### BE-P2-002: 建立系統預設問題種子資料
- **檔案**: `backend/scripts/seed-system-questions.ts` (新增)
- **優先級**: P0
- **說明**: 插入一句話問題與故事問題的種子資料
- **驗收標準**:
  - [ ] 10 個一句話問題
  - [ ] 6 個故事分類
  - [ ] 31 個故事問題

> **備註**：前端已有完整常量定義在 `src/lib/constants/biography-questions.ts`，可作為種子資料來源

#### BE-P2-003: 建立種子資料執行腳本
- **檔案**: `backend/scripts/seed-all.ts` (新增)
- **優先級**: P0
- **說明**: 統一執行所有種子資料的腳本
- **驗收標準**:
  - [ ] `pnpm seed:system-data` 命令
  - [ ] 冪等執行（重複執行不會重複插入）
  - [ ] 支援 --env 參數

---

### Phase 3: API 端點更新 (P0)

#### BE-P3-001: 新增系統預設資料 API
- **檔案**: `backend/src/routes/system-presets.ts` (新增)
- **優先級**: P0
- **說明**: 提供系統預設標籤、問題的 API
- **驗收標準**:
  - [ ] `GET /api/v1/system-presets/tags` - 取得所有標籤維度與選項
  - [ ] `GET /api/v1/system-presets/oneliners` - 取得所有一句話問題
  - [ ] `GET /api/v1/system-presets/stories` - 取得所有故事分類與問題
  - [ ] 支援 KV 快取

> **替代方案**：由於前端已有完整常量，此 API 可考慮暫緩，直接使用前端常量

#### BE-P3-002: 更新 Biography GET API (回傳 V2 結構)
- **檔案**: `backend/src/routes/biographies.ts`
- **優先級**: P0
- **說明**: 更新取得人物誌 API，確保正確回傳 V2 欄位
- **驗收標準**:
  - [ ] `GET /biographies/:id` 回傳包含 tags_data, one_liners_data, stories_data
  - [ ] `GET /biographies/me` 回傳包含 V2 欄位
  - [ ] `GET /biographies/slug/:slug` 回傳包含 V2 欄位

#### BE-P3-003: 完善 Visibility 過濾邏輯
- **檔案**: `backend/src/routes/biographies.ts`
- **優先級**: P0
- **說明**: 完整實作四種 visibility 的過濾邏輯
- **驗收標準**:
  - [ ] `public`: 所有人可見
  - [ ] `community`: 登入用戶可見
  - [ ] `private`: 僅本人可見
  - [ ] `anonymous`: 隱藏名稱和頭像，內容可見
  - [ ] 列表 API 正確過濾 private 人物誌

#### BE-P3-004: 新增 Biography Search by Tags API
- **檔案**: `backend/src/routes/biographies.ts`
- **優先級**: P1
- **說明**: 根據標籤搜尋人物誌
- **驗收標準**:
  - [ ] `GET /biographies/search/tags?dimension=xxx&option=yyy`
  - [ ] 支援多標籤 AND/OR 搜尋
  - [ ] 分頁支援

---

### Phase 4: 用戶自訂內容 API (P1)

> 此階段需先完成 BE-P1-002 資料庫遷移

#### BE-P4-001: 用戶自訂標籤維度 CRUD
- **檔案**: `backend/src/routes/user-custom-content.ts` (新增)
- **優先級**: P1
- **說明**: 用戶自訂標籤維度的 CRUD API
- **驗收標準**:
  - [ ] `GET /user-content/tag-dimensions`
  - [ ] `POST /user-content/tag-dimensions`
  - [ ] `PUT /user-content/tag-dimensions/:id`
  - [ ] `DELETE /user-content/tag-dimensions/:id`

#### BE-P4-002: 用戶自訂標籤選項 CRUD
- **檔案**: `backend/src/routes/user-custom-content.ts`
- **優先級**: P1
- **說明**: 用戶自訂標籤選項的 CRUD API
- **驗收標準**:
  - [ ] `GET /user-content/tag-options`
  - [ ] `POST /user-content/tag-options`
  - [ ] `PUT /user-content/tag-options/:id`
  - [ ] `DELETE /user-content/tag-options/:id`

#### BE-P4-003: 用戶自訂一句話問題 CRUD
- **檔案**: `backend/src/routes/user-custom-content.ts`
- **優先級**: P1
- **說明**: 用戶自訂一句話問題的 CRUD API
- **驗收標準**:
  - [ ] `GET /user-content/oneliner-questions`
  - [ ] `POST /user-content/oneliner-questions`
  - [ ] `PUT /user-content/oneliner-questions/:id`
  - [ ] `DELETE /user-content/oneliner-questions/:id`

#### BE-P4-004: 用戶自訂故事分類 CRUD
- **檔案**: `backend/src/routes/user-custom-content.ts`
- **優先級**: P1
- **說明**: 用戶自訂故事分類的 CRUD API
- **驗收標準**:
  - [ ] `GET /user-content/story-categories`
  - [ ] `POST /user-content/story-categories`
  - [ ] `PUT /user-content/story-categories/:id`
  - [ ] `DELETE /user-content/story-categories/:id`

#### BE-P4-005: 用戶自訂故事問題 CRUD
- **檔案**: `backend/src/routes/user-custom-content.ts`
- **優先級**: P1
- **說明**: 用戶自訂故事問題的 CRUD API
- **驗收標準**:
  - [ ] `GET /user-content/story-questions`
  - [ ] `POST /user-content/story-questions`
  - [ ] `PUT /user-content/story-questions/:id`
  - [ ] `DELETE /user-content/story-questions/:id`

#### BE-P4-006: 整合用戶自訂內容到 Biography API
- **檔案**: `backend/src/routes/biographies.ts`
- **優先級**: P1
- **說明**: 在取得人物誌時合併用戶自訂內容
- **驗收標準**:
  - [ ] GET API 回傳合併後的標籤維度與選項
  - [ ] GET API 回傳合併後的問題列表
  - [ ] 用戶自訂內容標記 source: 'user'

---

### Phase 5: 統計與分析 (P2)

#### BE-P5-001: 擴充社群統計 API
- **檔案**: `backend/src/routes/biographies.ts`
- **優先級**: P2
- **說明**: 擴充正常化訊息所需的社群統計
- **驗收標準**:
  - [ ] 攀岩年資分布統計
  - [ ] 最多人寫的故事類型
  - [ ] 最受歡迎的故事主題

#### BE-P5-002: 標籤使用統計 API
- **檔案**: `backend/src/routes/analytics.ts` (新增)
- **優先級**: P2
- **說明**: 標籤使用頻率統計
- **驗收標準**:
  - [ ] `GET /analytics/tags/popular` - 熱門標籤
  - [ ] `GET /analytics/tags/dimension/:id` - 特定維度的選項分布
  - [ ] 支援 KV 快取

#### BE-P5-003: 用戶旅程階段追蹤
- **檔案**: `backend/src/routes/user-journey.ts` (新增)
- **優先級**: P2
- **說明**: 追蹤用戶在人物誌填寫的階段
- **驗收標準**:
  - [ ] `GET /user-journey/stage` - 取得用戶目前階段
  - [ ] `PUT /user-journey/stage` - 更新用戶階段
  - [ ] 階段計算邏輯（觀眾 → 私密記錄 → 公開分享）

---

### Phase 6: 進階功能 (P2)

#### BE-P6-001: 熱門自訂內容推薦
- **檔案**: `backend/src/routes/recommendations.ts` (新增)
- **優先級**: P2
- **說明**: 基於用戶自訂內容的熱門推薦
- **驗收標準**:
  - [ ] `GET /recommendations/popular-custom-tags` - 熱門自訂標籤
  - [ ] `GET /recommendations/popular-custom-questions` - 熱門自訂問題

#### BE-P6-002: 相似人物誌推薦
- **檔案**: `backend/src/routes/recommendations.ts`
- **優先級**: P2
- **說明**: 基於標籤相似度推薦人物誌
- **驗收標準**:
  - [ ] `GET /recommendations/similar/:id` - 取得相似人物誌
  - [ ] 標籤 Jaccard 相似度計算

#### BE-P6-003: 曝光邀請觸發條件
- **檔案**: `backend/src/routes/notifications.ts`
- **優先級**: P2
- **說明**: 判斷是否應該向用戶發送曝光邀請
- **驗收標準**:
  - [ ] `GET /notifications/exposure-invite/should-show`
  - [ ] 條件：私密故事 >= 3 則、未曾邀請過

#### BE-P6-004: 正向回饋通知
- **檔案**: `backend/src/routes/notifications.ts`
- **優先級**: P2
- **說明**: 當用戶故事收到互動時發送通知
- **驗收標準**:
  - [ ] 故事被按讚時觸發
  - [ ] 故事被留言時觸發

---

## 現有 API 端點

### 已實作

| Method | Endpoint | 狀態 |
|--------|----------|------|
| GET | `/api/v1/biographies` | ✅ 基本 visibility 過濾 |
| GET | `/api/v1/biographies/:id` | ✅ 回傳 V2 欄位 |
| GET | `/api/v1/biographies/me` | ✅ 回傳 V2 欄位 |
| PUT | `/api/v1/biographies/me` | ✅ 支援 V2 欄位 |
| PUT | `/api/v1/biographies/me/autosave` | ✅ 支援 V2 欄位 + Rate limiting |
| GET | `/api/v1/biographies/community/stats` | ✅ 基本統計 |

### 待實作

| Method | Endpoint | 優先級 |
|--------|----------|--------|
| GET | `/api/v1/system-presets/tags` | P0 (可選) |
| GET | `/api/v1/system-presets/oneliners` | P0 (可選) |
| GET | `/api/v1/system-presets/stories` | P0 (可選) |
| GET | `/api/v1/biographies/search/tags` | P1 |
| * | `/api/v1/user-content/*` | P1 (20 個端點) |
| GET | `/api/v1/analytics/tags/popular` | P2 |
| * | `/api/v1/user-journey/*` | P2 |
| * | `/api/v1/recommendations/*` | P2 |

---

## 資料庫 Schema

### 現有表 (已更新)

```
biographies
├── ... (原有欄位)
├── visibility TEXT          ✅ 已新增
├── tags_data TEXT           ✅ 已新增
├── one_liners_data TEXT     ✅ 已新增
├── stories_data TEXT        ✅ 已新增
├── basic_info_data TEXT     ✅ 已新增
└── autosave_at TEXT         ✅ 已新增
```

### 待新增表

```
system_tag_dimensions        # 系統預設標籤維度 (P0)
system_tag_options           # 系統預設標籤選項 (P0)
system_oneliner_questions    # 系統預設一句話問題 (P0)
system_story_categories      # 系統預設故事分類 (P0)
system_story_questions       # 系統預設故事問題 (P0)

user_custom_tag_dimensions   # 用戶自訂標籤維度 (P1)
user_custom_tag_options      # 用戶自訂標籤選項 (P1)
user_custom_oneliner_questions  # 用戶自訂一句話問題 (P1)
user_custom_story_categories    # 用戶自訂故事分類 (P1)
user_custom_story_questions     # 用戶自訂故事問題 (P1)
```

---

## 待完成任務總計

| 優先級 | 任務數 | 說明 |
|-------|--------|------|
| P0 | 6 | 系統預設資料表、種子資料、基本 API |
| P1 | 8 | 用戶自訂內容 API、標籤搜尋 |
| P2 | 8 | 統計分析、推薦、進階功能 |

**總計：22 項待完成任務**

---

## 備註

1. **系統預設資料 API (BE-P3-001)** 為可選項目，因為前端已有完整的系統預設常量定義在：
   - `src/lib/constants/biography-tags.ts`
   - `src/lib/constants/biography-questions.ts`

   如果不需要動態管理系統預設（例如：從後台新增/修改預設標籤），可以暫時跳過此 API。

2. **用戶自訂內容功能 (Phase 4)** 需要與前端同步開發，建議優先完成前端 Modal 組件後再開發後端 API。

---

## 變更紀錄

| 日期 | 版本 | 變更內容 |
|-----|-----|---------|
| 2026-01-18 | v1.0 | 初版建立 |
| 2026-01-18 | v2.0 | 重新盤點已實作項目，更新任務狀態 |
