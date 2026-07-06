---
name: add-db-migration
description: 改 D1 資料庫結構（加表、加欄位、改 index）的標準步驟。schema.sql 與 migrations 必須同步修改，編號有重複陷阱
---

# 新增 D1 Database Migration

D1 = Cloudflare 的 SQLite。本 repo 有**兩套並存、不會自動同步**的 DB 定義：

1. `backend/src/db/schema.sql` — 全量快照（`CREATE TABLE IF NOT EXISTS`），供全新環境
2. `backend/migrations/NNNN_*.sql` — 增量 delta，供既有 DB 逐步升級

**任何結構變更必須兩處都改**，只改一處就是不完整的變更。

## 步驟

### 1. 決定 migration 編號（必做，有重複編號的歷史事故）

```bash
ls backend/migrations/ | grep -E '^[0-9]{4}_' | sort | tail -3
```

取最大編號 +1，4 位數零填充。命名：`NNNN_snake_case_description.sql`。
注意：歷史上出現過兩個 0071——所以**一定要先列出現有檔案確認**,不要憑記憶。

### 2. 寫 migration 檔 `backend/migrations/NNNN_xxx.sql`

- SQLite 語法。加欄位用 `ALTER TABLE x ADD COLUMN ...`（SQLite 的 ALTER 能力有限：
  不能 DROP COLUMN（舊版）、不能改型別——需要時用「建新表→搬資料→改名」模式，
  參考既有 migration 檔的做法）。
- 慣例：table 複數、欄位 snake_case、boolean INTEGER 0/1、
  timestamp `TEXT DEFAULT (datetime('now'))`、enum 用 `CHECK (col IN (...))`、
  owned child 加 `ON DELETE CASCADE`、PK 是 `TEXT PRIMARY KEY`（app 端產 id）。

### 3. 同步改 `backend/src/db/schema.sql`

把同樣的變更反映到全量快照（新表加整段 `CREATE TABLE IF NOT EXISTS`；
加欄位則直接改該表的 CREATE 定義）。

### 4. 本機套用與驗證

```bash
cd backend
pnpm db:migrate                      # 用 schema.sql 重建本機 DB（--local）
npx wrangler d1 execute nobodyclimb-db --local --file=./migrations/NNNN_xxx.sql
```

驗證 SQL 語法沒錯、與 schema.sql 不衝突（在已套用 schema.sql 的 DB 上跑增量，
重複建立會報錯的語句要處理成 IF NOT EXISTS 或確認欄位不存在）。

### 5. 遠端套用（不要主動做）

Preview / production 的套用是**手動、高風險操作**：
`wrangler d1 execute ... --remote --file=...`。
**除非使用者明確要求，否則不要執行任何 `--remote` 指令**；
在 PR 描述中註明「本 PR 含 migration NNNN，需部署時手動套用」即可。

## 陷阱

- `backend/package.json` 的 `db:migrate` / `db:migrate:remote` 跑的是 **schema.sql**，
  不是 numbered migrations；沒有「自動跑所有 pending migrations」的機制。
- 另有舊目錄 `backend/src/db/migrations/`（少數 npm scripts 指向它）——新 migration
  一律放 `backend/migrations/`，不要放舊目錄。
- 資料搬移類 migration（UPDATE/INSERT SELECT）先在 --local 測過再進 PR。
- 改了 schema 之後，對應的 TypeScript 型別（`packages/types`）與 Zod schema
  （route 檔或 `packages/schemas`）通常也要改，檢查一遍。
