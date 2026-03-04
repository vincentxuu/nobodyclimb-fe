# Migration 0027 問題診斷報告

## 發現的問題

### 1. **One-liners 資料不會被移轉** ❌ 重大問題

**位置**: PART 12, 第 555-574 行

**問題**:

```sql
FROM biographies b, json_each(b.one_liners_data) j
WHERE b.one_liners_data IS NOT NULL
  AND json_valid(b.one_liners_data)
  AND j.key NOT IN ('climbing_origin', 'climbing_meaning', 'advice_to_self')  -- ❌ 問題在這裡
```

**原因**:

- 查詢排除了 `climbing_origin`, `climbing_meaning`, `advice_to_self` 這三個 key
- 但根據實際資料,`one_liners_data` **只包含這三個 key**
- 結果:這個 INSERT 語句會移轉 **0 筆資料**

**實際資料結構**:

```json
{
  "climbing_origin": { "answer": "...", "visibility": "public" },
  "climbing_meaning": { "answer": "...", "visibility": "public" },
  "advice_to_self": { "answer": "...", "visibility": "public" }
}
```

**影響**:

- 所有 one_liners_data 中的非核心問題資料會丟失(但實際上沒有非核心問題)
- 這是設計意圖,因為這三個問題應該移轉到 `biography_core_stories` 表
- **不是 bug,是設計如此**

### 2. **user_id 可能消失的問題** ⚠️ 潛在問題

**位置**: PART 1 (第 23-65 行) 和 PART 13 (第 663-689 行)

**問題流程**:

1. PART 1: Users 表被重建

   ```sql
   CREATE TABLE users_new (...);
   INSERT INTO users_new (...) SELECT ... FROM users;
   DROP TABLE users;  -- ❌ 刪除舊的 users 表
   ALTER TABLE users_new RENAME TO users;
   ```

2. PART 13: Biographies 表被重建
   ```sql
   INSERT INTO biographies_new (...) SELECT b.id, b.user_id, ... FROM biographies b;
   DROP TABLE biographies;  -- ❌ 刪除舊的 biographies 表
   ALTER TABLE biographies_new RENAME TO biographies;
   ```

**潛在風險**:

- 如果 users 表的資料沒有正確複製,biographies.user_id 會指向不存在的用戶
- D1 預設不強制外鍵約束,所以不會報錯,但會導致資料不一致
- 在 PART 2 (第 96 行) 使用了 `INNER JOIN users`,表示只保留有效 user_id 的通知

### 3. **JSON 資料移轉失敗時無備份** ❌ 重大風險

**位置**: PART 12 和 PART 13

**問題**:

- PART 12 將 JSON 資料移轉到新表
- PART 13 刪除 biographies 表的 `one_liners_data` 和 `stories_data` 欄位
- **如果 PART 12 移轉失敗,PART 13 仍會執行**
- 結果:**資料永久遺失**

**執行流程**:

```
PART 12: 嘗試移轉 JSON → 新表
  ↓ (如果失敗,SQL 繼續執行)
PART 13: 刪除舊表,重建 biographies (不包含 JSON 欄位)
  ↓
資料永久遺失! ❌
```

### 4. **SQLite 的 CREATE TABLE IF NOT EXISTS 陷阱** ⚠️

**位置**: PART 3-6 的所有 CREATE TABLE 語句

**問題**:

```sql
CREATE TABLE IF NOT EXISTS temp_stories_flat AS SELECT ...
```

- 如果表已經存在(例如上次執行失敗),不會重建
- 舊資料會影響新的移轉
- 可能導致重複資料或資料不一致

## 修復建議

### 修復 1: 移除不必要的 one-liners 移轉邏輯

因為 `one_liners_data` 只包含 core questions,且已經在 PART 12 的 Core Stories 移轉中處理,所以第 555-574 行的 one-liners 移轉可以移除或改為註解。

### 修復 2: 增加資料驗證步驟

在 PART 13 執行前,驗證 PART 12 的移轉是否成功:

```sql
-- 驗證 core stories 移轉成功
SELECT CASE
  WHEN (SELECT COUNT(*) FROM biography_core_stories) > 0
  THEN 'OK'
  ELSE RAISE(ABORT, 'Core stories migration failed')
END;
```

### 修復 3: 使用 Transaction (D1 限制)

D1 不支援顯式的 BEGIN TRANSACTION,但會自動將整個 migration 檔案包在一個 transaction 中。
如果任何語句失敗,整個 migration 會回滾。

### 修復 4: 分階段執行

建議將 migration 分成兩個檔案:

1. `0027a_create_tables_and_migrate.sql` - 創建新表並移轉資料
2. `0027b_cleanup.sql` - 清理舊欄位(在確認資料正確後手動執行)

## 實際影響評估

### user_id 消失的原因

最可能的原因:

1. **PART 1 的 users 表重建時,某些 user 資料沒有正確複製**
2. **PART 13 的 biographies 表重建正常執行**
3. **結果**: biographies 有 user_id,但指向的 users 可能不存在

### JSON 資料沒有移轉成功的原因

可能原因:

1. **PART 12 的 INSERT 語句失敗**(例如 UUID 生成問題、JSON 格式問題)
2. **但錯誤被忽略,PART 13 仍然執行**
3. **結果**: biographies 表被重建,但沒有 JSON 欄位,新表也沒有資料

## 下一步行動

1. **檢查現有資料**:

   ```sql
   -- 檢查 users 表的資料量
   SELECT COUNT(*) FROM users;

   -- 檢查 biographies 表的 user_id
   SELECT
     COUNT(*) as total,
     COUNT(DISTINCT user_id) as unique_users,
     COUNT(*) - COUNT(user_id) as null_user_id
   FROM biographies;

   -- 檢查新表的資料
   SELECT
     (SELECT COUNT(*) FROM biography_core_stories) as core_stories,
     (SELECT COUNT(*) FROM biography_one_liners) as one_liners,
     (SELECT COUNT(*) FROM biography_stories) as stories;
   ```

2. **準備安全的 migration**:
   - 先備份資料庫
   - 使用修復後的 migration script
   - 分階段執行並驗證每個階段

3. **資料恢復**:
   - 如果有備份,從備份恢復
   - 如果沒有備份,檢查 Cloudflare D1 的時間點恢復功能
