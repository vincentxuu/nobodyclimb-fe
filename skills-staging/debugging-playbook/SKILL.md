---
name: debugging-playbook
description: 觀察到以下任一症狀時載入：指令失敗或行為詭異、CI 紅燈、preview/production 頁面崩潰或空白、AI 回答錯誤/空白/被封鎖、「改了沒生效」、模組找不到、非中文語系行為異常。先查表，再自己 debug。
---

# Debugging Playbook（症狀 → 分診）

查證日期：2026-07-13。每條都來自實際事故（附 commit）。
本檔是**分診入口**：與 `.claude/skills/troubleshooting` 同域（重疊處一致）；深入處置見
build-and-env / ci-and-delivery / web-frontend-pitfalls / ai-subsystem-map 各 skill。
使用方式：比對症狀 → 照步驟 → 達到完成定義才算修好。同一個錯誤修兩次還在 → 停手回報現況與已試方法。

## 環境 / 指令類

| 症狀 | 原因 | 處置 |
|------|------|------|
| `Cannot find module '@nobodyclimb/...'` | packages 沒 build（apps 吃 dist/） | `pnpm --filter "./packages/*" build`，禁改 tsconfig/exports |
| 改了 `packages/*` 沒生效 | 只改了 src，app 吃 dist | 同上 rebuild；dev 時 tsup --watch 會自動重建 |
| root typecheck 過但 mobile 有型別錯 | mobile 無 typecheck script，被 `--if-present` 靜默跳過 | `cd apps/mobile && npx tsc --noEmit` |
| turbo 顯示 cache hit / FULL TURBO | 正常快取回放，不是沒跑 | 輸入沒變即合法；要強制 `--force` |
| 指令 pipe 後成敗誤判 | pipe 吃掉 exit code | 裸跑看 `$?`；要截輸出就 `cmd > log 2>&1; echo $?` |
| `npx vitest run --reporter=basic` 在 backend 炸 ERR_LOAD_URL | vitest 4 無 basic reporter 套件 | 直接 `cd backend && npx vitest run`（2026-07-13 實測 83 tests 過） |
| web Jest 報 `SyntaxError: Unexpected token 'export'`（next-intl） | jest.config 沒把 next-intl 加進 transform 範圍（i18n 遷移遺留，2026-07-13 實測 2/2 suite 皆掛） | 這不是你改壞的；要用 web 測試先修 `transformIgnorePatterns`。另：Jest 跑完不退出（open handles），加 `--forceExit` |
| mobile `pnpm test` exit 1 但看不出哪個測試壞 | 路由畫面 `app/quiz/test.tsx` 被 Jest 按檔名誤認為測試檔（AsyncStorage null；2026-07-13 實測） | 已知假失敗，不是你改壞的；看輸出 `Tests:` 行判讀（現況 100/100 過） |

## CI / 部署類

| 症狀 | 原因（事故） | 處置 |
|------|------|------|
| CI `module not found`，本地卻能 build | 新檔案沒 `git add`（`2e6db07`、`4089f61`：i18n 重構期間四次同類事故） | `git status` 對照 import；本地驗證要驗「已 commit 的樹」 |
| preview 全站 ErrorBoundary，本地正常 | 設定 wrapper 沒一起 commit（`ab15022`：next.config 缺 `withNextIntl()`） | 檢查功能的「伴生檔」：config wrapper、package.json 依賴、messages 檔 |
| 所有 `/en/*`、`/ja/*` 頁崩潰 | 巢狀 `<html>`：root layout 與 `[locale]/layout` 都渲染完整骨架（`13d458d`） | root `app/layout.tsx` 必須是 passthrough 只回 `{children}` |
| wrangler deploy 失敗：bundle 超過 3072 KiB（free plan gzip 上限） | dead code 佔空間（`6e2500b`：i18n 後舊的非 locale 路由樹 13,599 行全是死碼） | 找不可能執行到的路由/依賴刪除；該次瘦身 3326→~2250 KiB |
| PR 一開 CI 就部署了？ | 已修（`3bb13ad`）：PR 只跑 Build Check，push 才 deploy | 若再出現，檢查 workflow 的 `if: github.event_name` |
| workflow 內 secrets 引用報錯 | shell script 內直接 `${{ secrets.* }}`（`02a9ff9`） | secrets 一律放 step 的 `env:` block 再用 `$VAR` |

