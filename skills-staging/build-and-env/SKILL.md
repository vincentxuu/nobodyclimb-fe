---
name: build-and-env
description: 觀察到以下任一狀態時載入：新 container / 新 clone 第一次跑指令；typecheck 或 build 報 `Cannot find module '@nobodyclimb/...'`；「改了 packages 但 app 沒反應」；turbo 顯示 cache hit 但你預期它重跑；要從零重建整個開發環境。
---

# Build 與環境：從零重建 + 已知陷阱

查證日期：2026-07-13（所有指令在本 repo 實跑過，exit code 皆為 0）。

## 從零重建（驗證過的完整順序）

```bash
pnpm install --frozen-lockfile          # pnpm 鎖定 9.15.0（root package.json packageManager）
pnpm --filter "./packages/*" build      # 必做！apps 消費 packages 的 dist/，不是 src/
pnpm typecheck                          # = pnpm -r --if-present run typecheck
pnpm lint                               # = biome check .（不是 ESLint）
```

- CI 用 Node 20；本地 Node 22 也驗證可用（2026-07-13）。
- workspace 成員：`apps/*`、`backend`、`packages/*`、`scripts/*`（見 `pnpm-workspace.yaml`）。

**規則：任何 typecheck/build 前，先確認 packages 已 build。**
- 觸發：新環境第一次跑檢查、或看到 `Cannot find module '@nobodyclimb/types'`。
- 步驟：跑 `pnpm --filter "./packages/*" build`，再重跑原指令。
- 完成定義：原指令 exit 0，且你沒有動過任何 tsconfig paths / package.json exports / `@ts-ignore`。
- 正例：新 session 看到 `packages/constants` typecheck 失敗 → 先 build packages → 重跑 → 過。
- 反例（實際觀察過的合理化）：「找不到模組，應該是 tsconfig paths 沒設好，我來加一個 mapping」——
  錯。這是 dist 不存在的假失敗，改設定只會把問題變成真的。歷史上 tsconfig paths（`31a5f2e`）
  與 package.json 依賴（`a19c205`）都已修正過，不要再動。

## 陷阱事實表

| 事實 | 說明 |
|------|------|
| root `pnpm typecheck` 不會先 build 依賴 | 它是 `pnpm -r`，不是 turbo。turbo 任務（`pnpm build`/`pnpm test`）才有 `dependsOn: ["^build"]` |
| root typecheck **靜默跳過 mobile** | `apps/mobile` 沒有 `typecheck` script（`--if-present`）。改 mobile 必須 `cd apps/mobile && npx tsc --noEmit` |
| turbo 對 build/lint/typecheck/test 有快取 | cache hit（FULL TURBO）是正常，不是「沒跑」；要強制重跑加 `--force` |
| mobile Jest ≠ Metro 的模組解析 | Jest moduleNameMapper 把 `@nobodyclimb/*` 指到 packages **src**，Metro 跑 **dist**——測試綠了不代表已 rebuild |
| `packages/hooks` 的 tsup 有 `--external react --external zustand --external axios` | 加新 peer 依賴時要跟著改 build script |
| packages 依賴要顯式宣告 | 只「用到」別的 package 的型別而不在 package.json 宣告 `workspace:*`，本地 typecheck 會過、DTS build 會炸（事故：`a19c205`，constants 缺 types 依賴 → deploy 失敗 PR #377） |
| pnpm overrides 鎖 react 19.1.0 | root package.json `pnpm.overrides`；不要在子套件另裝不同版本 |

## 指令成敗判斷紀律

**觸發**：你想把檢查指令 pipe 給 `tail`/`grep`/`head` 再看輸出。
**步驟**：不要。先跑裸指令看 exit code；需要截輸出時 `cmd > /tmp/out.log 2>&1; echo $?` 分開處理。
**完成定義**：你回報的成敗來自 exit code，不是來自輸出的目視判讀。
（pipe 會回報最後一個指令的退出碼，歷史上多次造成「看起來成功其實失敗」。）
唯一已知例外：mobile `pnpm test` 因誤認檔必 exit 1，以 `Tests:` 輸出行為證據（見 mobile-pitfalls）。

## 重新驗證

```bash
pnpm install --frozen-lockfile && pnpm --filter "./packages/*" build && pnpm typecheck && pnpm lint; echo "exit=$?"
```
