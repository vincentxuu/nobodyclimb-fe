---
name: ai-subsystem-map
description: 觀察到以下任一狀態時載入：要 debug 或修改 AI 聊天/RAG/推薦功能；AI 回答錯誤、空白、被封鎖、latency 異常；要新增/修改 AI tool 或 prompt；看到 backend/src/services/{query,react-agent,ai-graph,pipeline} 任一目錄的檔案。
---

# AI 子系統地圖（本 repo 最大事故熱區）

查證日期：2026-07-13。AI 相關 fix 佔全史 31/146 commits——改這裡之前必讀。

## 請求流（POST /api/v1/ai/ask）

```
routes/ai.ts:84
  → authMiddleware → IP rate limit → 輸入 guardrail checkInput()（擋掉不扣 quota，400）
  → 原子扣 quota+token（admin 免扣）
  → QueryService.ask()（services/query/index.ts:93）
      個人化 context → KV cache 檢查 → 載入 ai_config + prompts → circuit breaker
      → 選引擎（見下）→ withTimeout(pipeline_timeout_ms)
  → 引擎內 output guard + route 層第二次 checkOutput()（ai.ts:321）
  → logQuery 寫 ai_query_logs → KV cache → 回 { answer, sources, query_id, suggested_questions, quota }
```

錯誤映射：`pipeline_timeout`→408、`circuit_breaker_rejected`→503、`internal_error`→500；失敗會退 quota。

## 引擎選擇：由 DB 決定，不是 code

**觸發**：任何「AI 行為和 code 對不起來」的困惑。
**步驟**：先 dump `ai_config` 表（唯讀 SELECT，分診允許；見 architecture-contract 禁令的唯讀例外）：
```bash
# 本地：
npx wrangler d1 execute nobodyclimb-db --local --command "SELECT key,value FROM ai_config WHERE key IN ('rag_strategy','use_langgraph_engine')"
# preview（唯讀查詢；需 Cloudflare 認證）：
npx wrangler d1 execute nobodyclimb-db-preview --remote --env preview --command "SELECT key,value FROM ai_config WHERE key IN ('rag_strategy','use_langgraph_engine')"
```
（或走 admin UI `/admin/ai` 的 AI 設定頁。）選擇邏輯在 `services/query/config.ts:17` 載入：
- `rag_strategy` ∈ `baseline|agentic|plan-execute|react|auto`（default `baseline`）
- `rag_strategy='react'` → **ReAct agent**（`services/react-agent/`）
- 否則 `use_langgraph_engine='1'` → **LangGraph**（`services/ai-graph/`，strategy 再選 graph）
- 否則 → **legacy pipeline**（`services/pipeline/engine.ts`）

ReAct 失敗（非 timeout/breaker）會 in-request fallback 到 baseline（`query/index.ts:349`）。
**完成定義**：你能說出這個環境目前實際跑哪個引擎，並在 `pipeline_trace.strategy` 得到印證。

## 三引擎並存 = 頭號維護風險

`pipeline/steps/*` 與 `ai-graph/nodes/*` 是近乎複製的兩套實作（hyde、multi-query、hybrid-search、
tool-selection、judge、text-to-sql…）。**修跨引擎語意時必須兩邊都改**
（事故：同一分類 bug 同日修兩次，`1476ede`+`fae3ce6`）。
新引擎/新路徑必須複製完整 postProcessing：logQuery、query_id、sources、suggested questions、
KV cache、token breakdown、climbed-route 排除（事故 `09e6652`：LangGraph 漏掉全部）。

## Guard 體系（改動前先枚舉狀態空間）

- 輸入：`utils/guardrails.ts` `checkInput()` — blocklist / prompt_injection / jailbreak / meaningless，
  可被 `ai_config` 覆寫；擋掉 → 400、不扣 quota、log `query_type='guardrails_blocked'`。
- 輸出（共用）：`checkOutput()` — system prompt 洩漏（整句換掉）、PII 遮蔽（email/台灣手機 → `[已隱藏]`）、
  長度截斷（default 3000）。
- 輸出（ReAct 專屬）：`react-agent/guards.ts` `runOutputGuards()` qualityFlags：
  `too_short`（<50 字：guards.ts 回 `passed:false` 但 **caller 不封鎖**，答案照出、僅記 flag）、
  `tool_call_leak`（`/^\[呼叫工具:/`，**唯一會封鎖**、換錯誤訊息）、`prompt_leak`（清洗後放行）。
  這個三分法是三次事故換來的（`0bc9fb3`→`fe6ba78`→`bc21cb7`），別再合併旗標。
