---
name: pre-commit-check
description: commit 前執行 lint、typecheck、慣例檢查，自動修復可修的錯誤
---

# Pre-Commit Check

commit 前的品質檢查。發現錯誤時先嘗試自動修復，修不了的再報告給使用者。
**判斷成敗看退出碼**，不要把指令 pipe 給 tail/grep 後看輸出猜。

## 步驟 0：環境就緒

```bash
[ -d node_modules ] || pnpm install --frozen-lockfile
pnpm --filter "./packages/*" build
```

（不先 build packages，typecheck 會假失敗在 `@nobodyclimb/types` 找不到——見 troubleshooting skill）

## 步驟 1：lint（Biome）

1. 執行 `pnpm run lint`
2. 如果有錯誤，嘗試 `pnpm run format` 自動修復格式問題
3. 再次執行 `pnpm run lint` 確認
4. 仍有錯誤 → 讀取錯誤訊息，手動修復對應檔案

## 步驟 2：typecheck

1. 執行 `pnpm run typecheck`
2. **若變更包含 `apps/mobile`**：另跑 `cd apps/mobile && npx tsc --noEmit`
   （root typecheck 不含 mobile）
3. 有錯誤 → 逐一修復後重跑確認
4. 禁止用 `@ts-ignore` / 刪 code 讓它過；修不動就回報

## 步驟 3：專案慣例檢查

```bash
bash scripts/check-conventions.sh
```

- FAIL → 依訊息內建議修法修正後重跑
- WARN → 逐條確認，能修就修

## 步驟 4：回報結果

- 全部通過 → 告知使用者可以 commit
- 有無法自動修復的錯誤 → 列出錯誤原文與已嘗試的修法，詢問使用者如何處理
