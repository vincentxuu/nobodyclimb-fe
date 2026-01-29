# D1 資料庫遷移指南

本文件說明如何將 Cloudflare D1 production 資料庫的 schema 和資料完整複製到 preview 資料庫。

## 前置條件

- 安裝 wrangler（建議使用專案內版本）
- 已登入 Cloudflare：`wrangler login`
- 在 `backend/` 目錄下執行所有指令

## 資料庫資訊

| 環境 | Database Name | 用途 |
|------|---------------|------|
| Production | nobodyclimb-db | 正式環境資料庫 |
| Preview | nobodyclimb-db-preview | 測試/預覽環境資料庫 |

## 完整遷移步驟

### 步驟 1：從 Production 導出資料

```bash
cd backend
pnpm wrangler d1 export nobodyclimb-db --remote --output=prod-backup.sql --config wrangler.toml
```

### 步驟 2：刪除並重建 Preview 資料庫

```bash
# 刪除現有的 preview 資料庫
pnpm wrangler d1 delete nobodyclimb-db-preview

# 重新建立
pnpm wrangler d1 create nobodyclimb-db-preview
```

> ⚠️ **重要**：執行後會顯示新的 `database_id`，需要更新 `wrangler.toml`

### 步驟 3：更新 wrangler.toml

編輯 `backend/wrangler.toml`，更新 preview 環境的 `database_id`：

```toml
[[env.preview.d1_databases]]
binding = "DB"
database_name = "nobodyclimb-db-preview"
database_id = "新的-database-id"  # <-- 更新這裡
migrations_dir = "migrations"
```

### 步驟 4：重新排序 SQL 檔案

由於外鍵依賴關係，需要將 `users` 表移到最前面。使用以下 Python 腳本：

```bash
python3 << 'EOF'
import re

with open('prod-backup.sql', 'r') as f:
    content = f.read()

# 分離語句
statements = re.split(r';\s*\n', content)

creates = []
inserts = []
others = []

for stmt in statements:
    stmt = stmt.strip()
    if not stmt:
        continue
    if stmt.startswith('CREATE TABLE'):
        creates.append(stmt + ';')
    elif stmt.startswith('INSERT INTO'):
        inserts.append(stmt + ';')
    else:
        others.append(stmt + ';')

# 重新排序 CREATE TABLE - users 優先
creates_sorted = sorted(creates, key=lambda x: 0 if '"users"' in x else 1)

with open('prod-ordered.sql', 'w') as f:
    f.write('PRAGMA defer_foreign_keys=TRUE;\n')
    f.write('PRAGMA foreign_keys=OFF;\n')
    for stmt in creates_sorted:
        f.write(stmt + '\n')
    for stmt in inserts:
        f.write(stmt + '\n')
    f.write('PRAGMA foreign_keys=ON;\n')

print('Created prod-ordered.sql')
EOF
```

### 步驟 5：導入資料到 Preview

```bash
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=prod-ordered.sql --config wrangler.toml
```

### 步驟 6：驗證資料

```bash
# 檢查表格數量
pnpm wrangler d1 execute nobodyclimb-db-preview --env preview --remote --config wrangler.toml \
  --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';"

# 檢查用戶數量
pnpm wrangler d1 execute nobodyclimb-db-preview --env preview --remote --config wrangler.toml \
  --command="SELECT COUNT(*) as user_count FROM users;"
```

### 步驟 7：清理暫存檔案

```bash
rm prod-backup.sql prod-ordered.sql
```

## 常見問題

### Q: wrangler 版本過舊導致 FileHandle 錯誤

```
[Error: A FileHandle object was closed during garbage collection...]
```

**解決方案**：更新 wrangler 並使用 `pnpm wrangler` 執行

```bash
pnpm add -D wrangler@latest
pnpm wrangler d1 execute ...  # 使用 pnpm 而非直接執行 wrangler
```

### Q: 找不到資料庫

```
Couldn't find a D1 DB with the name or binding 'xxx' in your wrangler.json file.
```

**解決方案**：加上 `--config wrangler.toml` 參數

```bash
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --config wrangler.toml ...
```

### Q: 外鍵約束失敗

```
FOREIGN KEY constraint failed: SQLITE_CONSTRAINT
```

**解決方案**：使用步驟 4 的 Python 腳本重新排序 SQL 檔案，確保 `users` 表最先建立

### Q: UNIQUE 約束失敗

```
UNIQUE constraint failed: posts.slug: SQLITE_CONSTRAINT
```

**解決方案**：先清空 preview 資料庫的資料再導入

```bash
pnpm wrangler d1 execute nobodyclimb-db-preview --env preview --remote --config wrangler.toml \
  --command="PRAGMA foreign_keys=OFF; DELETE FROM table_name; PRAGMA foreign_keys=ON;"
```

### Q: Schema 欄位數量不一致

```
table biographies has 63 columns but 68 values were supplied
```

**解決方案**：刪除並重建 preview 資料庫，然後直接導入完整備份（包含 schema），而不是只導入資料

## 快速指令（一鍵複製）

將以下內容存為 `scripts/sync-db-to-preview.sh`：

```bash
#!/bin/bash
set -e

cd "$(dirname "$0")/../backend"

echo "📦 導出 production 資料庫..."
pnpm wrangler d1 export nobodyclimb-db --remote --output=prod-backup.sql --config wrangler.toml

echo "🔄 重新排序 SQL 檔案..."
python3 << 'PYTHON'
import re

with open('prod-backup.sql', 'r') as f:
    content = f.read()

statements = re.split(r';\s*\n', content)
creates = []
inserts = []

for stmt in statements:
    stmt = stmt.strip()
    if not stmt:
        continue
    if stmt.startswith('CREATE TABLE'):
        creates.append(stmt + ';')
    elif stmt.startswith('INSERT INTO'):
        inserts.append(stmt + ';')

creates_sorted = sorted(creates, key=lambda x: 0 if '"users"' in x else 1)

with open('prod-ordered.sql', 'w') as f:
    f.write('PRAGMA defer_foreign_keys=TRUE;\n')
    f.write('PRAGMA foreign_keys=OFF;\n')
    for stmt in creates_sorted:
        f.write(stmt + '\n')
    for stmt in inserts:
        f.write(stmt + '\n')
    f.write('PRAGMA foreign_keys=ON;\n')
PYTHON

echo "🗄️ 導入到 preview 資料庫..."
pnpm wrangler d1 execute nobodyclimb-db-preview --remote --file=prod-ordered.sql --config wrangler.toml

echo "🧹 清理暫存檔案..."
rm prod-backup.sql prod-ordered.sql

echo "✅ 完成！"
```

使用方式：

```bash
chmod +x scripts/sync-db-to-preview.sh
./scripts/sync-db-to-preview.sh
```

> ⚠️ 執行前請確認 preview 資料庫是空的或已重建
