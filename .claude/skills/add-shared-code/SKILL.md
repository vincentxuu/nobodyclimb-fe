---
name: add-shared-code
description: 修改共用 packages（types/schemas/constants/utils/hooks/api-client）的標準步驟。apps 吃的是 dist，改完必須 rebuild。改任何 packages/* 時使用
---

# 修改共用 Packages

`packages/*` 六個套件：`types`、`schemas`、`constants`、`utils`、`hooks`、`api-client`。
全部用 tsup build 到 `dist/`，**apps（web/backend/mobile Metro）消費的是 `dist/`，不是 `src/`**。

## 核心規則：改完必須 rebuild

```bash
pnpm --filter "./packages/*" build
```

不 rebuild 的後果：web/backend 的 typecheck、build、dev server 全部看到舊 code——
「我明明改了但沒生效」九成是這個原因。用 turbo 跑 build/lint/typecheck 會自動處理依賴順序
（`dependsOn: ["^build"]`），但 root 的 `pnpm typecheck`（`pnpm -r`）**不會**。

## 加新東西的步驟（barrel 模式）

1. 建 `packages/<pkg>/src/<name>.ts`
2. 在 `packages/<pkg>/src/index.ts` 加 `export * from './<name>'`
3. rebuild（上面的指令）
4. 到用的地方 `import { X } from '@nobodyclimb/<pkg>'`

放哪裡：
- **TypeScript 型別**（API 回應、domain model）→ `packages/types`（純型別，不能有 runtime code）
- **Zod schema**（前後端共用驗證）→ `packages/schemas`
- **常數 / 設計 tokens** → `packages/constants`（theme.ts 是 web+mobile 共用的顏色/間距來源）
- **純函式** → `packages/utils`
- **React hooks / Zustand factory** → `packages/hooks`
- **HTTP client** → `packages/api-client`（subpath exports：`.`、`./web`、`./native`）

## 依賴方向（不可逆）

`types`（無依賴）← `constants` ← `api-client` ← `hooks`。
新增 package 間依賴時用 `workspace:*`，並想清楚是否會造成循環。

## 驗證

```bash
pnpm --filter "./packages/*" build && pnpm typecheck   # 必須先 build 再 typecheck
pnpm lint
pnpm --filter @nobodyclimb/constants test              # constants 有 vitest 測試（quiz scoring）
```

改了會影響 web/backend 的東西，再照 `verify-changes` skill 跑對應 app 的檢查。

## 陷阱

- 不要手改任何 `dist/`（tsup 產生物）。
- `packages/hooks` 的 tsup 有 `--external react zustand axios`，加新的 peer 依賴時要跟著改。
- mobile 的 Jest 把 `@nobodyclimb/*` map 到 src、Metro 跑 dist——兩邊行為可能不同，別忘 rebuild。
- 型別若只有 backend 用，仍建議放 `packages/types`（前端遲早會用到；歷史教訓：
  曾因 app 內重複定義造成 web/mobile 不同步）。
