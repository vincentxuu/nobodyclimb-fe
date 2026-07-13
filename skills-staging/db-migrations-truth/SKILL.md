---
name: db-migrations-truth
description: 觀察到以下任一狀態時載入：要加表/加欄位/改 index；diff 內出現 backend/src/db/schema.sql 或 backend/migrations/；migration 套用失敗；懷疑 preview/production schema 不同步；看到 db:migrate 系列 npm script。
---

# D1 Migrations 的真相（兩套定義、撞號史、CI 自動套用、憲法漂移）

查證日期：2026-07-13。D1 = Cloudflare 的 SQLite。wrangler 4.64.0。

## 核心模型：兩套並存、不自動同步的 DB 定義（且快照已漂移）

1. `backend/src/db/schema.sql` — 憲法說它是「全量快照」，**實況不是**（2026-07-13 查證）：
   只有最初 **15 張表**（users→likes）。`user_ranks`（0047）、`ai_*`（0046 起）、quiz/chat/rank 等
   全部**只存在於 migrations/**。查表結構的真相 = schema.sql ＋ `grep backend/migrations/`。
2. `backend/migrations/NNNN_*.sql` — 增量 delta，實質的完整結構史（現有 75 個 `NNNN_*.sql`，
   外加 1 個 `backup_*` 目錄，忽略它）。

**規則（憲法要求）：結構變更兩處都改。** 但要知道兩件事：
`check-conventions.sh` 規則 1 只單向執法（改 schema.sql 沒加 migration 才 FAIL；反向不抓），
而 0046 之後的新表實務上都只進了 migrations——憲法與現實已漂移，是否回填 schema.sql
屬維護者決策（見 UNCERTAINTY.md）。改完結構後，`packages/types` 與對應 Zod schema 通常也要跟著改。

## 編號紀律（撞號是既成事實）

**觸發**：要建立新 migration 檔。
**步驟**：
```bash
ls backend/migrations/ | grep -E '^[0-9]{4}_' | sort | tail -3   # 取最大編號 +1，4 位數零填充
```
**完成定義**：新檔名 `NNNN_snake_case.sql`，且
`ls backend/migrations/ | cut -c1-4 | sort | uniq -d | grep -x '<你的編號>'` 無輸出
（注意：`uniq -d` 本來就會列出歷史撞號 0053、0071，看到它們不是你的問題）。
- 現況（2026-07-13）：**已存在兩組歷史撞號**——`0053_*` ×2、`0071_*` ×2。wrangler 按檔名排序照跑，
  既成事實不要去改名（會讓已套用環境的 `d1_migrations` 紀錄對不上），但**不得再新增撞號**。
- 反例（觀察過的合理化）：「上次看到最大是 0070，直接寫 0071」——憑記憶命名正是兩次撞號的成因。
- 另注意：`backend/migrations/backup_20260225_150037/` 是一個備份**目錄**，混在 migrations 裡，忽略它。

## 套用路徑（哪個指令做什麼——名字會騙人）

| 指令 | 實際行為 |
|------|----------|
| `cd backend && pnpm db:migrate` | **壞的（2026-07-13 實測 exit 1，兩個原因）**：script 寫 `nobodyclimb-db` 但 root wrangler.toml 本地 DB 名是 `nobodyclimb-db-local`；且 `--batch` 在 wrangler 4.64 會讓參數解析失敗（"You must provide either --command or --file"） |
| `npx wrangler d1 execute nobodyclimb-db-local --local --file=./src/db/schema.sql` | **實測可用**：本機建出 15 張基礎表（去掉 `--batch`、用 `-local` 名） |
| `npx wrangler d1 execute nobodyclimb-db-local --local --file=./migrations/NNNN_x.sql` | 本機套用單一增量檔（實測 0047 exit 0） |
| `npx wrangler d1 migrations apply nobodyclimb-db-local --local` | 全量重放 75 個 migrations——**實測在 0033 失敗**（`no such column: visibility`：對「已含後期狀態的快照」重放歷史必撞），沒有可用的一鍵完整重建 |
| CI（`deploy-api.yml`，push 到 develop/main 觸發） | **自動** `wrangler d1 migrations apply <db> --remote`（preview/production 各自，retry 3 次）——remote DB 有完整 `d1_migrations` 追蹤史，只跑「還沒套用過的」，所以 CI 路徑是好的 |
| `pnpm db:migrate:preview` / `db:migrate:production` / `db:seed` | **死 script**：指向不存在的 `src/db/migrations/001_*.sql` / `seed.sql`，別跑別模仿 |

要點：**remote 套用由 CI 在 merge 後自動完成**（`wrangler.toml` 各環境有 `migrations_dir = "migrations"`）。
本地 session 不要主動跑任何會寫入的 `--remote` 指令；PR 描述註明「本 PR 含 migration NNNN」。
**由此推論：merge 本身就是一次線上 DB 操作。** 破壞性/不可逆 migration（DROP、資料搬移 UPDATE）
必須在 PR 描述中明確警告使用者「merge 即套用到線上 DB」，讓授權發生在 merge 時點。
（注意：`.claude/skills/add-db-migration` §5 的「remote 手動套用」說法已過時，以本檔為準。）

## SQLite 語法限制與慣例

- `ALTER TABLE` 只能 ADD COLUMN（不能 DROP/改型別）；需要時用「建新表→搬資料→改名」，抄既有 migration。
- 慣例：table 複數、欄位 snake_case、boolean INTEGER 0/1、timestamp `TEXT DEFAULT (datetime('now'))`、
  enum 用 `CHECK (col IN (...))`、owned child 加 `ON DELETE CASCADE`、PK `TEXT PRIMARY KEY`（app 端 `generateId()`）。
- 在已套用 schema.sql 的 DB 上跑增量會撞「已存在」錯誤的語句，寫成 `IF NOT EXISTS` 或先確認欄位不存在。
- 資料搬移類（UPDATE / INSERT SELECT）必先 `--local` 測過才進 PR。

## 本機驗證流程（實測過的配方，2026-07-13）

兩個陷阱先記住：(a) 用**已改過的** schema.sql 先建庫再套自己的增量，ADD COLUMN 必撞
「duplicate column name」——SQLite **沒有** `ADD COLUMN IF NOT EXISTS`（idempotent 只適用
CREATE TABLE / CREATE INDEX）；(b) 你要動的表若不在 schema.sql（0046 之後的表），
光建快照庫會 `no such table`。

```bash
cd backend
# 1. 建基礎庫（變更前的快照；若你沒改 schema.sql，直接用現行檔即可）
git show HEAD:src/db/schema.sql > /tmp/old-schema.sql
npx wrangler d1 execute nobodyclimb-db-local --local --file=/tmp/old-schema.sql
# 2. 你的目標表不在快照裡 → 先套用「建立該表」的那個歷史 migration（grep 找到它）
#    例：user_ranks → migrations/0047_climber_rank_system.sql（實測 exit 0）
npx wrangler d1 execute nobodyclimb-db-local --local --file=./migrations/0047_climber_rank_system.sql
# 3. 套你的新增量
npx wrangler d1 execute nobodyclimb-db-local --local --file=./migrations/NNNN_xxx.sql
# 4. 若你也改了 schema.sql：確認新快照仍能在全新庫建成
npx wrangler d1 execute nobodyclimb-db-local --local --file=./src/db/schema.sql
```

**完成定義**：上述指令全 exit 0；`check-conventions.sh` 無 FAIL；types/schemas 已同步。
反例（會發生的合理化）：「增量撞 duplicate column，我把 schema.sql 裡的新欄位拿掉讓它過」——
問題出在驗證順序（先建了含新欄位的庫），不在 schema.sql；別為了過檢查破壞兩處同步。

## 重新驗證

```bash
grep -c "CREATE TABLE" backend/src/db/schema.sql; ls backend/migrations/ | grep -E '^[0-9]{4}' | cut -c1-4 | sort | uniq -d; grep -n "migrations_dir" backend/wrangler.toml
```
（預期：15 / 0053+0071 / 兩個 env 各一行。任一不符＝本檔需更新。）
