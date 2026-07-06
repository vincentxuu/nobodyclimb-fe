---
name: troubleshooting
description: 常見環境 / 指令失敗的除錯 runbook — typecheck 找不到模組、改了沒生效、turbo 快取、Biome/Prettier 混淆、wrangler 問題。遇到指令失敗或行為詭異時先查這裡
---

# Troubleshooting Runbook

先查表，再自己 debug。每一條都是實際發生過、查證過的。

## `Cannot find module '@nobodyclimb/types'`（typecheck / build 失敗）

**原因**：packages 還沒 build（apps 與 packages 互相吃 `dist/`，新 container 沒有 dist）。
**解法**：`pnpm --filter "./packages/*" build`，再重跑。
**不要做**：改 tsconfig paths、改 package.json exports、加 @ts-ignore。

## 改了 `packages/*` 的 code，但 app 行為 / 型別沒變

**原因**：apps 消費 `dist/`，你只改了 `src/`。
**解法**：rebuild 該 package（同上），或開發時跑 `pnpm dev`（tsup --watch 會自動重建）。

## root `pnpm typecheck` 過了，但 mobile 其實有型別錯誤

**原因**：`apps/mobile` 沒有 `typecheck` script，`pnpm -r --if-present` 靜默跳過。
**解法**：`cd apps/mobile && npx tsc --noEmit` 手動跑。

## 指令看起來成功但其實失敗（或反之）

**原因**：把指令 pipe 給 `tail`/`head`/`grep`，shell 回報的是 pipe 最後一個指令的退出碼。
**解法**：先跑裸指令看 exit code；需要截輸出時用 `cmd > /tmp/out.log 2>&1; echo $?` 分開處理。

## turbo 說 cache hit 但我預期它重跑

**原因**：turbo 對 lint/typecheck/test/build 有快取，輸入沒變就直接回放。
**解法**：確認你的變更真的在該 package 範圍內；必要時加 `--force`。
反過來說：cache hit（FULL TURBO）是正常現象，不是「沒跑」。

## Biome / Prettier / ESLint 混淆

事實：**lint 一律是 Biome**（root、web、mobile 的 lint script 都是 `biome check .`）。
`apps/web` 另有 Prettier 的 format script；沒有 ESLint（CLAUDE.md 舊描述已過時）。
格式錯誤先試 `pnpm format`（root, Biome）；web 專屬的用 `pnpm --filter @nobodyclimb/web format`（Prettier）。

## `wrangler` 相關指令失敗

- 本機 D1（`--local`）不需要 Cloudflare 認證；`--remote` / `deploy` 需要，
  且屬於高風險操作——**沒被明確要求就不要跑**。
- backend 本機開發：`cd backend && pnpm dev`（localhost:8787），
  API docs 在 `http://localhost:8787/api/v1/docs`。

## Migration 相關

- `pnpm db:migrate` 跑的是 **schema.sql 全量**，不是 numbered migrations（設計如此）。
- 新 migration 編號一定先 `ls backend/migrations/ | sort | tail` 確認（有過重複 0071 的事故）。

## web build 在 Cloudflare 相關的失敗

- Workers runtime 不是 Node：server component 用了 Node-only API 會在 build/runtime 炸。
- `NEXT_PUBLIC_*` 是 build time 固定的；runtime 才知道的值走 `getCloudflareContext()`
  （參考 `apps/web/src/lib/api/server-fetch.ts`）。
- 瀏覽器限定 lib 要 `next/dynamic` + `ssr: false`。

## 測試框架對照（別跑錯）

| 位置 | 框架 | 指令 |
|------|------|------|
| `apps/web` | Jest | `pnpm --filter @nobodyclimb/web test` |
| `apps/mobile` | Jest（jest-expo） | `pnpm --filter @nobodyclimb/mobile test` |
| `packages/constants` | Vitest | `pnpm --filter @nobodyclimb/constants test` |
| `backend` | Vitest（無 script） | `cd backend && npx vitest run` |

## 還是卡住？

同一個錯誤修兩次還在 → 停手，回報：錯誤原文、已嘗試的方法、你的假設。
不要進入「亂改到過為止」模式。
