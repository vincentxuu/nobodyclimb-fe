# skills-staging Manifest

建立日期：2026-07-13。13 個 skill，每個一行 ＋ 佐證來源；未定案事項見 `UNCERTAINTY.md`。
所有指令/路徑/旗標均於 2026-07-13 在本 repo 查證；無法查證者在各檔內標 `unverified` 或 `user-must-provide`。
交付前經三輪 fresh-context 審查（factual / doctrine / usability），BLOCKING＋IMPORTANT 發現均已修入。

| Skill | 一句話 | 佐證 |
|-------|--------|------|
| `architecture-contract` | 不變量與承重決策：信封、dist 消費、i18n 導航、DB 慣例、依賴方向、禁令 | project-rules skill 同源 + 事故 `ee5618b`/`a19c205`/`1476ede` + `check-conventions.sh` 規則對照 |
| `build-and-env` | 從零重建的驗證順序與假失敗防呆（packages dist、mobile 靜默跳過、turbo 快取） | 2026-07-13 實跑：install→build→typecheck→lint 全 exit 0；事故 `31a5f2e`/`a19c205` |
| `debugging-playbook` | 症狀→分診表：環境/CI/web/AI 四大類，每條附事故 commit | git 史料 31 個 fix(ai) + CI 事故 `2e6db07`/`ab15022`/`13d458d` + 當日實測（web/mobile 測試破損） |
| `failure-archaeology` | 死路（Django docs、DEPRECATED restore、quiz 單體）與會重演的失敗模式 | git log 全量掃描（無 revert、熱區檔案統計）+ docs/openspec 對照 |
| `ai-subsystem-map` | 最大事故熱區的地圖：請求流、DB 決定引擎、三引擎並存風險、guard 三分法、SQL 紀律 | backend 原始碼逐檔核對（routes/ai.ts、query/config.ts、react-agent/guards.ts、text-to-sql.ts）+ vitest 83 tests 實跑 |
| `db-migrations-truth` | 兩套 DB 定義與憲法漂移（schema.sql 僅 15 表）、撞號既成事實（0053/0071）、CI 自動 remote apply、壞/死 npm scripts、實測過的本機驗證配方 | `grep CREATE TABLE schema.sql`=15 + `pnpm db:migrate` 實測 exit 1（雙因）+ 全量重放實測卡 0033 + 0047 選擇性套用實測 exit 0 + deploy-api.yml |
| `validation-and-qa` | 證據標準與檢查矩陣；exit code 紀律；兩個已知假失敗（web/mobile 測試） | 矩陣中每條「實測」當日實跑；web 2/2 suite 掛（next-intl ESM）、mobile 假失敗（quiz/test.tsx）皆有重現輸出 |
| `config-and-flags` | 四層旗標模型（build-time/vars/secrets/DB ai_config）與已查證旗標事實 | deploy.yml env 區塊 + wrangler.toml/json 全讀 + providers/index.ts key 名核對 |
| `run-and-operate` | 本地執行、CI 部署真相、危險操作清單、營運資料流 | workflows 全讀 + scripts/README + restore 腳本內容（未執行） |
| `ci-and-delivery` | workflow 一覽、CI 紅燈分診（歷史成因排序）、commit/push/OpenSpec 紀律 | 7 個 workflow 檔全讀 + CI 事故五類 + openspec 目錄實查 |
| `web-frontend-pitfalls` | i18n 六大坑、Workers≠Node、Next15 params、bundle 上限、資料層三件套 | 事故 `ee5618b`/`13d458d`/`6e2500b`/`ab15022` + add-web-page skill 對照 |
| `mobile-pitfalls` | 三個結構性盲點（typecheck 跳過、Jest/Metro 解析分歧、quiz/test.tsx 假失敗）+ UI/行為契約 | 當日實測（tsc exit 0、jest 20/21 suite + 誤認檔頭 25 行實讀）+ review 事故 `94abd61`/`f83a5ef` |
| `docs-truth-map` | 文件信任順位與陷阱表（Django 屍體、ESLint 漂移、StartMoving 不存在） | docs/ 全目錄掃描 + 逐項與 code 對質（`.startmoving` 不存在、biome.json 存在等） |

## 與既有 `.claude/skills/` 的關係

本庫**補充**而非取代既有 playbooks（add-api-endpoint 等操作步驟仍以 `.claude/skills/` 為準）；
新增的是：事故史料、已破損項目的當日實測、文件信任地圖、AI 子系統深度地圖。

**已知的一處衝突（本庫為準）**：`.claude/skills/add-db-migration` §5 說 remote 套用是
「手動、高風險操作」且「沒有自動跑 pending migrations 的機制」——已過時。
`deploy-api.yml`（148–196 行）在 push develop/main 時**自動** `wrangler d1 migrations apply --remote`
（retry ×3）。正確描述見本庫 `db-migrations-truth`；佐證：workflow 檔本身。

## 待修清單（查證中發現、本 session 因唯讀未修）

1. web Jest：next-intl 未進 transform，2/2 suite 無法執行；跑完不退出（open handles）。
2. mobile Jest：`app/quiz/test.tsx` 路由檔被誤認為測試 → `pnpm test` 永遠 exit 1。
3. backend package.json：`db:migrate:preview`/`db:migrate:production`/`db:seed` 指向不存在的檔案。
4. backend vitest（83 tests）未接入 turbo/CI。
5. CLAUDE.md 漂移：ESLint 描述、StartMoving 章節、Tamagui UI 描述。
6. `.claude/skills/add-db-migration` §5「remote 手動套用」說法已被 CI 自動化推翻，需更新。
7. **schema.sql 漂移**：憲法（project-rules 不變量 4、add-db-migration）稱 schema.sql 為全量快照，
   實際凍結在 15 張基礎表（0046 起的表只在 migrations）——需決策：回填 schema.sql 或修改憲法措辭。
8. `backend/package.json` 的 `db:migrate` 本身也壞（DB 名 `nobodyclimb-db` ≠ root wrangler.toml 的
   `nobodyclimb-db-local`；`--batch` 在 wrangler 4.64 失效）。
9. 本機無法一鍵重建完整 DB：`wrangler d1 migrations apply --local` 全量重放在 0033 失敗。