- 耦合陷阱：`tool_call_leak` 的 regex 綁定 `engine.ts:159` 寫出的文字標記 `[呼叫工具: ...]`——
  改標記格式，guard 就靜默失效。

## ReAct tools 與 SQL 紀律

Tools（`react-agent/tools/index.ts` 註冊）：`search_routes`、`search_crags`、`sql_query`（委給
`services/text-to-sql.ts` 的 18 個模板）、`weather`、`user_profile`、`recommend`、`crag_info`。
迴圈行為：tool 連續失敗 2 次自動移除；turn-1 沒呼叫 tool 會強制 retry（防幻覺，`eb641b7`）。

**規則：動 `text-to-sql.ts` 或任何 tool SQL 前，逐欄核對真實 schema。**
注意：`backend/src/db/schema.sql` **只有最初 15 張表**（2026-07-13 查證）；AI/quiz/rank 相關表
只存在於 migrations——所以核對指令是兩段式：
```bash
grep -n "<table>" backend/src/db/schema.sql || grep -rln "CREATE TABLE.*<table>" backend/migrations/
```
- 正例：要查使用者積分 → `grep -rln "CREATE TABLE.*user_ranks" backend/migrations/`
  → `0047_climber_rank_system.sql` → 欄位是 `score` → 才寫 SQL。
- 反例（實際事故的合理化）：「使用者積分欄位當然叫 total_points」——`e33d64f` 就是這樣炸的；
  同類事故至少三起（`ra.route_name`、`crag_sectors` 表、`u.name` 全是想像的）。
- 已知刻意設計：`user-profile.ts:89` 不用 SQL `MAX(grade)`（字典序錯誤），在 JS 內數值化取最高級數。

## Provider 與模型

- Provider 由 env `LLM_PROVIDER`/`EMBEDDING_PROVIDER` 選（default `cloudflare`＝Workers AI binding，免 key）。
  其他 provider 需 secret：`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`/**`GOOGLE_AI_API_KEY`**（不是 GEMINI_API_KEY）。
- 預設模型（`react-agent/index.ts:27`、`query/config.ts:6`）：orchestrator `@cf/meta/llama-4-scout-17b-16e-instruct`
  （fallback `llama-3.1-8b-instruct`）、embedding `@cf/baai/bge-m3`、baseline LLM `@cf/google/gemma-3-12b-it`。
- **LLM 回傳絕不假設是 string**：一律走 `query/types.ts` 的 `extractResponseText()`（事故 `7f949d9`：
  `.response?.trim()` 散落 9 處，preview 全掛）。
- 成本契約：整個 AI stack 以 Cloudflare **free tier $0/月** 為目標（Workers AI Neurons、Vectorize 單 index、
  D1 100MB）——引入外部付費 API 是架構級決策，不是實作細節。

## 觀測與 debug 入口

- 每筆查詢 → D1 `ai_query_logs`（`query/cache-log.ts:59`），`pipeline_trace` JSON 含 phase 延遲、
  token_breakdown、error_stack、strategy；admin UI `/admin/ai`（`routes/admin-ai.ts`，25 endpoints）。
- 品質標記 → `ai_flagged_responses`（low_groundedness / low_feedback / score_discrepancy）。
- 外部 tracing → Langfuse（secrets `LANGFUSE_*`，`utils/langfuse.ts`）。

## 測試與評估

- 單元測試：7 檔 83 tests（react-agent engine/providers/registry/cache/index + ai-graph routing/providers），
  **沒接進 turbo**（backend 無 test script、無 vitest config）——`cd backend && npx vitest run`（2026-07-13 實測全過，<1s）。
- 黑箱評估：`.github/workflows/evaluate-rag.yml`（workflow_dispatch / develop push 後自動 ci 模式），
  跑 `backend/scripts/evaluate-rag.ts` 打**活的** preview API；資料集 `backend/tests/golden-test-set.json`、
  `red-team-test-set.json`。門檻只發 `::warning::` 不擋（`continue-on-error`）。
- 本地 gap：root `wrangler.toml` 的本地區塊**沒有 Vectorize binding**——本地 `wrangler dev`
  的向量檢索會失敗，屬已知限制，不是你改壞的。

## 重新驗證

```bash
grep -n "rag_strategy" backend/src/services/query/config.ts | head -3 && cd backend && npx vitest run 2>&1 | tail -3
```
