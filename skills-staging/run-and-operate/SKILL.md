---
name: run-and-operate
description: 觀察到以下任一狀態時載入：要啟動 dev server 或實跑功能驗證；要部署或被問部署流程；要動線上資料（還原、seed、批次匯入）；被要求查 production 日誌或健康狀態。
---

# 執行與營運

查證日期：2026-07-13。

## 本地執行

| 目標 | 指令 | 位址 / 備註 |
|------|------|------------|
| Web dev | `pnpm dev:web` | localhost:3000（先 build packages） |
| Backend dev | `pnpm dev:backend`（= `cd backend && pnpm dev`，wrangler dev） | localhost:8787；API docs `http://localhost:8787/api/v1/docs`、OpenAPI JSON `/api/v1/openapi.json` |
| Mobile | `pnpm dev:mobile`（Expo） | 需模擬器/裝置 |
| 本地 DB | `cd backend && npx wrangler d1 execute nobodyclimb-db-local --local --file=./src/db/schema.sql`（15 張基礎表；`pnpm db:migrate` 是壞的，見 db-migrations-truth） | `--local` 不需 Cloudflare 認證 |
| Backend 行為驗證 | `curl localhost:8787/api/v1/<path>` 看回應信封 | `{ success, data, ... }` |

本地已知限制：root wrangler.toml 無 Vectorize binding → 本地 AI 向量檢索必失敗（見 ai-subsystem-map）。

## 部署真相（都走 CI，不要本地 deploy）

- **分支即環境**：push `develop` → preview（`preview.nobodyclimb.cc` / `api-preview.nobodyclimb.cc`）；
  push `main` → production（`nobodyclimb.cc` / `api.nobodyclimb.cc`）。
- Web：`deploy.yml`——PR 只跑 Build Check；push 才 deploy（`3bb13ad` 之後刻意分離）。
  main 部署後自動 purge Cloudflare cache。
- API：`deploy-api.yml`——typecheck → deploy → 自動重新 put secrets → **自動套 D1 migrations（--remote，retry×3）**
  → develop push 再自動觸發 RAG ci 評估（打 preview API）。
- Mobile：`deploy-app.yml`（EAS build，push main / dispatch；PR→main 只跑 typecheck job）。
- 路徑過濾：只有 `apps/web/**`、`backend/**`、`packages/**`、lockfile 或 workflow 本身變更才觸發對應 deploy。
- `keep-alive.yml`：每 5 分鐘 ping 兩個 production worker 的 health endpoint 防冷啟動。
- 手動 deploy（`wrangler deploy --env ...`）＝高風險操作，**沒被明確要求不做**。

## 危險操作清單（一律先取得明確授權）

| 操作 | 風險 |
|------|------|
| `wrangler deploy` / 會寫入的 `wrangler d1 execute --remote`（DDL、UPDATE/INSERT/DELETE、`--file=`） | 直接動線上（唯讀 `--remote --command "SELECT ..."` 屬分診用途，允許） |
| `scripts/restore-prod-to-preview-rebuild.sh` | 砍掉整個 preview DB 重建（會改 wrangler.toml 的 database_id）；~10-20 分鐘 |
| `scripts/restore-preview-to-prod-rebuild.sh` | **覆寫 production DB**，極度危險 |
| `scripts/restore-prod-to-preview.sh` | 已 DEPRECATED（不 drop tables 會造成資料衝突），別用 |
| `scripts/crag-data/drop-all-tables.sh` | 字面意思 |

備份落在 repo 根目錄 `backups/`（`backup-d1-sql.sh` 的 `BACKUP_DIR="../../backups/..."`）；
restore log 為 `restore_rebuild_*.log` / `restore_preview_to_prod_*.log`（舊版才是 `restore_*.log`）。

## 營運資料流（存在但非日常）

- YouTube 影片資料：靜態 JSON 在 `apps/web/public/data/`（~16MB，9,648 部影片、20 個 chunk）；
  更新靠 `apps/web/scripts/update-videos.sh` 等（需 `yt-dlp`、`jq`）`unverified`（本 session 未實跑）。
- 岩場/岩館資料：`scripts/crag-data/`、`scripts/gym-data/` 的 migrate-json-to-db 工具鏈。
- Landing 統計：web build 前自動跑 `scripts/generate-stats.js`（`prebuild`/`build:cf` 內建）。

## 查 production 狀態

- 日誌：`wrangler tail --env production`（web 在 `apps/web/`、api 在 `backend/`）`user-must-provide`（需 Cloudflare 認證）。
- AI 查詢逐筆紀錄：admin UI `/admin/ai`（backend `routes/admin-ai.ts`）或 D1 `ai_query_logs`。
- Health：`https://api.nobodyclimb.cc/health`、`https://nobodyclimb.cc/api/health`。

## 重新驗證

```bash
grep -n "on:" -A6 .github/workflows/deploy-api.yml | head -12 && ls scripts/restore-*.sh
```
