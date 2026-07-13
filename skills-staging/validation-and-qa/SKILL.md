---
name: validation-and-qa
description: 觀察到以下任一狀態時載入：改動完成準備 commit / 開 PR；要宣稱「修好了」「測過了」；需要決定跑哪些檢查與什麼才算證據；review 別人（或前一個 session）的變更。
---

# 驗證與 QA：證據標準

查證日期：2026-07-13（檢查矩陣中標注「實測」者當日在本 repo 跑過並 exit 0）。
本檔與 `.claude/skills/verify-changes`（操作流程）同域：流程照它走，本檔補「證據標準＋兩個已知假失敗」。

## 證據等級（宣稱前先對號入座）

| 宣稱 | 最低證據 |
|------|----------|
| 「typecheck/lint 過」 | 裸指令 exit 0（不是 pipe 後目視）。變更含 mobile 時必含 `npx tsc --noEmit` 的 mobile 結果 |
| 「測試過」 | 對應框架的測試 exit 0 ＋ 說出跑了哪個 suite、幾個 test |
| 「功能正常」 | typecheck ≠ 功能。至少其一：相關單元測試（沒有就補最小的）、backend `curl` 實打 endpoint 看信封、web dev server 實看頁面 |
| 「CI 會綠」 | 本地驗的是 **committed tree**（`git status` 乾淨、新檔已 add）——四次 CI 事故都是本地有檔、樹裡沒有 |
| 「AI 行為修好」 | `pipeline_trace` 或測試證明走到修改的引擎路徑；且確認另一個引擎沒有複製的同 bug |

## 檢查矩陣

**第 0 步（新環境一次）**：`pnpm install --frozen-lockfile && pnpm --filter "./packages/*" build`（實測 exit 0）。

**第 1 步（任何變更）**：
```bash
pnpm typecheck                        # 實測 exit 0；注意：靜默跳過 mobile
pnpm lint                             # Biome；實測 exit 0
bash scripts/check-conventions.sh     # diff-aware 慣例檢查；FAIL 必修，WARN 逐條看
```

**第 2 步（依範圍加跑）**：

| 改了什麼 | 加跑 | 備註 |
|----------|------|------|
| `apps/web` | `pnpm --filter @nobodyclimb/web test`（Jest + RTL；單一測試加 `-- <檔名關鍵字>`） | **已知破損（2026-07-13 實測）**：僅有的 2 個 suite 都因 next-intl ESM 未被 transform 而 fail（i18n 遷移遺留），且 Jest 跑完不退出（open handles，要加 `--forceExit` 或等 timeout）。web test 綠燈目前不可作為證據；要以 web 測試作證據需先修 `transformIgnorePatterns`（屬既有破損——動它前先向使用者確認，勿順手修） |
| `apps/mobile` | `cd apps/mobile && npx tsc --noEmit`（實測 exit 0）＋ `pnpm --filter @nobodyclimb/mobile test`（jest-expo） | root typecheck 不含 mobile。**mobile test 目前必 exit 1**（2026-07-13 實測）：路由畫面 `app/quiz/test.tsx` 被 Jest 誤認為測試檔；真實結果看輸出行（現況 20 suites/100 tests 全過）。exit code 在這一格例外不可用 |
| `backend` | `cd backend && npx tsc --noEmit`；動到 AI services 加 `npx vitest run` | vitest 實測：7 檔 83 tests 全過 <1s；**沒接進 turbo**，root `pnpm test` 不會跑它 |
| `packages/*` | rebuild 後 `pnpm --filter @nobodyclimb/constants test`（若動 constants；實測 1 檔 15 tests 過）＋ 受影響 app 檢查 | mobile Jest 吃 src、Metro 吃 dist——測試綠≠已 rebuild |
| DB migration | 見 `db-migrations-truth` skill 的本機驗證流程 | |
| build 設定 / next.config / wrangler | `pnpm build:cf`（web）或 `pnpm turbo run build --filter=@nobodyclimb/api^...` | 事故 `ab15022`：config wrapper 沒驗就上 preview 全站崩 |
| AI 引擎 / RAG 語意 | backend vitest ＋（merge 到 develop 後）`evaluate-rag.yml` ci 模式自動跑 | 黑箱評估打活 API，門檻只 warning 不擋——要自己看報告 |

## 紀律規則

**規則：exit code 是唯一裁判。**
- 觸發：任何檢查指令要下結論時。
- 步驟：裸跑 → `echo $?`；要留輸出就 `cmd > log 2>&1; echo $?`。
- 完成定義：回報裡的每個「通過」都能對到一個 exit 0。
- 唯一已知例外：mobile `pnpm test`（見上方矩陣 apps/mobile 格）——該格以 `Tests: ... passed` 輸出行為證據。
- 反例（觀察過的合理化）：「輸出最後幾行沒看到 error 字樣，應該是過了」——pipe 給 tail 之後
  shell 回報的是 tail 的退出碼，這正是 project-rules 特別立規的原因。

**規則：不為了過檢查而降標。**
- 觸發:測試/typecheck 修不動的衝動時刻。
- 步驟：禁刪測試、禁 `@ts-ignore`、禁放寬 tsconfig；兩次修不動 → 停手回報錯誤原文＋已試方法。
- 完成定義：檢查通過且 diff 中沒有任何壓制手段；或如實回報卡點。

**規則：宣稱交付前跑一次 `git status`。**
- 觸發：準備說「完成」。
- 步驟：確認無未 add 的新檔（CI 事故頭號成因）、無誤入的產生物（dist/.next/.open-next，規則 7 會 FAIL）。
- 完成定義：working tree 與你要交付的內容一致。

## 重新驗證

```bash
pnpm typecheck && pnpm lint && bash scripts/check-conventions.sh && (cd backend && npx vitest run) ; echo "exit=$?"
```
