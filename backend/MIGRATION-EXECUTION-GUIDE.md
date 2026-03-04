# Migration 0027 安全執行指南

## ⚠️ 重要提醒

**執行此 migration 前必須備份資料庫!** 此 migration 會重建 `users` 和 `biographies` 表,如果出現問題,沒有備份將無法恢復資料。

## 問題總結

### 已發現的問題

1. **One-liners 移轉邏輯錯誤** ✅ 已修復
   - 原始版本會嘗試移轉不存在的資料
   - 修復:移除不必要的 one-liners 移轉邏輯

2. **臨時表可能有舊資料** ✅ 已修復
   - 原始版本使用 `CREATE TABLE IF NOT EXISTS`
   - 修復:執行前先 `DROP TABLE IF EXISTS`

3. **user_id 可能消失**
   - 原因:users 表重建時資料複製可能失敗
   - 解決:修復後的版本有完整的資料複製邏輯

4. **JSON 資料沒有移轉成功**
   - 原因:可能的 JSON 格式問題或 UUID 生成失敗
   - 解決:增加錯誤處理和驗證步驟

## 執行前準備

### 1. 備份資料庫

```bash
# 匯出整個資料庫
pnpm wrangler d1 export nobodyclimb-db-preview --remote --output=backup-$(date +%Y%m%d-%H%M%S).sql --config wrangler.toml
```

### 2. 檢查現有資料

執行以下查詢來了解資料現狀:

```bash
# 檢查 biographies 表的資料量
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --command="SELECT COUNT(*) as total_biographies, COUNT(user_id) as with_user_id, COUNT(one_liners_data) as with_one_liners, COUNT(stories_data) as with_stories FROM biographies;" --config wrangler.toml

# 檢查 users 表的資料量
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --command="SELECT COUNT(*) as total_users FROM users;" --config wrangler.toml

# 檢查是否有舊的 migration 表
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name IN ('biography_core_stories', 'biography_one_liners', 'biography_stories');" --config wrangler.toml
```

### 3. 準備回滾計畫

如果 migration 執行失敗:

```bash
# 從備份恢復
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=backup-YYYYMMDD-HHMMSS.sql --config wrangler.toml
```

## 執行步驟

### 方案 A: 直接執行修復後的 migration (推薦用於測試環境)

```bash
cd backend

# 執行修復後的 migration
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=migrations/0027_consolidated_schema_updates_FIXED.sql --config wrangler.toml
```

### 方案 B: 分階段執行 (推薦用於正式環境)

將 migration 分成多個階段,每個階段執行後驗證結果:

#### 階段 1: 創建新表和種子資料

創建 `migrations/0027_step1_create_tables.sql`:

- PART 1-11: 創建所有新表、更新 users、插入種子資料

執行並驗證:

```bash
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=migrations/0027_step1_create_tables.sql --config wrangler.toml

# 驗證新表已創建
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'biography_%';" --config wrangler.toml
```

#### 階段 2: 移轉 JSON 資料

創建 `migrations/0027_step2_migrate_data.sql`:

- PART 12: 移轉 JSON 資料到新表

執行並驗證:

```bash
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=migrations/0027_step2_migrate_data.sql --config wrangler.toml

# 驗證資料已移轉
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --command="SELECT (SELECT COUNT(*) FROM biography_core_stories) as core_stories, (SELECT COUNT(*) FROM biography_stories) as stories;" --config wrangler.toml
```

#### 階段 3: 清理舊欄位

創建 `migrations/0027_step3_cleanup.sql`:

- PART 13: 重建 biographies 表,移除舊欄位

**⚠️ 只有在確認階段 2 的資料移轉成功後才執行此步驟!**

```bash
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=migrations/0027_step3_cleanup.sql --config wrangler.toml
```

## 執行後驗證

### 1. 檢查資料完整性

```sql
-- 檢查 users 表
SELECT COUNT(*) as total_users FROM users;

-- 檢查 biographies 表
SELECT
  COUNT(*) as total_biographies,
  COUNT(user_id) as with_user_id,
  COUNT(*) - COUNT(user_id) as null_user_id
FROM biographies;

-- 檢查 JSON 資料是否正確移轉
SELECT
  (SELECT COUNT(*) FROM biography_core_stories) as core_stories,
  (SELECT COUNT(*) FROM biography_one_liners) as one_liners,
  (SELECT COUNT(*) FROM biography_stories) as stories;

-- 檢查 biographies 是否還有 JSON 欄位(應該沒有)
PRAGMA table_info(biographies);
```

