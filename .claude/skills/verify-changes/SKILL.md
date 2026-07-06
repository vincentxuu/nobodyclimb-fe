---
name: verify-changes
description: commit 前驗證變更的標準流程 — 依變更範圍選擇檢查矩陣（build packages → typecheck → lint → 測試 → 慣例檢查）。每次要 commit 前使用
---

# 驗證變更（commit 前必跑）

原則：**看退出碼，不要看輸出猜**。不要把指令 pipe 給 `tail`/`grep` 再判斷成敗
（pipe 會吃掉 exit code）；先跑原指令，失敗了再重跑並截取輸出來讀。

## 第 0 步：環境就緒（新 container 必做一次）

```bash
[ -d node_modules ] || pnpm install --frozen-lockfile
pnpm --filter "./packages/*" build
```

沒 build packages 就跑 typecheck 必定失敗在 `packages/constants`（找不到 `@nobodyclimb/types`）——
這不是你的 bug，先 build。

## 第 1 步：全域檢查（任何變更都要跑）

```bash
pnpm typecheck        # pnpm -r，前提是第 0 步跑過
pnpm lint             # Biome（root）
bash scripts/check-conventions.sh   # 專案慣例機械檢查（diff-aware，只查你改的檔案）
```

## 第 2 步：依變更範圍加跑

| 改了什麼 | 加跑 |
|----------|------|
| `apps/web` | `pnpm --filter @nobodyclimb/web test`；跑單一測試加 `-- <檔名關鍵字>` |
| `apps/mobile` | `cd apps/mobile && npx tsc --noEmit`（root typecheck 不含 mobile！）＋ `pnpm --filter @nobodyclimb/mobile test` |
| `backend` | `cd backend && npx tsc --noEmit`；若動到 AI services，`cd backend && npx vitest run` |
| `packages/*` | `pnpm --filter @nobodyclimb/constants test`（若動 constants）＋ 受影響 app 的檢查 |
| DB migration | `cd backend && pnpm db:migrate`（本機重建）＋ 用 `--local` 套用新 migration 檔（見 add-db-migration skill） |
| build 設定 / next.config / wrangler | `pnpm build:web`（或 `pnpm turbo run build --filter=@nobodyclimb/api^...`）確認 build 得起來 |

## 第 3 步：行為驗證（改了 runtime 行為時）

typecheck 過 ≠ 功能對。有 runtime 行為變更時至少做其一：
- 相關單元測試（沒有就補一個最小的）
- backend：`cd backend && pnpm dev`（wrangler dev, localhost:8787）+ `curl` 打該 endpoint 看回應信封
- web：`pnpm dev:web`（localhost:3000）確認頁面會動

## 通過標準

- 上述指令全部 exit 0
- `check-conventions.sh` 無 FAIL（WARN 要逐條看過，能修就修）
- 沒有為了通過而刪測試 / 加 `@ts-ignore` / 放寬設定——修不動就如實回報

全部通過後 → 依 CLAUDE.md 的 commit 流程（pre-commit-check → format-commit）。
