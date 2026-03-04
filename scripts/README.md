# Scripts 目錄說明

此目錄包含 NobodyClimb 專案的各種腳本工具。

## 📦 主要腳本

### `restore-prod-to-preview-rebuild.sh` - Production → Preview 完整重建流程 ⭐ 推薦

**用途**: 完全刪除並重建 preview 資料庫，解決 schema 不相容問題。

**完整流程**:
```bash
1. 備份 production 資料庫 → SQL dump
2. 刪除整個 preview 資料庫 (wrangler d1 delete)
3. 重建 preview 資料庫 (wrangler d1 create)
4. 自動更新 wrangler.toml (database_id)
5. 還原 production 資料 (完整 schema + 資料)
6. 執行最新的 migrations
7. 執行資料遷移 (routes/videos/gyms)
```

**使用方式**:
```bash
# 完整流程 (推薦)
./restore-prod-to-preview-rebuild.sh

# 跳過備份步驟 (使用現有最新備份)
./restore-prod-to-preview-rebuild.sh --skip-backup

# 跳過 migrations
./restore-prod-to-preview-rebuild.sh --skip-migration

# 跳過資料遷移
./restore-prod-to-preview-rebuild.sh --skip-data-migration

# 查看說明
./restore-prod-to-preview-rebuild.sh --help
```

**執行時間**: 約 10-20 分鐘 (視資料量而定)

**注意事項**:
- ⚠️ 此操作會**完全刪除並重建** preview 資料庫
- ⚠️ 會產生新的 `database_id` 並自動更新 `wrangler.toml`
- ✅ 執行前會要求輸入 `YES` 確認 (兩次)
- 📝 所有操作會記錄到 `restore_rebuild_YYYYMMDD_HHMMSS.log`
- 💾 會自動備份 `wrangler.toml` 為 `wrangler.toml.backup_YYYYMMDD_HHMMSS`
- 🔄 建議在低流量時段執行
- ⚡ **解決 schema 不相容問題** - 適用於 production 和 preview 的 migration 版本不一致時

**優勢**:
- ✅ 完全乾淨的重建，不會有 schema 衝突
- ✅ 自動處理 database_id 更新
- ✅ 保留 wrangler.toml 備份，可隨時還原

---

### `restore-prod-to-preview.sh` - Production → Preview 快速還原流程 (已棄用)

**狀態**: ⚠️ 此腳本已棄用，因為不 drop 資料表會有資料衝突，且 schema 可能不相容。

**建議**: 請使用 `restore-prod-to-preview-rebuild.sh` 代替。

---

## 📂 子目錄

### `crag-data/` - 岩場資料管理

包含岩場 (crags)、路線 (routes)、影片 (videos) 的資料管理腳本。

**主要腳本**:
- `backup-d1-sql.sh` - 備份資料庫為 SQL 格式
- `restore-d1-sql.sh` - 還原 SQL 備份
- `drop-all-tables.sh` - 刪除所有資料表
- `check-migration.sh` - 檢查 migration 狀態

**TypeScript 遷移腳本** (`src/`):
- `migrate-json-to-db.ts` - JSON 資料遷移到 D1
- `migrate-via-api.ts` - 透過 API 遷移資料
- `sync-from-sheets.ts` - 從 Google Sheets 同步資料

**執行方式**:
```bash
cd crag-data

# 備份資料庫
./backup-d1-sql.sh production

# 還原資料庫
./restore-d1-sql.sh <backup_dir> preview

# 執行資料遷移
pnpm migrate:json
```

---

### `gym-data/` - 岩館資料管理

包含岩館 (gyms) 的資料管理腳本。

**TypeScript 遷移腳本** (`src/`):
- `migrate-json-to-db.ts` - 岩館 JSON 資料遷移到 D1

**執行方式**:
```bash
cd gym-data

# 執行岩館資料遷移
pnpm migrate:json
```

---

## 🔧 常用操作流程

### 1. 完整還原 Preview 環境

```bash
# 在 scripts 目錄執行
./restore-prod-to-preview.sh
```

### 2. 僅備份 Production

```bash
cd crag-data
./backup-d1-sql.sh production
```

### 3. 僅執行資料遷移

```bash
# Routes/Videos
cd crag-data
pnpm migrate:json

# Gyms
cd gym-data
pnpm migrate:json
```

### 4. 檢查資料庫狀態

```bash
# 列出所有資料表
npx wrangler d1 execute nobodyclimb-db-preview --remote \
  --command='SELECT name FROM sqlite_master WHERE type="table"'

# 檢查資料數量
npx wrangler d1 execute nobodyclimb-db-preview --remote \
  --command='SELECT COUNT(*) FROM crags'
```

---

## 📋 前置需求

執行這些腳本前，請確保已安裝:

- ✅ Node.js 18+
- ✅ pnpm (`npm install -g pnpm`)
- ✅ jq (`brew install jq`)
- ✅ Cloudflare Wrangler (`npm install -g wrangler`)
- ✅ 已登入 Cloudflare (`wrangler login`)

---

## 🚨 故障排除

### 問題: 執行腳本時權限錯誤

```bash
# 設定執行權限
chmod +x restore-prod-to-preview.sh
cd crag-data && chmod +x *.sh
```

### 問題: 找不到 wrangler

```bash
# 全域安裝 wrangler
npm install -g wrangler

# 登入 Cloudflare
wrangler login
```

### 問題: 資料遷移失敗

```bash
# 檢查 D1 連線
npx wrangler d1 execute nobodyclimb-db-preview --remote \
  --command='SELECT 1'

# 查看詳細錯誤日誌
tail -f restore_*.log
```

---

## 📝 日誌檔案

所有主控腳本會產生日誌檔案:
- 格式: `restore_YYYYMMDD_HHMMSS.log`
- 位置: `scripts/` 目錄
- 內容: 所有執行步驟的時間戳記和狀態

---

## ⚡ 效能建議

1. **備份壓縮**: 大型資料庫建議壓縮備份以節省空間
2. **分批遷移**: 資料量大時可分批執行遷移
3. **低流量時段**: 建議在低流量時段執行完整還原
4. **定期清理**: 定期清理舊的備份檔案 (`backups/` 目錄)

---

## 🔗 相關文件

- [Backend API 文件](../docs/backend/)
- [資料庫 Schema](../backend/migrations/)
- [CLAUDE.md](../CLAUDE.md) - 專案總覽
