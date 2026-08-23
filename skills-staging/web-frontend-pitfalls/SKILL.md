---
name: web-frontend-pitfalls
description: 觀察到以下任一狀態時載入：要在 apps/web 新增/修改頁面、元件、資料流；i18n 三語系相關症狀；Cloudflare Workers 上的 build/runtime 錯誤；bundle 大小逼近上限；Next.js 15 params/route 型別報錯。
---

# Web 前端陷阱（Next.js 15 + React 19 on Cloudflare Workers）

查證日期：2026-07-13。標準作法見 `.claude/skills/add-web-page`；本檔收「會炸的地方」。

## i18n（歷史上最貴的一類 bug）

- 路由都在 `apps/web/src/app/[locale]/`；next-intl，locales `zh`（default）/`en`/`ja`，
  `localePrefix: 'as-needed'`（zh 無前綴）。
- **連結**：一律 `import { Link, useRouter, usePathname } from '@/i18n/navigation'`。
  `next/link` 會掉 locale（事故 `ee5618b`，29 頁中招；conventions 規則 3 現在會 FAIL 新增）。
- **訊息檔三連改**：新 namespace 同時進 `apps/web/messages/zh.json`、`en.json`、`ja.json`，
  漏一個 = 該語系 runtime 爆。
- **比對用 key 不用譯文**（事故 `ee5618b` gym filter）：資料比對用 enum/原始值，UI 才翻譯。
- **layout 契約**：`[locale]/layout.tsx` 渲染完整 `<html>/<body>`；root `app/layout.tsx` 必須是
  只回 `{children}` 的 passthrough（事故 `13d458d`：巢狀 html 讓所有非 zh 頁面崩潰）。
- **死碼即債**：`as-needed` 會把所有請求 rewrite 進 `[locale]` 樹——不在 `[locale]` 下的路由目錄
  是永遠跑不到的死碼，還會撐爆 Worker bundle（事故 `6e2500b`：刪 13,599 行才降回 3MiB 限制內）。

## Cloudflare Workers ≠ Node

- server component / route handler 禁 Node-only API（fs、net…）；build 或 runtime 才炸。
- `NEXT_PUBLIC_*` 是 build-time 烘死；要 runtime 值 → `export const dynamic = 'force-dynamic'`
  ＋ `src/lib/api/server-fetch.ts` 模式（`getCloudflareContext()` 取 env）。
- 瀏覽器限定 lib（editor 等）→ `next/dynamic` + `ssr: false`。
- bundle 上限：free plan **3072 KiB gzip**，`6e2500b` 時曾到 3326 KiB。加大依賴前先想。
- 部署產物：`.open-next/`（OpenNext adapter）；`wrangler.json` 的 `run_worker_first`
  列出動態路徑——新的頂層動態 route 記得加進去，否則可能被當靜態 assets 服務 `unverified`（推論自設定結構，未實測反例）。

## Next 15 / React 19 專屬

- `params` 是 **Promise**：server 端 `await params`，client 端 `use(params)`。
- server `page.tsx`（metadata/SEO，不加 `'use client'`）＋ 同目錄 `XxxClient.tsx`（互動）拆分。
- server 端抓資料用 `server-fetch.ts`（native fetch），不是 axios。

## 資料層三件套（缺一不可）

1. `src/lib/api/services.ts` 加 service 方法（conventions 規則 4 只允許 `src/lib/api/` 目錄內 import axios；
   實務上 client.ts 是包 `@nobodyclimb/api-client`，component 一律不碰 axios）
2. 需要時 `src/lib/adapters/`（DTO → view model）
3. `src/hooks/api/useXxx.ts` TanStack Query hook ＋ barrel export；
   慣例 `staleTime: 5min`、`gcTime: 30min`；mutation 後 `invalidateQueries`。

信封解包：axios 包一層 → `(await apiClient.get(...)).data` 是 backend 信封，資料在 `.data.data`。

## 其他

- UI 元件：`src/components/ui/`（CVA + Radix + `cn()`）；Radix 用統一套件 `radix-ui`，不是 `@radix-ui/*` 分包。
- 表單：RHF + `zodResolver`，schema 放 `src/lib/schemas/`。
- 新外部圖片網域 → `next.config.mjs` 的 `remotePatterns`。
- 假功能是 review 必抓項：refresh 一定要真的 invalidate（事故 `94abd61`：`setTimeout` 假裝刷新）。
- 測試：Jest + RTL，colocate `__tests__/`；`pnpm --filter @nobodyclimb/web test -- <關鍵字>`。

## 重新驗證

```bash
ls apps/web/messages/ && grep -rn "localePrefix" apps/web/src/i18n/ 2>/dev/null | head -3
```
