---
name: architecture-contract
description: 觀察到以下任一狀態時載入：要新增/修改任何跨層功能（API、頁面、畫面、共用碼）；review 一份 diff；不確定某個設計是「慣例」還是「可改的」；準備動 response 格式、DB 慣例、i18n 導航、資料層結構。
---

# 架構契約：不變量與承重決策

查證日期：2026-07-13。每一條都有 code 或事故佐證；違反即為 bug，review 必擋。
（本檔與 `.claude/skills/project-rules/SKILL.md` 同源；衝突時以 repo 內 project-rules 為準。）

## 不變量（違反 = bug）

1. **API 回應信封**：backend 一律回 `{ success, data?, error?, message?, pagination? }`；
   列表的 pagination = `{ page, limit, total, total_pages }`。
   前端解包注意雙層：axios 再包一層 → mobile/web hook 取 `response.data?.data`。
2. **共用型別/schema/常數放 `packages/*`**，apps 內不得重複定義
   （事故：app 內重複定義曾造成 web/mobile 不同步）。
3. **Apps 消費 packages 的 `dist/`**。改 `packages/*/src` 後必 rebuild（見 build-and-env skill）。
4. **DB 結構變更 = 兩處同步**：`backend/src/db/schema.sql` ＋ `backend/migrations/NNNN_*.sql`。
   `check-conventions.sh` 規則 1 會 FAIL「只改 schema.sql 不加 migration」的 diff
   （反向抓不到，要自律）。注意：schema.sql 實際上**不是**全量快照——0046 之後的表只在
   migrations 裡（憲法漂移，詳見 db-migrations-truth skill）。
5. **web 站內連結一律 `@/i18n/navigation` 的 `Link`/`useRouter`**，禁 `next/link`。
   事故 `ee5618b`：29 個頁面用 `next/link`，`/en`、`/ja` 使用者點任何連結都被彈回中文。
6. **web HTTP 分層**：client component → `src/lib/api/services.ts`（axios）＋ TanStack Query hook；
   server component → `src/lib/api/server-fetch.ts`（native fetch）。component 內禁直接 import axios。
7. **比對/篩選邏輯用 locale 無關的 key，不用顯示字串**。
   事故 `ee5618b`：英文版岩館篩選拿翻譯後的 "Bouldering" 去比中文資料「抱石」→ 永遠不匹配。
   正例：key 用 enum（`bouldering`）或原始資料值，label 才翻譯。
   反例（觀察過的合理化）：「篩選選項就是顯示文字，直接拿來比對最簡單」——在第二個語系上線那天就壞。
8. **mobile `SafeAreaView` 來自 `react-native-safe-area-context`**；
   UI tokens（顏色/間距/字級）取自 `@nobodyclimb/constants`（`SEMANTIC_COLORS`/`SPACING`/`FONT_SIZE`），不硬編碼 hex。
9. **backend 命名**：檔案 kebab-case、table 複數、欄位 snake_case（API 回應也 snake_case，不轉 camelCase）、
   boolean 存 INTEGER 0/1、PK 為 app 端 `generateId()` 產生的 TEXT（`backend/src/utils/id.ts`）。
10. **新 backend route 用 Zod `validator`**（`hono-openapi` 的 `validator('json'|'query'|'param', ...)`），
    不要模仿舊檔的手動 if 檢查。
11. **語言**：註解、文件、commit message 用繁體中文（技術術語保留英文）。

## 承重決策（為什麼長這樣，別「順手改掉」）

| 決策 | 理由 / 佐證 |
|------|------------|
| backend 分層可選：簡單 CRUD 直接寫在 route，複雜的走 route→service→repository | 兩種都是認可模式（範例 `crags.ts` vs `posts.ts` 三層）；不要把簡單 CRUD 強行三層化 |
| Service 在每個 request handler 內建構（bindings 來自 `c.env`），不做 module 單例 | Workers 環境 bindings per-request；全域單例曾導致 provider 未初始化 crash（`1124d5b` 同類） |
| `adminMiddleware` 必須接在 `authMiddleware` 之後 | 單獨用拿不到 user |
| like/bookmark/comment 用多型表（`entity_type` + `entity_id`） | 不要為新內容型別另開互動表 |
| 錯誤處理：service `throw new Error('<訊息>')`，route catch 後字串比對映射 404/403，未知丟給全域 `app.onError` | 既有慣例，全 repo 一致 |
| web 頁面 = server `page.tsx`（metadata/SEO）＋ client `XxxClient.tsx` 拆分；Next 15 的 `params` 是 Promise（server `await`，client `use()`） | 範例：`apps/web/src/app/[locale]/crag/[id]/page.tsx` |
| TanStack Query 慣例：`staleTime: 5min`、`gcTime: 30min`；server state 不進 Zustand store | 全 repo 一致 |
| AI 引擎選擇存在 DB `ai_config` 表，不在 code / env | debug AI 行為先查 DB config，不是先讀 code（見 ai-subsystem-map skill） |
| 邏輯禁止跨引擎複製 | AI 子系統三引擎並存，複製的分類邏輯修了一邊漏另一邊（事故 `1476ede`+`fae3ce6`：同一 bug 修兩次） |

## 依賴方向（不可逆）

`packages/types`（無依賴）← `constants` ← `api-client` ← `hooks`。
新增 package 間依賴用 `workspace:*` **且必須寫進該 package 的 package.json**
（事故 `a19c205`：constants 用了 types 的型別但沒宣告依賴 → 本地過、DTS build 炸、deploy 失敗）。

## 禁令

- 不手改產生物：`dist/`、`.next/`、`.open-next/`、`pnpm-lock.yaml`、`worker-configuration.d.ts`、openapi.json。
- 不直接 push `main`（production）或 `develop`（default branch）；一律 feature branch → PR。
- 沒被明確要求不跑：`wrangler deploy`、`scripts/restore-*.sh`、任何**會寫入**的 `--remote` d1 指令
  （DDL/UPDATE/INSERT/DELETE、`migrations apply`、`--file=`）。唯一例外：**唯讀 SELECT** 的
  `--remote --command "SELECT ..."` 允許用於分診（例：查 `ai_config`，見 ai-subsystem-map skill）。
- 不因難修就刪測試、加 `@ts-ignore`、放寬 tsconfig。修不動就回報。
- 不順手重構任務外的 code；歷史違規（舊 `next/link`）留給專門任務。

## 重新驗證

```bash
bash scripts/check-conventions.sh && sed -n '1,60p' .claude/skills/project-rules/SKILL.md
```
