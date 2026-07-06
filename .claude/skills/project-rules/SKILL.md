---
name: project-rules
description: nobodyclimb 專案憲法 — 不變量、禁令、事實表、任務 playbook 索引。任何開發工作（規劃、實作、除錯、review）前必讀
---

# nobodyclimb 專案規範（憲法層）

本文件是最高優先規範。與其他文件（含舊 docs/）衝突時，以本文件為準。
本文件只放「不變的規則」；「怎麼做某類任務」請查 [Playbook 索引](#playbook-索引) 載入對應 skill。

## 不變量（Invariants）— 違反即為 bug

1. **API 回應信封**：所有 backend 回應必須是
   `{ success: boolean, data?, error?, message?, pagination? }`。
   列表回應的 pagination 為 `{ page, limit, total, total_pages }`。
2. **跨專案共用的型別 / schema / 常數必須放 `packages/*`**，不得在 apps 內重複定義。
3. **Apps 消費的是 packages 的 `dist/`，不是 `src/`**。改了 `packages/*/src` 之後，
   必須 rebuild 該 package（`pnpm --filter "./packages/*" build` 或跑 turbo），
   否則 web/backend 看到的是舊 code。這是本 repo 最常見的「改了沒生效」原因。
4. **改 DB 結構必須同時改兩處**：`backend/src/db/schema.sql`（全量快照，供新環境）
   ＋ `backend/migrations/NNNN_*.sql`（增量，供既有 DB）。只改一處就是不完整的變更。
5. **web 的站內連結必須用 `@/i18n/navigation` 的 `Link`/`useRouter`**，不得用 `next/link`
   （會丟失 locale）。舊 code 有歷史違規，新 code 不得新增。
6. **web 的 HTTP 呼叫走既有層**：client component → `src/lib/api/services.ts`（axios）
   ＋ TanStack Query hook；server component → `src/lib/api/server-fetch.ts`（native fetch）。
   兩者不可混用，也不得在 component 內直接 import axios。
7. **mobile 的 `SafeAreaView` 一律來自 `react-native-safe-area-context`**，不是 `react-native`。
8. **mobile UI 的顏色 / 間距 / 字級一律取自 `@nobodyclimb/constants` 的
   `SEMANTIC_COLORS` / `SPACING` / `FONT_SIZE`**，不硬編碼 hex。
9. **backend 命名**：檔案 kebab-case、table 複數、欄位 snake_case（API 回應也維持 snake_case，
   不轉 camelCase）、boolean 存 INTEGER 0/1、PK 是 app 端產生的 TEXT
   （用 `backend/src/utils/id.ts` 的 `generateId()`）。
10. **新 backend route 的驗證用 Zod `validator`**（`hono-openapi` 的 `validator('json'|'query'|'param', schema)`），
    不要學舊 code 的手動 if 檢查。
11. **語言**：註解、文件、commit message 用繁體中文（技術術語保留英文）。

## 禁令（Never do）

- 不要手動編輯：`dist/`、`.next/`、`.open-next/`、`pnpm-lock.yaml`、
  `worker-configuration.d.ts`、`openapi.json`（皆為產生物）。
- 不要直接 push 到 `main`（production）或 `develop`（default）。一律開 feature branch → PR。
- 不要在沒被要求時執行 `wrangler deploy`、`wrangler d1 execute --remote`、
  `scripts/restore-*.sh`（會動到線上環境與資料庫）。
- 不要在 server component / OpenNext 環境使用 Node-only API（Workers runtime）。
- 不要因為測試 / typecheck 難修就刪測試、加 `@ts-ignore`、放寬 tsconfig。修不動就回報。
- 不要「順手重構」與任務無關的 code。歷史違規（如舊的 `next/link`）留給專門任務處理。

## 事實表（查證過的，別靠印象）

| 事項 | 事實 |
|------|------|
| Default branch | `develop`（preview 環境）；`main` = production。diff base 用 `origin/develop` |
| Lint | **Biome**（root `pnpm lint` = `biome check .`）。不是 ESLint |
| Format | root 用 Biome；`apps/web` 另有 Prettier script。以 `pnpm lint` 的結果為準 |
| Typecheck | root `pnpm typecheck` = `pnpm -r --if-present`，**不會自動先 build 依賴**；新環境要先 build packages（見不變量 3） |
| mobile typecheck | **沒有 typecheck script**，root typecheck 會靜默跳過 mobile；要查就在 `apps/mobile` 手動跑 `npx tsc --noEmit` |
| 測試框架 | web = Jest（`pnpm --filter @nobodyclimb/web test`）；`packages/constants` 與 backend = Vitest；backend 沒有 test script（在 `backend/` 跑 `npx vitest run`） |
| Node / pnpm | CI 用 Node 20；pnpm 鎖定 9.15.0（`packageManager`） |
| Migration 編號 | 4 位數零填充遞增；**歷史上已出現重複編號（兩個 0071）**，新增前必須檢查 |
| web/mobile lint | 各 app 的 `lint` script 也是 `biome check .` |
| i18n | next-intl，locales `zh`(default)/`en`/`ja`，訊息檔在 `apps/web/messages/{zh,en,ja}.json` |

## 快速索引（東西放哪裡）

- Backend route/service/repository：`backend/src/{routes,services,repositories}/`，
  掛載於 `backend/src/index.ts` 的 `v1.route(...)`
- Web 頁面：`apps/web/src/app/[locale]/`；API hooks：`apps/web/src/hooks/api/`；
  services：`apps/web/src/lib/api/services.ts`；adapters：`apps/web/src/lib/adapters/`；
  stores：`apps/web/src/store/`；UI 元件：`apps/web/src/components/ui/`（CVA + Radix + `cn()`）
- Mobile 畫面：`apps/mobile/app/`（Expo Router，檔案即路由）；hooks：`apps/mobile/src/lib/hooks/`；
  UI 元件：`apps/mobile/src/components/ui/`（純 RN StyleSheet，非 Tamagui）
- 共用 packages：`packages/{types,schemas,constants,utils,hooks,api-client}`，
  一律 barrel export（`src/index.ts`）
- 設計 tokens（web+mobile 共用）：`packages/constants/src/theme.ts`

## Playbook 索引

做以下任務前，先載入對應 skill（用 Skill tool）：

| 任務 | Skill |
|------|-------|
| 新增 / 修改 backend API endpoint | `add-api-endpoint` |
| 改 DB 結構（加表、加欄位） | `add-db-migration` |
| 新增 web 頁面或功能 | `add-web-page` |
| 新增 mobile 畫面或功能 | `add-mobile-screen` |
| 改共用 packages（型別、schema、常數） | `add-shared-code` |
| 驗證變更是否正確（commit 前必跑） | `verify-changes` |
| 指令失敗、環境問題、「改了沒生效」 | `troubleshooting` |

## 給 AI 的操作守則

- **先查再寫**：不確定的慣例，找一個同類型的現有檔案照抄結構，不要自己發明。
- **檢查指令的退出碼**：不要把檢查指令 pipe 給 `tail`/`grep` 後看輸出猜結果
  （pipe 會吃掉 exit code）；先跑原指令，失敗再截取輸出。
- **範圍最小化**：一個任務一個 branch，diff 越小越好。
- **卡住就停**：同一個錯誤修兩次還在，停下來回報現況與已嘗試的方法，不要亂改到過為止。
