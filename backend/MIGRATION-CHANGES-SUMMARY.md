# 遷移腳本修改摘要

## 修改內容

已對 `migrations/0027_consolidated_schema_updates_FIXED.sql` 進行以下修改:

### 1. ✅ 保留 JSON 資料欄位 (PART 13)

**修改位置**: 行 626-627

**修改前**:

```sql
CREATE TABLE biographies_new (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  -- ... 其他欄位 ...
  -- ❌ 缺少 one_liners_data 和 stories_data
  youtube_channel_id TEXT,
  -- ...
);
```

**修改後**:

```sql
CREATE TABLE biographies_new (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  -- ... 其他欄位 ...
  -- ✅ 保留 JSON 資料欄位作為備份
  one_liners_data TEXT,
  stories_data TEXT,
  youtube_channel_id TEXT,
  -- ...
);
```

### 2. ✅ 更新資料複製邏輯 (PART 13)

**修改位置**: 行 645-667

在 `INSERT INTO biographies_new` 中加入 `one_liners_data` 和 `stories_data` 欄位的複製。

### 3. ✅ 恢復 One-liners 遷移邏輯 (PART 12)

**修改位置**: 行 555-575

**修改前**:

```sql
-- 🔧 FIX: 移除 one-liners 移轉邏輯
-- 因為 one_liners_data 只包含 core questions...
```

**修改後**:

```sql
-- Migrate one_liners_data to biography_one_liners (non-core questions)
INSERT INTO biography_one_liners (id, biography_id, question_id, answer, ...)
SELECT ...
FROM biographies b, json_each(b.one_liners_data) j
WHERE j.key NOT IN ('climbing_origin', 'climbing_meaning', 'advice_to_self')
  AND json_extract(j.value, '$.answer') IS NOT NULL
  ...
```

## 修改原因

### 問題 1: JSON 資料會被刪除

原始的 FIXED 版本在 PART 13 重建 `biographies` 表時,不包含 `one_liners_data` 和 `stories_data` 欄位,導致這些資料會永久遺失。

### 問題 2: One-liners 資料可能遺失

FIXED 版本移除了 non-core one-liners 的遷移邏輯,假設 `one_liners_data` 中只有 3 個 core questions。但如果實際資料中有其他 one-liner questions,這些資料將不會被遷移。

## 修改後的資料流

```
one_liners_data (JSON)
├─→ biography_core_stories (climbing_origin, climbing_meaning, advice_to_self)
├─→ biography_one_liners (其他 one-liner questions,如 best_moment, favorite_place 等)
└─→ one_liners_data (保留原始 JSON 作為備份) ✅

stories_data (JSON)
├─→ biography_stories (所有分類故事)
└─→ stories_data (保留原始 JSON 作為備份) ✅
```

## 驗證工具

已創建以下驗證工具:

### 1. `verify-json-migration.sql` (新檔案)

完整的遷移驗證腳本,包含 7 項檢查:

- JSON 資料保留檢查
- Core Stories 遷移驗證
- One-liners 遷移驗證
- Stories 遷移驗證
- 內容一致性抽樣
- 遺漏檢查
- 統計摘要

### 2. `JSON-MIGRATION-VERIFICATION.md` (新檔案)

詳細的驗證指南,包含:

- 驗證步驟說明
- 資料結構對照
- 回滾方案
- 問題排查

## 執行建議

### 在 Preview 環境測試

1. **執行遷移前計數**:

```bash
cd backend
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=test-migration-count.sql
```

2. **執行遷移**:

```bash
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=migrations/0027_consolidated_schema_updates_FIXED.sql
```

3. **執行驗證**:

```bash
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=verify-json-migration.sql
```

4. **檢查結果**:
   所有檢查應顯示 `✓ 完全一致` 或 `✓ 無 non-core one-liners`

### 在 Production 環境執行

**只有在 Preview 環境驗證成功後才執行**:

```bash
# 1. 先備份 (重要!)
pnpm wrangler d1 execute nobodyclimb-db --remote --command "SELECT * FROM biographies" > backup-before-migration.sql

# 2. 執行遷移
pnpm wrangler d1 execute nobodyclimb-db --remote --file=migrations/0027_consolidated_schema_updates_FIXED.sql

# 3. 驗證
pnpm wrangler d1 execute nobodyclimb-db --remote --file=verify-json-migration.sql
```

## 風險評估

### ✅ 低風險 (已解決)

- JSON 資料遺失 → **已解決**: 保留 JSON 欄位
- Non-core one-liners 遺失 → **已解決**: 恢復遷移邏輯

### ⚠️ 中等風險 (可控)

- 資料遷移邏輯錯誤 → **可控**: 保留 JSON 可重新遷移
- UUID 生成重複 → **極低機率**: SQLite randomblob 機制可靠

### 🛡️ 保護措施

1. JSON 資料保留 → 可隨時重新遷移
2. 完整的驗證腳本 → 確保資料完整性
3. 在 Preview 環境測試 → 發現問題後再處理
4. 備份建議 → Production 執行前先備份

## 後續清理 (可選)

當確認遷移成功且新的關聯式表格運作正常後 (建議 1-3 個月後),可以考慮移除 JSON 欄位以節省空間:

```sql
-- 警告: 只有在確認不需要 JSON 資料後才執行
ALTER TABLE biographies DROP COLUMN one_liners_data;
ALTER TABLE biographies DROP COLUMN stories_data;
```

但這不是必要的,保留 JSON 作為備份也是合理的選擇。
