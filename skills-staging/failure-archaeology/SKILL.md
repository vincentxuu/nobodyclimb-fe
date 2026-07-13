---
name: failure-archaeology
description: 觀察到以下任一狀態時載入：你正要做的事似曾相識（重構 AI 邏輯、i18n 相關改動、換 lint 工具、動 migrations、寫 AI tool SQL）；發現看似可用但可疑的舊 code/docs/scripts；想知道某個奇怪設計是不是「有屍體埋在下面」。
---

# Failure Archaeology：死路、事故與教訓

查證日期：2026-07-13，基於 git 史料（~146 commits，其中 31 個 `fix(ai*)`）與 repo 現況。
本 repo **沒有任何 `git revert`**——所有修正都是 forward-fix，所以同檔反覆 churn 是常態，
熱區檔案（`admin-ai.ts` 18 次、`ai-prompts.ts` 19 次、`ChatWidget.tsx` 18 次）即事故地圖。

## 已確認的死路（不要復活它們）

| 死路 | 證據 | 教訓 |
|------|------|------|
| **Django/DRF/PostgreSQL backend** | `docs/backend/` 整目錄（10 檔）是完整 Django 教學，dated 2025-01-15；實際 backend 是 Hono + D1 | `docs/backend/` 全部視為「被放棄的架構」；backend 事實以 `docs/techstack/backend.md` 與 code 為準 |
| **`scripts/restore-prod-to-preview.sh`（不重建版）** | `scripts/README.md` 標記「已棄用」；不 drop tables 的就地還原造成資料衝突與 schema 不相容 | 要還原用 `restore-prod-to-preview-rebuild.sh`（且需明確授權，動線上 DB） |
| **quiz 單體 change** | openspec archive 有 `add-climbing-personality-quiz-monolith`，之後被重新拆成 10 個 `add-quiz-*` 細粒度 active changes | 大 feature 一開始就拆；單體 proposal 走不完 |
| **Spec Kit（`.specify/`）** | 目錄存在但實際流程走 openspec/ | 兩套 spec 框架並存，OpenSpec 才是活的 |
| **CLAUDE.md 的部分描述** | 寫著 ESLint、StartMoving（`.startmoving/` 不存在）、Tamagui UI | CLAUDE.md 有漂移；工具事實以 project-rules skill 與 `docs-truth-map` skill 為準 |
| **backend 死/壞 npm scripts** | `db:migrate:preview`/`db:migrate:production` 指向不存在的 `src/db/migrations/001_...`；`db:seed` 指向不存在的 `seed.sql`；連 `db:migrate` 本身也壞（DB 名不符 + `--batch` 在 wrangler 4.64 失效，2026-07-13 實測） | 別跑、別模仿；可用指令見 `db-migrations-truth` skill |

## 事故群像（會重演的模式）

### 1. AI guard 三連修（`0bc9fb3` → `fe6ba78` → `bc21cb7`）
症狀修一次爆一次：先加 guard 偵測 `[呼叫工具:` 文字洩漏 → 發現 caller 根本沒看 `passed` 欄位、
壞回答照樣出貨 → 修了之後又把合法短回答一起封鎖（因為和 `too_short` 共用旗標）。
**教訓**：改 guard/驗證邏輯時，先枚舉完整狀態空間（好輸出/壞輸出/合法空結果），
並確認**呼叫端有消費結果**；一次只修症狀就會連環爆。

### 2. 平行引擎邏輯漂移（`1476ede` + `fae3ce6`，同日同 bug 修兩次）
「我完攀了X，推薦下一條」被誤判為個人紀錄查詢——上午修在 `pipeline/steps/tool-selection.ts`，
下午發現 `ai-graph/nodes/tool-selection.ts` 有一份**複製的**分類邏輯要再修一次。
commit body 原文：「LangGraph 引擎的 tool-selection node 有獨立的查詢分類邏輯，未同步原始 pipeline 的修正」。
**教訓**：AI 子系統三引擎並存（pipeline / ai-graph / react-agent），任何跨引擎語意的修改
必須 grep 兩邊；長期解是抽共用模組，短期紀律是「修 A 引擎時列出 B 引擎對應檔」。

### 3. 想像出來的 SQL 欄位（`0bc9fb3`、`e33d64f`、crag-info）
至少三起獨立事故：`ra.route_name`、`u.name`、`ra.grade`、`ur.total_points`、table `crag_sectors`——
全部不存在，runtime 才炸 `SQLITE_ERROR`。
**教訓**：寫任何 AI tool / text-to-sql 模板前，逐欄核對真實 schema——注意 schema.sql 只有
15 張基礎表，`user_ranks`/`ai_*` 等要到 `backend/migrations/` 裡找 CREATE TABLE（見 ai-subsystem-map）。
反例（觀察過的合理化）：「欄位名這麼直覺，一定是這樣」——`user_ranks` 的分數欄位叫 `score` 不叫 `total_points`。

### 4. i18n rollout 連環爆（四次 CI/preview 事故 + 兩次行為 bug）
`2e6db07`、`4089f61`（檔案沒 git add）、`ab15022`（next.config 缺 withNextIntl wrapper）、
`13d458d`（巢狀 html）、`ee5618b`（next/link 掉 locale + 顯示字串比對）、`6e2500b`（死路由樹撐爆 bundle）。
還有一具尚未收屍的：web 僅有的 2 個 Jest suite 至今仍因 next-intl ESM 未設 transform 而全掛
（2026-07-13 實測）——web 測試套件實質癱瘓中。
**教訓**：橫切式改動（i18n、lint 遷移）最大的風險不是邏輯，是**伴生物**：
新檔要 add、config wrapper 要 commit、舊路徑要刪。本地能跑 ≠ committed tree 能跑。

### 5. Migration 編號撞號（現存兩組重複：`0053_*` ×2、`0071_*` ×2）
`ls backend/migrations/ | grep -E '^[0-9]{4}' | cut -c1-4 | sort | uniq -d` 今日仍輸出 0053、0071。
`check-conventions.sh` 規則 2 只擋「新增的」重複，歷史重複已成既成事實（wrangler 按檔名排序照跑）。
**教訓**：新編號一定 `ls | sort | tail` 取最大 +1，不憑記憶。

### 6. Biome 遷移（`93795fb`）的長尾
動機：mobile/backend 沒有 .prettierrc，`pnpm format` 默默用 Prettier 預設值造成風格分裂。
遷移是全 repo 大 reformat，之後仍有風格漂移由 review 收尾（`f83a5ef`）。
**教訓**：現在 lint/format 只有 Biome（`biome check .`）；看到文件說 ESLint/Prettier 就是過時文件。

### 7. Review 反覆抓到的同類錯（mobile：`94abd61`、`122abe2`、`f83a5ef`）
假功能（`setTimeout` 假裝 refresh，正解 `queryClient.invalidateQueries`）、`any` 逃逸、
不存在的 token（`WB_COLORS[80]`、`FONT_SIZE.md`）、`ViewStyle`/`TextStyle` 混用。
另注意：`94abd61` 與 `122abe2` 是**兩個 session 對同一批 review 意見各修一次**——
接手工作前先 `git log` 確認別人是否已修過。

## 重新驗證

```bash
ls backend/migrations/ | grep -E '^[0-9]{4}' | cut -c1-4 | sort | uniq -d; ls docs/backend/ .specify/ 2>/dev/null | head
```