## Web 前端類

| 症狀 | 原因（事故） | 處置 |
|------|------|------|
| 非中文語系點連結被彈回中文 | 用了 `next/link`（`ee5618b`，29 頁） | 換 `@/i18n/navigation` 的 Link；`check-conventions.sh` 規則 3 會擋新增 |
| 某語系篩選/比對永遠不匹配 | 拿翻譯後顯示字串去比原始資料（`ee5618b` gym filter） | key 用 locale 無關 enum，label 才翻譯 |
| 新頁面在 en/ja 直接爆 | messages namespace 只加了 zh | 三檔都要加：`apps/web/messages/{zh,en,ja}.json` |
| server 端 build/runtime 炸 Node API | Workers runtime ≠ Node | 移除 Node-only API；runtime env 用 `getCloudflareContext()`（抄 `server-fetch.ts`） |
| 頁面拿不到 runtime 值 | `NEXT_PUBLIC_*` 是 build time 烘死的 | 頁面加 `export const dynamic = 'force-dynamic'` + server-fetch |

## AI 子系統類（歷史最大熱區，31 個 fix commits）

先讀 `ai-subsystem-map` skill。分診第一步永遠是：**查 DB `ai_config` 表現在選的是哪個引擎**
（`rag_strategy`、`use_langgraph_engine`），不是先讀 code。

| 症狀 | 原因（事故） | 處置 |
|------|------|------|
| AI 回答空白 / 空氣泡 | 曾為 output guard 換答案 + 前端渲染空 message（`fe6ba78`） | 取該筆 `query_id` 查 `ai_query_logs.pipeline_trace`（admin UI `/admin/ai` 日誌詳情）看引擎與 error_stack → 再 dump `ai_config`（指令見 ai-subsystem-map） |
| AI 回答編造不存在的路線 | 第一輪沒呼叫工具就作答（`eb641b7`） | 引擎已有 turn-1 強制 retry guard（`react-agent/engine.ts`）；檢查 system prompt 是否走 `REACT_AGENT_SYSTEM_PROMPT_TEMPLATE` |
| 工具丟 `SQLITE_ERROR`/`D1_ERROR` | SQL 欄位是想像的（`0bc9fb3`、`e33d64f`：`total_points`→`score` 等三起） | 逐欄核對真實 schema：schema.sql 只有 15 張基礎表，AI/rank 表要 grep `backend/migrations/`（兩段式指令見 ai-subsystem-map） |
| 合法短回答被換成「暫時無法處理」 | guard 分類太粗（`bc21cb7`：`too_short` 與 `tool_call_leak` 曾共用旗標） | 看 `react-agent/guards.ts` 的 qualityFlags 分類；只有 `tool_call_leak` 該封鎖 |
| 所有查詢都回「AI 服務暫時無法使用」 | LLM 回傳非 string 就 `.trim()`（`7f949d9`） | 用 `query/types.ts` 的 `extractResponseText()`，禁止散落各處自己 `.response?.trim()` |
| 修好的 AI bug 又出現 | 修在一個引擎，另一個引擎有複製的同邏輯（`1476ede`+`fae3ce6`） | 同時檢查 `pipeline/steps/*` 與 `ai-graph/nodes/*` 兩份 |
| 換引擎後 sources/建議問題/log 消失 | 新引擎漏了 postProcessing 對等實作（`09e6652`） | 對照 `postGraphProcessing`：logQuery、query_id、KV cache、token breakdown 缺一不可 |
| 單筆查詢 debug | 看 `ai_query_logs.pipeline_trace`（JSON，含各 phase 延遲、error_stack），admin UI 在 `/admin/ai` 日誌詳情 | |

## 卡住的停損規則

**觸發**：同一錯誤第二次修完仍在。
**步驟**：停手；回報錯誤原文、已嘗試的修法、目前假設。
**完成定義**：使用者拿到足以決策的現況，而不是一串越改越亂的 diff。
反例（觀察過的合理化）：「再試一個方向就好」——AI guard 事故連環修三次（`0bc9fb3`→`fe6ba78`→`bc21cb7`）就是沒有建模完整狀態空間的代價。

## 重新驗證

```bash
git log --oneline --grep="fix" -i | head -30   # 對照本檔事故 commit 是否仍在史料中
```