### 2. 檢查資料關聯

```sql
-- 檢查 biographies.user_id 是否都有效
SELECT COUNT(*) as orphaned_biographies
FROM biographies b
LEFT JOIN users u ON b.user_id = u.id
WHERE b.user_id IS NOT NULL AND u.id IS NULL;

-- 結果應該是 0
```

### 3. 檢查 JSON 資料移轉正確性

```sql
-- 隨機檢查一筆 biography,確認資料正確
SELECT
  b.id,
  b.name,
  b.user_id,
  (SELECT COUNT(*) FROM biography_core_stories WHERE biography_id = b.id) as core_stories_count,
  (SELECT COUNT(*) FROM biography_stories WHERE biography_id = b.id) as stories_count
FROM biographies b
LIMIT 5;

-- 每個 biography 應該有 3 筆 core_stories (如果原本有 one_liners_data)
-- stories_count 應該對應原本 stories_data 中的問題數量
```

## 如果遇到問題

### 問題 1: user_id 全部變成 NULL

**診斷**:

```sql
SELECT COUNT(*) as null_user_ids FROM biographies WHERE user_id IS NULL;
SELECT COUNT(*) FROM users;
```

**可能原因**:

- PART 1 的 users 表資料複製失敗
- users 表被意外清空

**解決方案**:

1. 從備份恢復
2. 檢查 PART 1 的 SQL 是否正確執行

### 問題 2: JSON 資料沒有移轉

**診斷**:

```sql
SELECT COUNT(*) FROM biography_core_stories;
SELECT COUNT(*) FROM biography_stories;
```

**可能原因**:

- JSON 格式不正確
- UUID 生成失敗
- 外鍵約束問題

**解決方案**:

1. 檢查 D1 執行日誌,找出具體錯誤訊息
2. 手動執行 PART 12 的 SQL,觀察錯誤
3. 如果是外鍵問題,先檢查 biographies 表的資料

### 問題 3: Migration 執行到一半失敗

**好消息**: D1 會自動回滾整個 migration

**下一步**:

1. 檢查錯誤日誌
2. 修復 SQL 問題
3. 重新執行 migration

## 測試建議

### 在 Preview 環境測試

```bash
# 1. 備份 preview 資料庫
pnpm wrangler d1 export nobodyclimb-db-preview --remote --output=preview-backup.sql --config wrangler.toml

# 2. 執行 migration
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=migrations/0027_consolidated_schema_updates_FIXED.sql --config wrangler.toml

# 3. 驗證結果
# (執行上面的驗證查詢)

# 4. 如果成功,記錄結果;如果失敗,從備份恢復
```

### 在 Production 環境執行

**⚠️ 只有在 preview 環境測試成功後才執行!**

```bash
# 1. 備份 production 資料庫
pnpm wrangler d1 export nobodyclimb-db --remote --output=prod-backup-$(date +%Y%m%d-%H%M%S).sql --config wrangler.toml

# 2. 通知用戶系統維護(可選)

# 3. 執行 migration
pnpm wrangler d1 execute nobodyclimb-db --remote --file=migrations/0027_consolidated_schema_updates_FIXED.sql --config wrangler.toml

# 4. 驗證結果

# 5. 監控應用程式是否正常運作
```

## 修復內容總結

修復後的 migration (`0027_consolidated_schema_updates_FIXED.sql`) 包含以下改進:

1. ✅ **移除不必要的 one-liners 移轉** (第 555-574 行)
   - 因為 `one_liners_data` 只包含 core questions
   - Core questions 已在 core_stories 移轉中處理

2. ✅ **修復臨時表創建** (第 672 行)
   - 從 `CREATE TABLE IF NOT EXISTS` 改為先 `DROP TABLE IF EXISTS`
   - 避免舊資料干擾新的移轉

3. ✅ **增加註解說明**
   - 標記所有修復點為 `🔧 FIX:`
   - 解釋每個修復的原因

4. ✅ **保持原始功能**
   - 所有原始的 migration 功能都保留
   - 只修復了問題部分

## 聯絡資訊

如有問題,請參考:

- 問題診斷報告: `backend/MIGRATION-ISSUES.md`
- 原始 migration: `backend/migrations/0027_consolidated_schema_updates.sql`
- 修復後 migration: `backend/migrations/0027_consolidated_schema_updates_FIXED.sql`
