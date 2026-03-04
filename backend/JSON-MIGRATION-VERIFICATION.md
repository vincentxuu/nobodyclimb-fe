# JSON 資料遷移驗證指南

## 修改說明

已修改 `migrations/0027_consolidated_schema_updates_FIXED.sql`,確保:

### ✅ 已完成的修改

1. **保留 JSON 資料欄位** (行 626-627)
   - `one_liners_data` - 保留原始 one-liner 資料
   - `stories_data` - 保留原始 story 資料
   - 這些欄位在表格重建時會被複製,不會被刪除

2. **資料遷移邏輯**
   - Core Stories (3 個固定問題): `one_liners_data` → `biography_core_stories`
   - One-liners (其他問題): `one_liners_data` → `biography_one_liners`
   - Stories (分類故事): `stories_data` → `biography_stories`

### 📋 遷移策略

遷移採用**雙軌制**:

- **新資料結構**: JSON 資料已遷移到關聯式表格 (支援 likes, comments, 更靈活的查詢)
- **原始備份**: JSON 欄位保留作為備份和驗證用途

## 驗證步驟

### 步驟 1: 執行遷移前的資料統計

```bash
cd backend
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=test-migration-count.sql --config wrangler.toml
```

記錄輸出的數量,例如:

```
type          | count
--------------|------
core_stories  | 15
```

### 步驟 2: 執行遷移

```bash
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=migrations/0027_consolidated_schema_updates_FIXED.sql --config wrangler.toml
```

### 步驟 3: 執行遷移後驗證

```bash
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=verify-json-migration.sql --config wrangler.toml
```

### 步驟 4: 檢查驗證結果

驗證腳本會檢查以下項目:

1. ✅ **JSON 資料保留檢查** - 確認 JSON 欄位仍存在且有資料
2. ✅ **Core Stories 遷移** - JSON 來源數量 = 遷移後數量
3. ✅ **One-liners 遷移** - Non-core questions 的遷移驗證
4. ✅ **Stories 遷移** - JSON 來源數量 = 遷移後數量
5. ✅ **內容一致性抽樣** - 隨機抽取資料比對內容是否一致
6. ✅ **遺漏檢查** - 檢查是否有資料未遷移
7. ✅ **統計摘要** - 顯示每個 biography 的遷移統計

### 預期結果

所有檢查應該顯示:

- `✓ 完全一致` - 遷移成功
- `⚠ 遷移數量多於來源` - 可能有重複資料 (需要進一步檢查)
- `✗ 遷移數量少於來源` - 有資料遺漏 (需要修正)

## 資料結構對照

### Core Stories (3 個固定問題)

**JSON 格式** (`one_liners_data`):

```json
{
  "climbing_origin": {
    "answer": "大學社團體驗,一爬就愛上了"
  },
  "climbing_meaning": {
    "answer": "一種生活方式,也是認識自己的途徑"
  },
  "advice_to_self": {
    "answer": "不要急,享受每一次攀爬的過程"
  }
}
```

**關聯式表格** (`biography_core_stories`):
| biography_id | question_id | content |
|--------------|-------------|---------|
| xxx | climbing_origin | 大學社團體驗,一爬就愛上了 |
| xxx | climbing_meaning | 一種生活方式... |
| xxx | advice_to_self | 不要急,享受每一次... |

### Stories (分類故事)

**JSON 格式** (`stories_data`):

```json
{
  "sys_cat_growth": {
    "memorable_moment": {
      "answer": "去年第一次去龍洞..."
    }
  },
  "sys_cat_psychology": {
    "climbing_lesson": {
      "answer": "學會了面對失敗..."
    }
  }
}
```

**關聯式表格** (`biography_stories`):
| biography_id | category_id | question_id | content |
|--------------|-------------|-------------|---------|
| xxx | sys_cat_growth | memorable_moment | 去年第一次去龍洞... |
| xxx | sys_cat_psychology | climbing_lesson | 學會了面對失敗... |

## 回滾方案

如果遷移失敗或資料有問題,JSON 資料仍然保留在 `biographies` 表中,可以:

1. 刪除遷移後的關聯式資料:

```sql
DELETE FROM biography_core_stories;
DELETE FROM biography_stories;
```

2. 重新執行遷移腳本的 PART 12

或者使用備份檔案恢復:

```bash
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=biographies-backup-data.sql --config wrangler.toml
```

## 問題排查

### 問題: 遷移數量不一致

**檢查步驟:**

1. 檢查 JSON 資料是否有效 (使用 `test-json-extraction.sql`)
2. 檢查是否有空白或 NULL 的 answer
3. 檢查是否有重複的 biography_id + question_id

### 問題: 內容不一致

**檢查步驟:**

1. 使用驗證腳本的檢查 4 和 5 來抽樣比對
2. 檢查編碼問題 (特殊字元)
3. 檢查是否有 JSON 解析錯誤

## 相關檔案

- `migrations/0027_consolidated_schema_updates_FIXED.sql` - 主要遷移腳本 (已修改,保留 JSON)
- `verify-json-migration.sql` - 驗證腳本 (新建)
- `test-json-extraction.sql` - JSON 提取測試
- `test-migration-count.sql` - 遷移前計數
- `biographies-backup-data.sql` - 完整備份
